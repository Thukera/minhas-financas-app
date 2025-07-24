import { AxiosResponse } from "axios";
import { httpClient } from "../http";
import { Login } from "../models/login";
import { Token } from "../models/token";

const signInEndpoint: string = "/signin"
const signUpEndpoint: string = "/signup"

export const useAuthService = () => {

    const signin = async (login: Login): Promise<Token> => {
        // Chamada da API 
        console.log(login)
        const response: AxiosResponse<Token> = await httpClient.post<Token>(signInEndpoint, login)
        console.log(response)
        return response.data;
    }

    return {
        signin,
    }

}