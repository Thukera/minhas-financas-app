import { useState } from 'react';
import * as yup from 'yup';

interface UseFormValidationOptions<T> {
    validationSchema: yup.ObjectSchema<any>;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
}

interface ValidationResult<T> {
    errors: Partial<Record<keyof T, string>>;
    isValid: boolean;
}

export const useFormValidation = <T extends Record<string, any>>(
    options: UseFormValidationOptions<T>
) => {
    const { 
        validationSchema, 
        validateOnChange = true, 
        validateOnBlur = true 
    } = options;

    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

    /**
     * Validate a single field
     */
    const validateField = async (
        fieldName: keyof T, 
        value: any
    ): Promise<string | undefined> => {
        try {
            await validationSchema.validateAt(fieldName as string, { [fieldName]: value });
            return undefined; // No error
        } catch (err: any) {
            return err.message;
        }
    };

    /**
     * Validate entire form
     */
    const validateForm = async (values: T): Promise<ValidationResult<T>> => {
        try {
            await validationSchema.validate(values, { abortEarly: false });
            return { errors: {}, isValid: true };
        } catch (err: any) {
            const validationErrors: Partial<Record<keyof T, string>> = {};
            if (err.inner) {
                err.inner.forEach((e: any) => {
                    validationErrors[e.path as keyof T] = e.message;
                });
            }
            return { errors: validationErrors, isValid: false };
        }
    };

    /**
     * Handle field change with optional validation
     */
    const handleFieldChange = async (
        fieldName: keyof T,
        value: any,
        values: T
    ): Promise<void> => {
        if (validateOnChange && touchedFields.has(fieldName)) {
            const error = await validateField(fieldName, value);
            setErrors(prev => ({
                ...prev,
                [fieldName]: error
            }));
        }
    };

    /**
     * Handle field blur with optional validation
     */
    const handleFieldBlur = async (
        fieldName: keyof T,
        value: any
    ): Promise<void> => {
        // Mark field as touched
        setTouchedFields(prev => new Set(prev).add(fieldName));

        if (validateOnBlur) {
            const error = await validateField(fieldName, value);
            setErrors(prev => ({
                ...prev,
                [fieldName]: error
            }));
        }
    };

    /**
     * Clear all errors
     */
    const clearErrors = (): void => {
        setErrors({});
    };

    /**
     * Clear error for specific field
     */
    const clearFieldError = (fieldName: keyof T): void => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    };

    /**
     * Set errors manually
     */
    const setFormErrors = (newErrors: Partial<Record<keyof T, string>>): void => {
        setErrors(newErrors);
    };

    /**
     * Reset form validation state
     */
    const resetValidation = (): void => {
        setErrors({});
        setTouchedFields(new Set());
    };

    return {
        errors,
        validateField,
        validateForm,
        handleFieldChange,
        handleFieldBlur,
        clearErrors,
        clearFieldError,
        setFormErrors,
        resetValidation,
        touchedFields
    };
};
