import type { Metadata, Viewport } from "next";
import Image from "next/image";
import cornerArtwork from "../../public/background_corner.png";
import { Geist, Geist_Mono } from "next/font/google";
import 'bulma/css/bulma.min.css';
import "@/styles/global.scss";
import { UserProvider } from "@/context/userContext";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minhas Finanças",
  description: "Gerenciador de finanças pessoais completo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Minhas Finanças",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2f2f31",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="background-corners" aria-hidden="true">
          <Image className="corner top-left" src={cornerArtwork} alt="" draggable={false} />
          <Image className="corner top-right" src={cornerArtwork} alt="" draggable={false} />
          <Image className="corner bottom-left" src={cornerArtwork} alt="" draggable={false} />
          <Image className="corner bottom-right" src={cornerArtwork} alt="" draggable={false} />
        </div>
        <ConnectionStatus />
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}