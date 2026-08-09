import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Store — Premium Digital & AI Services',
  description: 'Affordable ChatGPT Plus, Gemini Pro, Claude 3.5, Canva Pro and AI subscriptions with instant warranty.',
  keywords: ['ChatGPT Plus', 'Gemini AI Pro', 'Claude Pro', 'Perplexity Pro', 'Canva Pro', 'Telegram Mini App', 'AI Store']
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Telegram WebApp official SDK script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
