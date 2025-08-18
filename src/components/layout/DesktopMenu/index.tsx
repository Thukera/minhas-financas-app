import React from "react";
import { Home, House, DollarSign, CreditCard, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import Image from "next/image";
import styles from "./DesktopMenu.module.css";


interface DesktopMenuProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const links = [
  { name: "Rendimentos", icon: DollarSign, href: "#" },
  { name: "Compras", icon: ShoppingBag, href: "#" },
  { name: "Residência", icon: House, href: "/home" },
  { name: "Crédito", icon: CreditCard, href: "/credito" },
];

export const DesktopMenu: React.FC<DesktopMenuProps> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <aside
      className={styles.aside}
      style={{ width: isCollapsed ? 60 : 200 }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={styles.collapseButton}
        style={{ alignSelf: isCollapsed ? "center" : "flex-end" }}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Logo */}
      <div className={styles.logo}>
        <img
          src="/logo.png"
          alt="logo"
          style={{ width: isCollapsed ? 32 : "100%" }}
        />
      </div>

      {/* Links */}
      <ul className={styles.menuList}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.name} className={styles.menuItem} style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}>
              <a href={link.href} title={isCollapsed ? link.name : undefined} style={{ display: "flex", alignItems: "center" }}>
                <Icon size={!isCollapsed ? 28 : 20} style={{ marginRight: isCollapsed ? 0 : "0.5rem" }} />
                {!isCollapsed && link.name}
              </a>
            </li>
          );
        })}
      </ul>

      {/* User Photo */}
      <div className={styles.userContainer}>
        <Image
          src="/user.png"
          alt="User"
          width={isCollapsed ? 24 : 48}
          height={isCollapsed ? 24 : 48}
          style={{ borderRadius: "50%" }}
        />
        {!isCollapsed && (
            <div>
              <a href="#">Configurações</a>
              <br />
              <a href="/">Logout</a>
            </div>
          )}
      </div>
    </aside>
  );
};
