import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function Badge({ className, variant = "default", ...props }) {
    return (
        <span
            className={twMerge(
                clsx(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    {
                        "bg-indigo-500/10 text-indigo-400": variant === "default",
                        "bg-emerald-500/10 text-emerald-400": variant === "success", // Delivered
                        "bg-amber-500/10 text-amber-400": variant === "warning", // Pending, In Transit
                        "bg-rose-500/10 text-rose-400": variant === "destructive", // Cancelled, Returned
                        "bg-slate-800 text-slate-400": variant === "secondary",
                    },
                    className
                )
            )}
            {...props}
        />
    )
}
