
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Trophy, Store, Share2, BarChart, Info, Minus, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createCheckoutSession } from '../actions';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import type { AuthenticatedUser } from '@/services/auth';


const tiers = [
  {
    name: 'Free',
    monthlyPrice: 0,
    monthlyPriceId: null,
    annualPriceId: null,
    idealFor: 'Students & Individual Researchers',
    featureHeader: 'Features included:',
    features: [
      'Track up to 10 pipelines',
      'AI-powered literature summaries (3/mo)',
      'Clinical trials search',
      'Basic dashboard access',
    ],
    cta: 'Try Free Forever',
    popular: false,
  },
  {
    name: 'Standard',
    monthlyPrice: 249,
    // =================================================================================
    // TODO: REPLACE THESE PLACEHOLDER PRICE IDs WITH YOUR ACTUAL STRIPE PRICE IDs
    // =================================================================================
    // To find these, go to your Stripe Dashboard > Products, click on your "Standard" product,
    // and copy the API ID for both the monthly and yearly prices.
    monthlyPriceId: 'price_1RxeWdJYUV5teNW7zllTpSzJ', 
    annualPriceId: 'price_1RxeWdJYUV5teNW754jS8uYv',
    // =================================================================================
    idealFor: 'Single Site',
    featureHeader: 'Features included:',
    features: [
      'Track up to 100 pipelines',
      'AI-powered literature summaries',
      'Access to 1 therapeutic area',
      'Email-only alerts',
    ],
    cta: 'Start 7 days FREE trial',
    popular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 799,
    // =================================================================================
    // TODO: REPLACE THESE PLACEHOLDER PRICE IDs WITH YOUR ACTUAL STRIPE PRICE IDs
    // =================================================================================
    // To find these, go to your Stripe Dashboard > Products, click on your "Pro" product,
    // and copy the API ID for both the monthly and yearly prices.
    monthlyPriceId: 'price_1RxeXnJYUV5teNW7G16DQV5F',
    annualPriceId: 'price_1RxeXnJYUV5teNW7Roxywj5u',
    // =================================================================================
    idealFor: 'Biotech, CROs, PDPs, SMOs',
    featureHeader: 'Everything in Standard, PLUS:',
    features: [
      'Track up to 1000 pipelines',
      'Advanced AI experiment suggestions',
      'Downloadable reports',
      'Access to all therapeutic areas',
    ],
    cta: 'Start 7 days FREE trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null, // Custom pricing
    monthlyPriceId: null,
    annualPriceId: null,
    idealFor: 'Pharma, Investors, Universities',
    featureHeader: 'Everything in Advanced, PLUS:',
    features: [
        'Unlimited users & pipelines',
        'Custom AI model training',
        'Dedicated account manager & SLAs',
        'API access & SSO',
    ],
    cta: 'Request a Demo',
    popular: false,
  },
];

const allFeatures = [
    { 
        category: 'General', 
        items: [
            { name: 'Track pipelines', free: 'Up to 10', standard: 'Up to 100', pro: 'Up to 1000', enterprise: 'Unlimited' },
            { name: 'AI-powered literature summaries', free: '3 per month', standard: true, pro: true, enterprise: true },
            { name: 'Full dashboard access', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Catalyst tracking', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Unlimited filters', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Downloadable reports', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Advanced AI experiment suggestions', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Advanced data filtering', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Access to top-level pipeline data', free: '100 records', standard: '500 records', pro: '2500 records', enterprise: true },
            { name: 'Custom AI model training', free: false, standard: false, pro: false, enterprise: true },
            { name: 'On-premise deployment option', free: false, standard: false, pro: false, enterprise: true },
            { name: 'API access', free: false, standard: false, pro: false, enterprise: true },
            { name: 'White-labeled reports', free: false, standard: false, pro: false, enterprise: true },
        ]
    },
    {
        category: 'Users & Collaboration',
        items: [
            { name: 'Team seats', free: false, standard: false, pro: false, enterprise: true },
            { name: 'Single Sign-On (SSO)', free: false, standard: false, pro: false, enterprise: true },
        ]
    },
    {
        category: 'Support & Services',
        items: [
            { name: 'Email-only alerts', free: true, standard: true, pro: false, enterprise: false },
            { name: 'Email and text alerts', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Standard email support', free: true, standard: true, pro: false, enterprise: false },
            { name: 'Priority email & chat support', free: false, standard: false, pro: true, enterprise: true },
            { name: 'Dedicated account manager & SLAs', free: false, standard: false, pro: false, enterprise: true },
            { name: 'Onboarding + custom support', free: false, standard: false, pro: false, enterprise: true },
        ]
    }
];


const includedFeatures = [
    {
      name: 'AI-Powered Insights',
      description: 'Instantly summarize research to quickly identify key findings and competitive relevance.',
      icon: <Trophy className="h-8 w-8 text-primary" />,
    },
    {
      name: 'Advanced Search',
      description: 'Filter millions of clinical trials with precision to find strategic opportunities.',
      icon: <Store className="h-8 w-8 text-primary" />,
    },
    {
      name: 'Pipeline Tracking',
      description: 'Monitor the entire R&D pipeline from preclinical to approved stages in one place.',
      icon: <Share2 className="h-8 w-8 text-primary" />,
    },
    {
      name: 'Data Export',
      description: 'Easily export findings and pipeline data to CSV for offline analysis and reporting.',
      icon: <BarChart className="h-8 w-8 text-primary" />,
    },
  ];
  
function PlanButton({ cta }: { cta: string }) {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {cta}
        </Button>
    );
}

