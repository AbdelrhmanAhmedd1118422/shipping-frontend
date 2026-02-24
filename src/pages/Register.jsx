import { useState } from "react"
import api from "../services/api"
import { useNavigate } from "react-router-dom"

export default function Register() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()

    const handleRegister = async () => {
        await api.post("/auth/register", { name, email, password })
        navigate("/")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="space-y-4">
                <h1 className="text-2xl">Register</h1>
                <input placeholder="Name" onChange={e => setName(e.target.value)} />
                <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
                <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
                <button onClick={handleRegister}>Register</button>
            </div>
        </div>
    )
}
