
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// This is the primary handler for when a user first subscribes.
// It uses the client_reference_id (Firebase UID) passed during checkout.
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const clientReferenceId = session.client_reference_id; // This is the Firebase UID
    const subscriptionId = session.subscription as string;

    if (!clientReferenceId) {
        console.error('Webhook Error: Checkout session is missing client_reference_id (Firebase UID).');
        return;
    }
    if (!subscriptionId) {
        console.error(`Webhook Error: Checkout session ${session.id} is missing subscription ID.`);
        return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = subscription.items.data[0]?.price.lookup_key; // e.g., 'standard' or 'pro'

    if (!plan) {
        console.error(`Webhook Error: Could not find plan lookup_key for subscription ${subscriptionId}.`);
        return;
    }

    const userDocRef = doc(db, 'users', clientReferenceId);
    
    // Create or update the user's document in Firestore with their subscription details.
    // Using { merge: true } is crucial here. It creates the doc if it doesn't exist,
    // or updates it if it does, preventing errors if the webhook runs before a user doc is created.
    await setDoc(userDocRef, {
        stripeCustomerId: subscription.customer,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        plan: plan,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { merge: true });

    console.log(`Successfully handled checkout.session.completed for user ${clientReferenceId}. Plan set to ${plan}.`);
}


export async function POST(req: NextRequest) {
    const sig = headers().get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    try {
        if (!sig || !webhookSecret) {
            console.error('Stripe signature or webhook secret is missing.');
            return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
        }
        
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Error verifying webhook signature: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
    
    // Log the event type for debugging
    console.log('Received Stripe event:', event.type);
    
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            // This is the most reliable event for new subscriptions.
            await handleCheckoutSessionCompleted(session);
            break;
        }
        case 'invoice.paid': {
             // This event occurs for renewals.
             // We can use this to confirm a subscription is still active.
             const invoice = event.data.object as Stripe.Invoice;
             const subscriptionId = invoice.subscription as string;
             const customerId = invoice.customer as string;
             
             if(invoice.billing_reason === 'subscription_cycle') {
                 const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                 const plan = subscription.items.data[0]?.price.lookup_key;
                 
                 // Here we would find our user in Firestore via the `customerId` and update their period end.
                 // This logic is secondary to the checkout session logic for plan changes.
                 console.log(`Recurring payment successful for customer ${customerId}, plan ${plan}.`);
             }
             break;
        }
        case 'customer.subscription.deleted': {
            // Handles when a subscription is canceled at the end of the billing period.
            const subscription = event.data.object as Stripe.Subscription;
            // Find user by customerId and downgrade their plan.
            console.log(`Subscription ${subscription.id} for customer ${subscription.customer} was deleted.`);
            break;
        }
        default:
            console.warn(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
