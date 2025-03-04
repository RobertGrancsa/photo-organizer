import { PropsWithChildren, useEffect, useRef } from "react";
import * as React from "react";

interface MeasureWrapperProps {
    onResize: (rect: DOMRectReadOnly) => void;
}

const MeasureWrapper: React.FC<PropsWithChildren<MeasureWrapperProps>> = ({ children, onResize }) => {
    const ref = useRef();

    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => onResize(entry.contentRect));
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [onResize]);

    return (
        <div ref={ref} className="flex h-fit">
            {children}
        </div>
    );
};

export default MeasureWrapper;
