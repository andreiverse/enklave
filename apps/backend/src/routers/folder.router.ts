import { Hono } from "hono";
import { type } from "arktype";
import { sValidator } from "@hono/standard-validator";
import { folderService, honoUser } from "../services";

const createFolderSchema = type({
    name: "string",
    parentFolderId: "string?",
});

const updateFolderSchema = type({
    name: "string?",
    parentFolderId: "string | null | undefined",
});

const folderRoutes = new Hono()
    .use(honoUser.middleware)

    // List folders
    .get("", async (c) => {
        const user = c.get("user");
        const parentFolderId = c.req.query("parentFolderId");

        const filter: { ownerId: string; parentFolderId?: string | null } = {
            ownerId: user.id,
        };

        if (parentFolderId === "root") {
            filter.parentFolderId = null;
        } else if (parentFolderId) {
            filter.parentFolderId = parentFolderId;
        }

        return c.json(
            await folderService.findFolders(filter)
        );
    })

    // Get folder metadata
    .get(":folder", async (c) => {
        const user = c.get("user");
        const { folder } = c.req.param();

        const result =
            await folderService.findFolderById(
                folder,
                user.id
            );

        if (!result) {
            return c.json(
                { error: "couldn't find folder" },
                404
            );
        }

        return c.json(result);
    })

    // Create folder
    .post(
        "",
        sValidator("json", createFolderSchema),
        async (c) => {
            const user = c.get("user");
            const { name, parentFolderId } =
                c.req.valid("json");

            const folder =
                await folderService.createFolder(
                    name,
                    user.id,
                    parentFolderId ?? null
                );

            return c.json(folder, 201);
        }
    )

    // Update folder metadata / move folder
    .patch(
        ":folder",
        sValidator("json", updateFolderSchema),
        async (c) => {
            const user = c.get("user");
            const { folder } = c.req.param();
            const updates = c.req.valid("json");

            const result =
                await folderService.updateFolder(
                    folder,
                    user.id,
                    updates
                );

            if (!result) {
                return c.json(
                    { error: "couldn't find folder" },
                    404
                );
            }

            return c.json(result);
        }
    )

    // Delete folder
    .delete(":folder", async (c) => {
        const user = c.get("user");
        const { folder } = c.req.param();

        const result =
            await folderService.deleteFolder(
                folder,
                user.id
            );

        if (!result) {
            return c.json(
                { error: "couldn't find folder" },
                404
            );
        }

        return c.body(null, 204);
    });

export default folderRoutes;