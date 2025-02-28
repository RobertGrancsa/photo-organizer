import { Photo } from "@/types/photo";

export type Folder = {
    id: string;
    path: string;
    isImported: boolean;
    children?: (Folder | Photo)[];
};
