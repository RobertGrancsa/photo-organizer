import * as React from "react";
import { createBrowserRouter } from "react-router";
import HeroPage from "@/pages/HeroPage";
import HomePage from "@/pages/HomePage";
import PhotoDisplay from "@/components/photo/PhotoDisplay";
import { Loader } from "lucide-react";
import PhotoArea from "@/components/photo/PhotoArea";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
        children: [
            {
                path: "/:directory",
                element: <PhotoArea />,
            },
            {
                path: "/:directory/:name",
                element: <PhotoDisplay />,
            },
        ],
    },
    {
        path: "/launch",
        element: <HeroPage />,
    },
    {
        path: "*",
        element: <Loader />,
    },
]);

export default router;
