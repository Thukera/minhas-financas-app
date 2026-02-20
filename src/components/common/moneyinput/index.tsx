import { InputHTMLAttributes, useState, useEffect } from "react";
import { formatReal, converteEmBigDecimal } from "@/lib/utils/money";

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
    id: string;
    onChange?: (value: number) => void;
    label?: string;
    columnClasses?: string;
    error?: string;
    value?: number;
}

/**
 * MoneyInput component with live masking
 * - Displays: 1.299,99 (Brazilian format)
 * - Outputs: 1299.99 (BigDecimal)
 */
export const MoneyInput: React.FC<MoneyInputProps> = ({
    onChange,
    label,
    columnClasses,
    id,
    error,
    value = 0,
    placeholder = "0,00",
    ...inputProps
}: MoneyInputProps) => {
    // Internal display value (formatted string)
    const [displayValue, setDisplayValue] = useState<string>("");

    // Sync display value when prop value changes
    useEffect(() => {
        if (value && value > 0) {
            // Convert BigDecimal to formatted string
            // value is already a decimal like 1299.99, multiply by 100 to get cents
            const formatted = formatReal(Math.round(value * 100).toString());
            setDisplayValue(formatted);
        } else {
            setDisplayValue("");
        }
    }, [value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        
        // Format the display value
        const formatted = formatReal(inputValue);
        setDisplayValue(formatted);

        // Convert back to BigDecimal for the API
        const decimalValue = converteEmBigDecimal(formatted);
        
        if (onChange) {
            onChange(decimalValue);
        }
    };

    const handleBlur = () => {
        // On blur, ensure proper formatting even if user typed nothing
        if (!displayValue || displayValue === "0,00") {
            setDisplayValue("");
        }
    };

    const inputElement = (
        <input 
            className={`input ${error ? 'is-danger' : ''}`}
            id={id} 
            type="text" 
            value={displayValue} 
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            {...inputProps} 
        />
    );

    // If label is provided, wrap in field structure, otherwise just return input
    if (label) {
        return (
            <div className={`field ${columnClasses ? `column ${columnClasses}` : ''}`}>
                <label className="label" htmlFor={id}>{label}</label>
                <div className="control">
                    {inputElement}
                    {error && <p className="help is-danger">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="control">
            {inputElement}
            {error && <p className="help is-danger">{error}</p>}
        </div>
    );
};
