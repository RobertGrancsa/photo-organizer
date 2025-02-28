import { configureStore } from "@reduxjs/toolkit";
import pathReducer from "@/contexts/slices/pathSlice";

export const store = configureStore({
    reducer: {
        path: pathReducer,
        // config: configReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
