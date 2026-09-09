import { Hono } from "hono";
import { AppEnv } from "../services/honoSession.service";
import { honoSession, oidc } from "..";

const auth = new Hono<AppEnv>()
    .get("oidc", async (c) => {
        return c.redirect(await oidc.authorizeUser())
    })
    .get("callback", async (c) => {
        let tokens = await oidc.handleCallback(c.req.url);
        let claims = tokens.claims();

        if (claims) {
            return c.json({claims});
        } else {
            return c.json({
                error: "yes"
            }, 501);
        }
    })

export default auth;