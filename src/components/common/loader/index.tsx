import React from 'react';

interface LoaderProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    showSkeletons?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ 
    size = 'medium', 
    text = 'Carregando...', 
    showSkeletons = false 
}) => {
    const spinnerSize = {
        small: '30px',
        medium: '50px',
        large: '70px'
    }[size];

    const borderWidth = {
        small: '3px',
        medium: '4px',
        large: '5px'
    }[size];

    return (
        <div className="loader-container">
            <div className="has-text-centered" style={{ padding: size === 'large' ? '3rem' : '2rem' }}>
                <div className="mb-4">
                    <div 
                        className="loader-spinner"
                        style={{
                            width: spinnerSize,
                            height: spinnerSize,
                            borderWidth: borderWidth
                        }}
                    ></div>
                </div>
                {text && (
                    <p className={`has-text-grey ${size === 'large' ? 'title is-5' : 'subtitle is-6'}`}>
                        {text}
                    </p>
                )}
                
                {showSkeletons && (
                    <div className="columns is-multiline mt-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="column is-one-third">
                                <div className="skeleton-card"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .loader-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3273dc;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .skeleton-card {
                    height: 120px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 6px;
                }
                
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};
