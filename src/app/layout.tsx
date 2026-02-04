import type { Metadata } from "next";
import "./globals.css";
import 'highlight.js/styles/github-dark.css';

export const metadata: Metadata = {
  title: "SERVE OS | Frontier Logic",
  description: "AI Implementation Operating System by Frontier Logic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
