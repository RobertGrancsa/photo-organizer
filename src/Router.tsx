import * as React from "react";
import { Route, Routes } from "react-router";
import HeroPage from "@/pages/HeroPage";
import HomePage from "@/pages/HomePage";
import useIsInitialized from "@/contexts/FoldersContext";

const Router: React.FC = () => {
    useIsInitialized();

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/launch" element={<HeroPage />} />
        </Routes>
    );
};

export default Router;
