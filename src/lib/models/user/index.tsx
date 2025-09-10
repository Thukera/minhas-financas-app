import { CreditCard } from "./creditcard";

export interface User {
    username?: string;
    id?: number;
    profilePicturePath?: string;
    creditcards: CreditCard[];
}