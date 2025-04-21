import * as React from "react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Download,
    Maximize2Icon,
    MinimizeIcon,
    PaletteIcon,
    RotateCcwIcon,
    RotateCwIcon,
    Share2Icon,
    ZoomInIcon,
    ZoomOutIcon,
} from "lucide-react";

interface ImageContextMenuProps {
    children: React.ReactNode;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    onChangeBackground: (color: string) => void;
    backgroundColor: string;
}

const ImageContextMenu: React.FC<ImageContextMenuProps> = ({
    children,
    onToggleFullscreen,
    isFullscreen,
    onChangeBackground,
    backgroundColor,
}) => {
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-64">
                <ContextMenuItem onClick={onToggleFullscreen} className="cursor-pointer">
                    {isFullscreen ? (
                        <>
                            <MinimizeIcon className="mr-2 h-4 w-4" />
                            Exit Fullscreen
                        </>
                    ) : (
                        <>
                            <Maximize2Icon className="mr-2 h-4 w-4" />
                            Enter Fullscreen
                        </>
                    )}
                    <ContextMenuShortcut>F</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuShortcut className="mx-2">C (Cycle)</ContextMenuShortcut>
                <ContextMenuItem
                    onClick={() => onChangeBackground("black")}
                    className={`cursor-pointer ${backgroundColor === "black" ? "text-blue-400" : ""}`}
                >
                    <PaletteIcon className="mr-2 h-4 w-4" />
                    Black Background
                    {backgroundColor === "black" && <ContextMenuShortcut>✓</ContextMenuShortcut>}
                </ContextMenuItem>

                <ContextMenuItem
                    onClick={() => onChangeBackground("gray")}
                    className={`cursor-pointer ${backgroundColor === "gray" ? "text-blue-400" : ""}`}
                >
                    <PaletteIcon className="mr-2 h-4 w-4" />
                    Gray Background
                    {backgroundColor === "gray" && <ContextMenuShortcut>✓</ContextMenuShortcut>}
                </ContextMenuItem>

                <ContextMenuItem
                    onClick={() => onChangeBackground("white")}
                    className={`cursor-pointer ${backgroundColor === "white" ? "text-blue-400" : ""}`}
                >
                    <PaletteIcon className="mr-2 h-4 w-4" />
                    White Background
                    {backgroundColor === "white" && <ContextMenuShortcut>✓</ContextMenuShortcut>}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="cursor-pointer">
                    <RotateCwIcon className="mr-2 h-4 w-4" />
                    Rotate Right
                    <ContextMenuShortcut>R</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem className="cursor-pointer">
                    <RotateCcwIcon className="mr-2 h-4 w-4" />
                    Rotate Left
                    <ContextMenuShortcut>L</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem className="cursor-pointer">
                    <ZoomInIcon className="mr-2 h-4 w-4" />
                    Zoom In
                    <ContextMenuShortcut>+</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem className="cursor-pointer">
                    <ZoomOutIcon className="mr-2 h-4 w-4" />
                    Zoom Out
                    <ContextMenuShortcut>-</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                    <ContextMenuShortcut>D</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem className="cursor-pointer">
                    <Share2Icon className="mr-2 h-4 w-4" />
                    Share
                    <ContextMenuShortcut>S</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default ImageContextMenu;
