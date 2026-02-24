import { Routes, Route } from "react-router-dom"
import { Component } from "react"
import Tracking from "./pages/Tracking"
import Login from "./pages/Login"
import DashboardLayout from "./layouts/DashboardLayout"
import ProtectedRoute from "./components/ProtectedRoute"
import { ToastProvider } from "./components/Toast"

// Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative min-h-screen">
          <div className="animated-bg">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
            <p className="text-8xl font-bold text-gradient-blue mb-4">⚠️</p>
            <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 mb-6 text-center max-w-md">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = "/dashboard" }}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
          <Route path="/track" element={<Tracking />} />
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          {/* Catch-all 404 */}
          <Route path="*" element={
            <div className="relative min-h-screen">
              <div className="animated-bg"><div className="orb orb-1"></div><div className="orb orb-2"></div></div>
              <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                <p className="text-8xl font-bold text-gradient-blue mb-4">404</p>
                <p className="text-xl text-slate-400 mb-6">Page not found</p>
                <a href="/" className="btn-primary">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
