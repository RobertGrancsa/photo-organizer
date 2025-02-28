import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { Folder } from "@/types/folder";

interface PathState {
    folder: Folder;
}

const initialState: PathState = {
    folder: { id: "", path: "", isImported: false },
};

export const pathSlice = createSlice({
    name: "path",
    initialState,
    reducers: {
        setPath: (state, action: PayloadAction<Folder>) => {
            state.folder = action.payload;
        },
    },
});

export const { setPath } = pathSlice.actions;

export const selectCurrentPath = (state: RootState) => state.path.folder.path;
export const selectCurrentFolder = (state: RootState) => state.path.folder;

export default pathSlice.reducer;
