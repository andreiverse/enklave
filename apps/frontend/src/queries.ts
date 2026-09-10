import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { client } from "./main";


export const useDocumentsQuery = (enabled: boolean | undefined) => useQuery({
    queryKey: ["documents-info"],
    queryFn: async () => {
        return await parseResponse(client.api.documents.$get());
    },
    enabled 
});

export const useSessionQuery = () => useQuery({
    queryKey: ["session-info"],
    queryFn: async () => {
        return await parseResponse(client.api.auth.session.$get());
    }
});