import { getFolders } from "@/lib/api";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { selectCurrentPath, setPath, setPreviewsDir } from "@/contexts/slices/pathSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { join, localDataDir } from "@tauri-apps/api/path";
import { APP_NAME } from "@/App";
import { useEffect } from "react";

const useIsInitialized = () => {
    const dirName = useAppSelector(selectCurrentPath);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isError, data, isSuccess } = useQuery({ queryKey: ["folders"], queryFn: getFolders });
    const { data: dirData, isSuccess: isDirLoaded } = useQuery({
        queryKey: ["previews-dir"],
        queryFn: async () => join(await localDataDir(), APP_NAME),
    });

    useEffect(() => {
        if (isError || (isSuccess && !data.length)) {
            navigate("/launch");
            return;
        }

        if (dirData && isDirLoaded) {
            dispatch(setPreviewsDir(dirData));
        }

        if (isSuccess && data.length && !dirName) {
            console.log("set path");
            dispatch(setPath(data[0]));
            navigate("/" + data[0].id, { replace: true });
        }
    }, [isSuccess, isError, data, dirData]);
};

export default useIsInitialized;
