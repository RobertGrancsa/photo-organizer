import * as React from "react";
import { Route, Routes } from "react-router";
import HeroPage from "@/pages/HeroPage";
import LoadingPage from "@/pages/LoadingPage";

const Router: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<LoadingPage />} />
            <Route path="/launch" element={<HeroPage />} />
            <Route path="/home" element={null} />
        </Routes>
    );
};

export default Router;
