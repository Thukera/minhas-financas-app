"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { DesktopMenu } from "./DesktopMenu";
import { MobileMenu } from "./MobileMenu";

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const desktopSidebarWidth = isCollapsed ? 60 : 200;
  const mobileMenuHeight = 64;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    handleResize(); // initial
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      {/* Mobile menu */}
      {isMobile && <MobileMenu />}

      {/* Desktop sidebar */}
      {!isMobile && <DesktopMenu isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}

      {/* Main content */}
      <main
        style={{
          padding: "1rem",
          transition: "margin-left 0.3s ease, margin-top 0.3s ease",
          marginLeft: isMobile ? 0 : desktopSidebarWidth,
          // marginTop: isMobile ? mobileMenuHeight : 0,
        }}
        className="layout-main"
      >
        <div className="columns is-multiline">
          {React.Children.map(children, (child) => child)}
        </div>
      </main>
    </div>
  );
};
