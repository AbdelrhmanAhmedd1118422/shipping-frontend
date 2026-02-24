import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function Label({ className, children, ...props }) {
    return (
        <label
            className={twMerge(
                clsx(
                    "text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5 block",
                    className
                )
            )}
            {...props}
        >
            {children}
        </label>
    )
}
