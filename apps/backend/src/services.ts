import { drizzle } from 'drizzle-orm/node-postgres/driver';
import { DocumentService } from './services/document.service';
import { HonoSessionService } from './services/honoSession.service';
import { HonoUserService } from './services/honoUser.service';
import { createOidcService } from './services/oidc.service';
import { SessionService } from './services/session.service';
import { UserService } from './services/user.service';
import { S3Service } from './services/s3.service';

export const db = drizzle(process.env.POSTGRES_URL!);

export const session = new SessionService();
export const honoSession = new HonoSessionService(session);
export const oidc = await createOidcService();
export const userService = new UserService(db);
export const s3Service = new S3Service();
export const documentService = new DocumentService(db, s3Service);
export const honoUser = new HonoUserService(userService, honoSession);