export const metadata = {
  title: 'Lavender Travel KZ — туры из Алматы и Астаны',
  description: 'Авторские туры, забота 24/7, маршруты под ваш стиль отдыха.',
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}