"use client";

import React, { useState , useEffect} from "react";
import Image from "next/image";
import { Home, House, DollarSign, CreditCard, ShoppingBag, BadgeDollarSign } from "lucide-react";
import styles from "./MobileMenu.module.css";
import { useRouter } from 'next/navigation';
import { useAuthService } from "@/lib/service";
import { User } from "@/lib/models/user";
import { usePanelService } from '@/lib/service';


export const MobileMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [username, setUsername] = useState(false);
  const [id, setid] = useState(false);
  const [profilePicturePath, setprofilePicturePath] = useState(false);
  const { getUserDetails } = usePanelService();
  const [src, setSrc] = useState("/user.png");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { logout } = useAuthService();
  const router = useRouter();

    useEffect(() => {
      const fetchUser = async () => {
        try {
          const fetchedUser = await getUserDetails();
          if (!fetchedUser) {
            router.replace("/login"); // redirect if API fails
            return;
          }
          setUser(fetchedUser);
          setSrc(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${fetchedUser.profilePicturePath}`);
        } catch (error) {
          console.error("Failed to fetch user", error);
          localStorage.removeItem("signed");
          router.replace("/login");
        } finally {
          setLoading(false);
        }
      };
  
      fetchUser();
    }, [getUserDetails, router]);
  
    if (loading) return null; // or a loading spinner

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
            <Image src={src} alt="User" width={32} height={32} style={{ borderRadius: "50%" }} />
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
