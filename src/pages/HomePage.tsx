import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFolders, getPhotosAtPath } from "@/lib/api";
import LoadingPage from "@/pages/LoadingPage";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Sidebar from "@/components/Sidebar";
import PhotoArea from "@/components/photo/PhotoArea";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentFolder } from "@/contexts/slices/pathSlice";

const HomePage = () => {
    const folder = useAppSelector(selectCurrentFolder);
    const { isFetched, data: loadedPhotos } = useQuery({
        queryKey: ["photos", folder.path],
        queryFn: () => getPhotosAtPath(folder.path),
        enabled: !!folder.id,
    });

    console.log(loadedPhotos);

    if (!isFetched) {
        return <LoadingPage />;
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="w-screen h-screen rounded-lg border md:min-w-[450px]">
            <ResizablePanel defaultSize={15} maxSize={40}>
                <Sidebar />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={85}>
                <PhotoArea photos={loadedPhotos} />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};

export default HomePage;
