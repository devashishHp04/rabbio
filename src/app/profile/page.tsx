
import { AppLayout } from '@/components/app-layout';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Folder, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ProfileClient from './client';
import { getCurrentUser } from '@/services/auth';
import { getSettings } from '@/services/settings';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  // Fetch settings to get the user's name
  const settings = await getSettings(currentUser.uid);

  // Map the authenticated user to the format the ProfileClient expects.
  const userProfile = {
      name: settings.name, // Use name from settings
      title: currentUser.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}` : 'User',
      email: currentUser.email || 'No email provided',
      avatarUrl: `https://i.pravatar.cc/150?u=${currentUser.uid}`,
      phone: 'Not provided',
      address: 'Not provided',
      company: 'Not provided'
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
            </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile details and preferences.
          </p>
        </div>
        
        <ProfileClient user={userProfile} />
        <div className="grid md:grid-cols-2 gap-6">
             <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">My Folders</h3>
                        <p className="text-sm text-muted-foreground">Organize and view your saved studies.</p>
                    </div>
                    <Button asChild>
                        <Link href="/profile/folders">
                            View Folders <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
