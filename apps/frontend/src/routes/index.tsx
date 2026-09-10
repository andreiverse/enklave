import { client } from '#/main';
import { useDocumentsQuery, useSessionQuery } from '#/queries';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const user = useSessionQuery();
  const documents = useDocumentsQuery(!!user.data?.userId);

  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function upload() {
    if (!file) return;

    const formData = new FormData();
    formData.append('fileName', fileName);
    formData.append('file', file);

    const response = await client.api.documents.$post({
      form: {
        fileName,
        file,
      },
    });

    if (!response.ok) {
      console.error(await response.text());
      return;
    }

    setFileName('');
    setFile(null);

    await documents.refetch();
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">
        Welcome to TanStack Start
      </h1>

      {user.data?.userId ? (
        <div>
          <p>welcome {user.data.userId}</p>

          <pre>{JSON.stringify(documents.data, null, 2)}</pre>

          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />

          <input
            type="file"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
            }}
          />

          <button onClick={upload}>
            Add document
          </button>
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