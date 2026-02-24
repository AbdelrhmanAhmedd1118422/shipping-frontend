import { useEffect, useState } from "react"
import api from "../services/api"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Users, ShoppingBag, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Package, Sparkles } from "lucide-react"

function getStatusBadge(status) {
    const styles = {
        delivered: "badge-success",
        in_transit: "badge-warning",
        out_for_delivery: "badge-warning",
        picked_up: "badge-warning",
        created: "badge-default",
        cancelled: "badge-error",
        returned: "badge-error",
    }
    return styles[status] || "badge-default"
}

export default function Overview() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        activeShipments: 0
    })
    const [recentOrders, setRecentOrders] = useState([])
    const [chartData, setChartData] = useState([])
    const [governateStats, setGovernateStats] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/stats")
                setStats(res.data.stats || { totalRevenue: 0, totalOrders: 0, totalUsers: 0, activeShipments: 0 })
                setRecentOrders(res.data.recentOrders || [])
                setGovernateStats(res.data.codByGovernate || [])

                const formattedChartData = (res.data.ordersPerDay || []).map(day => ({
                    name: day._id,
                    orders: day.count,
                    revenue: day.revenue
                }))
                setChartData(formattedChartData)
            } catch (err) {
                console.error("Failed to fetch stats:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const statsCards = [
        { name: "Total Revenue", value: `${stats.totalRevenue?.toFixed(2) || '0.00'} EGP`, change: "Live", trend: "up", icon: DollarSign, gradient: "from-blue-500 to-cyan-500", glow: "glow-blue" },
        { name: "Total Orders", value: stats.totalOrders || 0, change: "Live", trend: "up", icon: ShoppingBag, gradient: "from-emerald-500 to-teal-500", glow: "glow-emerald" },
        { name: "Total Users", value: stats.totalUsers || 0, change: "Live", trend: "up", icon: Users, gradient: "from-purple-500 to-pink-500", glow: "glow-purple" },
        { name: "Active Shipments", value: stats.activeShipments || 0, change: "Tracking", trend: "neutral", icon: Package, gradient: "from-amber-500 to-orange-500", glow: "" },
    ]

    if (loading) {
        return <div className="flex h-full items-center justify-center text-slate-400">Loading dashboard data...</div>
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
                            <Sparkles className="h-3 w-3" /> Live
                        </span>
                    </div>
                    <p className="mt-1 text-slate-400">Welcome back! Here's what's happening today.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                    <div key={stat.name} className="stat-card">
                        <div className="flex items-center justify-between">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glow}`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${stat.trend === "up" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                                {stat.change}
                                {stat.trend === "up" && <ArrowUpRight className="h-3 w-3" />}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="mt-1 text-sm text-slate-400">{stat.name}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Chart */}
                <div className="card">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
                            <p className="text-sm text-slate-400">Daily revenue performance</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => new Date(v).getDate()} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} EGP`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                    labelStyle={{ color: '#f8fafc' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Governate Performance */}
                <div className="card">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Top Governorates</h3>
                            <p className="text-sm text-slate-400">Revenue performance by region</p>
                        </div>
                    </div>
                    <div className="h-72 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            {governateStats.length === 0 ? (
                                <div className="text-center text-slate-500 py-12">No data available</div>
                            ) : (
                                governateStats.map((item, index) => (
                                    <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-slate-400/20 text-slate-400' : index === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-slate-700 text-slate-400'}`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{item._id}</div>
                                                <div className="text-xs text-slate-500">{item.count} orders</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-emerald-400">{item.totalCod.toFixed(2)} EGP</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="card overflow-hidden p-0">
                <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                            <p className="text-sm text-slate-400">Latest customer orders</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="table-header">Order ID</th>
                                <th className="table-header">Customer</th>
                                <th className="table-header">Status</th>
                                <th className="table-header">Time</th>
                                <th className="table-header text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No orders yet</td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order._id} className="table-row">
                                        <td className="table-cell font-mono font-medium text-blue-400">{order.order_id || '—'}</td>
                                        <td className="table-cell text-white">{order.customerName}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${getStatusBadge(order.status)}`}>
                                                {order.status?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="table-cell text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="table-cell text-right font-semibold text-white">{(order.cod || 0).toFixed(2)} EGP</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
