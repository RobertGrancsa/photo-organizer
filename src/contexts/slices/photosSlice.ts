import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { Photo } from "@/types";

interface PhotosState {
    photos: Photo[];
    selectedPhoto?: Photo;
    selectedPhotoIndex?: number;
}

const initialState: PhotosState = {
    photos: [],
};

export const photosSlice = createSlice({
    name: "photos",
    initialState,
    reducers: {
        setPhotos: (state, action: PayloadAction<Photo[]>) => {
            state.photos = action.payload;
        },
        setSelectedPhoto: (state, action: PayloadAction<{ photo: Photo; index: number }>) => {
            state.selectedPhoto = action.payload.photo;
            state.selectedPhotoIndex = action.payload.index;
        },
        setNextPhoto: (state) => {
            state.selectedPhotoIndex = state.selectedPhotoIndex + 1;
            state.selectedPhoto = state.photos[state.selectedPhotoIndex];
        },
        setPreviousPhoto: (state) => {
            state.selectedPhotoIndex = state.selectedPhotoIndex - 1;
            state.selectedPhoto = state.photos[state.selectedPhotoIndex];
        },
        clearSelectedPhotos: (state) => {
            state.selectedPhotoIndex = undefined;
            state.selectedPhoto = undefined;
        },
    },
});

export const { setPhotos, setSelectedPhoto, setNextPhoto, setPreviousPhoto, clearSelectedPhotos } = photosSlice.actions;

export const selectPhotos = (state: RootState) => state.photo.photos;
export const selectSelectedPhoto = (state: RootState) => state.photo.selectedPhoto;
export const selectSelectedPhotoIndex = (state: RootState) => state.photo.selectedPhotoIndex;
export const selectCurrentPhoto = createSelector(selectSelectedPhoto, selectSelectedPhotoIndex, (photo, index) => ({
    photo: photo,
    index: index,
}));
export const selectNextPhoto = createSelector(selectPhotos, selectSelectedPhotoIndex, (photos, index) => ({
    photo: photos[index + 1],
    index: index + 1,
}));
export const selectPrevPhoto = createSelector(selectPhotos, selectSelectedPhotoIndex, (photos, index) => ({
    photo: photos[index - 1],
    index: index - 1,
}));

export const selectPhotoWithNeighbours = createSelector(selectCurrentPhoto, selectNextPhoto, selectPrevPhoto, (b, c, a) => [a, b, c]);

export default photosSlice.reducer;
