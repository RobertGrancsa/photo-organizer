import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";
import { Folder } from "@/types/folder";

export interface PathState {
    folder: Folder;
    previewsDir: string;
}

const initialState: PathState = {
    folder: { id: "", path: "", isImported: false, photoCount: 0 },
    previewsDir: "",
};

export const pathSlice = createSlice({
    name: "path",
    initialState,
    reducers: {
        setPath: (state, action: PayloadAction<Folder>) => {
            state.folder = action.payload;
        },
        setPreviewsDir: (state, action: PayloadAction<string>) => {
            state.previewsDir = action.payload;
        },
    },
});

export const { setPath, setPreviewsDir } = pathSlice.actions;

export const selectCurrentPath = (state: RootState) => state.path.folder.path;
export const selectCurrentFolder = (state: RootState) => state.path.folder;
export const selectPreviewDir = (state: RootState) => state.path.previewsDir;

export default pathSlice.reducer;
