import * as React from "react";
import { Photo } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getPhotoSummary } from "@/lib/api";

interface HoverCardProps {
    photo: Photo;
}

const PhotoHoverCard: React.FC<HoverCardProps> = ({ photo }) => {
    const { data, isSuccess } = useQuery({
        queryKey: ["summary", photo.id],
        queryFn: () => getPhotoSummary([photo.id]),
    });

    // Get the first (and only) summary, since we requested one photo
    const summary = isSuccess && data && data[0];

    return (
        <div className="flex flex-col space-y-1 p-2">
            <h4 className="text-sm font-semibold">Name: {photo.name}</h4>
            {summary ? (
                <>
                    <p className="text-sm">
                        Date: {summary.date_time_original ? new Date(summary.date_time_original).toLocaleString() : "N/A"}
                    </p>
                    <p className="text-sm">
                        Camera: {summary.make ?? "?"} {summary.model ?? ""}
                    </p>
                    <p className="text-sm">
                        Dimensions: {summary.width ?? "?"}×{summary.height ?? "?"} px
                    </p>
                    <p className="text-sm">
                        ISO: {summary.iso_speed ?? "?"} | f/{summary.aperture ?? "?"} | {summary.shutter_speed ?? "?"}s |{" "}
                        {summary.focal_length ?? "?"}mm
                    </p>
                    {(summary.gps_latitude || summary.gps_longitude) && (
                        <p className="text-xs text-muted-foreground">
                            GPS: {summary.gps_latitude ?? "?"}, {summary.gps_longitude ?? "?"}
                        </p>
                    )}
                </>
            ) : (
                <p className="text-sm text-muted-foreground">Loading metadata...</p>
            )}
        </div>
    );
};

export default PhotoHoverCard;
