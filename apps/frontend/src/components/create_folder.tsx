import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCreateFolderMutation } from "#/queries";
import { FolderPlusIcon } from "@phosphor-icons/react";

export function CreateFolder({ currentFolderId }: {
    currentFolderId: string | null;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const createFolder = useCreateFolderMutation(currentFolderId);

    async function handleCreate() {
        const name = folderName.trim();
        if (!name) return;

        try {
            await createFolder.mutateAsync(name);
            setFolderName('');
            setIsOpen(false);
        } catch (e: any) {
            alert(e.message ?? "Failed to create folder");
        }
    }

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
            >
                <FolderPlusIcon className="size-4 mr-1" />
                New Folder
            </Button>
        );
    }

    return (
        <div className='flex gap-2 items-center'>
            <Input
                type="text"
                placeholder="Folder name"
                value={folderName}
                autoFocus
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                        setFolderName('');
                    }
                }}
                className="max-w-60"
            />
            <Button
                onClick={handleCreate}
                disabled={createFolder.isPending || !folderName.trim()}
            >
                {createFolder.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button
                variant="ghost"
                onClick={() => {
                    setIsOpen(false);
                    setFolderName('');
                }}
            >
                Cancel
            </Button>
        </div>
    );
}
