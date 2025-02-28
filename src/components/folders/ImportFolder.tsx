import * as React from "react";
import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFolder } from "@/lib/api";

interface ImportFolderProps {
    text: string;
    variant: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
    className: string;
}

const ImportFolder: React.FC<ImportFolderProps> = ({ text, variant, className }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: addFolder,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["folders", "photos"] }),
    });

    const uploadFolder = useCallback(async () => {
        const dir = await open({ directory: true });
        if (!dir) {
            return;
        }

        mutation.mutate(dir);

        navigate("/");
    }, []);

    return (
        <Button className={className} variant={variant} onClick={uploadFolder}>
            {text}
        </Button>
    );
};

export default ImportFolder;
