'use client';

import { Input } from '@/components/common/input';
import * as yup from 'yup';
import { useEffect, useState } from 'react'; // Use effect , update the project to check if already have a token on cookie
import '@/styles/login.scss';  // login styles only for login form
import { Login } from '@/lib/models/login';
import { useAuthService } from '@/lib/service';
import { Alert, Message } from '../common/message';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();


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
                console.log(document.cookie);
                console.log("Signed : {}" , signed)
                router.push("/home");
            } else {
                setMessages([{
                    tipo: "danger",
                    texto: "Usuário ou Senha Inválidos!"
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
                    <a href="#" className="is-link-text has-text-weight-semibold">Sign up</a>
                </p>
            </div>
        </section>
    )
}



