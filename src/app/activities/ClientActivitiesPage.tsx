"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Примерный тип данных для активности
interface Activity {
  id: string;
  title: string;
  imageUrl: string;
  excerpt: string; // Краткое описание
  category?: string; // Например: "Пеший туризм", "Водный спорт", "Культура"
  // Добавьте другие поля по необходимости (дата, место, цена и т.д.)
}

// Примерные данные (заглушка)
const dummyActivities: Activity[] = [
  { id: "1", title: "Поход на г. Фалаза", imageUrl: "/activities/dummy-hiking.jpg", excerpt: "Захватывающий однодневный поход с великолепными видами.", category: "Пеший туризм" },
  { id: "2", title: "Морская прогулка к островам", imageUrl: "/activities/dummy-boat.jpg", excerpt: "Исследование прибрежных островов на катере.", category: "Водный спорт" },
  { id: "3", title: "Сплав по реке Уссури", imageUrl: "/activities/dummy-rafting.jpg", excerpt: "Приключение для любителей водных порогов.", category: "Водный спорт" },
  { id: "4", title: "Экскурсия по историческому центру Владивостока", imageUrl: "/activities/dummy-city.jpg", excerpt: "Погружение в историю портового города.", category: "Культура" },
  { id: "5", title: "Скалолазание на Чандалазе", imageUrl: "/activities/dummy-climbing.jpg", excerpt: "Вертикальные приключения для смелых.", category: "Скалолазание" },
   { id: "6", title: "Джип-тур на мыс Гамова", imageUrl: "/activities/dummy-jeep.jpg", excerpt: "Путешествие по живописным и труднодоступным местам.", category: "Автотуризм" },
   { id: "7", title: "Наблюдение за китами", imageUrl: "/activities/dummy-whales.jpg", excerpt: "Уникальная возможность увидеть морских гигантов.", category: "Наблюдение за животными" },
];

const dummyFeaturedActivities = dummyActivities.slice(0, 3); // Главные объявления для слайдера

const dummyThematicCollections = [
  { title: "Популярные походы", activities: dummyActivities.filter(a => a.category === "Пеший туризм") },
  { title: "Водные приключения", activities: dummyActivities.filter(a => a.category === "Водный спорт") },
  { title: "Исследование природы на авто", activities: dummyActivities.filter(a => a.category === "Автотуризм") }
];

export default function ClientActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Здесь будет логика загрузки реальных данных активностей
    // Пока используем заглушку с задержкой для имитации загрузки
    const timer = setTimeout(() => {
      setActivities(dummyActivities);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Структурированные данные для активностей
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Активности и события на Дальнем Востоке",
    description: "Список туристических активностей в Приморском крае",
    numberOfItems: dummyActivities.length,
    itemListElement: dummyActivities.map((activity, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristAttraction",
        name: activity.title,
        description: activity.excerpt,
        category: activity.category,
        image: `https://visitvostok.ru${activity.imageUrl}`
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col min-h-screen pt-14"> {/* Добавляем отступ сверху для хедера */}
        <h1 className="sr-only">Что поделать? Активности и события на Дальнем Востоке России</h1>
        
        {/* Главный слайдер */}
        <section className="w-full py-8 bg-white">
           <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Главные события</h2>
               {loading ? (
                  <Skeleton className="w-full h-[300px]" />
               ) : (
                  <Carousel className="w-full">
                     <CarouselContent>
                        {dummyFeaturedActivities.map((activity) => (
                           <CarouselItem key={activity.id}>
                              <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                                 <Image
                                    src={activity.imageUrl}
                                    alt={activity.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                                    <h3 className="text-xl font-semibold text-white mb-1 drop-shadow">{activity.title}</h3>
                                    <p className="text-sm text-gray-200 drop-shadow">{activity.excerpt}</p>
                                 </div>
                                 <Link href={`/activities/${activity.id}`} className="absolute inset-0"><span className="sr-only">Подробнее</span></Link>
                              </div>
                           </CarouselItem>
                        ))}
                     </CarouselContent>
                     <CarouselPrevious className="left-4" />
                     <CarouselNext className="right-4" />
                  </Carousel>
               )}
           </div>
        </section>

        {/* Тематические подборки */}
        <section className="w-full py-8 bg-[#f0f2f8]">
           <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Популярные подборки</h2>
              {loading ? (
                   <div className="flex space-x-4 overflow-hidden"><Skeleton className="w-[300px] h-[200px]" /><Skeleton className="w-[300px] h-[200px]" /></div>
              ) : (
                 dummyThematicCollections.map((collection, index) => (
                    <div key={index} className="mb-8 last:mb-0">
                       <h3 className="text-xl font-semibold mb-4 text-[#2C3347]">{collection.title}</h3>
                       <ScrollArea className="w-full whitespace-nowrap pb-4">
                          <div className="flex w-max space-x-4 p-1">
                             {collection.activities.map((activity) => (
                                 <Link key={activity.id} href={`/activities/${activity.id}`}>
                                    <Card className="w-64 inline-block overflow-hidden">
                                       <div className="relative w-full h-40">
                                          <Image
                                             src={activity.imageUrl}
                                             alt={activity.title}
                                             fill
                                              sizes="(max-width: 768px) 50vw, 20vw"
                                             className="object-cover"
                                          />
                                       </div>
                                       <CardContent className="p-3">
                                          <h4 className="font-semibold text-lg text-[#2C3347] truncate">{activity.title}</h4>
                                          <p className="text-sm text-gray-600 truncate">{activity.excerpt}</p>
                                       </CardContent>
                                    </Card>
                                 </Link>
                             ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                       </ScrollArea>
                    </div>
                 ))
              )}
           </div>
        </section>

        {/* Общий список всех активностей */}
        <section className="w-full py-8 bg-white">
           <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Все Активности</h2>
               {loading ? (
                  <div className="space-y-4"><Skeleton className="w-full h-[100px]" /><Skeleton className="w-full h-[100px]" /></div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {activities.map((activity) => (
                        <Link key={activity.id} href={`/activities/${activity.id}`}>
                           <Card className="overflow-hidden h-full">
                              <div className="relative w-full h-48">
                                 <Image
                                    src={activity.imageUrl}
                                    alt={activity.title}
                                    fill
                                     sizes="(max-width: 768px) 50vw, 33vw"
                                    className="object-cover"
                                 />
                              </div>
                              <CardContent className="p-4">
                                 <h3 className="font-semibold text-xl text-[#2C3347] mb-2">{activity.title}</h3>
                                 <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{activity.excerpt}</p>
                              </CardContent>
                           </Card>
                        </Link>
                     ))}
                  </div>
               )}
           </div>
        </section>

        {/* Футер - уже в layout.tsx */}

      </div>
    </>
  );
} 