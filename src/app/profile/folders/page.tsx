import { AppLayout } from "@/components/app-layout";
import { handleGetFolders } from "@/app/actions";
import FoldersClient from "./client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function FoldersFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default async function FoldersPage() {
  const folders = await handleGetFolders();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Folders</h1>
          <p className="text-muted-foreground">
            Browse and manage your saved clinical trials.
          </p>
        </div>
        <Suspense fallback={<FoldersFallback />}>
          <FoldersClient initialFolders={folders} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
