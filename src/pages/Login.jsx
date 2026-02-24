import { useState } from "react"
import api from "../services/api"
import { useNavigate } from "react-router-dom"
import { Package, ArrowRight, Mail, Lock, Sparkles, Zap, Shield, Globe } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/auth/login", { email, password })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      navigate("/dashboard")
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            {/* Logo */}
            <div className="mb-12 flex items-center gap-3">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg glow-blue">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-white">Golden Way</span>
                <span className="ml-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">SHIPPING</span>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Welcome back
              </h1>
              <p className="mt-3 text-lg text-slate-400">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@goldenway.com"
                    className="input-field h-14 pl-12 text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field h-14 pl-12 text-base"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
                  <span className="text-sm text-slate-400">Remember me</span>
                </label>
                <a href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary h-14 w-full justify-center text-base"
              >
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Authorized personnel only
            </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
          <div className="relative max-w-lg px-8 text-center">
            {/* Main Icon */}
            <div className="mb-10 inline-flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-2xl" style={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)' }}>
              <Package className="h-14 w-14 text-white" />
            </div>

            <h2 className="mb-4 text-4xl font-bold text-white">
              The Golden Way<br />
              <span className="text-gradient-blue">For Shipping</span>
            </h2>
            <p className="mb-12 text-lg text-slate-400">
              Track shipments, manage orders, and deliver excellence across Egypt with our powerful platform.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-5 text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-white">Fast</p>
                <p className="text-xs text-slate-400">Real-time updates</p>
              </div>
              <div className="glass-card rounded-2xl p-5 text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-white">Secure</p>
                <p className="text-xs text-slate-400">Enterprise grade</p>
              </div>
              <div className="glass-card rounded-2xl p-5 text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Globe className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white">Global</p>
                <p className="text-xs text-slate-400">Worldwide reach</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
