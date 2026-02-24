import { useState, useEffect } from "react"
import api from "../services/api"
import { User, Lock, Mail, Shield, Save, Eye, EyeOff, CheckCircle } from "lucide-react"
import { useToast } from "../components/Toast"

export default function Settings() {
    const toast = useToast()
    const [profile, setProfile] = useState({ name: "", email: "", role: "", phone: "" })
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false })
    const [saving, setSaving] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [activeTab, setActiveTab] = useState("profile")

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/settings/profile")
                setProfile(res.data)
            } catch (err) {
                // Fallback to localStorage
                const user = JSON.parse(localStorage.getItem("user") || "{}")
                setProfile({ name: user.name || "", email: user.email || "", role: user.role || "", phone: "" })
            }
        }
        fetchProfile()
    }, [])

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await api.put("/settings/profile", { name: profile.name, email: profile.email })
            // Update localStorage
            const user = JSON.parse(localStorage.getItem("user") || "{}")
            localStorage.setItem("user", JSON.stringify({ ...user, name: res.data.name, email: res.data.email }))
            toast.success("Profile updated successfully")
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()

        if (passwords.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters")
            return
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        setChangingPassword(true)
        try {
            await api.put("/settings/password", {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            })
            toast.success("Password changed successfully!")
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to change password")
        } finally {
            setChangingPassword(false)
        }
    }

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "security", label: "Security", icon: Lock },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="mt-1 text-slate-400">Manage your account and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="card max-w-2xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-400" />
                            Profile Information
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Update your personal details</p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        {/* Avatar Preview */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg glow-purple">
                                {profile.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?"}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">{profile.name || "Your Name"}</p>
                                <p className="text-sm text-slate-400 flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {profile.role}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                <User className="h-3.5 w-3.5 inline mr-1" /> Full Name
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="input-field"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                <Mail className="h-3.5 w-3.5 inline mr-1" /> Email Address
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="input-field"
                                placeholder="your@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
                <div className="card max-w-2xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Lock className="h-5 w-5 text-amber-400" />
                            Change Password
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Ensure your account is using a strong password</p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-5">
                        {["currentPassword", "newPassword", "confirmPassword"].map((field) => (
                            <div key={field}>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    {field === "currentPassword" ? "Current Password" : field === "newPassword" ? "New Password" : "Confirm New Password"}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword[field.replace("Password", "").replace("confirm", "confirm")] ? "text" : "password"}
                                        value={passwords[field]}
                                        onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                                        className="input-field pr-12"
                                        placeholder={field === "currentPassword" ? "Enter current password" : field === "newPassword" ? "Enter new password" : "Confirm new password"}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const key = field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"
                                            setShowPassword(prev => ({ ...prev, [key]: !prev[key] }))
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                    >
                                        {showPassword[field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"]
                                            ? <EyeOff className="h-4 w-4" />
                                            : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Password strength indicators */}
                        {passwords.newPassword && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <CheckCircle className={`h-3.5 w-3.5 ${passwords.newPassword.length >= 6 ? "text-emerald-400" : "text-slate-600"}`} />
                                    <span className={passwords.newPassword.length >= 6 ? "text-emerald-400" : "text-slate-500"}>
                                        At least 6 characters
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <CheckCircle className={`h-3.5 w-3.5 ${passwords.newPassword === passwords.confirmPassword && passwords.confirmPassword ? "text-emerald-400" : "text-slate-600"}`} />
                                    <span className={passwords.newPassword === passwords.confirmPassword && passwords.confirmPassword ? "text-emerald-400" : "text-slate-500"}>
                                        Passwords match
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="btn-primary"
                        >
                            <Lock className="h-4 w-4" />
                            {changingPassword ? "Changing..." : "Change Password"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
