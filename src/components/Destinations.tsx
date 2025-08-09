import Image from "next/image";

const items = [
  { title:"Турция",  img:"/images/destinations/turkey.png"   },
  { title:"Вьетнам", img:"/images/destinations/vietnam.jpg"  },
  { title:"Таиланд", img:"/images/destinations/thailand.jpg" },
  { title:"ОАЭ",     img:"/images/destinations/uae.jpg"      },
  { title:"Египет",  img:"/images/destinations/egypt.png"    },
];

export default function Destinations(){
  return (
    <section id="dest" className="section bg-[var(--tint)]">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-bold" style={{color:"var(--navy)"}}>
          Популярные направления
        </h2>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {items.map((d)=>(
            <article key={d.title} className="card p-5 text-center">
              <div className="mx-auto w-28 h-28 rounded-full overflow-hidden shadow-sm ring-1 ring-gray-100">
                <Image src={d.img} alt={d.title} width={300} height={300} className="w-full h-full object-cover"/>
              </div>
              <div className="mt-3 font-semibold">{d.title}</div>
              <a href="#contact" className="mt-3 inline-block text-sm underline text-gray-600">
                Подобрать тур
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}