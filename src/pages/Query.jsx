import { useState } from "react"
import api from "../services/api"
import { Search, Package, MapPin, Phone, User, DollarSign, Calendar, Truck, Shield, ArrowRight, Hash } from "lucide-react"

export default function Query() {
    const [searchQuery, setSearchQuery] = useState("")
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        if (!searchQuery.trim()) return

        setLoading(true)
        setError("")
        setOrder(null)

        try {
            // We search for a single order by Ref Code or Order ID
            const res = await api.get(`/orders?search=${searchQuery}`)
            const ordersList = res.data.orders || res.data || []
            const found = ordersList.find(o =>
                o.order_id === searchQuery ||
                o.reference_code === searchQuery ||
                o._id === searchQuery
            )

            if (found) {
                setOrder(found)
            } else {
                setError("Order not found. Please check the Reference Code or Order ID.")
            }
        } catch (err) {
            console.error("Search failed", err)
            setError("Failed to fetch order details. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const getStatusStyle = (status) => {
        const styles = {
            delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            in_transit: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            out_for_delivery: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            picked_up: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            created: "bg-slate-500/10 text-slate-400 border-slate-500/20",
            assigned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
            returned: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        }
        return styles[status] || styles.created
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Detailed Query</h1>
                <p className="text-slate-400 mt-1">Search and view comprehensive order life-cycle information</p>
            </div>

            {/* Search Section */}
            <div className="glass-card p-1">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Enter Reference Code or Order ID (e.g. ORD-000001)"
                            className="w-full bg-slate-950/50 border-0 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[160px]"
                    >
                        {loading ? "Searching..." : (
                            <>
                                <Search className="h-5 w-5" />
                                Search
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center animate-in slide-in-from-top-2 duration-300">
                    {error}
                </div>
            )}

            {/* Result Section */}
            {order && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-500">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <Package className="h-7 w-7 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tracking Number</div>
                                    <div className="text-xl font-mono font-bold text-white">{order.order_id}</div>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border font-bold text-sm uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                {order.status?.replace(/_/g, " ")}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Sender & Receiver */}
                            <div className="glass-card p-6 space-y-6">
                                <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-3">
                                    <Truck className="h-4 w-4 text-blue-400" />
                                    Logistic Parties
                                </div>

                                <div className="space-y-4">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sender Company</div>
                                        <div className="text-white font-medium flex items-center gap-2">
                                            <Shield className="h-3 w-3 text-emerald-400" />
                                            {order.senderCompany || "Not Specified"}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Customer / Recipient</div>
                                        <div className="text-white font-medium flex items-center gap-2">
                                            <User className="h-3 w-3 text-blue-400" />
                                            {order.customerName}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                            <Phone className="h-3 w-3" />
                                            {order.phone}
                                        </div>
                                    </div>
                                    {order.receiver && order.receiver.name && (
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Direct Receiver</div>
                                            <div className="text-white font-medium text-sm">{order.receiver.name}</div>
                                            <div className="text-xs text-slate-400">{order.receiver.phone}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="glass-card p-6 space-y-6">
                                <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-3">
                                    <MapPin className="h-4 w-4 text-emerald-400" />
                                    Destination Info
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Governorate</div>
                                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20">
                                            {order.governate}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Delivery Address</div>
                                        <div className="text-slate-300 text-sm leading-relaxed italic">
                                            "{order.address}"
                                        </div>
                                    </div>
                                    {order.reference_code && (
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Internal Reference</div>
                                            <div className="text-blue-400 font-mono text-sm">{order.reference_code}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Financial Card */}
                        <div className="glass-card overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
                                <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Cash On Delivery</div>
                                <div className="text-4xl font-black">{order.cod?.toFixed(2)} EGP</div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Net Product Price</span>
                                    <span className="text-white font-bold">{order.net_cod?.toFixed(2)} EGP</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Shipping Fees</span>
                                    <span className="text-white font-bold">{order.shipping_price?.toFixed(2)} EGP</span>
                                </div>
                                <div className="h-px bg-slate-800 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300 font-bold">Grand Total</span>
                                    <span className="text-emerald-400 font-black text-xl">{order.cod?.toFixed(2)} EGP</span>
                                </div>
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase mb-4">
                                <Shield className="h-4 w-4 text-purple-400" />
                                System Info
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Booked Date</div>
                                    <div className="text-xs text-white">{new Date(order.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-slate-500" />
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Assigned Driver</div>
                                    <div className="text-xs text-white font-bold">{order.assignedTo?.name || "Unassigned"}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Hash className="h-4 w-4 text-slate-500" />
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Internal Key</div>
                                    <div className="text-[10px] font-mono text-slate-600 truncate">{order._id}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
