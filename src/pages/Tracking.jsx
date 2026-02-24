import { useState } from "react"
import api from "../services/api"
import { Search, Package, MapPin, Phone, Truck, Clock, CheckCircle, XCircle, ArrowRight, Sparkles, AlertCircle } from "lucide-react"

const statusConfig = {
  created: { color: "from-slate-500 to-slate-600", label: "Order Created", icon: Package },
  assigned: { color: "from-blue-500 to-indigo-600", label: "Assigned", icon: Truck },
  picked_up: { color: "from-cyan-500 to-blue-600", label: "Picked Up", icon: Package },
  in_transit: { color: "from-amber-500 to-orange-600", label: "In Transit", icon: Truck },
  out_for_delivery: { color: "from-purple-500 to-pink-600", label: "Out for Delivery", icon: Truck },
  delivered: { color: "from-emerald-500 to-teal-600", label: "Delivered", icon: CheckCircle },
  returned: { color: "from-red-500 to-rose-600", label: "Returned", icon: XCircle },
  cancelled: { color: "from-red-600 to-red-800", label: "Cancelled", icon: XCircle },
}

export default function Tracking() {
  const [code, setCode] = useState("")
  const [order, setOrder] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError("")
    setOrder(null)

    try {
      const res = await api.get(`/tracking/${code.trim()}`)
      setOrder(res.data)
    } catch (err) {
      setError(err.response?.data?.message || "Order not found. Please check the tracking code.")
    } finally {
      setLoading(false)
    }
  }

  const currentStatus = statusConfig[order?.status] || statusConfig.created
  const StatusIcon = currentStatus.icon

  const allStatuses = ["created", "assigned", "picked_up", "in_transit", "out_for_delivery", "delivered"]
  const currentIndex = allStatuses.indexOf(order?.status)

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="animated-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg glow-blue">
              <Package className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Track Your Shipment</h1>
          <p className="text-slate-400 text-lg">Enter your tracking code, order ID, or reference code</p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleTrack} className="w-full max-w-xl mb-10">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter tracking code (e.g., TRK-1234567890)"
              className="input-field h-16 pl-14 pr-36 text-lg rounded-2xl"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary h-12 px-6 rounded-xl"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4" /> Track
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="w-full max-w-xl mb-8">
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {order && (
          <div className="w-full max-w-2xl space-y-6">
            {/* Status Card */}
            <div className="card overflow-hidden p-0">
              <div className={`bg-gradient-to-r ${currentStatus.color} p-6`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <StatusIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Current Status</p>
                    <h2 className="text-2xl font-bold text-white">{currentStatus.label}</h2>
                    <p className="text-white/70 text-sm mt-1">{order.order_id}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {order.status !== "returned" && order.status !== "cancelled" && (
                <div className="p-6 pb-3">
                  <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-800"></div>
                    <div
                      className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, (currentIndex / (allStatuses.length - 1)) * 100)}%` }}
                    ></div>
                    {allStatuses.map((s, i) => (
                      <div key={s} className="relative z-10 flex flex-col items-center" style={{ width: "60px" }}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${i <= currentIndex
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-700 bg-slate-900 text-slate-600"
                          }`}>
                          {i <= currentIndex ? <CheckCircle className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                        </div>
                        <p className={`mt-2 text-[10px] text-center font-medium leading-tight ${i <= currentIndex ? "text-emerald-400" : "text-slate-600"
                          }`}>
                          {s.replace(/_/g, " ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Delivery Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Recipient</p>
                    <p className="text-white font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-white">{order.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Governorate</p>
                    <p className="text-white">{order.governate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-white font-mono">{order.phone}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Shipment Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Tracking Code</p>
                    <p className="text-white font-mono font-medium">{order.trackingCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Order ID</p>
                    <p className="text-blue-400 font-mono font-medium">{order.order_id}</p>
                  </div>
                  {order.senderCompany && (
                    <div>
                      <p className="text-xs text-slate-500">Sender</p>
                      <p className="text-white">{order.senderCompany}</p>
                    </div>
                  )}
                  {order.assignedCompany && (
                    <div>
                      <p className="text-xs text-slate-500">Shipping Company</p>
                      <p className="text-white">{order.assignedCompany}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status History Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Status History
                </h3>
                <div className="space-y-1">
                  {order.statusHistory.map((entry, i) => {
                    const config = statusConfig[entry.status] || statusConfig.created
                    const EntryIcon = config.icon

                    return (
                      <div key={i} className="flex items-start gap-4 relative">
                        {i < order.statusHistory.length - 1 && (
                          <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-800" style={{ height: "calc(100% - 10px)" }}></div>
                        )}
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.color} shadow-lg z-10`}>
                          <EntryIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium">{config.label}</p>
                            <p className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                          </div>
                          {entry.note && <p className="text-sm text-slate-400 mt-0.5">{entry.note}</p>}
                          {entry.changedBy && <p className="text-xs text-slate-600 mt-0.5">by {entry.changedBy}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help text when no result */}
        {!order && !error && !loading && (
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-1 text-slate-600">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm">Enter a tracking code above to see shipment details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
