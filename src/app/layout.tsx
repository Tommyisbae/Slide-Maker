import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlideMaker - AI Presentation Generator",
  description: "Transform textbook content into professional presentations with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
