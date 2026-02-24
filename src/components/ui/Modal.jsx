import { X } from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect } from "react"

export function Modal({ isOpen, onClose, title, children, className }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => (document.body.style.overflow = "unset")
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-950/60 animate-in fade-in duration-200">
            <div
                className="absolute inset-0"
                onClick={onClose}
            ></div>
            <div
                className={twMerge(
                    clsx(
                        "relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200",
                        className
                    )
                )}
            >
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
