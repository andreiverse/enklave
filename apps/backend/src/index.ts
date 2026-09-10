import { Hono } from 'hono'
import { cors } from 'hono/cors';
import auth from './routers/auth.router';
import document from './routers/document.router';
import { AppEnv } from './services/honoSession.service';
import { honoSession } from './services';
import { logger } from 'hono/logger';

const app = new Hono<AppEnv>()
  .use(logger())
  .use(cors())
  .use(honoSession.middleware)
  .route("api/auth", auth)
  .route("api/documents", document);

export type AppType = typeof app
export default app;