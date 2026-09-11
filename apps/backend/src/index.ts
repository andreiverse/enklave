import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routers/auth.router';
import document from './routers/document.router';
import folder from './routers/folder.router';
import { AppEnv } from './services/honoSession.service';
import { honoSession } from './services';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

const app = new Hono<AppEnv>()
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({
        error: err.message
      }, err.status);
    }

    console.error(err);
    return c.json({
      message: "Internal server error"
    }, 500);
  })
  .use(logger())
  .use(cors())
  .use(honoSession.middleware)
  .route("api/auth", auth)
  .route("api/documents", document)
  .route("api/folders", folder);

export type AppType = typeof app
export default app;