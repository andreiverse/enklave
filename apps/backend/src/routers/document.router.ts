import { Hono } from "hono";
import { documentService, honoUser } from '../services';


export default new Hono()
    .use(honoUser.middleware)
    .get("", async (c) => {
        let user = c.get("user");

        return c.json(await documentService.findDocumentsByOwner(user.id));
    })
    .post("", async (c) => {
        
    });
