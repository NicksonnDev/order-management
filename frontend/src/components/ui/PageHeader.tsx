import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export default function PageHeader({
    title,
    description,
    actions
}: PageHeaderProps) {
    return (
        <div className="page-header-new">
            <div className="page-header-content">
                <h1>
                    {title}
                </h1>

                {description && (
                    <p>
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="page-header-actions">
                    {actions}
                </div>
            )}
        </div>
    );
}