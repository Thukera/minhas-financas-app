import { AxiosResponse } from "axios";
import { httpClient } from "../http";
import { Login } from "../models/login";

const signInEndpoint: string = "api/cookie/signin";
const refreshEndpoint: string = "api/cookie/refresh";

export const useAuthService = () => {

    const signin = async (login: Login): Promise<boolean> => {
        try {
            const response = await httpClient.post(signInEndpoint, login);
            // login successful → mark in localStorage
            localStorage.setItem("signed", "true");
            return true;
        } catch (error) {
            console.error("Login failed", error);
            localStorage.removeItem("signed");
            return false;
        }
    };

    const refreshToken = async (): Promise<boolean> => {
        try {
            const response: AxiosResponse<{ message: string }> =
                await httpClient.post(refreshEndpoint);
            console.log("Token refreshed:", response.data.message);
            return true;
        } catch (error: any) {
            console.error("Refresh token failed:", error.response?.data?.message || error.message);
            return false;
        }
    }

    const logout = async (): Promise<void> => {
        try {
            await httpClient.post("/api/cookie/logout");
            localStorage.removeItem("signed");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return {
        signin,
        refreshToken,
        logout
    }
}
