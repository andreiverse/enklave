import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { client } from "./main";


export const useDocumentsQuery = (currentFolderId: string | null, enabled: boolean | undefined) => useQuery({
    queryKey: ["documents-info", currentFolderId],
    queryFn: async () => {
        const folderId = currentFolderId ?? "root";
        return await parseResponse(client.api.documents.$get({
            query: { folderId },
        }));
    },
    enabled 
});

export const useFoldersQuery = (currentFolderId: string | null, enabled: boolean | undefined) => useQuery({
    queryKey: ["folders-info", currentFolderId],
    queryFn: async () => {
        const parentFolderId = currentFolderId ?? "root";
        return await parseResponse(client.api.folders.$get({
            query: { parentFolderId },
        }));
    },
    enabled
});

export const useCreateFolderMutation = (currentFolderId: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (name: string) => {
            const res = await client.api.folders.$post({
                json: {
                    name,
                    parentFolderId: currentFolderId ?? undefined,
                },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error((error as any).error ?? "Failed to create folder");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["folders-info", currentFolderId] });
        },
    });
};

export const useSessionQuery = () => useQuery({
    queryKey: ["session-info"],
    queryFn: async () => {
        return await parseResponse(client.api.auth.session.$get());
    }
});