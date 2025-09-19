import { AppLayout } from "@/components/app-layout";
import { getStudiesInFolder, getPipelinesInFolder } from "@/services/folders";
import { notFound } from "next/navigation";
import FolderDetailClient from "./client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function FolderDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you'd get the user ID from the session.
  const userId = 'user123';
  
  const studies = await getStudiesInFolder(userId, params.id);
  const pipelines = await getPipelinesInFolder(userId, params.id);

  return (
    <AppLayout>
       <div className="space-y-6">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                  <Link href="/profile/folders">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Folders
                  </Link>
              </Button>
          </div>
          <FolderDetailClient studies={studies} pipelines={pipelines} />
      </div>
    </AppLayout>
  );
}
