import { client } from "#/main";
import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function UploadFile({ onUpdate, currentFolderId }: {
    onUpdate: () => void;
    currentFolderId: string | null;
}) {
    const [fileName, setFileName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function reset() {
        setFileName('');
        setFile(null);
        fileInputRef.current!.value = '';

    }

    async function upload() {
        if (!file) return;

        const formData = new FormData();
        formData.append('fileName', fileName);
        formData.append('file', file);

        const response = await client.api.documents.$post({
            form: {
                fileName,
                file,
                ...(currentFolderId ? { parentFolderId: currentFolderId } : {}),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.data['message']);
            return;
        }

        reset();
        onUpdate();
    }

    return <div className='flex gap-2'>
        <Input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setFileName(e.target.files?.[0].name || "");
            }}
        />

        {
            fileName != "" && <>
                <Input
                    type="text"
                    placeholder={"Filename"}
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                />


                <Button onClick={upload}>
                    Add document
                </Button>
                <Button onClick={reset} variant="ghost">
                    Cancel
                </Button>
            </>
        }
    </div>;
}