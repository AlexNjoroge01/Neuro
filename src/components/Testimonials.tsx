"use client";

import Image from "next/image";

const testimonials = [
  {
    name: "Brian Mwangi",
    role: "Software Engineer, Nairobi",
    image: "/t1.png",
    quote:
      "I ordered from this store and the experience was smooth from checkout to delivery. The quality blew me away!",
  },
  {
    name: "Faith Mwikali",
    role: "Digital Marketer, Mombasa",
    image: "/t2.png",
    quote:
      "Amazing customer support! They responded quickly and made sure I got exactly what I wanted. 10/10 service.",
  },
  {
    name: "Kevin Munene",
    role: "Entrepreneur, Eldoret",
    image: "/t3.png",
    quote:
      "Honestly one of the best online stores in Kenya. Fast delivery, genuine products, and great prices.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-secondary text-white mt-10 py-16 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-10">
          What Our Customers Say
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-background/10 backdrop-blur-sm border border-border p-6 rounded-xl shadow-sm hover:shadow-lg transition"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 relative rounded-full overflow-hidden border-2 border-primary mb-4">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-white/80 italic mb-4 text-sm leading-relaxed">
                  “{t.quote}”
                </p>
                <h4 className="font-semibold text-primary">{t.name}</h4>
                <span className="text-xs text-white/60">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
