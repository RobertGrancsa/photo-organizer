import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { convertFileSrc } from "@tauri-apps/api/core";
import * as path from "path-browserify";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getPhotoPath = (dirPath: string, photoName: string) => convertFileSrc(path.join(dirPath, photoName));

export const getPreviewPath = (dirId: string, photoId: string, previewDir: string) =>
    convertFileSrc(path.join(previewDir, dirId, photoId) + ".preview.webp");
