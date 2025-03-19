import { invoke } from "@tauri-apps/api/core";
import { Folder, Photo, PhotoData } from "@/types";

export async function getFolders(): Promise<Folder[]> {
    return invoke("get_folders");
}

export async function addFolder(path: string): Promise<Folder> {
    return invoke("add_folder", { path });
}

export async function getPhotosAtPath(path: string, tagFilters: string[]): Promise<PhotoData> {
    return invoke("get_photos_from_path", { path, tagFilters });
}
