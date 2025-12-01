import axios, { AxiosInstance} from "axios";

export const httpClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.60:9090",
    withCredentials: true,
    headers: {
    "Content-Type": "application/json",
    "Accept": "application/json" // must match backend expectations
  }
})
