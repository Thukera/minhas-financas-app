'use client';

import { Input } from '@/components/common/input';
import * as yup from 'yup';
import { useEffect, useState } from 'react';
import '@/styles/login.scss';  // login styles only for login form
import { Login } from '@/lib/models/login';
import { useAuthService } from '@/lib/service';
import { Alert } from '../common/message';
import { Token } from '@/lib/models/token';
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
    const [username, setUsername] = useState('')
    const [password, setpassword] = useState('')
    const [messages, setMessages] = useState<Array<Alert>>([])
    const [errors, setErrors] = useState<LoginFormErros>()
    const [token, setToken] = useState<Token>()
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();  // <-- Prevents the page reload
        submit();            // <-- Your existing submit logic
    };

    const submit = () => {
        const login: Login = {
            username,
            password
        }
        console.log(login)

        validationSchema.validate({ username, password }, { abortEarly: false }).then(obj => {
            setErrors({})
            service
                .signin(login)
                .then(tokenResposta => {
                    setToken(tokenResposta)
                    console.log(token)

                    // Redirect to dashboard (or wherever you want)
                    router.push('/home');
                })
        }).catch(err => {
            const validationErrors: LoginFormErros = {};
            if (err.inner) {
                err.inner.forEach((e: any) => {
                    validationErrors[e.path as keyof LoginFormErros] = e.message;
                });
            }
            setErrors(validationErrors);
            // Redirect to dashboard (or wherever you want)
            router.push('/home');
        });
    }
    return (
        <section className="section is-flex is-align-items-center is-justify-content-center">
            <div className="login-box box" >
                <div className="has-text-centered mb-4">
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
                            />
                        </div>
                    </div>

                    <div className="field is-flex is-justify-content-space-between is-align-items-center">
                        <label className="checkbox">
                            <input id="remenberMe" type="checkbox" />
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
                </form>

                <p className="has-text-centered is-size-7 mt-4">
                    Don’t have an account?
                    <a href="#" className="is-link-text has-text-weight-semibold">Sign up</a>
                </p>
            </div>
        </section>
    )
}



