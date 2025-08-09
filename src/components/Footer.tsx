export default function Footer(){
  return (
    <footer className="mt-10 border-t">
      <div className="container py-8 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-gray-600">
          © {new Date().getFullYear()} Lavender Travel KZ — Авторские туры • Вылеты из Казахстана
        </div>
        <div className="flex items-center gap-4">
          <a href="https://www.instagram.com/lavender_travel_kz" target="_blank" className="underline">Instagram</a>
          <a href="https://wa.me/77080086191" target="_blank" className="underline">WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}