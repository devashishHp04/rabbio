  'use client';

  import { useRouter } from 'next/navigation';
  import { useState } from 'react';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { auth } from '@/lib/firebase';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import Link from 'next/link';
  import { Separator } from '@/components/ui/separator';
  import { Linkedin } from 'lucide-react';
  import { signInWithCustomToken } from 'firebase/auth';
  import { cn } from '@/lib/utils';
  import Image from 'next/image';
  
  

  export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signInWithLinkedIn = async () => {
      try {
        const width = 600;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open('/api/auth/linkedin/start', 'LinkedIn Auth', `width=${width},height=${height},left=${left},top=${top}`);
        if (!popup) return;

        const onMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          const data = event.data;
          if (!data || data.type !== 'linkedin-auth') return;
          window.removeEventListener('message', onMessage);
          if (data.error) {
            setError(data.error);
            return;
          }
          if (data.customToken) {
            setLoading(true);
            try {
              const cred = await signInWithCustomToken(auth, data.customToken);
              // Log user basic info to console
              console.log('Signed in user:',cred,"===>", {
                uid: cred.user.uid,
                email: cred.user.email,
                providerData: cred.user.providerData,
              });
              const idToken = await cred.user.getIdToken();
              await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              });
              router.push('/dashboard');
            } catch (e: any) {
              setError(e?.message || 'LinkedIn sign-in failed');
            } finally {
              setLoading(false);
            }
          }
        };
        window.addEventListener('message', onMessage);
      } catch (e: any) {
        setError(e?.message || 'LinkedIn sign-in failed');
      }
    };

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await cred.user.getIdToken();
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        router.push('/dashboard');
      } catch (err: any) {
        setError(err?.message || 'Failed to sign in');
      } finally {
        setLoading(false);
      }
    };

    return (
      <main className="flex min-h-screen">
        {/* Left Pane */}
        <div className={cn("relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-center", "bg-image-custom")}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-md">
              <Image src="/pipelineX-logo.png" alt="PipelineX Logo" width={160} height={64} className="h-16 w-auto mx-auto mb-6" />
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
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to access your R&D intelligence dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      <Button variant="outline" className="w-full" onClick={signInWithLinkedIn} disabled={loading}>
                          <Linkedin className="mr-2 h-5 w-5 text-[#0A66C2]" />
                          {loading ? 'Signing in…' : 'Sign in with LinkedIn'}
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
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="researcher@rabbio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                          {loading ? 'Signing in…' : 'Sign In'}
                        </Button>
                      </form>
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                      Don't have an account?{' '}
                      <Link href="/signup" className="font-semibold text-primary hover:underline">
                          Sign up
                      </Link>
                  </div>
                </CardFooter>
              </Card>
          </div>
        </div>
      </main>
    );
  }
