'use client';

import { Input } from '@/components/common/input';
import * as yup from 'yup';
import { useState } from 'react';
import '@/styles/login.scss';  // login styles only for login form

const msgCampoObrigatorio = "Campo Obrigatorio"

const validationSchema = yup.object().shape({
    login: yup.string().trim().required(msgCampoObrigatorio),
    senha: yup.string().trim().required(msgCampoObrigatorio)
})

interface LoginFormErros {
    login?: string;
    senha?: string;
}

export const LoginForm: React.FC = () => {

    const [login, setLogin] = useState('')
    const [senha, setSenha] = useState('')
        const [errors, setErros] = useState<LoginFormErros>()

    return (
        <section className="section is-flex is-align-items-center is-justify-content-center">
            <div className="login-box box" >
                <div className="has-text-centered mb-4">
                    {/* <img className="logo-login" src="logo.png" alt="logo">  */}
                    <h1 className="title is-4 login-title">Minhas Finanças</h1>
                </div>

                <form>
                    <div className="field">
                        <div className="control">
                            <Input id='inputLogin'
                                label='Login'
                                //columnClasses='is-half'
                                onChange={setLogin}
                                value={login}
                                placeholder="you@example.com"
                                error={errors?.login}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <div className="control">
                                <Input id='inputSenha'
                                label='Password'
                                //columnClasses='is-half'
                                onChange={setSenha}
                                value={senha}
                                placeholder="you@example.com"
                                error={errors?.senha}
                             />
                        </div>
                    </div>

                    <div className="field is-flex is-justify-content-space-between is-align-items-center">
                        <label className="checkbox">
                            <input type="checkbox" />
                            Remember me
                        </label>
                        <a href="#" className="is-link-text is-size-7">Forgot?</a>
                    </div>

                    <div className="field mt-4">
                        <button className="button is-fullwidth login-button">
                            Sign in
                        </button>
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



