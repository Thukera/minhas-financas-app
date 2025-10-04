"use client";

import React, { useState, useEffect } from "react";
import { Home, House, DollarSign, CreditCard, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./DesktopMenu.module.css";
import { useAuthService } from "@/lib/service";
import { useUser } from "@/context/userContext";

interface DesktopMenuProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const links = [
  { name: "Rendimentos", icon: DollarSign, href: "#" },
  { name: "Compras", icon: ShoppingBag, href: "#" },
  { name: "Residência", icon: House, href: "/domicilio" },
  { name: "Crédito", icon: CreditCard, href: "/credito" },
];

export const DesktopMenu: React.FC<DesktopMenuProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { logout } = useAuthService();
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [src, setSrc] = useState("/user.png"); // fallback image

  // Update avatar src when user is loaded
  useEffect(() => {
    if (user?.profilePicturePath) {
      setSrc(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePicturePath}`);
    }
  }, [user]);

  return (
    <aside className={styles.aside} style={{ width: isCollapsed ? 60 : 200 }}>
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
        <Link href="/home">
          <img src="/logo.png" alt="logo" style={{ width: isCollapsed ? 32 : "100%" }} />
        </Link>
      </div>

      {/* Menu Links */}
      <ul className={styles.menuList}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li
              key={link.name}
              className={styles.menuItem}
              style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
            >
              <a href={link.href} title={isCollapsed ? link.name : undefined} style={{ display: "flex", alignItems: "center" }}>
                <Icon size={!isCollapsed ? 28 : 20} style={{ marginRight: isCollapsed ? 0 : "0.5rem" }} />
                {!isCollapsed && link.name}
              </a>
            </li>
          );
        })}
      </ul>

      {/* User Info */}
      <div className={styles.userContainer}>
        <Image
          src={src}
          alt="User"
          width={isCollapsed ? 24 : 48}
          height={isCollapsed ? 24 : 48}
          style={{ borderRadius: "50%" }}
          onError={() => setSrc("/user.png")}
        />
        {!isCollapsed && (
          <div>
            <a href="#">Configurações</a>
            <br />
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                await logout();
                router.replace("/login");
              }}
            >
              Logout
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};
