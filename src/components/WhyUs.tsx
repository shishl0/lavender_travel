const feats = [
  { icon:"🧭", title:"Индивидуальный подход", text:"Маршруты под ваши даты и бюджет." },
  { icon:"📞", title:"Поддержка 24/7",        text:"Мы на связи до, во время и после поездки." },
  { icon:"🌍", title:"Опытные гиды",          text:"Проверенные партнёры и экскурсии." },
  { icon:"✓",  title:"Прозрачные цены",       text:"Без скрытых доплат и сюрпризов." },
];

export default function WhyUs(){
  return (
    <section id="why" className="section">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-bold" style={{color:"var(--navy)"}}>
          Почему выбирают нас
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {feats.map(f=>(
            <div key={f.title} className="card p-6">
              <div className="text-3xl" style={{color:"var(--lavender)"}}>{f.icon}</div>
              <div className="mt-3 font-semibold">{f.title}</div>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}