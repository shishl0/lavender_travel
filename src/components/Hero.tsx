import Image from "next/image";

export default function Hero(){
  return (
    <section className="section relative overflow-hidden">
      {/* Дымка-подложка как в референсе (много белого, минимум фиолетового) */}
      <div className="pointer-events-none absolute -top-40 -left-28 w-[44rem] h-[44rem] rounded-full hero-haze" />
      <div className="container grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="kicker">Lavender Travel</div>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight"
              style={{color:"var(--navy)"}}>
            Путешествуй красиво <br/> с Lavender Travel
          </h1>
          <p className="mt-5 text-[17px] text-gray-700 max-w-xl">
            Авторские туры по миру, продуманные маршруты и забота 24/7.
            Минимум суеты — максимум впечатлений.
          </p>
          <div className="mt-8 flex gap-3">
            <a href="#dest" className="btn-primary press">Выбрать тур</a>
            <a href="https://wa.me/77080086191" target="_blank" className="btn-ghost press">Связаться</a>
          </div>
        </div>

        {/* Большое изображение, чтобы сразу дать эмоцию */}
        <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100">
          <Image
            src="/images/hero.jpg"
            alt="Море и закат"
            width={1200}
            height={900}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}