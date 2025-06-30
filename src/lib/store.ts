import { configureStore } from "@reduxjs/toolkit";
import pathReducer from "@/contexts/slices/pathSlice";
import photosReducer from "@/contexts/slices/photosSlice";

export const store = configureStore({
    reducer: {
        path: pathReducer,
        photo: photosReducer,
        // config: configReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
