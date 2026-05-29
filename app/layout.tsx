import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkinBank Beta',
  description: 'CS2 Case Opening Simulator — Provably Fair',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white font-sans min-h-screen flex flex-col items-center">
        {children}
      </body>
    </html>
  );
}
