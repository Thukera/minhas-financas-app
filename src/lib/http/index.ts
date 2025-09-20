import axios, { AxiosInstance} from "axios";

export const httpClient: AxiosInstance = axios.create({
    baseURL: "http://localhost:9090/",
    withCredentials: true,
    headers: {
    "Content-Type": "application/json",
    "Accept": "application/json" // must match backend expectations
  }
})
