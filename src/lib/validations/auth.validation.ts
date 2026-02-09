import * as yup from 'yup';
import { commonValidations } from './common.validation';

// Login validation schema
export const loginValidationSchema = yup.object().shape({
    username: commonValidations.username,
    password: commonValidations.password,
});

// Signup validation schema
export const signupValidationSchema = yup.object().shape({
    doc: commonValidations.cpf,
    name: commonValidations.name,
    username: commonValidations.username,
    email: commonValidations.email,
    password: commonValidations.password,
    confirmPassword: commonValidations.confirmPassword('password'),
});

// TypeScript types
export interface LoginFormErrors {
    username?: string;
    password?: string;
}

export interface SignupFormErrors {
    doc?: string;
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}
