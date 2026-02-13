import axios, { AxiosInstance } from "axios";
import { isAuthDebugEnabled } from "@/lib/utils/config";

const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000", 10);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.60:9090";
const AUTH_DEBUG = isAuthDebugEnabled();

const shouldLogAuthRequest = (url?: string) => {
  if (!url) return false;
  return url.includes("/api/cookie") || url.includes("/api/panel");
};

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: API_TIMEOUT,
    headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

if (AUTH_DEBUG && typeof window !== "undefined") {
  console.info("[AUTH_DEBUG] enabled", {
    origin: window.location.origin,
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  httpClient.interceptors.request.use((config) => {
    if (shouldLogAuthRequest(config.url)) {
      console.info("[AUTH_DEBUG][REQUEST]", {
        method: config.method,
        url: `${config.baseURL || ""}${config.url || ""}`,
        withCredentials: config.withCredentials,
        hasAuthorizationHeader: Boolean(config.headers?.Authorization),
      });
    }
    return config;
  });

  httpClient.interceptors.response.use(
    (response) => {
      if (shouldLogAuthRequest(response.config.url)) {
        console.info("[AUTH_DEBUG][RESPONSE]", {
          method: response.config.method,
          url: `${response.config.baseURL || ""}${response.config.url || ""}`,
          status: response.status,
          acao: response.headers?.["access-control-allow-origin"],
          acac: response.headers?.["access-control-allow-credentials"],
        });
      }
      return response;
    },
    (error) => {
      const requestUrl = error?.config?.url as string | undefined;
      if (shouldLogAuthRequest(requestUrl)) {
        console.error("[AUTH_DEBUG][ERROR]", {
          method: error?.config?.method,
          url: `${error?.config?.baseURL || ""}${requestUrl || ""}`,
          status: error?.response?.status,
          data: error?.response?.data,
          acao: error?.response?.headers?.["access-control-allow-origin"],
          acac: error?.response?.headers?.["access-control-allow-credentials"],
        });
      }
      return Promise.reject(error);
    }
  );
}
