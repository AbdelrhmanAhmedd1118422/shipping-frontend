import { useEffect, useState } from "react"
import api from "../services/api"
import { Search, Filter, MoreHorizontal, UserPlus, X, Mail, User, Shield, Printer, Barcode, Plus, Phone } from "lucide-react"

export default function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [userOrders, setUserOrders] = useState([])
    const [ordersDateFilter, setOrdersDateFilter] = useState("")
    const [buttonLoading, setButtonLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Scan to Assign states
    const [isScanModalOpen, setIsScanModalOpen] = useState(false)
    const [scanInput, setScanInput] = useState("")
    const [scanLogs, setScanLogs] = useState([])
    const [lastScanResult, setLastScanResult] = useState(null)
    const [selectedUserForAssign, setSelectedUserForAssign] = useState("")
    const [scanStatus, setScanStatus] = useState("assigned")
    const [newUser, setNewUser] = useState({
        name: "",
        phone: "",
        email: "",
        role: "User",
        status: "active"
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users")
            setUsers(res.data)
        } catch (err) {
            console.error("Failed to fetch users", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async () => {
        setButtonLoading(true)
        try {
            const res = await api.post("/users", newUser)
            setUsers([res.data, ...users])
            setIsModalOpen(false)
            setNewUser({ name: "", phone: "", email: "", role: "User", status: "active" })
        } catch (err) {
            console.error("Failed to add user", err)
            alert(err.response?.data?.message || "Failed to add user")
        } finally {
            setButtonLoading(false)
        }
    }

    const handleDeleteUser = async (id) => {
        if (!confirm("Are you sure you want to delete this user?")) return
        try {
            await api.delete(`/users/${id}`)
            setUsers(users.filter(u => u._id !== id))
        } catch (err) {
            console.error("Failed to delete user", err)
            alert("Failed to delete user")
        }
    }

    const handleViewOrders = async (user) => {
        setSelectedUser(user)
        setIsOrdersModalOpen(true)
        setUserOrders([]) // Clear previous
        try {
            const res = await api.get(`/orders?assignedTo=${user._id}`)
            setUserOrders(res.data.orders || res.data || [])
        } catch (err) {
            console.error("Failed to fetch user orders", err)
            alert("Failed to fetch user orders")
        }
    }

    const handleUnassignOrder = async (orderId) => {
        if (!confirm("Are you sure you want to remove this order from the user?")) return
        try {
            await api.put(`/orders/${orderId}/assign`, { userId: null })
            setUserOrders(userOrders.filter(o => o._id !== orderId))
            // Optionally refresh users if needed, but since it's just the modal contents it should be fine
        } catch (err) {
            console.error("Failed to unassign order", err)
            alert("Failed to unassign order")
        }
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus })
            setUserOrders(userOrders.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
        } catch (err) {
            console.error("Failed to update status", err)
            alert("Failed to update status")
        }
    }

    const handleScan = async (e) => {
        if (e.key !== 'Enter') return
        if (!scanInput.trim() || !selectedUserForAssign) return

        const code = scanInput.trim()
        setScanInput("") // Clear immediately for next scan

        try {
            const res = await api.put("/orders/assign-by-code", {
                code: code,
                userId: selectedUserForAssign,
                status: scanStatus
            })

            const logEntry = {
                id: Date.now(),
                code: code,
                orderId: res.data.order_id,
                customer: res.data.customerName,
                success: true,
                time: new Date().toLocaleTimeString()
            }

            setScanLogs(prev => [logEntry, ...prev])
            setLastScanResult({ success: true, message: `Assigned: ${res.data.order_id || code}` })

            // If the orders modal is open for the same user, refresh their orders
            if (isOrdersModalOpen && selectedUser?._id === selectedUserForAssign) {
                const refreshedOrders = await api.get(`/orders?assignedTo=${selectedUserForAssign}`)
                setUserOrders(refreshedOrders.data.orders || refreshedOrders.data || [])
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Order not found"
            setScanLogs(prev => [{
                id: Date.now(),
                code: code,
                success: false,
                message: errorMsg,
                time: new Date().toLocaleTimeString()
            }, ...prev])
            setLastScanResult({ success: false, message: errorMsg })
        }

        // Clear result message after 2 seconds
        setTimeout(() => setLastScanResult(null), 2000)
    }

    const openScanForUser = (user) => {
        setSelectedUserForAssign(user._id)
        setScanStatus("assigned") // Reset status to default for safety
        setIsScanModalOpen(true)
        setScanLogs([])
        setLastScanResult(null)
    }

    const totalCOD = userOrders.reduce((sum, order) => sum + (order.cod || 0), 0)
    const totalDeliveredCOD = userOrders.filter(o => o.status === 'delivered').reduce((sum, order) => sum + (order.cod || 0), 0)

    const filteredAssignedOrders = userOrders.filter(order => {
        if (!ordersDateFilter) return true
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
        return orderDate === ordersDateFilter
    })

    const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const handlePrintAssignedOrders = () => {
        const printWindow = window.open("", "_blank", "width=1000,height=800")
        const dateStr = ordersDateFilter || "All Dates"

        let tableRows = filteredAssignedOrders.map(order => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${order.order_id}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${order.customerName}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${order.phone}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${order.governate}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${order.status.replace(/_/g, ' ')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.cod?.toFixed(2)} EGP</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.reference_code || order.order_id}&scale=2&height=10" alt="barcode" style="height: 30px;" />
                </td>
            </tr>
        `).join("")

        printWindow.document.write(`
            <html>
                <head>
                    <title>Assigned Orders - ${selectedUser?.name}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        h1 { font-size: 24px; margin-bottom: 5px; }
                        p { color: #666; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f4f4f4; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
                        .footer { margin-top: 30px; text-align: right; font-weight: bold; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <h1>Assigned Orders Report</h1>
                    <p>Driver: <b>${selectedUser?.name}</b> | Date Filter: <b>${dateStr}</b></p>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Governate</th>
                                <th>Status</th>
                                <th>COD Amount</th>
                                <th>Barcode</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <div class="footer">
                        Total COD: ${filteredAssignedOrders.reduce((sum, o) => sum + (o.cod || 0), 0).toFixed(2)} EGP
                    </div>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-slate-400">Manage system users and permissions</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            setSelectedUserForAssign("")
                            setIsScanModalOpen(true)
                            setScanLogs([])
                            setLastScanResult(null)
                        }}
                        className="btn-secondary border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                        <Barcode className="h-4 w-4" />
                        Scan to Assign
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                        <UserPlus className="h-4 w-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
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
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="table-header">User</th>
                                <th className="table-header">Role</th>
                                <th className="table-header">Status</th>
                                <th className="table-header">Joined</th>
                                <th className="table-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <User className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                                        No users yet. Add your first user!
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="table-row">
                                        <td className="table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                                                    {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.name}</div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                        <Phone className="h-2.5 w-2.5" />
                                                        {user.phone}
                                                        {user.email && <>
                                                            <span className="text-slate-700">•</span>
                                                            <Mail className="h-2.5 w-2.5" />
                                                            {user.email}
                                                        </>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`badge ${user.role === "Admin" ? "badge-warning" : "badge-default"}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`badge ${user.status === "active" ? "badge-success" : "badge-error"}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="table-cell text-slate-400">
                                            {new Date(user.createdAt || user.joinedAt).toLocaleDateString()}
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewOrders(user)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-blue-400"
                                                    title="View Orders"
                                                >
                                                    <Shield className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="p-2 hover:bg-red-900/20 text-red-400 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white">Add New User</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        placeholder="+20 XXX XXX XXXX"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address (Optional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="User">User</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={buttonLoading}
                                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {buttonLoading ? "Adding..." : "Create User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Orders Modal */}
            {isOrdersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Assigned Orders</h2>
                                    <p className="text-slate-400 text-sm">For {selectedUser?.name}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block"></div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="date"
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={ordersDateFilter}
                                        onChange={(e) => setOrdersDateFilter(e.target.value)}
                                    />
                                    <button
                                        onClick={() => openScanForUser(selectedUser)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 text-xs font-bold transition-all"
                                    >
                                        <Barcode className="h-3.5 w-3.5" />
                                        Quick Scan
                                    </button>
                                    <button
                                        onClick={handlePrintAssignedOrders}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 text-xs font-bold transition-all"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                        Print List
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOrdersModalOpen(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                            {userOrders.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <div className="mb-2">No orders assigned to this user</div>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-950/50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Barcode</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredAssignedOrders.map(order => (
                                            <tr key={order._id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400">{order.order_id || '—'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                    <div>{order.customerName}</div>
                                                    <div className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                                                    >
                                                        <option value="created">Created</option>
                                                        <option value="assigned">Assigned</option>
                                                        <option value="picked_up">Picked Up</option>
                                                        <option value="in_transit">In Transit</option>
                                                        <option value="out_for_delivery">Out for Delivery</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="returned">Returned</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-400 font-bold">
                                                    {order.cod?.toFixed(2)} EGP
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <img
                                                        src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.reference_code || order.order_id}&scale=2&height=10`}
                                                        alt="barcode"
                                                        className="h-8 mx-auto"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    <button
                                                        onClick={() => handleUnassignOrder(order._id)}
                                                        className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                                        title="Remove from User"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="text-sm font-medium text-slate-400">
                                    Total Assigned: {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'}
                                </div>
                                <div className="text-xs text-slate-500">
                                    Delivered: {userOrders.filter(o => o.status === 'delivered').length} orders
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Total Delivered COD</div>
                                    <div className="text-xl font-black text-blue-400">
                                        {totalDeliveredCOD.toFixed(2)} EGP
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Total Assigned COD</div>
                                    <div className="text-xl font-black text-emerald-400">
                                        {totalCOD.toFixed(2)} EGP
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Scan to Assign Modal */}
            {isScanModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between border-b border-slate-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                                    <Barcode className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Scan to Assign</h2>
                                    <p className="text-xs text-slate-400">Rapidly scan barcodes to assign orders</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsScanModalOpen(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
                            {/* Target User and Status Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Driver / User</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none text-base font-medium"
                                            value={selectedUserForAssign}
                                            onChange={(e) => setSelectedUserForAssign(e.target.value)}
                                        >
                                            <option value="">Select Target User...</option>
                                            {users.map(u => (
                                                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Status</label>
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none text-base font-medium"
                                            value={scanStatus}
                                            onChange={(e) => setScanStatus(e.target.value)}
                                        >
                                            <option value="created">Created</option>
                                            <option value="assigned">Assigned</option>
                                            <option value="picked_up">Picked Up</option>
                                            <option value="in_transit">In Transit</option>
                                            <option value="out_for_delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="returned">Returned</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Scan Input Area */}
                            <div className={`relative transition-all duration-300 ${!selectedUserForAssign ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    autoFocus
                                    className={`w-full bg-slate-950 border-2 rounded-xl px-4 py-8 text-center text-3xl font-mono tracking-widest outline-none transition-all
                                        ${lastScanResult?.success === true ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                                            lastScanResult?.success === false ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-slate-700 focus:border-blue-500'}`}
                                    placeholder={selectedUserForAssign ? "WAITING FOR SCAN..." : "Select user first..."}
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScan}
                                    onBlur={(e) => selectedUserForAssign && e.target.focus()} // Keep focused
                                />

                                {lastScanResult && (
                                    <div className={`mt-4 text-center font-bold animate-bounce ${lastScanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {lastScanResult.message}
                                    </div>
                                )}
                            </div>

                            {/* Session Log */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Session Log</h3>
                                    <span className="text-[10px] text-slate-600 font-mono">{scanLogs.length} items</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar text-white">
                                    {scanLogs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                                            <p className="text-sm italic">No scans in this session</p>
                                        </div>
                                    ) : (
                                        scanLogs.map(log => (
                                            <div key={log.id} className={`flex items-center justify-between p-3 rounded-lg border leading-none ${log.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-2 w-2 rounded-full ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <div>
                                                        <div className="text-sm font-semibold">{log.code}</div>
                                                        {log.success && <div className="text-[10px] text-slate-400">{log.customer} ({log.orderId})</div>}
                                                        {!log.success && <div className="text-[10px] text-red-400/80">{log.message}</div>}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
                            <p>Pro Tip: Keep the scanner ready. Enter key triggers auto-assignment.</p>
                            <button
                                onClick={() => setIsScanModalOpen(false)}
                                className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
