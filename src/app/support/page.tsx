
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SupportPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
                <Link href="/help">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
            </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Support</h1>
          <p className="text-muted-foreground">
            Fill out the form below and our team will get back to you as soon as possible.
          </p>
        </div>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>
                    Please describe your issue in detail.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="Evelyn Reed" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="e.reed@rabbio.com" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="e.g., Issue with data export" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="issue-type">Type of Issue</Label>
                        <Select>
                            <SelectTrigger id="issue-type">
                                <SelectValue placeholder="Select an issue type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bug">Bug Report</SelectItem>
                                <SelectItem value="feature">Feature Request</SelectItem>
                                <SelectItem value="billing">Billing Inquiry</SelectItem>
                                <SelectItem value="general">General Question</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Please describe the issue in as much detail as possible..." rows={6} />
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                <Button type="submit">Submit Ticket</Button>
            </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
