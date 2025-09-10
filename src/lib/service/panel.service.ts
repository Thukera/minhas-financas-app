import { AxiosResponse } from "axios";
import { httpClient } from "../http";
import { User } from "../models/user";
import { CreditCard } from "../models/user/creditcard";

const userPanelEndpoint = "/api/panel"

export const usePanelService = () => {

    const getUserDetails = async (): Promise<User | null> => {
        try {
            const response = await httpClient.get(userPanelEndpoint);
            return response.data as User;
        } catch (error) {
            console.error("Failed to get user details", error);
            localStorage.removeItem("signed");
            return null; // indicate failure
        }
    };

    return {
        getUserDetails
    }
}
