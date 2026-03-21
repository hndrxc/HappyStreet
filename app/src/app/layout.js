import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const pressStart = Press_Start_2P({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

export const metadata = {
  title: "HappyStreet",
  description: "The happiness economy app",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FDFAF5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
