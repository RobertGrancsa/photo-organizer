import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { listen } from "@tauri-apps/api/event";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "../ui/sonner";

const PreviewToast = ({ progress }) => (
    <div style={{ padding: "1rem", minWidth: "250px" }}>
        <p style={{ marginBottom: "0.5rem" }}>
            {progress < 100 ? `Generating previews... ${progress.toFixed(2)}%` : "Preview generation complete!"}
        </p>
        <Progress value={progress} max={100} />
    </div>
);

const PreviewNotifier = () => {
    const [progress, setProgress] = useState(0);
    const toastIdRef = useRef<string | number | null>(null);

    useEffect(() => {
        // preview-start: Create toast if not already present
        console.log(toastIdRef.current, "current toast id");
        const startUnlisten = listen<string>("preview-start", () => {
            if (!toastIdRef.current) {
                toastIdRef.current = toast(<PreviewToast progress={0} />, {
                    duration: Infinity,
                    dismissible: true,
                });
                setProgress(0);
            }
        });

        // preview-progress: Update the progress state (and thus the toast)
        const progressUnlisten = listen<number>("preview-progress", (event) => {
            const newProgress = event.payload;
            setProgress(newProgress);
            console.log(newProgress, "new progress");
            if (toastIdRef.current) {
                toast(<PreviewToast progress={newProgress} />, { id: toastIdRef.current });
            }
        });

        // preview-end: Set progress to complete, show success and clean up
        const endUnlisten = listen<string>("preview-end", () => {
            if (toastIdRef.current) {
                toast.success(<PreviewToast progress={100} />, { id: toastIdRef.current });
                setTimeout(() => {
                    toast.dismiss(toastIdRef.current!);
                    toastIdRef.current = null;
                    setProgress(0);
                }, 4000);
            }
        });

        return () => {
            startUnlisten.then((fn) => fn());
            progressUnlisten.then((fn) => fn());
            endUnlisten.then((fn) => fn());
        };
    }, [toastIdRef.current]);

    return <Toaster visibleToasts={5} />;
};

export default PreviewNotifier;
