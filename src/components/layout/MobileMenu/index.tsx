"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Home, House, DollarSign, CreditCard, ShoppingBag, BadgeDollarSign } from "lucide-react";
import styles from "./MobileMenu.module.css";
import { useRouter } from 'next/navigation';
import { useAuthService } from "@/lib/service";

export const MobileMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const { logout } = useAuthService();
  const router = useRouter();

  return (
    <nav className={`navbar is-hidden-tablet ${styles.navbar}`}>
      {/* Left logo toggle */}
      <div className={styles.leftLogo} onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <Image src="/logo.png" alt="Logo" width={32} height={32} />
      </div>

      {/* Right user menu */}
      <div className={styles.userMenu}>
        <div style={{ position: "relative" }}>
          <button className={styles.userButton} onClick={() => setIsUserOpen(!isUserOpen)}>
            <Image src="/user.png" alt="User" width={32} height={32} style={{ borderRadius: "50%" }} />
          </button>

          {isUserOpen && (
            <div className={styles.userDropdown}>
              <a href="#">Configurações</a>
              <hr />
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
      </div>

      {/* Dropdown menu */}
      <div
        className={styles.dropdownMenu}
        style={{ maxHeight: isMenuOpen ? "300px" : "0px" }}
      >
        <ul>
          <li>
            <a href="#/home">
              <BadgeDollarSign size={20} style={{ marginRight: "0.5rem" }} /> Inicio
            </a>
          </li>
          <li>
            <a href="#">
              <DollarSign size={20} style={{ marginRight: "0.5rem" }} /> Rendimentos
            </a>
          </li>
          <li>
            <a href="#">
              <ShoppingBag size={20} style={{ marginRight: "0.5rem" }} /> Compras
            </a>
          </li>
          <li>
            <a href="/domicilio">
              <House size={20} style={{ marginRight: "0.5rem" }} /> Residência
            </a>
          </li>    
          <li>
            <a href="/credito">
              <CreditCard size={20} style={{ marginRight: "0.5rem" }} /> Crédito
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
