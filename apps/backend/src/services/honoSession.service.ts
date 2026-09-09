import { Context, Next } from "hono";
import { Session, SessionService } from "./session.service";
import { getCookie, setCookie } from "hono/cookie";

export type AppEnv = {
    Variables: {
        sessionId: string;
    };
};

export class HonoSessionService {
    constructor(
        private readonly sessionService: SessionService,
    ) {
        this.middleware = this.middleware.bind(this);
    }

    async middleware(
        c: Context<AppEnv>,
        next: Next,
    ) {
        const sessionId = getCookie(c, "__Session");

        if (sessionId && await this.sessionService.exists(sessionId))
            c.set("sessionId", sessionId);
        else {
            // require session on all endpoints
            const sessionId = await this.sessionService.create();

            setCookie(c, "__Session", sessionId, {
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
                path: "/",
            });

            c.set("sessionId", sessionId);
        }

        await next();
    }

    async getSession(c: Context<AppEnv>) {
        return await this.sessionService.get(c.get("sessionId"));
    }

    async updateSession(c: Context<AppEnv>, session: Partial<Session>) {
        return await this.sessionService.update(c.get("sessionId"), session);
    }
}