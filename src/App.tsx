import * as React from "react";
import "./App.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router";
import router from "@/Router";
import { AnimatePresence } from "framer-motion";

export const APP_NAME = "photo-organizer";

const App: React.FC = () => {
    return (
        <AnimatePresence mode="wait">
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
        </AnimatePresence>
    );
};

export default App;
