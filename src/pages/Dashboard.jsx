import { useNavigate } from "react-router-dom"

export default function Dashboard() {
    const navigate = useNavigate()

    const logout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/")
    }

    return (
        <div className="min-h-screen bg-black text-white p-10">
            <h1 className="text-3xl">Dashboard 🔥</h1>
            <button onClick={logout}>Logout</button>
        </div>
    )
}
