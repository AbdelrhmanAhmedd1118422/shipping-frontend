import { Routes, Route } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import Overview from "../pages/Overview"
import Users from "../pages/Users"
import Orders from "../pages/Orders"
import Shipments from "../pages/Shipments"
import Query from "../pages/Query"
import Companies from "../pages/Companies"
import Settings from "../pages/Settings"
import ActivityLog from "../pages/ActivityLog"

export default function DashboardLayout() {
    return (
        <div className="relative min-h-screen">
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            {/* Main Layout */}
            <div className="relative z-10 flex h-screen">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                        <div className="mx-auto max-w-7xl">
                            <Routes>
                                <Route path="/" element={<Overview />} />
                                <Route path="users" element={<Users />} />
                                <Route path="orders" element={<Orders />} />
                                <Route path="shipments" element={<Shipments />} />
                                <Route path="query" element={<Query />} />
                                <Route path="companies" element={<Companies />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="activity" element={<ActivityLog />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center py-24">
            <p className="text-8xl font-bold text-gradient-blue mb-4">404</p>
            <p className="text-xl text-slate-400 mb-6">Page not found</p>
            <a href="/dashboard" className="btn-primary">Back to Dashboard</a>
        </div>
    )
}
