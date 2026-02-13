"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { House, DollarSign, CreditCard, ShoppingBag, BadgeDollarSign } from "lucide-react";
import styles from "./MobileMenu.module.css";
import { useRouter } from "next/navigation";
import { useAuthService } from "@/lib/service";
import { useUser } from "@/context/userContext";

export const MobileMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  const { logout } = useAuthService();
  const { user, loading } = useUser();
  const router = useRouter();

  const [src, setSrc] = useState("/user.png"); // fallback image

  // Update avatar src when user is loaded
  useEffect(() => {
    if (user?.profilePicturePath) {
      setSrc(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePicturePath}`);
    }
  }, [user]);

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
            <Image
              src={src}
              alt="User"
              width={32}
              height={32}
              style={{ borderRadius: "50%" }}
              onError={() => setSrc("/user.png")}
            />
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
            <a href="/home">
              <BadgeDollarSign size={20} style={{ marginRight: "0.5rem" }} /> Início
            </a>
          </li>
          <li>
            <a href="/rendimentos">
              <DollarSign size={20} style={{ marginRight: "0.5rem" }} /> Rendimentos
            </a>
          </li>
          <li>
            <a href="/compras">
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
