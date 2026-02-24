import { useEffect, useState } from "react"
import api from "../services/api"
import { Plus, Search, Trash, Eye, X, Building, Mail, Phone, MapPin, DollarSign, Package, Printer, Barcode, Filter } from "lucide-react"

export default function Companies() {
    const [companies, setCompanies] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newCompany, setNewCompany] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
    })

    // Company Orders Modal
    const [selectedCompany, setSelectedCompany] = useState(null)
    const [companyOrders, setCompanyOrders] = useState([])
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false)
    const [loadingOrders, setLoadingOrders] = useState(false)
    const [ordersDateFilter, setOrdersDateFilter] = useState("")

    // Scan to Assign states
    const [isScanModalOpen, setIsScanModalOpen] = useState(false)
    const [scanInput, setScanInput] = useState("")
    const [scanLogs, setScanLogs] = useState([])
    const [lastScanResult, setLastScanResult] = useState(null)
    const [selectedCompanyForAssign, setSelectedCompanyForAssign] = useState("")
    const [scanStatus, setScanStatus] = useState("assigned")

    const fetchCompanies = async () => {
        try {
            const res = await api.get("/companies")
            setCompanies(res.data)
        } catch (err) {
            console.error("Failed to fetch companies")
        }
    }

    const fetchCompanyOrders = async (company) => {
        setSelectedCompany(company)
        setIsOrdersModalOpen(true)
        setLoadingOrders(true)
        try {
            const res = await api.get(`/orders?assignedCompany=${company._id}`)
            setCompanyOrders(res.data.orders || res.data || [])
        } catch (err) {
            console.error("Failed to fetch company orders")
        } finally {
            setLoadingOrders(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    const handleCreateCompany = async () => {
        try {
            await api.post("/companies", newCompany)
            fetchCompanies()
            setIsModalOpen(false)
            setNewCompany({ name: "", email: "", phone: "", address: "" })
        } catch (err) {
            alert("Failed to create company")
        }
    }

    const handleDeleteCompany = async (id) => {
        if (!confirm("Are you sure you want to delete this company?")) return
        try {
            await api.delete(`/companies/${id}`)
            fetchCompanies()
        } catch (err) {
            alert("Failed to delete company")
        }
    }

    const unassignOrder = async (orderId) => {
        try {
            await api.put(`/orders/${orderId}/assign-company`, { companyId: null })
            setCompanyOrders(companyOrders.filter(o => o._id !== orderId))
        } catch (err) {
            alert("Failed to unassign order")
        }
    }

    const handleScan = async (e) => {
        if (e.key !== 'Enter') return
        if (!scanInput.trim() || !selectedCompanyForAssign) return

        const code = scanInput.trim()
        setScanInput("") // Clear immediately for next scan

        try {
            const res = await api.put("/orders/assign-by-code", {
                code: code,
                companyId: selectedCompanyForAssign,
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

            // If the orders modal is open for the same company, refresh their orders
            if (isOrdersModalOpen && selectedCompany?._id === selectedCompanyForAssign) {
                const refreshedOrders = await api.get(`/orders?assignedCompany=${selectedCompanyForAssign}`)
                setCompanyOrders(refreshedOrders.data.orders || refreshedOrders.data || [])
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

    const openScanForCompany = (company) => {
        setSelectedCompanyForAssign(company._id)
        setScanStatus("assigned")
        setIsScanModalOpen(true)
        setScanLogs([])
        setLastScanResult(null)
    }

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.phone.includes(searchQuery)
    )

    const totalCOD = companyOrders.reduce((sum, order) => sum + (order.cod || 0), 0)
    const totalDeliveredCOD = companyOrders.filter(o => o.status === 'delivered').reduce((sum, order) => sum + (order.cod || 0), 0)

    const filteredCompanyOrders = companyOrders.filter(order => {
        if (!ordersDateFilter) return true
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
        return orderDate === ordersDateFilter
    })

    const handlePrintCompanyOrders = () => {
        const printWindow = window.open("", "_blank", "width=1000,height=800")
        const dateStr = ordersDateFilter || "All Dates"

        let tableRows = filteredCompanyOrders.map(order => `
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
                    <title>Assigned Orders - ${selectedCompany?.name}</title>
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
                    <h1>Company Assigned Orders Report</h1>
                    <p>Company: <b>${selectedCompany?.name}</b> | Date Filter: <b>${dateStr}</b></p>
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
                        Total COD: ${filteredCompanyOrders.reduce((sum, o) => sum + (o.cod || 0), 0).toFixed(2)} EGP
                    </div>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Companies</h1>
                    <p className="text-slate-400">Manage business partners and senders</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            setSelectedCompanyForAssign("")
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
                        <Plus className="h-4 w-4" />
                        Add Company
                    </button>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search companies..."
                    className="input-field pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                    <div key={company._id} className="glass-card p-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Building className="h-6 w-6 text-blue-400" />
                                </div>
                                <button
                                    onClick={() => handleDeleteCompany(company._id)}
                                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{company.name}</h3>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Mail className="h-3 w-3" />
                                        {company.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Phone className="h-3 w-3" />
                                        {company.phone}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <MapPin className="h-3 w-3" />
                                        {company.address}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <button
                                onClick={() => fetchCompanyOrders(company)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
                            >
                                <Eye className="h-4 w-4" />
                                View Orders
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Company Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 p-6">
                            <h2 className="text-lg font-semibold text-white">Add New Company</h2>
                            <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Company Name *</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Acme Corp"
                                    value={newCompany.name}
                                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Email Address *</label>
                                <input
                                    className="input-field"
                                    type="email"
                                    placeholder="contact@company.com"
                                    value={newCompany.email}
                                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Phone Number *</label>
                                <input
                                    className="input-field"
                                    placeholder="+20 XXX XXX XXXX"
                                    value={newCompany.phone}
                                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Business Address *</label>
                                <input
                                    className="input-field"
                                    placeholder="Street, City, Building"
                                    value={newCompany.address}
                                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-800 p-6">
                            <button onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                            <button onClick={handleCreateCompany} className="btn-primary">Create Company</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Company Orders Modal */}
            {isOrdersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-4xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-slate-800 p-6 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Building className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{selectedCompany?.name}</h2>
                                    <p className="text-xs text-slate-400 font-medium">Assigned Orders Management</p>
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
                                        onClick={() => openScanForCompany(selectedCompany)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 text-xs font-bold transition-all"
                                    >
                                        <Barcode className="h-3.5 w-3.5" />
                                        Quick Scan
                                    </button>
                                    <button
                                        onClick={handlePrintCompanyOrders}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 text-xs font-bold transition-all"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                        Print List
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setIsOrdersModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-0">
                            {loadingOrders ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="h-8 w-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                    <span className="text-slate-400 font-medium">Loading orders...</span>
                                </div>
                            ) : companyOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                                    <Package className="h-12 w-12 opacity-20" />
                                    <p>No orders assigned to this company.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-950/50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Order ID</th>
                                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Customer</th>
                                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                                            <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Amount</th>
                                            <th className="px-6 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">Barcode</th>
                                            <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredCompanyOrders.map((order) => (
                                            <tr key={order._id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-400 font-semibold">{order.order_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                                    <div>{order.customerName}</div>
                                                    <div className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-800 text-slate-300 border border-slate-700">
                                                        {order.status?.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-400 font-bold">
                                                    {order.cod?.toFixed(2)} EGP
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <img
                                                        src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.reference_code || order.order_id}&scale=2&height=10`}
                                                        alt="barcode"
                                                        className="h-8 mx-auto"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => unassignOrder(order._id)}
                                                        className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 flex items-center justify-center transition-all group"
                                                        title="Unassign Order"
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
                                    Total Assigned: {companyOrders.length} {companyOrders.length === 1 ? 'Order' : 'Orders'}
                                </div>
                                <div className="text-xs text-slate-500">
                                    Delivered: {companyOrders.filter(o => o.status === 'delivered').length} orders
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
                                    <h2 className="text-xl font-bold text-white">Scan to Assign (Company)</h2>
                                    <p className="text-xs text-slate-400">Rapidly scan barcodes to assign orders to a company</p>
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
                            {/* Target Company and Status Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Company</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none text-base font-medium"
                                            value={selectedCompanyForAssign}
                                            onChange={(e) => setSelectedCompanyForAssign(e.target.value)}
                                        >
                                            <option value="">Select Target Company...</option>
                                            {companies.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
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
                            <div className={`relative transition-all duration-300 ${!selectedCompanyForAssign ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    autoFocus
                                    className={`w-full bg-slate-950 border-2 rounded-xl px-4 py-8 text-center text-3xl font-mono tracking-widest outline-none transition-all
                                        ${lastScanResult?.success === true ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                                            lastScanResult?.success === false ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-slate-700 focus:border-blue-500'}`}
                                    placeholder={selectedCompanyForAssign ? "WAITING FOR SCAN..." : "Select company first..."}
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScan}
                                    onBlur={(e) => selectedCompanyForAssign && e.target.focus()} // Keep focused
                                />

                                {lastScanResult && (
                                    <div className={`mt-4 text-center font-bold animate-bounce ${lastScanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {lastScanResult.message}
                                    </div>
                                )}
                            </div>

                            {/* Session Log */}
                            <div className="flex-1 flex flex-col overflow-hidden text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Session Log</h3>
                                    <span className="text-[10px] text-slate-600 font-mono">{scanLogs.length} items</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
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
