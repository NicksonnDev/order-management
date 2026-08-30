import { ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    variant?:
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral";
}

export default function Badge({
    children,
    variant = "neutral"
}: BadgeProps) {
    return (
        <span
            className={`badge badge-${variant}`}
        >
            <span className="badge-dot" />

            {children}
        </span>
    );
}