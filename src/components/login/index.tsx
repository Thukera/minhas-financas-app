'use client';

import { Input } from '@/components/common/input';
import * as yup from 'yup';
import { useEffect, useState } from 'react'; // Use effect , update the project to check if already have a token on cookie
import '@/styles/login.scss';  // login styles only for login form
import { Login } from '@/lib/models/login';
import { useAuthService, CreateUserRequest } from '@/lib/service';
import { Alert, Message } from '../common/message';
import { useRouter } from 'next/navigation';
import { useUser } from "@/context/userContext";
import { usePanelService } from "@/lib/service";

const msgCampoObrigatorio = "Campo Obrigatorio"

const validationSchema = yup.object().shape({
    username: yup.string().trim().required(msgCampoObrigatorio),
    password: yup.string().trim().required(msgCampoObrigatorio)
})

interface LoginFormErros {
    username?: string;
    password?: string;
}

export const LoginForm: React.FC = () => {

    const service = useAuthService()
    const [rememberMe, setRememberMe] = useState(false);
    const [username, setUsername] = useState('')
    const [password, setpassword] = useState('')
    const [messages, setMessages] = useState<Array<Alert>>([])
    const [errors, setErrors] = useState<LoginFormErros>()
    const [showSignupModal, setShowSignupModal] = useState(false);
    const router = useRouter();
    const { setUser } = useUser();
    const { getUserDetails } = usePanelService();

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


        try {
            // Validate form
            await validationSchema.validate({ username, password }, { abortEarly: false });
            setErrors({}); // clear previous errors

            // Call signin service
            const signed = await service.signin(login);
            if (signed) {
                const userData = await getUserDetails();
                setUser(userData ?? null);
                router.push("/home");
            } else {
                // Login failed - show error message
                setMessages([{
                    tipo: "danger",
                    texto: "Usuário ou senha inválidos. Por favor, tente novamente."
                }]);
            }
        } catch (err: any) {
            if (err.inner) {
                // Validation errors
                const validationErrors: LoginFormErros = {};
                err.inner.forEach((e: any) => {
                    validationErrors[e.path as keyof LoginFormErros] = e.message;
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
        }
    }

    const handleSignupSubmit = async () => {
        // Clear previous messages
        setMessages([]);

        // Validation
        if (!signupForm.doc || !signupForm.name || !signupForm.username || 
            !signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
            setMessages([{
                tipo: "warning",
                texto: "Por favor, preencha todos os campos obrigatórios"
            }]);
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signupForm.email)) {
            setMessages([{
                tipo: "warning",
                texto: "Por favor, insira um email válido"
            }]);
            return;
        }

        // Password match validation
        if (signupForm.password !== signupForm.confirmPassword) {
            setMessages([{
                tipo: "warning",
                texto: "As senhas não coincidem"
            }]);
            return;
        }

        // Password length validation
        if (signupForm.password.length < 6) {
            setMessages([{
                tipo: "warning",
                texto: "A senha deve ter no mínimo 6 caracteres"
            }]);
            return;
        }

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
            // Reset form
            setSignupForm({
                doc: "",
                name: "",
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
        } else {
            setMessages([{
                tipo: "danger",
                texto: "Erro ao criar conta. Verifique os dados e tente novamente."
            }]);
        }
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
                        <button type="submit" className="button is-fullwidth login-button">Sign in</button>
                        {/*  <button onClick={submit} className="button is-fullwidth login-button">
                            Sign in
                        </button> */}
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
                                        className="input"
                                        type="text"
                                        placeholder="000.000.000-00"
                                        value={signupForm.doc}
                                        onChange={(e) => setSignupForm({ ...signupForm, doc: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Nome Completo *</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder="Seu nome completo"
                                        value={signupForm.name}
                                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Usuário *</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder="username"
                                        value={signupForm.username}
                                        onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Email *</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={signupForm.email}
                                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Senha *</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={signupForm.password}
                                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Confirmar Senha *</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        type="password"
                                        placeholder="Digite a senha novamente"
                                        value={signupForm.confirmPassword}
                                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>
                        <footer className="modal-card-foot">
                            <button className="button is-dark" onClick={handleSignupSubmit}>
                                Criar Conta
                            </button>
                            <button 
                                className="button is-dark is-outlined" 
                                onClick={() => setShowSignupModal(false)}
                            >
                                Cancelar
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </section>
    )
}



