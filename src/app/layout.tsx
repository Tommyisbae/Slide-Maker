import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

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
      <body
        className={`${outfit.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-black text-white selection:bg-violet-500/30 selection:text-violet-200`}
        style={{
          backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 100% 0%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)
            `,
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </body>
    </html>
  );
}
