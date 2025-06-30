export type Folder = {
    id: string;
    path: string;
    isImported: boolean;
    children?: Folder[];
    photoCount: number;
};
