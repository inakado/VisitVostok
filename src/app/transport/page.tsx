import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "lucide-react";
import { Metadata } from "next";

// Metadata для страницы транспорта
export const metadata: Metadata = {
  title: "Транспорт - Аренда автомобилей на Дальнем Востоке",
  description: "Арендуйте надежный транспорт для путешествий по Приморскому краю. Suzuki Jimny и другие автомобили для любых маршрутов по Дальнему Востоку России.",
  keywords: [
    "аренда автомобилей Приморский край",
    "прокат машин Владивосток",
    "Suzuki Jimny аренда",
    "транспорт Дальний Восток",
    "аренда авто ДВ",
    "джип туры Приморье",
    "внедорожники аренда"
  ],
  openGraph: {
    title: "Транспорт - Аренда автомобилей на Дальнем Востоке | ВИЗИТВОСТОК",
    description: "Арендуйте надежный транспорт для путешествий по Приморскому краю. Suzuki Jimny и другие автомобили для любых маршрутов.",
    url: "https://visitvostok.ru/transport",
  },
  twitter: {
    title: "Транспорт - Аренда автомобилей на Дальнем Востоке",
    description: "Аренда надежного транспорта для путешествий по Дальнему Востоку России",
  },
  alternates: {
    canonical: "https://visitvostok.ru/transport",
  },
};

export default function TransportPage() {
  // Структурированные данные для сервиса аренды
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: "ВИЗИТВОСТОК - Аренда транспорта",
    description: "Сервис аренды автомобилей для путешествий по Дальнему Востоку",
    url: "https://visitvostok.ru/transport",
    areaServed: "Приморский край, Дальний Восток России",
    provider: {
      "@type": "Organization",
      name: "ВИЗИТВОСТОК",
      url: "https://visitvostok.ru"
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog", 
      name: "Автомобили в аренду",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Vehicle",
            name: "Suzuki Jimny",
            description: "Компактный внедорожник для любых маршрутов",
            vehicleEngine: {
              "@type": "EngineSpecification",
              fuelType: "Petrol"
            }
          }
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col min-h-screen bg-[#f0f2f8]">
        <h1 className="sr-only">Транспорт - Аренда автомобилей для путешествий по Дальнему Востоку</h1>
        
        {/* Секция Героя */}
        <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden bg-black">
          <Image
            src="/hero-image-transport.webp"
            alt="Suzuki Jimny на бездорожье"
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 px-4">
            <h2 className="text-4xl md:text-6xl font-bold drop-shadow mb-4">Ваше Приключение Начинается Здесь</h2>
            <p className="text-xl md:text-2xl mb-8 drop-shadow">Аренда легендарного Suzuki Jimny для незабываемых поездок</p>
            <Link href="#booking">
               <Button size="lg" className="bg-[#5783FF] hover:bg-[#4a71e8] text-white text-lg px-8 py-6 rounded-full shadow-lg">Забронировать Jimny</Button>
            </Link>
          </div>
        </section>

        {/* Секция О Джимни и Компании */}
        <section className="w-full py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#2C3347]">Почему Jimny для ваших приключений?</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Suzuki Jimny – это не просто автомобиль, это пропуск в мир настоящих исследований. 
              Его компактные размеры, невероятная проходимость и надежность делают его идеальным спутником 
              для изучения скрытых уголков Приморского края, куда не добраться на обычном авто. 
              Наш автопарк Jimny готов к любым вызовам, предоставляя вам свободу и уверенность на любом маршруте.
            </p>
          </div>
        </section>

        {/* Секция Преимуществ */}
        <section className="w-full py-16 bg-[#f0f2f8]">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#2C3347]">Наши Преимущества</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Полная готовность к бездорожью</h3>
                  <p className="text-gray-700">Все наши Jimny полностью обслужены и оснащены для безопасных поездок вне асфальта.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Гибкие условия аренды</h3>
                  <p className="text-gray-700">Выберите срок аренды, который подходит именно вам – от нескольких дней до недель.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Дополнительное оборудование</h3>
                  <p className="text-gray-700">Возможность аренды палаток, спальников, туристического снаряжения и прочего.</p>
                </div>
              </div>
               <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Поддержка на маршруте</h3>
                  <p className="text-gray-700">Мы всегда на связи, чтобы помочь вам в пути.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Секция Как это работает */}
        <section className="w-full py-16 bg-white">
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[#2C3347]">Просто Арендовать</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center p-6">
                       <div className="flex items-center justify-center w-12 h-12 bg-[#5783FF] text-white rounded-full text-xl font-bold mb-4">1</div>
                       <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Выберите даты</h3>
                       <p className="text-gray-700">Определите начало и конец вашего приключения.</p>
                  </div>
                  <div className="flex flex-col items-center p-6">
                       <div className="flex items-center justify-center w-12 h-12 bg-[#5783FF] text-white rounded-full text-xl font-bold mb-4">2</div>
                       <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Забронируйте онлайн</h3>
                       <p className="text-gray-700">Оформите бронь через нашу удобную форму.</p>
                  </div>
                  <div className="flex flex-col items-center p-6">
                       <div className="flex items-center justify-center w-12 h-12 bg-[#5783FF] text-white rounded-full text-xl font-bold mb-4">3</div>
                       <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Заберите ваш Jimny</h3>
                       <p className="text-gray-700">Получите ключи и отправляйтесь в путь!</p>
                  </div>
              </div>
           </div>
        </section>

        {/* Секция Призыв к действию */}
        <section id="booking" className="w-full py-16 bg-white text-center">
           <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#2C3347]">Готовы к Приключению?</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">Забронируйте ваш Suzuki Jimny прямо сейчас и начните планировать свою незабываемую поездку по Приморью!</p>
              <Link href="#">
                   <Button size="lg" className="bg-[#5783FF] hover:bg-[#4a71e8] text-white text-lg px-8 py-6 rounded-full shadow-lg">Забронировать Jimny</Button>
              </Link>
           </div>
        </section>

        {/* Футер (Пример) */}
        <footer className="w-full py-8 bg-[#2C3347] text-white text-center">
           <div className="max-w-4xl mx-auto px-4">
              <p>&copy; 2024 VV Travel. Все права защищены.</p>
           </div>
        </footer>

      </div>
    </>
  );
}