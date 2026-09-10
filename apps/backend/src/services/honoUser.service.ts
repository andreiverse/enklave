import { Context, Next } from "hono";
import { Session, SessionService } from "./session.service";
import { getCookie, setCookie } from "hono/cookie";
import { UserService } from "./user.service";
import { AppEnv, HonoSessionService } from "./honoSession.service";

export class HonoUserService {
    constructor(
        private readonly userService: UserService,
        private readonly honoSession: HonoSessionService
    ) {
        this.middleware = this.middleware.bind(this);
    }

    async middleware(
        c: Context<AppEnv>,
        next: Next,
    ) {
        let session = await this.honoSession.getSession(c);
       
        if (!session) {
            return c.json({
                error: "invalid session"
            }, 501);
        } 

        if (!session.userId) {
            return c.json({
                error: "unauthenticated"
            }, 402);
        }


        let user = await this.userService.findUserById(session.userId);

        if (!user) {
            return c.json({
                error: "invalid authenticated user"
            }, 501);
        }

        c.set("user", user);
        
        await next();
    }

   
}