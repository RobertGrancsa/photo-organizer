import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listen } from "@tauri-apps/api/event";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "../ui/sonner";

const PreviewToast = ({ progress }) => {
    return (
        <div style={{ padding: "1rem", minWidth: "250px" }}>
            <p style={{ marginBottom: "0.5rem" }}>
                {progress < 100 ? `Generating previews... ${progress.toFixed(2)}%` : "Preview generation complete!"}
            </p>
            <Progress value={progress} max={100} />
        </div>
    );
};

const PreviewNotifier = () => {
    // Holds the active toast id so we can update/dismiss it.
    const [toastId, setToastId] = useState(null);

    useEffect(() => {
        console.log("setting up preview for toast", toastId);

        // Listen for the "preview-start" event.
        const startUnlisten = listen<string>("preview-start", () => {
            // Create a new custom toast only if one does not exist yet.
            if (!toastId) {
                const id = toast(<PreviewToast progress={0} />, {
                    duration: Infinity,
                    // You can add additional options if needed.
                });
                setToastId(id);
            }
        });

        // Listen for the "preview-progress" event.
        const progressUnlisten = listen<number>("preview-progress", (event) => {
            const newProgress = event.payload;
            console.log(newProgress);
            console.log(toastId);
            if (toastId !== null) {
                // Update the toast content with the new progress value.
                toast(<PreviewToast progress={newProgress} />, { id: toastId });
            } else {
                setToastId((oldId) => {
                    if (oldId) return oldId;

                    return toast(<PreviewToast progress={newProgress} />, {
                        duration: Infinity,
                    });
                });
            }
        });

        // Listen for the "preview-end" event.
        const endUnlisten = listen<string>("preview-end", () => {
            if (toastId !== null) {
                // Ensure the progress reaches 100%.
                toast.success(<PreviewToast progress={100} />, { id: toastId });
                // Dismiss the toast 4 seconds after completion.
                setTimeout(() => {
                    toast.dismiss(toastId);
                    setToastId(null);
                }, 4000);
            }
        });

        // Cleanup: Unsubscribe from events when the component unmounts.
        return () => {
            console.log("unlistening");
            startUnlisten.then((fn) => fn());
            progressUnlisten.then((fn) => fn());
            endUnlisten.then((fn) => fn());
        };
    }, [toastId]);

    return <Toaster visibleToasts={5} />;
};

export default PreviewNotifier;
