import { Hono } from "hono";
import { documentService, honoUser, s3Service } from "../services";
import { type } from "arktype";
import { sValidator } from "@hono/standard-validator";

const updateDocumentSchema = type({
    fileName: "string?",
    parentFolderId: "string?",
});

const documentSchema = type({
    fileName: "string",
    file: "File",
    parentFolderId: "string?",
});

const documentRoutes = new Hono()
    .use(honoUser.middleware)

    // List documents
    .get("", async (c) => {
        const user = c.get("user");
        const folderId = c.req.query("folderId");

        const filter: { ownerId: string; parentFolderId?: string | null } = {
            ownerId: user.id,
        };

        if (folderId === "root") {
            filter.parentFolderId = null;
        } else if (folderId) {
            filter.parentFolderId = folderId;
        }

        return c.json(
            await documentService.findDocuments(filter)
        );
    })

    // Get document metadata
    .get(":doc", async (c) => {
        const user = c.get("user");
        const { doc } = c.req.param();

        const document = await documentService.findDocumentById(
            doc,
            user.id
        );

        if (!document) {
            return c.json(
                { error: "couldn't find document" },
                404
            );
        }

        return c.json(document);
    })

    // Get original file
    .get(":doc/original", async (c) => {
        const user = c.get("user");
        const { doc } = c.req.param();

        const document = await documentService.findDocumentById(
            doc,
            user.id
        );

        if (!document) {
            return c.json(
                { error: "couldn't find document" },
                404
            );
        }

        const s3Key =
            documentService.buildS3KeyFromDocument(document);

        const file = await s3Service.readFile(s3Key);

        return c.body(file, 200);
    })

    // Create document
    .post(
        "",
        sValidator("form", documentSchema),
        async (c) => {
            const user = c.get("user");
            const { fileName, file, parentFolderId } = c.req.valid("form");

            const document =
                await documentService.createDocument(
                    {
                        fileName,
                        ownerId: user.id,
                        parentFolderId: parentFolderId ?? null,
                    },
                    await file.arrayBuffer()
                );

            return c.json(document, 201);
        }
    )

    // Update document metadata
    .patch(
        ":doc",
        sValidator("json", updateDocumentSchema),
        async (c) => {
            const user = c.get("user");
            const { doc } = c.req.param();
            const updates = c.req.valid("json");

            const document =
                await documentService.updateDocument(
                    doc,
                    user.id,
                    updates
                );

            if (!document) {
                return c.json(
                    { error: "couldn't find document" },
                    404
                );
            }

            return c.json(document);
        }
    )

    // Delete document
    .delete(":doc", async (c) => {
        const user = c.get("user");
        const { doc } = c.req.param();

        
        await documentService.deleteDocument(
            doc,
            user.id
        );

        return c.body(null, 204);
    });

export default documentRoutes;