import * as yup from 'yup';
import { ValidationMessages } from './common.validation';

// Credit card validation messages
const CreditCardMessages = {
    endNumbers: "Últimos 4 dígitos inválidos",
    nickname: "Apelido é obrigatório",
    bank: "Banco é obrigatório",
};

// Credit card validation schema (matching backend API structure)
export const creditCardValidationSchema = yup.object().shape({
    bank: yup
        .string()
        .trim()
        .min(2, ValidationMessages.minLength(2))
        .required(ValidationMessages.required),
    
    endNumbers: yup
        .string()
        .trim()
        .matches(/^\d{4}$/, CreditCardMessages.endNumbers)
        .required(ValidationMessages.required),
    
    nickname: yup
        .string()
        .trim()
        .min(2, ValidationMessages.minLength(2))
        .required(ValidationMessages.required),
    
    dueDate: yup
        .number()
        .min(1, "Dia deve estar entre 1 e 31")
        .max(31, "Dia deve estar entre 1 e 31")
        .required(ValidationMessages.required),
    
    billingPeriodStart: yup
        .number()
        .min(1, "Dia deve estar entre 1 e 31")
        .max(31, "Dia deve estar entre 1 e 31")
        .required(ValidationMessages.required),
    
    billingPeriodEnd: yup
        .number()
        .min(1, "Dia deve estar entre 1 e 31")
        .max(31, "Dia deve estar entre 1 e 31")
        .required(ValidationMessages.required),
        //.test('after-start', 'Deve ser após o início do período', function(value) {
        //    const { billingPeriodStart } = this.parent;
        //    return value > billingPeriodStart;
        //}),
    
    totalLimit: yup
        .number()
        .positive("Limite deve ser maior que zero")
        .required(ValidationMessages.required),
});

// TypeScript types
export interface CreditCardFormErrors {
    bank?: string;
    endNumbers?: string;
    nickname?: string;
    dueDate?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    totalLimit?: string;
}

export interface CreditCardFormData {
    bank: string;
    endNumbers: string;
    nickname: string;
    dueDate: number;
    billingPeriodStart: number;
    billingPeriodEnd: number;
    totalLimit: number;
}
