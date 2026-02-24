import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function Card({ className, children, ...props }) {
    return (
        <div
            className={twMerge(
                clsx(
                    "rounded-xl glass-card p-6",
                    className
                )
            )}
            {...props}
        >
            {children}
        </div>
    )
}
