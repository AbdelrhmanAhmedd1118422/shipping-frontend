import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

const ToastContext = createContext()

export function useToast() {
    return useContext(ToastContext)
}

function ToastItem({ toast, onDismiss }) {
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true)
            setTimeout(() => onDismiss(toast.id), 300)
        }, toast.duration || 4000)
        return () => clearTimeout(timer)
    }, [toast, onDismiss])

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
        error: <XCircle className="h-5 w-5 text-red-400" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
        info: <Info className="h-5 w-5 text-blue-400" />
    }

    const borders = {
        success: "border-emerald-500/30",
        error: "border-red-500/30",
        warning: "border-amber-500/30",
        info: "border-blue-500/30"
    }

    return (
        <div
            className={`flex items-start gap-3 rounded-xl border ${borders[toast.type]} bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl transition-all duration-300 ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}`}
            style={{ minWidth: "320px", maxWidth: "450px", animation: isExiting ? "" : "slideInRight 0.3s ease-out" }}
        >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                {toast.title && <p className="text-sm font-semibold text-white">{toast.title}</p>}
                <p className="text-sm text-slate-300">{toast.message}</p>
            </div>
            <button
                onClick={() => { setIsExiting(true); setTimeout(() => onDismiss(toast.id), 300) }}
                className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = "info", title = "", duration = 4000) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type, title, duration }])
    }, [])

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const toast = {
        success: (message, title) => addToast(message, "success", title),
        error: (message, title) => addToast(message, "error", title),
        warning: (message, title) => addToast(message, "warning", title),
        info: (message, title) => addToast(message, "info", title),
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div className="fixed right-6 top-6 z-[9999] flex flex-col gap-3">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
                ))}
            </div>
            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </ToastContext.Provider>
    )
}
