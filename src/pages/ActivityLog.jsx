import { useState, useEffect } from "react"
import api from "../services/api"
import { Activity, ChevronLeft, ChevronRight, Package, User, Building, Shield, LogIn, Trash, Edit, ArrowRight } from "lucide-react"

const actionIcons = {
    login: LogIn,
    order_created: Package,
    order_updated: Edit,
    order_deleted: Trash,
    order_status_changed: ArrowRight,
    order_assigned: ArrowRight,
    order_bulk_assigned: ArrowRight,
    order_bulk_status: ArrowRight,
    order_bulk_deleted: Trash,
    user_created: User,
    user_deleted: Trash,
    company_created: Building,
    company_deleted: Trash,
    password_changed: Shield,
}

const actionColors = {
    login: "from-blue-500 to-cyan-500",
    order_created: "from-emerald-500 to-teal-500",
    order_updated: "from-amber-500 to-orange-500",
    order_deleted: "from-red-500 to-rose-500",
    order_status_changed: "from-purple-500 to-pink-500",
    order_assigned: "from-indigo-500 to-blue-500",
    order_bulk_assigned: "from-indigo-500 to-blue-500",
    order_bulk_status: "from-purple-500 to-pink-500",
    order_bulk_deleted: "from-red-500 to-rose-500",
    user_created: "from-emerald-500 to-teal-500",
    user_deleted: "from-red-500 to-rose-500",
    company_created: "from-emerald-500 to-teal-500",
    company_deleted: "from-red-500 to-rose-500",
    password_changed: "from-amber-500 to-orange-500",
}

export default function ActivityLogPage() {
    const [logs, setLogs] = useState([])
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
    const [loading, setLoading] = useState(true)

    const fetchLogs = async (page = 1) => {
        setLoading(true)
        try {
            const res = await api.get(`/activity?page=${page}&limit=30`)
            setLogs(res.data.logs || [])
            setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
        } catch (err) {
            console.error("Failed to fetch activity logs")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchLogs() }, [])

    const formatTime = (date) => {
        const d = new Date(date)
        const now = new Date()
        const diffMs = now - d
        const diffMins = Math.floor(diffMs / 60000)
        const diffHrs = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHrs < 24) return `${diffHrs}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return d.toLocaleDateString()
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center text-slate-400">Loading activity logs...</div>
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Activity Log</h1>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
                            {pagination.total} events
                        </span>
                    </div>
                    <p className="mt-1 text-slate-400">Track all actions performed in the system</p>
                </div>
            </div>

            {/* Timeline */}
            <div className="card p-0 overflow-hidden">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Activity className="h-12 w-12 mb-3 opacity-30" />
                        <p>No activity recorded yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {logs.map((log) => {
                            const IconComp = actionIcons[log.action] || Activity
                            const gradient = actionColors[log.action] || "from-slate-500 to-slate-600"

                            return (
                                <div key={log._id} className="flex items-start gap-4 p-5 hover:bg-white/[0.02] transition-colors">
                                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                                        <IconComp className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">{log.details}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-500">
                                                by {log.performedBy?.name || "Unknown"}
                                            </span>
                                            <span className="text-xs text-slate-600">•</span>
                                            <span className="text-xs text-slate-500">
                                                {formatTime(log.createdAt)}
                                            </span>
                                            <span className="text-xs text-slate-600">•</span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${log.action.includes("delete") ? "bg-red-500/10 text-red-400" :
                                                    log.action.includes("create") ? "bg-emerald-500/10 text-emerald-400" :
                                                        log.action === "login" ? "bg-blue-500/10 text-blue-400" :
                                                            "bg-slate-500/10 text-slate-400"
                                                }`}>
                                                {log.action.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-600 flex-shrink-0 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/5 px-5 py-4">
                        <p className="text-sm text-slate-500">
                            Page {pagination.page} of {pagination.pages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchLogs(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="btn-ghost disabled:opacity-30"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button
                                onClick={() => fetchLogs(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages}
                                className="btn-ghost disabled:opacity-30"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
