import { Hono } from "hono";
import { AppEnv } from "../services/honoSession.service";
import { honoSession, oidc, userService } from '../services';

export default new Hono<AppEnv>()
    .get("session", async (c) => {
        const session = await honoSession.getSession(c);
        if (!session) {
            return c.json({
                error: "invalid session"
            }, 501);
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
            return c.json({
                error: "invalid session"
            }, 501);
        }

        console.log(session);

        const tokens = await oidc.handleCallback(c.req.url, session.oidcState);
        const claims = tokens.claims();

        if (!claims) {
            return c.json({
                error: "couldn't get claims"
            }, 501);
        }

        const email = claims["email"];

        if (!email || typeof email != "string") {
            return c.json({
                error: "missing email from claims"
            }, 501);
        }

        let user = await userService.findUserByEmail(email);

        if (!user) {
            user = (await userService.createUser({
                email,
                username: email
            })).rows[0];
        }

        if (!user) {
            return c.json({
                error: "failed to create user"
            }, 501);
        }

        await honoSession.updateSession(c, {
            userId: user.id
        });

        return c.json(user, 200);
    });