import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
})

// Attach JWT token as Bearer token on every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// If any response comes back as 401 Unauthorized, clear the token and redirect to login
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== "/") {
                window.location.href = "/"
            }
        }
        return Promise.reject(error)
    }
)

export default api
