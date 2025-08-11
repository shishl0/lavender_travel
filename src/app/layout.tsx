import "./globals.css";
import I18nInit from "@/components/I18nInit";

export const metadata = {
  title: "Lavender Travel KZ — туры из Алматы и Астаны",
  description: "Авторские туры, забота 24/7, маршруты под ваш стиль отдыха.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <I18nInit/>
        {children}
      </body>
    </html>
  );
}