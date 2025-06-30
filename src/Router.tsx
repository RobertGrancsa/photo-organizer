import * as React from "react";
import { createBrowserRouter } from "react-router";
import HeroPage from "@/pages/HeroPage";
import HomePage from "@/pages/HomePage";
import { Loader } from "lucide-react";
import PhotoArea from "@/components/photo/grid/PhotoArea";
import PhotoCarousel from "@/components/photo/carousel/PhotoCarousel";

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
                element: <PhotoCarousel />,
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
