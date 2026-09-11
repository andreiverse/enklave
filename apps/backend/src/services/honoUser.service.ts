import { Context, Next } from "hono";
import { UserService } from "./user.service";
import { AppEnv, HonoSessionService } from "./honoSession.service";
import { AppException } from "../exception/AppException";

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
        const session = await this.honoSession.getSession(c);
       
        if (!session) {
            throw new AppException(401, "Invalid session");
        } 

        if (!session.userId) {
            throw new AppException(401, "Unauthenticated");
        }

        const user = await this.userService.findUserById(session.userId);

        if (!user) {
            throw new AppException(401, "Invalid authenticated user");
        }

        c.set("user", user);
        
        await next();
    }

   
}