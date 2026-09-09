import { Hono } from 'hono'
import { cors } from 'hono/cors';
import auth from './routers/auth.router';
import { AppEnv, HonoSessionService } from './services/honoSession.service';
import { SessionService } from './services/session.service';
import { createOidcService, OidcService } from './services/oidc.service';

export const session = new SessionService();
export const honoSession = new HonoSessionService(session);
export const oidc = await createOidcService();

const app = new Hono<AppEnv>()
  .use(cors())
  .use(honoSession.middleware)
  .route("api/auth", auth);

export type AppType = typeof app
export default app;