import { client } from '#/main'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <button
        onClick={async () => {
          let { redirectUrl } = await (await client.api.auth.oidc.$get()).json();

          window.location = redirectUrl as any;
        }}
      >
        Login
      </button>
    </div>
  )
}
