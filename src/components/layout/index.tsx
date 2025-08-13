import React from "react";
import { ReactNode } from 'react';
import { Menu } from "./menu";


interface LayoutProps {
    titulo?: string;
    children?: ReactNode;
}


export const Layout: React.FC<LayoutProps> = (props: LayoutProps) => {
    return (
        <div className="app">

            <Menu />

            <div className="section">
                <div className="card is-rounded px-4 has-background-dark">
                    <header className="card-header">
                        <p className="card-header-title has-text-white">
                            {props.titulo}
                        </p>
                    </header>
                    <div className="card-content">
                        <div className="content has-text-white">
                            {props.children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}