"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Panel } from "../common/panel";
import { Layout } from "../layout";
import { getAuthRedirectDelay } from '@/lib/utils/config';

export const RendimentosPage: React.FC = () => {
    const router = useRouter();
    
    useEffect(() => {
        const signed = localStorage.getItem("signed") === "true";
        if (!signed) {
            const delay = getAuthRedirectDelay();
            const timer = setTimeout(() => {
                router.replace("/login");
            }, delay);
            
            return () => clearTimeout(timer);
        }
    }, [router]);

    return (
        <Layout>
            <Panel title="Rendimentos">
                <div className="is-flex is-justify-content-center is-align-items-center" style={{ minHeight: "400px" }}>
                    <div className="has-text-centered">
                        <img 
                            src="/construction.svg" 
                            alt="Em Construção" 
                            style={{ maxWidth: "300px", marginBottom: "2rem" }}
                        />
                        <h2 className="title is-4">Em Construção</h2>
                        <p className="subtitle is-6 has-text-grey">Esta seção está sendo desenvolvida</p>
                    </div>
                </div>
            </Panel>
        </Layout>
    );
};
