import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Thêm interceptor để gửi token với mỗi yêu cầu
instance.interceptors.request.use(function (config) {
    const storedUser = localStorage.getItem('user')
    const user = storedUser ? JSON.parse(storedUser) : {}
    // const token = user?.accessToken || ''
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NjRlZjNjYTdkYjIzZTVkZDE2NWE5MmIiLCJpYXQiOjE3MTkzMjc5OTEsImV4cCI6MTcxOTQxNDM5MX0.0s8eURwF9-0muYklm5Snoj5DIY75_X71K7wY6qBn1q0'
    config.headers['Authorization'] = `Bearer ${token}`
    return config
})

export default instance
