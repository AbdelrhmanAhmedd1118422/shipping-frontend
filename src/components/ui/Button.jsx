import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function Button({ className, variant = "primary", size = "default", ...props }) {
    return (
        <button
            className={twMerge(
                clsx(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20": variant === "primary",
                        "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700": variant === "secondary",
                        "hover:bg-slate-800 text-slate-300 hover:text-white": variant === "ghost",
                        "bg-red-500/10 text-red-500 hover:bg-red-500/20": variant === "destructive",
                        "h-10 px-4 py-2": size === "default",
                        "h-8 px-3 text-sm": size === "sm",
                        "h-12 px-8 text-lg": size === "lg",
                    },
                    className
                )
            )}
            {...props}
        />
    )
}
