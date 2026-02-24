import { useEffect, useState } from "react"
import api from "../services/api"
import { Search, Filter, MapPin, Package } from "lucide-react"

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

export default function Shipments() {
    const [shipments, setShipments] = useState([])
    const [searchQuery, setSearchQuery] = useState("")

    const fetchShipments = async (query = "") => {
        try {
            const url = query ? `/shipments?search=${query}` : "/shipments"
            const res = await api.get(url)
            setShipments(res.data.orders || res.data || [])
        } catch (err) {
            console.error("Failed to fetch shipments")
        }
    }

    useEffect(() => {
        fetchShipments(searchQuery)
    }, [searchQuery])

    const updateStatus = async (id, status) => {
        await api.put(`/shipments/${id}/status`, { status })
        fetchShipments(searchQuery)
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Shipments</h1>
                <p className="text-slate-400">Track and manage all active shipments</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by tracking or customer..."
                        className="input-field pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="btn-secondary">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="table-header">Tracking Code</th>
                                <th className="table-header">Receiver</th>
                                <th className="table-header">Destination</th>
                                <th className="table-header">Status</th>
                                <th className="table-header">Update</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <Package className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                                        No shipments yet. Orders will appear here when created.
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((shipment) => (
                                    <tr key={shipment._id} className="table-row">
                                        <td className="table-cell">
                                            <span className="font-mono font-medium text-blue-400">
                                                {shipment.trackingCode}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="font-medium text-white">{shipment.receiver?.name || "—"}</div>
                                            <div className="text-xs text-slate-500">{shipment.receiver?.phone || "—"}</div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                {shipment.receiver?.city || "—"}
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`badge ${getStatusBadge(shipment.status)}`}>
                                                {shipment.status?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <select
                                                value={shipment.status}
                                                onChange={(e) => updateStatus(shipment._id, e.target.value)}
                                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
                                            >
                                                <option value="created">Created</option>
                                                <option value="picked_up">Picked Up</option>
                                                <option value="in_transit">In Transit</option>
                                                <option value="out_for_delivery">Out for Delivery</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="returned">Returned</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
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
