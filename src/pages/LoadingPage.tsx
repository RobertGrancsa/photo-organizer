import * as React from "react";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";

const loadingStates = [
    {
        text: "Feeding the hamster",
    },
    {
        text: "Spinning up the database",
    },
    {
        text: "Deciphering the photos",
    },
    {
        text: "Fixing the pipeline",
    },
    {
        text: "Hold on, almost ready",
    },
    {
        text: "Welcome to Photo Organizer",
    },
];

const LoadingPage = () => (
    <div className="w-full h-screen flex items-center justify-center bg-slate-200 dark:bg-slate-950">
        <Loader loadingStates={loadingStates} loading duration={2000} />(
    </div>
);

export default LoadingPage;
