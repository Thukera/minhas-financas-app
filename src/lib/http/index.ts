import axios, { AxiosInstance} from "axios";

const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000", 10);

export const httpClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.60:9090",
    withCredentials: true,
    timeout: API_TIMEOUT,
    headers: {
    "Content-Type": "application/json",
    "Accept": "application/json" // must match backend expectations
  }
})
