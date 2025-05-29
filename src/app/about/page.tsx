"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "lucide-react";
import { FaTelegramPlane } from 'react-icons/fa'; // Возможно, понадобится установить react-icons

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f8]"> {/* Общий контейнер для страницы */}

      {/* Секция Героя */}
      <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden bg-blue-900">
        <Image
          src="/hero-image-about.webp" // Замените на реальное фото ДВ (сопки, море, тайга) - нужно добавить в public
          alt="Пейзаж Дальнего Востока"
          fill
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 px-4">
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow mb-4">ВИЗИТВОСТОК – На Востоке, Как Дома!</h1>
          <p className="text-xl md:text-2xl mb-8 drop-shadow">Ваш проводник в мир доступных и незабываемых путешествий по Приморью и всему ДВ</p>
          <Link href="#services">
             <Button size="lg" className="bg-[#5783FF] hover:bg-[#4a71e8] text-white text-lg px-8 py-6 rounded-full shadow-lg">Узнать больше о нас</Button>
          </Link>
        </div>
      </section>

      {/* Секция О Центре и Миссии */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#2C3347]">Наша Миссия: Сделать Дальний Восток Доступным</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Мы – команда энтузиастов, влюбленных в Дальний Восток. Наша цель – разрушить мифы о сложности 
            и дороговизне путешествий по нашему уникальному региону. Мы собираем актуальную информацию, 
            разрабатываем маршруты, находим локальные секреты и делимся ими с вами, чтобы ваше путешествие 
            стало максимально комфортным, интересным и, главное, доступным.
          </p>
          {/* Опционально: Добавить фото команды или символическое фото ДВ */}
          {/* <div className="mt-8"><Image src="/about-mission.jpg" alt="Наша миссия" width={800} height={400} className="rounded-lg shadow-md mx-auto" /></div> */}
        </div>
      </section>

      {/* Секция Что Мы Предлагаем (Услуги) */}
      <section id="services" className="w-full py-16 bg-[#f0f2f8]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#2C3347]">Что Вы Найдете У Нас</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Актуальные Путеводители</h3>
                <p className="text-gray-700">Подробные описания мест, достопримечательностей и активностей с советами от местных жителей.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Готовые Маршруты</h3>
                <p className="text-gray-700">Продуманные логистически и интересные маршруты для разного времени и бюджета.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Поиск Жилья и Транспорта</h3>
                <p className="text-gray-700">Информация и ссылки на проверенные варианты проживания и аренды автомобилей.</p>
              </div>
            </div>
             <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Локальные События</h3>
                <p className="text-gray-700">Будьте в курсе фестивалей, выставок и других интересных мероприятий в регионе.</p>
              </div>
            </div>
             <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Отзывы и Оценки</h3>
                <p className="text-gray-700">Реальные мнения других путешественников помогут вам сделать правильный выбор.</p>
              </div>
            </div>
             <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#5783FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2C3347]">Поддержка и Консультации</h3>
                <p className="text-gray-700">Наша команда готова ответить на ваши вопросы и помочь спланировать поездку.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция Telegram */}
      <section className="w-full py-16 bg-white">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#2C3347]">Присоединяйтесь к Нашему Сообществу в Telegram</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
               Будьте всегда в курсе новостей, задавайте вопросы, делитесь опытом и находите попутчиков. 
               У нас есть официальный Telegram канал с самой свежей информацией и активный форум, 
               где путешественники по Дальнему Востоку общаются на любые темы.
            </p>
            <div className="flex justify-center gap-8 flex-wrap">
               <Link href="ВАША_ССЫЛКА_НА_КАНАЛ_В_TELEGRAM" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-[#0088CC] hover:bg-[#0077B3] text-white text-lg px-8 py-6 rounded-full shadow-lg flex items-center gap-2">
                     <FaTelegramPlane className="w-6 h-6" /> Канал в Telegram
                  </Button>
               </Link>
                <Link href="ВАША_ССЫЛКА_НА_ФОРУМ_В_TELEGRAM" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-[#0088CC] hover:bg-[#0077B3] text-white text-lg px-8 py-6 rounded-full shadow-lg flex items-center gap-2">
                     <FaTelegramPlane className="w-6 h-6" /> Форум Путешественников
                  </Button>
               </Link>
            </div>
         </div>
      </section>

      {/* Секция Призыв к действию (Опционально) */}
       {/* <section className="w-full py-16 bg-[#f0f2f8] text-center">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#2C3347]">Начните Планировать Свое Путешествие Сегодня!</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">Используйте наш ресурс, чтобы найти идеальный маршрут и сделать вашу поездку по Дальнему Востоку незабываемой.</p>
            <Link href="/">
                 <Button size="lg" className="bg-[#5783FF] hover:bg-[#4a71e8] text-white text-lg px-8 py-6 rounded-full shadow-lg">Начать Исследование</Button>
            </Link>
         </div>
       </section> */}

      {/* Футер */}
      <footer className="w-full py-8 bg-[#2C3347] text-white text-center">
         <div className="max-w-4xl mx-auto px-4">
            <p>&copy; 2024 VV Travel. Все права защищены.</p>
            {/* Добавить ссылки на политику конфиденциальности, контакты и т.д. */}
         </div>
      </footer>

    </div>
  );
}