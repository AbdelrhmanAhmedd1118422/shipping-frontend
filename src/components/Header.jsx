import { useNavigate } from "react-router-dom"
import { Bell, Search, Settings, Command } from "lucide-react"

export default function Header() {
  const navigate = useNavigate()

  // Get logged-in user info
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")) } catch { return null }
  })()
  const userName = storedUser?.name || "User"
  const userRole = storedUser?.role || "User"
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <header className="glass flex h-20 items-center justify-between px-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search anything..."
            className="input-field h-12 w-96 pl-12 pr-20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-500">
            <Command className="h-3 w-3" /> K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/5 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
          </span>
        </button>
        <button
          onClick={() => navigate("/dashboard/settings")}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="mx-2 h-8 w-px bg-white/10"></div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{userName}</p>
            <p className="text-xs text-slate-400">{userRole}</p>
          </div>
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg glow-purple">
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-400"></div>
          </div>
        </div>
      </div>
    </header>
  )
}
