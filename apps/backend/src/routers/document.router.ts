import { Hono } from "hono";
import { documentService, honoUser, s3Service } from "../services";
import { type } from "arktype";
import { sValidator } from "@hono/standard-validator";

const documentSchema = type({
    fileName: "string",
    file: "File",
});

const documentRoutes = new Hono()
    .use(honoUser.middleware)

    .get("", async (c) => {
        const user = c.get("user");

        return c.json(
            await documentService.findDocumentsByOwner(user.id)
        );
    })

    .get(
        ":doc/original",
        async (c) => {
            const { doc } = c.req.param();

            const user = c.get("user");
            const document = await documentService.findDocumentById(doc);

            if (!document || document.ownerId != user.id) {
                return c.json({
                    error: "couldn't find document"
                }, 404);
            }

            const s3Key = documentService.buildS3KeyFromDocument(document);

            return c.body(await s3Service.readFile(s3Key), 201);
        }
    )

    .post(
        "",
        sValidator("form", documentSchema),
        async (c) => {
            const user = c.get("user");
            const { fileName, file } = c.req.valid("form");

            const document = await documentService.createDocument(
                {
                    fileName,
                    ownerId: user.id,
                },
                await file.arrayBuffer()
            );

            return c.json(document, 201);
        }
    );

export default documentRoutes;