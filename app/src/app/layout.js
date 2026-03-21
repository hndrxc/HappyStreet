import "./globals.css";

export const metadata = {
  title: "HQEX - Happy Quest Exchange",
  description: "HappyStreet happiness economy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
