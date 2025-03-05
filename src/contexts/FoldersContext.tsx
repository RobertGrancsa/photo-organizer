import { getFolders } from "@/lib/api";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { setPath } from "@/contexts/slices/pathSlice";
import { useAppDispatch } from "@/lib/hooks";

const useIsInitialized = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isError, data, isSuccess } = useQuery({ queryKey: ["folders"], queryFn: getFolders });

    if (isError || (isSuccess && !data.length)) {
        navigate("/launch");
        return;
    }

    if (isSuccess && data.length) {
        console.log("set path");
        dispatch(setPath(data[0]));
        navigate("/");
    }
};

export default useIsInitialized;
