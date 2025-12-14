import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "H2 Online Judge Documentation",
  description:
    "Documentation for H2 Online Judge - A visual programming environment for the H2 robot language",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background">
          <header className="border-b border-border">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <a href="/" className="text-xl font-bold">
                  H2 Online Judge
                </a>
                <div className="flex items-center gap-6">
                  <a href="/guide" className="hover:text-primary">
                    Guide
                  </a>
                  <a href="/language" className="hover:text-primary">
                    Language
                  </a>
                  <a
                    href="https://github.com/ekusiadadus/h2-online-judge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    GitHub
                  </a>
                </div>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
              MIT License - H2 Online Judge
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
