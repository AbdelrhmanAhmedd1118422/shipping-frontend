import { NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, Users, ShoppingCart, Truck, Package, LogOut, Sparkles, Search, Building, Settings, Activity } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, end: true },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Companies", href: "/dashboard/companies", icon: Building },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Shipments", href: "/dashboard/shipments", icon: Truck },
  { name: "Detailed Query", href: "/dashboard/query", icon: Search },
  { name: "Activity Log", href: "/dashboard/activity", icon: Activity },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function Sidebar() {
  const navigate = useNavigate()

  // Get logged-in user info
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")) } catch { return null }
  })()
  const userName = storedUser?.name || "Admin User"
  const userEmail = storedUser?.email || ""
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  return (
    <aside className="flex h-full w-72 flex-col glass border-r-0" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-6">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg glow-blue">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Golden Way</h1>
          <p className="text-xs text-slate-400">Shipping Solutions</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Main Menu
        </p>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white shadow-lg">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-400"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-slate-400">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
