'use client';

import { Input } from '@/components/common/input';
import { useEffect, useState } from 'react';
import '@/styles/login.scss';  // login styles only for login form
import { Login } from '@/lib/models/login';
import { useAuthService, CreateUserRequest } from '@/lib/service';
import { Alert, Message } from '../common/message';
import { useRouter } from 'next/navigation';
import { useUser } from "@/context/userContext";
import { usePanelService } from "@/lib/service";
import { 
    loginValidationSchema, 
    signupValidationSchema,
    LoginFormErrors,
    SignupFormErrors 
} from '@/lib/validations';
import { getAuthRedirectDelay } from '@/lib/utils/config';
import { isAuthDebugEnabled } from '@/lib/utils/config';
import { useFormValidation } from '@/hooks/useFormValidation';

export const LoginForm: React.FC = () => {

    const service = useAuthService()
    const [rememberMe, setRememberMe] = useState(false);
    const [username, setUsername] = useState('')
    const [password, setpassword] = useState('')
    const [messages, setMessages] = useState<Array<Alert>>([])
    const [errors, setErrors] = useState<LoginFormErrors>()
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { setUser } = useUser();
    const { getUserDetails } = usePanelService();
    const authDebug = isAuthDebugEnabled() && typeof window !== "undefined";

    const logBrowserCookieDiagnostics = async () => {
        if (!authDebug || typeof window === "undefined") return;

        const storageAccessSupported = typeof document.hasStorageAccess === "function";
        const hasStorageAccess = storageAccessSupported
            ? await document.hasStorageAccess()
            : "not-supported";

        console.info("[AUTH_DEBUG][BROWSER] context", {
            origin: window.location.origin,
            protocol: window.location.protocol,
            isSecureContext: window.isSecureContext,
            cookieEnabled: navigator.cookieEnabled,
            hasStorageAccess,
            storageAccessSupported,
            userAgent: navigator.userAgent,
        });
    };

    const waitForAuthenticatedUser = async (maxAttempts = 5, delayMs = 300) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (authDebug) {
                console.info("[AUTH_DEBUG][PANEL_CHECK] attempt", {
                    attempt,
                    maxAttempts,
                });
            }

            const userData = await getUserDetails();
            if (userData) {
                if (authDebug) {
                    console.info("[AUTH_DEBUG][PANEL_CHECK] success", { attempt });
                }
                return userData;
            }

            if (authDebug) {
                console.warn("[AUTH_DEBUG][PANEL_CHECK] empty response", { attempt });
            }

            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        return null;
    };

    // Real-time validation for signup form
    const signupValidation = useFormValidation<SignupFormErrors>({
        validationSchema: signupValidationSchema,
        validateOnChange: true,
        validateOnBlur: true
    });

    // Check if already authenticated (only redirect if not actively submitting)
    useEffect(() => {
        const signed = localStorage.getItem("signed") === "true";
        if (signed && !isSubmitting) {
            const delay = getAuthRedirectDelay();
            const timer = setTimeout(() => {
                router.replace("/home");
            }, delay);
            
            return () => clearTimeout(timer);
        }
    }, [router, isSubmitting]);

    // Signup form state
    const [signupForm, setSignupForm] = useState({
        doc: "",
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();  // <-- Prevents the page reload
        submit();            // <-- Your existing submit logic
    };

    const submit = async () => {
        const login: Login = { username, password }

        setIsSubmitting(true);

        await logBrowserCookieDiagnostics();

        try {
            // Validate form
            await loginValidationSchema.validate({ username, password }, { abortEarly: false });
            setErrors({}); // clear previous errors

            // Call signin service
            const signed = await service.signin(login);
            if (signed) {
                const userData = await waitForAuthenticatedUser();

                if (!userData) {
                    localStorage.removeItem("signed");
                    setUser(null);

                    if (authDebug) {
                        console.error("[AUTH_DEBUG][SESSION] panel remained unauthorized after signin", {
                            hint: "Likely cookie blocked or missing SameSite=None; Secure for cross-site requests.",
                        });
                    }

                    setMessages([{
                        tipo: "danger",
                        texto: "Login realizado, mas não foi possível confirmar a sessão. Tente novamente."
                    }]);
                    setIsSubmitting(false);
                    return;
                }

                localStorage.setItem("signed", "true");
                setUser(userData);
                router.push("/home");
            } else {
                // Login failed - show error message
                setMessages([{
                    tipo: "danger",
                    texto: "Usuário ou senha inválidos. Por favor, tente novamente."
                }]);
                setIsSubmitting(false);
            }
        } catch (err: any) {
            if (err.inner) {
                // Validation errors
                const validationErrors: LoginFormErrors = {};
                err.inner.forEach((e: any) => {
                    validationErrors[e.path as keyof LoginFormErrors] = e.message;
                });
                setErrors(validationErrors);
            } else {
                // Network / other errors
                console.error(err);
                setMessages([{
                    tipo: "danger",
                    texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
                }]);
            }
            setIsSubmitting(false);
        }
    }

    const handleSignupSubmit = async () => {
        // Clear previous messages
        setMessages([]);

        // Validate entire form
        const { errors: validationErrors, isValid } = await signupValidation.validateForm(signupForm);
        
        if (!isValid) {
            signupValidation.setFormErrors(validationErrors);
            return;
        }

        try {
            const userData: CreateUserRequest = {
                doc: signupForm.doc,
                name: signupForm.name,
                username: signupForm.username,
                email: signupForm.email,
                password: signupForm.password,
                role: ["user"],
                status: true,
            };

            const success = await service.signup(userData);
            if (success) {
                setMessages([{
                    tipo: "success",
                    texto: "Conta criada com sucesso! Faça login para continuar."
                }]);
                setShowSignupModal(false);
                // Reset form and validation
                setSignupForm({
                    doc: "",
                    name: "",
                    username: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });
                signupValidation.resetValidation();
            } else {
                setMessages([{
                    tipo: "danger",
                    texto: "Erro ao criar conta. Verifique os dados e tente novamente."
                }]);
            }
        } catch (err: any) {
            console.error(err);
            setMessages([{
                tipo: "danger",
                texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
            }]);
        }
    };

    // Handle signup field change with real-time validation
    const handleSignupFieldChange = async (field: keyof SignupFormErrors, value: string) => {
        const updatedForm = { ...signupForm, [field]: value };
        setSignupForm(updatedForm);
        await signupValidation.handleFieldChange(field, value, updatedForm);
    };

    // Handle signup field blur
    const handleSignupFieldBlur = async (field: keyof SignupFormErrors, value: string) => {
        await signupValidation.handleFieldBlur(field, value);
    };

    return (
        <section className="section is-flex is-align-items-center is-justify-content-center">
            <div className="login-box box has-background-dark " >

                <div className="has-text-centered mb-4 ">
                    {/* <img className="logo-login" src="logo.png" alt="logo">  */}
                    <h1 className="title is-4 login-title">Minhas Finanças</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <div className="control">
                            <Input id='inputLogin'
                                label='Login'
                                //columnClasses='is-half'
                                onChange={setUsername}
                                value={username}
                                placeholder="username"
                                error={errors?.username}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <div className="control">
                            <Input id='inputpassword'
                                label='Password'
                                //columnClasses='is-half'
                                onChange={setpassword}
                                value={password}
                                placeholder="password here"
                                error={errors?.password}
                                type='password'
                            />
                        </div>
                    </div>

                    <div className="field is-flex is-justify-content-space-between is-align-items-center">
                        <label className="checkbox">
                            <input id="rememberMe" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                            Remember me
                        </label>
                        <a href="#" className="is-link-text is-size-7">Forgot?</a>
                    </div>

                    <div className="field mt-4">
                        {/* inputs here */}
                        <button 
                            type="submit" 
                            className={`button is-fullwidth login-button ${isSubmitting ? 'is-loading' : ''}`}
                            disabled={isSubmitting}
                        >
                            Sign in
                        </button>
                    </div>

                    {messages.map((msg, index) => (
                        <Message
                            key={index}
                            texto={msg.texto}
                            tipo={msg.tipo}
                            field={msg.field ?? undefined}
                        />
                    ))}
                </form>

                <p className="has-text-centered is-size-7 mt-4">
                    Don’t have an account?
                    <a 
                        href="#" 
                        className="is-link-text has-text-weight-semibold"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowSignupModal(true);
                        }}
                    > Sign up</a>
                </p>
            </div>

            {/* Signup Modal */}
            {showSignupModal && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={() => setShowSignupModal(false)}></div>
                    <div className="modal-card" style={{ maxWidth: "500px" }}>
                        <header className="modal-card-head">
                            <p className="modal-card-title">Criar Nova Conta</p>
                            <button 
                                className="delete" 
                                aria-label="close" 
                                onClick={() => setShowSignupModal(false)}
                            ></button>
                        </header>
                        <section className="modal-card-body">
                            <div className="field">
                                <label className="label">CPF *</label>
                                <div className="control">
                                    <input
                                        className={`input ${signupValidation.errors?.doc ? 'is-danger' : ''}`}
                                        type="text"
                                        placeholder="000.000.000-00"
                                        value={signupForm.doc}
                                        onChange={(e) => handleSignupFieldChange('doc', e.target.value)}
                                        onBlur={(e) => handleSignupFieldBlur('doc', e.target.value)}
                                    />
                                </div>
                                {signupValidation.errors?.doc && <p className="help is-danger">{signupValidation.errors.doc}</p>}
                            </div>

                            <div className="field">
                                <label className="label">Nome Completo *</label>
                                <div className="control">
                                    <input
                                        className={`input ${signupValidation.errors?.name ? 'is-danger' : ''}`}
                                        type="text"
                                        placeholder="Seu nome completo"
                                        value={signupForm.name}
                                        onChange={(e) => handleSignupFieldChange('name', e.target.value)}
                                        onBlur={(e) => handleSignupFieldBlur('name', e.target.value)}
                                    />
                                </div>
                                {signupValidation.errors?.name && <p className="help is-danger">{signupValidation.errors.name}</p>}
                            </div>

                            <div className="field">
                                <label className="label">Usuário *</label>
                                <div className="control">
                                    <input
                                        className={`input ${signupValidation.errors?.username ? 'is-danger' : ''}`}
                                        type="text"
                                        placeholder="username"
                                        value={signupForm.username}
                                        onChange={(e) => handleSignupFieldChange('username', e.target.value)}
                                        onBlur={(e) => handleSignupFieldBlur('username', e.target.value)}
                                    />
                                </div>
                                {signupValidation.errors?.username && <p className="help is-danger">{signupValidation.errors.username}</p>}
                            </div>

                            <div className="field">
                                <label className="label">Email *</label>
                                <div className="control">
                                    <input
                                        className={`input ${signupValidation.errors?.email ? 'is-danger' : ''}`}
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={signupForm.email}
                                        onChange={(e) => handleSignupFieldChange('email', e.target.value)}
                                        onBlur={(e) => handleSignupFieldBlur('email', e.target.value)}
                                    />
                                </div>
                                {signupValidation.errors?.email && <p className="help is-danger">{signupValidation.errors.email}</p>}
                            </div>

                            <div className="field">
                                <label className="label">Senha *</label>
                                <div className="control">
                                    <input
                                        className={`input ${signupValidation.errors?.password ? 'is-danger' : ''}`}
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={signupForm.password}
                                        onChange={(e) => handleSignupFieldChange('password', e.target.value)}
                                        onBlur={(e) => handleSignupFieldBlur('password', e.target.value)}
                                    />
                                </div>
                                {signupValidation.errors?.password && <p className="help is-danger">{signupValidation.errors.password}</p>}
                            </div>

                            <div className="field">
                                <label className="label">Confirmar Senha *</label>
                                <div className="control">
                                    <input
                                        className={`input ${signupValidation.errors?.confirmPassword ? 'is-danger' : ''}`}
                                        type="password"
                                        placeholder="Digite a senha novamente"
                                        value={signupForm.confirmPassword}
                                        onChange={(e) => handleSignupFieldChange('confirmPassword', e.target.value)}
                                        onBlur={(e) => handleSignupFieldBlur('confirmPassword', e.target.value)}
                                    />
                                </div>
                                {signupValidation.errors?.confirmPassword && <p className="help is-danger">{signupValidation.errors.confirmPassword}</p>}
                            </div>
                        </section>
                        <footer className="modal-card-foot is-justify-content-space-between">
                            <button 
                                className="button is-danger" 
                                onClick={() => setShowSignupModal(false)}
                            >
                                Cancelar
                            </button>
                            <button className="button is-success" onClick={handleSignupSubmit}>
                                Criar Conta
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </section>
    )
}



