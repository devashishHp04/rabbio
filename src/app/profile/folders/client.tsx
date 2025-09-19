'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Folder } from '@/lib/types';
import { ArrowLeft, Folder as FolderIcon, Plus, FileText, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { handleCreateFolder } from '@/app/actions';

function CreateFolderForm({ onFolderCreated }: { onFolderCreated: (folder: Folder) => void }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(handleCreateFolder, null);
    const formRef = React.useRef<HTMLFormElement>(null);

    React.useEffect(() => {
        if (state?.success && state.data) {
            toast({ title: state.message });
            onFolderCreated(state.data);
            formRef.current?.reset();
        } else if (state?.message) {
            toast({ variant: 'destructive', title: state.message });
        }
    }, [state, toast, onFolderCreated]);
    
    return (
        <form ref={formRef} action={formAction} className="flex gap-2">
            <Input name="folderName" placeholder="New folder name..." required />
            <Button type="submit">
                <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
        </form>
    );
}

export default function FoldersClient({ initialFolders }: { initialFolders: Folder[] }) {
    const [folders, setFolders] = useState(initialFolders);

    const handleFolderCreated = (newFolder: Folder) => {
        setFolders(currentFolders => [newFolder, ...currentFolders]);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Profile
                    </Link>
                </Button>
                <div className="w-full max-w-sm">
                   <CreateFolderForm onFolderCreated={handleFolderCreated} />
                </div>
            </div>

            {folders.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {folders.map(folder => (
                        <Link key={folder.id} href={`/profile/folders/${folder.id}`}>
                            <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FolderIcon className="h-6 w-6 text-primary" />
                                        <span className="truncate">{folder.name}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow"></CardContent>
                                <CardFooter className="text-xs text-muted-foreground justify-between items-center">
                                    <span>Created {formatDistanceToNow(new Date(folder.createdAt), { addSuffix: true })}</span>
                                    <ChevronRight className="h-4 w-4" />
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="bg-muted rounded-full p-4">
                        <FolderIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold">No Folders Created Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                       Use the form above to create your first folder to organize saved studies.
                    </p>
                </Card>
            )}
        </div>
    );
}
