
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Building, Case, Mail, MapPin, Phone, User as UserIcon } from 'lucide-react';

type UserProfile = {
    name: string;
    title: string;
    email: string;
    avatarUrl: string;
    phone: string;
    address: string;
    company: string;
};

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{value}</p>
        </div>
    </div>
);


export default function ProfileClient({ user: initialUser }: { user: UserProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(initialUser);
    const { toast } = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({...prev, [name]: value}));
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically call a server action to save the user data
        console.log('Saving user data:', user);
        toast({
            title: 'Profile Updated',
            description: 'Your profile details have been saved successfully.',
        });
        setIsEditing(false);
    };

    return (
        <Card>
            <form onSubmit={handleSave}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-6">
                         <Avatar className="h-24 w-24">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            {isEditing ? (
                                <div className="space-y-2">
                                     <Label htmlFor="name">Name</Label>
                                     <Input id="name" name="name" value={user.name} onChange={handleInputChange} className="text-2xl font-bold p-0 h-auto border-0 focus-visible:ring-0" />
                                     <Label htmlFor="title">Title</Label>
                                     <Input id="title" name="title" value={user.title} onChange={handleInputChange} className="text-muted-foreground p-0 h-auto border-0 focus-visible:ring-0"/>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-bold">{user.name}</h2>
                                    <p className="text-muted-foreground">{user.title}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {isEditing ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" value={user.email} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" type="tel" value={user.phone} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" name="address" value={user.address} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input id="company" name="company" value={user.company} onChange={handleInputChange} />
                            </div>
                         </div>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailRow icon={Mail} label="Email" value={user.email} />
                            <DetailRow icon={Phone} label="Phone" value={user.phone} />
                            <DetailRow icon={MapPin} label="Address" value={user.address} />
                            <DetailRow icon={Building} label="Company" value={user.company} />
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}
