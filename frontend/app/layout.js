import './globals.css';

export const metadata = {
  title: 'Saud The Spy',
  description: 'Secret Agent Cartoon Board Game',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">{children}</body>
    </html>
  );
}