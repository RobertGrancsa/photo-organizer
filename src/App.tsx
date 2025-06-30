import * as React from "react";
import "./App.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router";
import router from "@/Router";
import { AnimatePresence } from "framer-motion";
import PreviewNotifier from "@/components/notifications/PreviewNotifier";
import Titlebar from "@/components/menu/Titlebar";

export const APP_NAME = "photo-organizer";

const App: React.FC = () => {
    return (
        <AnimatePresence mode="wait">
            <Titlebar />
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
            <PreviewNotifier />
        </AnimatePresence>
    );
};

export default App;
