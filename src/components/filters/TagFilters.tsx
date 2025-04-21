import * as React from "react";
import { ClickableBadge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addTagFilter, removeTagFilter, selectTags } from "@/contexts/slices/photosSlice";
import { capitalize } from "lodash";

const TagFilters: React.FC = () => {
    const tags = useAppSelector(selectTags);
    const dispatch = useAppDispatch();

    return (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex border-b p-4">
            <div className="flex items-center gap-2 w-full flex-wrap">
                {tags.map((tag) => (
                    <ClickableBadge
                        key={tag}
                        onClickSelect={() => {
                            dispatch(addTagFilter(tag));
                        }}
                        onClickDeselect={() => {
                            dispatch(removeTagFilter(tag));
                        }}
                    >
                        {capitalize(tag)}
                    </ClickableBadge>
                ))}
            </div>
        </motion.div>
    );
};

export default TagFilters;
