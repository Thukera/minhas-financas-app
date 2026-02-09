import * as yup from 'yup';

// Common validation messages
export const ValidationMessages = {
    required: "Campo obrigatório",
    email: "Email inválido",
    minLength: (min: number) => `Mínimo ${min} caracteres`,
    maxLength: (max: number) => `Máximo ${max} caracteres`,
    passwordMatch: "As senhas não coincidem",
    invalidCPF: "CPF inválido",
    invalidFormat: "Formato inválido",
};

// Common validation rules
export const commonValidations = {
    email: yup
        .string()
        .trim()
        .email(ValidationMessages.email)
        .required(ValidationMessages.required),

    password: yup
        .string()
        .trim()
        .min(6, ValidationMessages.minLength(6))
        .required(ValidationMessages.required),

    username: yup
        .string()
        .trim()
        .min(3, ValidationMessages.minLength(3))
        .required(ValidationMessages.required),

    name: yup
        .string()
        .trim()
        .min(3, ValidationMessages.minLength(3))
        .required(ValidationMessages.required),

    cpf: yup
        .string()
        .trim()
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, ValidationMessages.invalidCPF)
        .required(ValidationMessages.required),

    confirmPassword: (passwordField: string = 'password') => 
        yup
            .string()
            .trim()
            .oneOf([yup.ref(passwordField)], ValidationMessages.passwordMatch)
            .required(ValidationMessages.required),
};
