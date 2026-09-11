import { Hono } from "hono";
import { AppEnv } from "../services/honoSession.service";
import { honoSession, oidc, userService } from '../services';
import { AppException } from "../exception/AppException";

export default new Hono<AppEnv>()
    .get("session", async (c) => {
        const session = await honoSession.getSession(c);
        if (!session) {
            throw new AppException(401, "Invalid session");
        }

        const { userId } = session;

        return c.json({
            userId
        });
    })

    .get("oidc", async (c) => {
        const { redirectUrl, state } = await oidc.authorizeUser();

        await honoSession.updateSession(c, {
            oidcState: state
        });

        return c.json({
            redirectUrl
        });
    })

    .get("callback", async (c) => {
        const session = await honoSession.getSession(c);

        if (!session || !session.oidcState) {
            throw new AppException(401, "Invalid session");
        }

        console.log(session);

        const tokens = await oidc.handleCallback(c.req.url, session.oidcState);
        const claims = tokens.claims();

        if (!claims) {
            throw new AppException(500, "Couldn't get claims");
        }

        const email = claims["email"];

        if (!email || typeof email != "string") {
            throw new AppException(500, "Missing email from claims");
        }

        let user = await userService.findUserByEmail(email);

        if (!user) {
            user = (await userService.createUser({
                email,
                username: email
            })).rows[0];
        }

        if (!user) {
            throw new AppException(500, "Failed to create user");
        }

        await honoSession.updateSession(c, {
            userId: user.id
        });

        return c.json(user, 200);
    });