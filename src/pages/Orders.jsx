import { useEffect, useState, useRef } from "react"
import api from "../services/api"
import { Plus, Search, Filter, X, DollarSign, MapPin, Phone, User, Printer, FileText, Trash, Download, Building, Upload, Edit, ChevronLeft, ChevronRight, MessageSquare, StickyNote } from "lucide-react"
import * as XLSX from 'xlsx';
import { useToast } from "../components/Toast"

function getStatusBadge(status) {
  const styles = {
    delivered: "badge-success",
    in_transit: "badge-warning",
    out_for_delivery: "badge-warning",
    picked_up: "badge-warning",
    created: "badge-default",
    assigned: "badge-primary",
    cancelled: "badge-error",
    returned: "badge-error",

  }
  return styles[status] || "badge-default"
}

export default function Orders() {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [notesOrder, setNotesOrder] = useState(null)
  const [newNote, setNewNote] = useState("")
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    phone: "",
    address: "",
    governate: "",
    net_cod: 0,
    shipping_price: 0,
    reference_code: "",
    senderCompany: "",
    assignedTo: "",
    assignedCompany: "",
    receiver: { name: "", phone: "", city: "", address: "" }
  })

  // Assignment states
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null)
  const [selectedUserForAssign, setSelectedUserForAssign] = useState("")
  const [selectedCompanyForAssign, setSelectedCompanyForAssign] = useState("")
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCompanyAssignModalOpen, setIsCompanyAssignModalOpen] = useState(false)

  // Bulk Action states
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [isBulkCompanyModalOpen, setIsBulkCompanyModalOpen] = useState(false)
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false)
  const [selectedStatusForBulk, setSelectedStatusForBulk] = useState("")

  // Scan-to-Assign states
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [scanInput, setScanInput] = useState("")
  const [scanLogs, setScanLogs] = useState([])
  const [lastScanResult, setLastScanResult] = useState(null) // { success: boolean, message: string }
  const [scanStatus, setScanStatus] = useState("assigned")

  const openScanModal = () => {
    setIsScanModalOpen(true)
    setScanInput("")
    setScanLogs([])
    setLastScanResult(null)
    setScanStatus("assigned")
  }

  // Auto-calculate COD
  const calculatedCod = (parseFloat(newOrder.net_cod) || 0) + (parseFloat(newOrder.shipping_price) || 0)

  // Filter orders based on search query and date
  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase()

    // Date match
    const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : "";
    const matchesDate = !dateFilter || orderDate === dateFilter;

    if (!matchesDate) return false;

    return (
      String(order.customerName ?? "").toLowerCase().includes(query) ||
      String(order.order_id ?? "").toLowerCase().includes(query) ||
      String(order.reference_code ?? "").toLowerCase().includes(query) ||
      String(order.phone ?? "").toLowerCase().includes(query) ||
      String(order.governate ?? "").toLowerCase().includes(query) ||
      String(order.senderCompany ?? "").toLowerCase().includes(query) ||
      (order.assignedTo && String(order.assignedTo.name ?? "").toLowerCase().includes(query)) ||
      (order.assignedCompany && String(order.assignedCompany.name ?? "").toLowerCase().includes(query))
    )
  })

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert("No orders to export");
      return;
    }

    const dataToExport = filteredOrders.map(order => ({
      'Order ID': order.order_id,
      'Reference': order.reference_code || '',
      'Customer Name': order.customerName,
      'Phone': order.phone,
      'Governate': order.governate,
      'Address': order.address,
      'Net COD': order.net_cod,
      'Shipping': order.shipping_price,
      'Total COD': order.cod,
      'Sender Company': order.senderCompany || '',
      'Status': order.status,
      'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
      'Assigned To': order.assignedTo?.name || 'Unassigned',
      'Assigned Company': order.assignedCompany?.name || 'Unassigned'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const dateStr = dateFilter || new Date().toISOString().split('T')[0];
    const filename = `Orders_Report_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users")
      setUsers(res.data)
    } catch (err) {
      console.error("Failed to fetch users")
    }
  }

  const fetchOrders = async (page = 1) => {
    try {
      const params = new URLSearchParams({ page, limit: 50 })
      if (statusFilter) params.append('status', statusFilter)
      if (dateFilter) params.append('dateFrom', dateFilter)
      if (dateFilter) params.append('dateTo', dateFilter)
      if (searchQuery) params.append('search', searchQuery)
      const res = await api.get(`/orders?${params.toString()}`)
      setOrders(res.data.orders || res.data || [])
      if (res.data.pagination) setPagination(res.data.pagination)
    } catch (err) {
      console.error("Failed to fetch orders")
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/companies")
      setCompanies(res.data)
    } catch (err) {
      console.error("Failed to fetch companies")
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchUsers()
    fetchCompanies()
  }, [])

  // Re-fetch when filters change  
  useEffect(() => {
    fetchOrders(1)
  }, [statusFilter, dateFilter, searchQuery])

  const openEditModal = (order) => {
    setEditOrder({ ...order })
    setIsEditModalOpen(true)
  }

  const handleEditOrder = async () => {
    if (!editOrder) return
    try {
      await api.put(`/orders/${editOrder._id}/edit`, editOrder)
      toast.success(`Order ${editOrder.order_id} updated`)
      fetchOrders(pagination.page)
      setIsEditModalOpen(false)
      setEditOrder(null)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order")
    }
  }

  const openNotesModal = async (order) => {
    try {
      const res = await api.get(`/orders/${order._id}/detail`)
      setNotesOrder(res.data)
      setIsNotesModalOpen(true)
      setNewNote("")
    } catch {
      setNotesOrder(order)
      setIsNotesModalOpen(true)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !notesOrder) return
    try {
      const res = await api.post(`/orders/${notesOrder._id}/notes`, { text: newNote })
      setNotesOrder(res.data)
      setNewNote("")
      toast.success("Note added")
    } catch (err) {
      toast.error("Failed to add note")
    }
  }

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      if (rows.length === 0) {
        toast.error("No data found in the file")
        return
      }

      const mapped = rows.map(row => ({
        customerName: row['Customer Name'] || row['customerName'] || row['Name'] || '',
        phone: String(row['Phone'] || row['phone'] || ''),
        address: row['Address'] || row['address'] || '',
        governate: row['Governate'] || row['governate'] || row['Governorate'] || '',
        net_cod: parseFloat(row['Net COD'] || row['net_cod'] || 0),
        shipping_price: parseFloat(row['Shipping'] || row['shipping_price'] || row['Shipping Price'] || 0),
        reference_code: row['Reference'] || row['reference_code'] || '',
        senderCompany: row['Sender Company'] || row['senderCompany'] || '',
      }))

      const res = await api.post('/orders/bulk-import', { orders: mapped })
      toast.success(`Imported ${res.data.success} orders (${res.data.failed} failed)`, 'Import Complete')
      if (res.data.failed > 0) {
        toast.warning(res.data.errors.slice(0, 3).join(', '))
      }
      fetchOrders(1)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to import orders")
    }
    e.target.value = ''
  }

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status })
    fetchOrders()
  }

  const handleAssignOrder = async () => {
    if (!selectedOrderForAssign || !selectedUserForAssign) return
    try {
      await api.put(`/orders/${selectedOrderForAssign._id}/assign`, { userId: selectedUserForAssign })
      fetchOrders()
      setIsAssignModalOpen(false)
      setSelectedOrderForAssign(null)
      setSelectedUserForAssign("")
    } catch (err) {
      console.error("Failed to assign order", err)
      alert("Failed to assign order")
    }
  }

  const handleAssignCompany = async () => {
    if (!selectedOrderForAssign || !selectedCompanyForAssign) return
    try {
      await api.put(`/orders/${selectedOrderForAssign._id}/assign-company`, { companyId: selectedCompanyForAssign })
      fetchOrders()
      setIsCompanyAssignModalOpen(false)
      setSelectedOrderForAssign(null)
      setSelectedCompanyForAssign("")
    } catch (err) {
      console.error("Failed to assign company", err)
      alert("Failed to assign company")
    }
  }

  const openAssignModal = (order) => {
    setSelectedOrderForAssign(order)
    setSelectedUserForAssign(order.assignedTo?._id || "")
    setIsAssignModalOpen(true)
  }

  const openCompanyAssignModal = (order) => {
    setSelectedOrderForAssign(order)
    setSelectedCompanyForAssign(order.assignedCompany?._id || "")
    setIsCompanyAssignModalOpen(true)
  }

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        ...newOrder,
        net_cod: parseFloat(newOrder.net_cod) || 0,
        shipping_price: parseFloat(newOrder.shipping_price) || 0,
        cod: calculatedCod
      }
      await api.post("/orders", orderData)
      fetchOrders()
      setIsModalOpen(false)
      setNewOrder({
        customerName: "",
        phone: "",
        address: "",
        governate: "",
        net_cod: 0,
        shipping_price: 0,
        reference_code: "",
        senderCompany: "",
        assignedTo: "",
        assignedCompany: "",
        receiver: { name: "", phone: "", city: "", address: "" }
      })
    } catch (err) {
      alert("Failed to create order")
    }
  }

  const handleDeleteOrder = async (id) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return
    try {
      await api.delete(`/orders/${id}`)
      fetchOrders()
    } catch (err) {
      console.error("Failed to delete order", err)
      alert("Failed to delete order")
    }
  }

  // Bulk Handlers
  const handleToggleSelectOrder = (id) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o._id))
    }
  }

  const handleBulkAssignOrder = async () => {
    if (!selectedUserForAssign) return
    try {
      await api.put("/orders/bulk-assign", {
        orderIds: selectedOrderIds,
        userId: selectedUserForAssign
      })
      fetchOrders()
      setSelectedOrderIds([])
      setIsBulkAssignModalOpen(false)
      setSelectedUserForAssign("")
    } catch (err) {
      alert("Failed to bulk assign orders")
    }
  }

  const handleBulkAssignCompany = async () => {
    if (!selectedCompanyForAssign) return
    try {
      await api.put("/orders/bulk-assign-company", {
        orderIds: selectedOrderIds,
        companyId: selectedCompanyForAssign
      })
      fetchOrders()
      setSelectedOrderIds([])
      setIsBulkCompanyModalOpen(false)
      setSelectedCompanyForAssign("")
    } catch (err) {
      alert("Failed to bulk assign companies")
    }
  }

  const handleBulkUpdateStatus = async () => {
    if (!selectedStatusForBulk) return
    try {
      await api.put("/orders/bulk-status", {
        orderIds: selectedOrderIds,
        status: selectedStatusForBulk
      })
      fetchOrders()
      setSelectedOrderIds([])
      setIsBulkStatusModalOpen(false)
      setSelectedStatusForBulk("")
    } catch (err) {
      alert("Failed to bulk update status")
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedOrderIds.length} orders?`)) return
    try {
      await api.delete("/orders/bulk-delete", {
        data: { orderIds: selectedOrderIds }
      })
      fetchOrders()
      setSelectedOrderIds([])
    } catch (err) {
      alert("Failed to bulk delete orders")
    }
  }

  const handleScan = async (e) => {
    if (e.key !== 'Enter' || !scanInput.trim() || !selectedUserForAssign) return

    const currentCode = scanInput.trim()
    setScanInput("") // Clear immediately for next scan

    try {
      const res = await api.put("/orders/assign-by-code", {
        code: currentCode,
        userId: selectedUserForAssign,
        status: scanStatus
      })

      const newLog = {
        id: Date.now(),
        code: currentCode,
        success: true,
        orderId: res.data.order_id,
        customer: res.data.customerName,
        time: new Date().toLocaleTimeString()
      }

      setScanLogs(prev => [newLog, ...prev])
      setLastScanResult({ success: true, message: `Assigned: ${res.data.order_id}` })
      fetchOrders() // Refresh list in background
    } catch (err) {
      const errorLog = {
        id: Date.now(),
        code: currentCode,
        success: false,
        message: err.response?.data?.message || "Error assigning order",
        time: new Date().toLocaleTimeString()
      }
      setScanLogs(prev => [errorLog, ...prev])
      setLastScanResult({ success: false, message: errorLog.message })
    }
  }

  const handleBulkPrint = () => {
    const selectedOrdersData = orders.filter(o => selectedOrderIds.includes(o._id))
    const printWindow = window.open("", "_blank", "width=800,height=600")

    let labelsHtml = ""
    selectedOrdersData.forEach(order => {
      const code = order.reference_code || order.order_id || order._id
      labelsHtml += `
        <div class="label-page">
          <div class="container">
            <div class="header">Golden Way - Shipping Label</div>
            <div class="main-content">
                <div class="section">
                    <div class="row">
                        <div class="col"><div class="label">Date</div><div class="value">${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div></div>
                        <div class="col"><div class="label">Order ID</div><div class="value">${order.order_id || '—'}</div></div>
                    </div>
                </div>
                <div class="section">
                    <div class="label">Recipient</div>
                    <div class="value large">${order.customerName}</div>
                    <div class="value">${order.address}</div>
                    <div class="value">${order.governate}</div>
                    <div class="value">Tel: ${order.phone}</div>
                </div>
                ${order.senderCompany ? `<div class="section"><div class="label">Sender / Company</div><div class="value">${order.senderCompany}</div></div>` : ''}
                <div class="cod-box"><div class="cod-label">Cash On Delivery (COD)</div><div class="cod-amount">${order.cod?.toFixed(2)} EGP</div></div>
            </div>
            <div class="barcode-container">
                <img class="barcode-img" src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${code}&scale=3&height=12&includetext" alt="Barcode" />
            </div>
          </div>
        </div>
      `
    })

    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk Print Labels</title>
          <style>
            @page { size: A6; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-print-color-adjust: exact; }
            .label-page { width: 100mm; height: 150mm; padding: 20px; box-sizing: border-box; page-break-after: always; }
            .container { border: 2px solid #000; height: 100%; display: flex; flex-direction: column; }
            .header { background: #000; color: #fff; padding: 10px; text-align: center; font-weight: bold; font-size: 18px; text-transform: uppercase; }
            .main-content { flex: 1; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
            .section { border-bottom: 1px dashed #ccc; padding-bottom: 8px; }
            .label { font-size: 10px; color: #555; text-transform: uppercase; margin-bottom: 2px; font-weight: 600; }
            .value { font-size: 13px; font-weight: bold; color: #000; line-height: 1.2; }
            .value.large { font-size: 16px; }
            .row { display: flex; justify-content: space-between; gap: 10px; }
            .col { flex: 1; }
            .cod-box { border: 2px solid #000; padding: 8px; text-align: center; margin-top: auto; background: #f0f0f0; }
            .cod-label { font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .cod-amount { font-size: 20px; font-weight: 900; }
            .barcode-container { text-align: center; padding: 15px; border-top: 2px solid #000; }
            .barcode-img { max-width: 100%; height: 50px; }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 1000); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handlePrintBarcode = (order) => {
    const code = order.reference_code || order.order_id || order._id
    const printWindow = window.open("", "_blank", "width=800,height=600")
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${order.order_id}</title>
          <style>
            @page { size: A6; margin: 0; }
            body { 
                margin: 0; 
                padding: 20px; 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                -webkit-print-color-adjust: exact; 
                width: 100mm;
                height: 150mm;
                box-sizing: border-box;
            }
            .container {
                border: 2px solid #000;
                height: 98%;
                display: flex;
                flex-direction: column;
            }
            .header {
                background: #000;
                color: #fff;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                font-size: 18px;
                text-transform: uppercase;
            }
            .main-content {
                flex: 1;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .section {
                border-bottom: 1px dashed #ccc;
                padding-bottom: 10px;
            }
            .section:last-child {
                border-bottom: none;
            }
            .label {
                font-size: 10px;
                color: #555;
                text-transform: uppercase;
                margin-bottom: 4px;
                font-weight: 600;
            }
            .value {
                font-size: 14px;
                font-weight: bold;
                color: #000;
                line-height: 1.4;
            }
            .value.large {
                font-size: 18px;
            }
            .row {
                display: flex;
                justify-content: space-between;
                gap: 10px;
            }
            .col {
                flex: 1;
            }
            .cod-box {
                border: 2px solid #000;
                padding: 10px;
                text-align: center;
                margin-top: auto;
                background: #f0f0f0;
            }
            .cod-label {
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .cod-amount {
                font-size: 24px;
                font-weight: 900;
            }
            .barcode-container {
                text-align: center;
                padding: 20px;
                border-top: 2px solid #000;
            }
            .barcode-img {
                max-width: 100%;
                height: 60px;
            }
            .ref-code {
                text-align: center;
                font-family: monospace;
                font-size: 12px;
                margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
                Golden Way - Shipping Label
            </div>
            
            <div class="main-content">
                <div class="section">
                    <div class="row">
                        <div class="col">
                            <div class="label">Date</div>
                            <div class="value">${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
                        </div>
                        <div class="col">
                            <div class="label">Order ID</div>
                            <div class="value">${order.order_id || '—'}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="label">Recipient</div>
                    <div class="value large">${order.customerName}</div>
                    <div class="value">${order.address}</div>
                    <div class="value">${order.governate}</div>
                    <div class="value">Tel: ${order.phone}</div>
                </div>

                ${order.senderCompany ? `
                <div class="section">
                    <div class="label">Sender / Company</div>
                    <div class="value">${order.senderCompany}</div>
                </div>
                ` : ''}

                ${order.assignedCompany ? `
                <div class="section">
                    <div class="label">Assigned Company</div>
                    <div class="value">${order.assignedCompany.name || 'Unknown'}</div>
                </div>
                ` : ''}

                ${order.assignedTo ? `
                <div class="section">
                    <div class="label">Assigned Driver</div>
                    <div class="value">${order.assignedTo.name || 'Unknown'}</div>
                </div>
                ` : ''}

                <div class="cod-box">
                    <div class="cod-label">Cash On Delivery (COD)</div>
                    <div class="cod-amount">${order.cod?.toFixed(2)} EGP</div>
                </div>
            </div>

            <div class="barcode-container">
                <img class="barcode-img" src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${code}&scale=3&height=12&includetext" alt="Barcode" />
            </div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
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
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-slate-400">Manage and track all customer orders</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setIsScanModalOpen(true); setScanLogs([]); }}
            className="btn-secondary bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
          >
            <Plus className="h-4 w-4 rotate-45" /> {/* Using rotate-45 for a "scan" look or just Plus */}
            Scan to Assign
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, ID, Ref Code, phone, or governorate..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <input
          type="date"
          className="input-field max-w-[160px]"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <select
          className="input-field max-w-[170px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="assigned">Assigned</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_transit">In Transit</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button onClick={handleExportExcel} className="btn-secondary">
          <Download className="h-4 w-4" />
          Export
        </button>

        <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx,.xls,.csv" className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
          <Upload className="h-4 w-4" />
          Import
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0 relative">
        {selectedOrderIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-blue-600 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-white leading-none">
                {selectedOrderIds.length} orders selected
              </span>
              <div className="h-4 w-px bg-blue-400" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkAssignModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Assign User
                </button>
                <button
                  onClick={() => setIsBulkCompanyModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  <Building className="h-3.5 w-3.5" />
                  Assign Company
                </button>
                <button
                  onClick={() => setIsBulkStatusModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Status
                </button>
                <button
                  onClick={handleBulkPrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Labels
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-xs font-medium text-white transition-colors"
              >
                <Trash className="h-3.5 w-3.5" />
                Delete
              </button>
              <button
                onClick={() => setSelectedOrderIds([])}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="table-header">Order ID</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Governate</th>
                <th className="table-header">Net COD</th>
                <th className="table-header">Shipping</th>
                <th className="table-header">Total COD</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? "No orders found matching your search." : "No orders yet. Create your first order!"}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className={`table-row ${selectedOrderIds.includes(order._id) ? 'bg-blue-500/5' : ''}`}>
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                        checked={selectedOrderIds.includes(order._id)}
                        onChange={() => handleToggleSelectOrder(order._id)}
                      />
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-sm font-semibold text-blue-400">{order.order_id || '—'}</span>
                      {order.reference_code && (
                        <div className="text-xs text-slate-500 mt-1">Ref: {order.reference_code}</div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-white">{order.customerName}</div>
                      <div className="text-xs text-slate-500">{order.phone}</div>
                      {order.senderCompany && (
                        <div className="text-[10px] text-blue-400 font-semibold mt-1">Sender: {order.senderCompany}</div>
                      )}
                    </td>
                    <td className="table-cell text-slate-300">
                      {order.governate || "—"}
                    </td>
                    <td className="table-cell text-slate-300">
                      {order.net_cod?.toFixed(2) || "0.00"} EGP
                    </td>
                    <td className="table-cell text-slate-300">
                      {order.shipping_price?.toFixed(2) || "0.00"} EGP
                    </td>
                    <td className="table-cell font-semibold text-emerald-400">
                      {order.cod?.toFixed(2) || "0.00"} EGP
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintBarcode(order)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                          title="Print Barcode"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openAssignModal(order)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                          title="Assign User"
                        >
                          <User className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openCompanyAssignModal(order)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                          title="Assign Company"
                        >
                          <Building className="h-4 w-4" />
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
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
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Delete Order"
                        >
                          <Trash className="h-4 w-4" />
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

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 p-6 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-semibold text-white">Create New Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              {/* Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Assign to User</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <select
                      className="input-field pl-10 text-xs"
                      value={newOrder.assignedTo}
                      onChange={(e) => setNewOrder({ ...newOrder, assignedTo: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Assign to Company</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <select
                      className="input-field pl-10 text-xs"
                      value={newOrder.assignedCompany}
                      onChange={(e) => setNewOrder({ ...newOrder, assignedCompany: e.target.value })}
                    >
                      <option value="">None</option>
                      {companies.map(company => (
                        <option key={company._id} value={company._id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400">Customer Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Ref / Barcode (Optional)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        className="input-field pl-10"
                        placeholder="Manual Code"
                        value={newOrder.reference_code}
                        onChange={(e) => setNewOrder({ ...newOrder, reference_code: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Customer Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        className="input-field pl-10"
                        placeholder="Full name"
                        value={newOrder.customerName}
                        onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Sender Company *</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        className="input-field pl-10"
                        placeholder="Company Name"
                        value={newOrder.senderCompany}
                        onChange={(e) => setNewOrder({ ...newOrder, senderCompany: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Phone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        className="input-field pl-10"
                        placeholder="+20 XXX XXX XXXX"
                        value={newOrder.phone}
                        onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Governate *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <select
                        className="input-field pl-10"
                        value={newOrder.governate}
                        onChange={(e) => setNewOrder({ ...newOrder, governate: e.target.value })}
                      >
                        <option value="">Select governorate</option>
                        <option value="Cairo">Cairo (القاهرة)</option>
                        <option value="Giza">Giza (الجيزة)</option>
                        <option value="Alexandria">Alexandria (الإسكندرية)</option>
                        <option value="Dakahlia">Dakahlia (الدقهلية)</option>
                        <option value="Red Sea">Red Sea (البحر الأحمر)</option>
                        <option value="Beheira">Beheira (البحيرة)</option>
                        <option value="Fayoum">Fayoum (الفيوم)</option>
                        <option value="Gharbia">Gharbia (الغربية)</option>
                        <option value="Ismailia">Ismailia (الإسماعيلية)</option>
                        <option value="Menofia">Menofia (المنوفية)</option>
                        <option value="Minya">Minya (المنيا)</option>
                        <option value="Qalyubia">Qalyubia (القليوبية)</option>
                        <option value="New Valley">New Valley (الوادي الجديد)</option>
                        <option value="Suez">Suez (السويس)</option>
                        <option value="Aswan">Aswan (أسوان)</option>
                        <option value="Assiut">Assiut (أسيوط)</option>
                        <option value="Beni Suef">Beni Suef (بني سويف)</option>
                        <option value="Port Said">Port Said (بورسعيد)</option>
                        <option value="Damietta">Damietta (دمياط)</option>
                        <option value="Sharkia">Sharkia (الشرقية)</option>
                        <option value="South Sinai">South Sinai (جنوب سيناء)</option>
                        <option value="Kafr El Sheikh">Kafr El Sheikh (كفر الشيخ)</option>
                        <option value="Matruh">Matruh (مطروح)</option>
                        <option value="Luxor">Luxor (الأقصر)</option>
                        <option value="Qena">Qena (قنا)</option>
                        <option value="North Sinai">North Sinai (شمال سيناء)</option>
                        <option value="Sohag">Sohag (سوهاج)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Address *</label>
                  <input
                    className="input-field"
                    placeholder="Full address"
                    value={newOrder.address}
                    onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400">Pricing</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Net COD (EGP) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        className="input-field pl-10"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newOrder.net_cod}
                        onChange={(e) => setNewOrder({ ...newOrder, net_cod: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Shipping Price (EGP) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        className="input-field pl-10"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newOrder.shipping_price}
                        onChange={(e) => setNewOrder({ ...newOrder, shipping_price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Total COD (Auto)</label>
                    <div className="input-field bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold text-center">
                      {calculatedCod.toFixed(2)} EGP
                    </div>
                  </div>
                </div>
              </div>

              {/* Receiver (Optional) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400">Receiver Details (Optional)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Receiver Name</label>
                    <input
                      className="input-field"
                      placeholder="Same as Customer"
                      value={newOrder.receiver.name}
                      onChange={(e) => setNewOrder({ ...newOrder, receiver: { ...newOrder.receiver, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Receiver Phone</label>
                    <input
                      className="input-field"
                      placeholder="Same as Customer"
                      value={newOrder.receiver.phone}
                      onChange={(e) => setNewOrder({ ...newOrder, receiver: { ...newOrder.receiver, phone: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 p-6 sticky bottom-0 bg-slate-900">
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleCreateOrder} className="btn-primary">
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-white">Assign Order</h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">Assigning order <strong>{selectedOrderForAssign?.order_id}</strong> to:</p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select
                  className="input-field pl-10"
                  value={selectedUserForAssign}
                  onChange={(e) => setSelectedUserForAssign(e.target.value)}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleAssignOrder} className="btn-primary">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign User Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-white">Bulk Assign User</h2>
              <button onClick={() => setIsBulkAssignModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">Assigning <strong>{selectedOrderIds.length}</strong> orders to:</p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select
                  className="input-field pl-10"
                  value={selectedUserForAssign}
                  onChange={(e) => setSelectedUserForAssign(e.target.value)}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsBulkAssignModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleBulkAssignOrder} className="btn-primary">Bulk Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Company Modal */}
      {isBulkCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-white">Bulk Assign Company</h2>
              <button onClick={() => setIsBulkCompanyModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">Assigning <strong>{selectedOrderIds.length}</strong> orders to company:</p>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select
                  className="input-field pl-10"
                  value={selectedCompanyForAssign}
                  onChange={(e) => setSelectedCompanyForAssign(e.target.value)}
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company._id} value={company._id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsBulkCompanyModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleBulkAssignCompany} className="btn-primary">Bulk Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-white">Bulk Update Status</h2>
              <button onClick={() => setIsBulkStatusModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">Updating <strong>{selectedOrderIds.length}</strong> orders to status:</p>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select
                  className="input-field pl-10"
                  value={selectedStatusForBulk}
                  onChange={(e) => setSelectedStatusForBulk(e.target.value)}
                >
                  <option value="">Select Status</option>
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
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsBulkStatusModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleBulkUpdateStatus} className="btn-primary">Update All</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Scan to Assign Modal */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                  <Plus className="h-5 w-5 rotate-45" />
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
                      {users.map(user => (
                        <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
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
                            <div className="text-sm font-semibold text-white">{log.code}</div>
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
                className="px-4 py-2 hover:text-white transition-colors"
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
