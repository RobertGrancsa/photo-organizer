import { invoke } from "@tauri-apps/api/core";
import { Folder } from "@/contexts/FoldersContext";

export async function getFolders(): Promise<Folder> {
    return invoke("getFolders");
}

export async function getPhotos(path: string): Promise<string[]> {
    return invoke("getPhotosFromPath", { path });
}
