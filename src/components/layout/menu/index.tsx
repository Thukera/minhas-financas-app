
import Image from 'next/image';


export const Menu: React.FC = () => {
    return (
        <div className="container is-fluid">
            <nav className="navbar is-dark is-rounded px-4" style={{ borderRadius: "1rem" }}>

                {/* Brand Logo */}
                <div className="navbar-brand">
                    <a className="navbar-item">
                        <img className="logo-login" src="logo.png" alt="logo" />
                    </a>
                </div>

                {/* Menu Items */}
                <div id="navBackgroundDemo1" className="navbar-menu">
                    <div className="navbar-start">
                        <a className="navbar-item" href="#">Home</a>
                        <a className="navbar-item" href="#">Residencia</a>
                        <a className="navbar-item" href="#">Ganhos</a>
                        <a className="navbar-item" href="#">Despesas</a>
                    </div>

                    {/* User Dropdown */}
                    <div className="navbar-end">
                        <div className="navbar-item has-dropdown is-hoverable">
                            <a className="navbar-link">
                                <figure className="image is-32x32" style={{ marginRight: "0.5rem" }}>
                                    <Image
                                        className="is-rounded"
                                        src="/user.png"
                                        alt="User avatar"
                                        width={32}
                                        height={32}
                                    />
                                </figure>
                            </a>

                            <div className="navbar-dropdown is-right">
                                <a className="navbar-item">Admin</a>
                                <hr className="navbar-divider" />
                                <a className="navbar-item">Logout</a>
                            </div>
                        </div>
                    </div>
                </div>

            </nav>
        </div>
    )
}