import { Hono } from "hono";
import { AppEnv } from "../services/honoSession.service";
import { honoSession, oidc, userService } from "..";
import { users } from "../db/schema";

const auth = new Hono<AppEnv>()
    .get("session", async (c) => {
        return c.json(await honoSession.getSession(c))
    })
    .get("oidc", async (c) => {
        return c.redirect(await oidc.authorizeUser())
    })
    .get("callback", async (c) => {
        let tokens = await oidc.handleCallback(c.req.url);
        let claims = tokens.claims();

        if (!claims) {
            return c.json({
                error: "couldn't get claims"
            }, 501);
        }

        let email = claims["email"];

        if (!email || typeof email != "string") {
            return c.json({
                error: "missing email"
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
    })

export default auth;