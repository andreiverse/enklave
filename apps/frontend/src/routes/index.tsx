import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { UploadFile } from '#/components/upload_file';
import { CreateFolder } from '#/components/create_folder';
import { client } from '#/main';
import { useDocumentsQuery, useFoldersQuery, useSessionQuery } from '#/queries';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Folder, File, ArrowLeft, ArrowLeftIcon } from '@phosphor-icons/react';

export const Route = createFileRoute('/')({
  component: Home,
});

type FolderBreadcrumb = {
  id: string;
  name: string;
};

function Home() {
  const user = useSessionQuery();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<FolderBreadcrumb[]>([]);

  const isLoggedIn = !!user.data?.userId;
  const documents = useDocumentsQuery(currentFolderId, isLoggedIn);
  const folders = useFoldersQuery(currentFolderId, isLoggedIn);

  function navigateToFolder(folderId: string, folderName: string) {
    setFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  }

  function navigateBack() {
    setFolderStack(prev => {
      const next = prev.slice(0, -1);
      setCurrentFolderId(next.length > 0 ? next[next.length - 1].id : null);
      return next;
    });
  }

  function navigateToBreadcrumb(index: number) {
    if (index < 0) {
      // Navigate to root
      setFolderStack([]);
      setCurrentFolderId(null);
    } else {
      const target = folderStack[index];
      setFolderStack(prev => prev.slice(0, index + 1));
      setCurrentFolderId(target.id);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
       Enklave
      </h1>

      {user.data?.userId ? (
        <div>
          <p className='mb-2'>welcome {user.data.userId}</p>

          {/* Breadcrumbs */}
          <div className='flex items-center gap-1 mb-3 text-sm'>
            {currentFolderId && (
              <button
                onClick={navigateBack}
                className='p-1 rounded hover:bg-accent mr-1'
                title='Go back'
              >
                <ArrowLeftIcon className='size-4' />
              </button>
            )}
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className={`hover:underline ${currentFolderId ? 'text-muted-foreground' : 'font-semibold'}`}
            >
              Root
            </button>
            {folderStack.map((crumb, i) => (
              <span key={crumb.id} className='flex items-center gap-1'>
                <span className='text-muted-foreground'>/</span>
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={`hover:underline ${i === folderStack.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>

          {/* Actions bar */}
          <div className='flex gap-2 items-center flex-wrap mb-3'>
            <UploadFile
              currentFolderId={currentFolderId}
              onUpdate={() => documents.refetch().then(() => {})}
            />
            <CreateFolder currentFolderId={currentFolderId} />
          </div>
          
          {/* Folders first, then documents */}
          <div className='grid gap-2 grid-cols-3'>
            {folders.data?.map(folder => 
              <Card
                key={folder.id}
                className='cursor-pointer hover:bg-accent/50 transition-colors'
                onClick={() => navigateToFolder(folder.id, folder.name)}
              >
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Folder className='size-5 text-amber-500' weight='fill' />
                    {folder.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
            {documents.data?.map(doc => 
              <Card key={doc.id}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <File className='size-5 text-muted-foreground' />
                    {doc.fileName}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Empty state */}
          {folders.data?.length === 0 && documents.data?.length === 0 && (
            <p className='text-muted-foreground text-sm mt-4'>
              This folder is empty. Upload a file or create a folder to get started.
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={async () => {
            const { redirectUrl } = await (
              await client.api.auth.oidc.$get()
            ).json();

            window.location.href = redirectUrl;
          }}
        >
          Login
        </button>
      )}
    </div>
  );
}