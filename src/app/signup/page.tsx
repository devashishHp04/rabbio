'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Linkedin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleSignup } from '../actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Account
    </Button>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleSignup, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success === false && state.message) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: state.message,
      });
    }
    if (state?.success === true) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  }, [state, toast, router]);


  return (
    <main className="flex min-h-screen">
      {/* Left Pane */}
      <div className={cn("relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-center", "bg-image-custom")} data-ai-hint="research lab">
         <div className="absolute inset-0 bg-black/50" />
         <div className="relative w-full max-w-md">
            <img src="/pipelineX-logo.png" alt="PipelineX Logo"  className="h-16 w-auto mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white">Unlock R&D Insights</h1>
            <p className="text-slate-300 mt-2">
                Join a community of researchers and innovators. Get the competitive edge with real-time pipeline intelligence.
            </p>
         </div>
      </div>

      {/* Right Pane */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Start your 7-day free trial. No credit card required.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                    <Linkedin className="mr-2 h-5 w-5 text-[#0A66C2]" />
                    Sign up with LinkedIn
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                        </span>
                    </div>
                </div>
                <form ref={formRef} action={formAction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" placeholder="Evelyn" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" placeholder="Reed" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Work Email</Label>
                      <Input id="email" name="email" type="email" placeholder="e.reed@rabbio.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <SubmitButton />
                </form>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-center gap-4">
              <p className="px-8 text-center text-xs text-muted-foreground">
                By clicking continue, you agree to our{' '}
                <Link
                  href="#"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="#"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <Separator />
              <div className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/" className="font-semibold text-primary hover:underline">
                      Sign In
                  </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