export default function PricingClient({ user }: { user: AuthenticatedUser | null }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const annualDiscount = 0.8; // 20% discount

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
        return value ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <Minus className="h-5 w-5 text-muted-foreground mx-auto" />;
    }
    return <span className="text-sm">{value}</span>;
  };

  const visibleFeatures = React.useMemo(() => {
    if (isFeaturesExpanded) {
        return allFeatures;
    }
    // Return first 10 features from the first category
    const featuresToShow = [];
    const firstCategory = allFeatures[0];
    if(firstCategory) {
        featuresToShow.push({
            ...firstCategory,
            items: firstCategory.items.slice(0, 10),
        });
    }
    return featuresToShow;
  }, [isFeaturesExpanded]);

  const handlePlanSelection = async (priceId: string | null) => {
    if (user) {
        // User is logged in, create checkout session
        if (!priceId) {
            toast({ title: 'This plan requires contacting sales.' });
            return;
        }
        try {
            await createCheckoutSession(priceId);
            // The action will handle the redirect
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    } else {
        // User is not logged in, navigate to signup
        const url = priceId ? `/signup?priceId=${priceId}` : '/signup';
        router.push(url);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center gap-4">
        <Label htmlFor="billing-cycle" className={cn(billingCycle === 'monthly' && "text-primary font-bold")}>
            Monthly
        </Label>
        <Switch
            id="billing-cycle"
            checked={billingCycle === 'annually'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
        />
        <Label htmlFor="billing-cycle" className={cn(billingCycle === 'annually' && "text-primary font-bold")}>
            Annually
        </Label>
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            Save 20%
        </Badge>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {tiers.map((tier: any) => {
            const price = tier.monthlyPrice !== null
              ? billingCycle === 'annually'
                ? tier.monthlyPrice === 0 ? 0 : Math.round(tier.monthlyPrice * annualDiscount)
                : tier.monthlyPrice
              : null;
            
            const priceId = billingCycle === 'annually' ? tier.annualPriceId : tier.monthlyPriceId;
            
            return (
              <Card
                key={tier.name}
                className={cn('flex flex-col', {
                  'border-2 border-primary shadow-lg relative': tier.popular,
                })}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                   <CardDescription>{tier.idealFor}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-6 flex flex-col flex-grow">
                  <div className="text-center flex flex-col justify-center min-h-[120px]">
                      {price !== null ? (
                        <>
                           <p className="text-5xl font-bold tracking-tight">${price}<span className="text-sm font-normal text-muted-foreground">{price > 0 ? ' per user/mo' : ''}</span></p>
                        </>
                      ) : (
                        <p className="text-4xl font-bold tracking-tight">Custom</p>
                      )}
                       {billingCycle === 'annually' && price !== null && price > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">Billed annually</p>
                      )}
                  </div>
                  <div className="mt-6">
                      <form action={() => handlePlanSelection(priceId)} className="w-full">
                          <PlanButton cta={tier.cta} />
                      </form>
                  </div>
                  <div className="mt-6 mb-8">
                      <Separator />
                  </div>
                  <div className="flex-grow">
                      <p className="text-base font-bold">{tier.featureHeader}</p>
                       <ul className="space-y-4 mt-4">
                         {tier.features.map((feature: string, index: number) => (
                           <li key={index} className="flex items-start gap-3">
                             <Check className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
                             <span className="text-sm">{feature}</span>
                           </li>
                         ))}
                       </ul>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      
       <div className="py-12 max-w-7xl mx-auto">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Compare Plans</h2>
            <p className="mt-2 text-lg text-muted-foreground">
                Find the right plan for your team's needs.
            </p>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[28%] text-lg font-semibold">Features</TableHead>
                {tiers.map((tier) => (
                  <TableHead
                    key={tier.name}
                    className={cn('text-center font-bold text-lg w-[18%] p-4', { 'bg-primary/5': tier.popular})}
                  >
                    {tier.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleFeatures.map((category) => (
                <React.Fragment key={category.category}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell
                      colSpan={5}
                      className="font-bold text-base text-muted-foreground"
                    >
                      {category.category}
                    </TableCell>
                  </TableRow>
                  {category.items.map((feature) => (
                    <TableRow key={feature.name}>
                      <TableCell className="font-medium">{feature.name}</TableCell>
                      <TableCell className="text-center">{renderFeatureValue(feature.free)}</TableCell>
                      <TableCell className="text-center">{renderFeatureValue(feature.standard)}</TableCell>
                      <TableCell className={cn("text-center", { 'bg-primary/5': true })}>{renderFeatureValue(feature.pro)}</TableCell>
                      <TableCell className="text-center">{renderFeatureValue(feature.enterprise)}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          <CardFooter className="justify-center py-4 bg-background">
            <Button
              variant="ghost"
              onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
            >
              {isFeaturesExpanded ? 'Show less' : 'Show all features'}
              <ChevronDown
                className={cn(
                  'ml-2 h-4 w-4 transition-transform',
                  isFeaturesExpanded && 'rotate-180'
                )}
              />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="py-12 max-w-5xl mx-auto">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">What every plan gets you</h2>
            <p className="mt-2 text-lg text-muted-foreground">
                Core features included in all our subscription plans.
            </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {includedFeatures.map((feature) => (
                <Card key={feature.name} className="text-center">
                    <CardContent className="p-6">
                        <div className="flex justify-center items-center h-12 w-12 rounded-full bg-primary/10 mx-auto mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold">{feature.name}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </>
  );
}
