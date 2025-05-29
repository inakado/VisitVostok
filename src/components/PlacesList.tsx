"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Place } from "@prisma/client"; // Предполагаем, что тип Place из Prisma
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
import { MapPin, Route } from "lucide-react";

// Примерный тип данных для маршрута (заглушка)
interface UserRoute {
  id: string;
  title: string;
  description: string;
  imageUrl?: string; // Опциональное изображение маршрута
  placesCount: number; // Количество мест в маршруте
  duration?: string; // Пример: "2 дня", "Выходные"
}

// Примерные данные (заглушка)
const dummyPlaces: Place[] = [
  // Используем dummyActivities из activities page как пример структуры, но лучше использовать реальные данные мест
   { id: "place-1", title: "Видовая площадка Орлиное гнездо", imageUrl: "/places/dummy-eagle-nest.jpg", categoryName: "Достопримечательность", city: "Владивосток", totalScore: 4.5, lat: 43.11746, lng: 131.898487, street: null, state: "Приморский край", reviewsCount: 4138, address: "Владивосток", categories: ["Достопримечательность"], temporarilyClosed: false, createdAt: new Date(), price: null },
   { id: "place-2", title: "Маяк Токаревского", imageUrl: "/places/dummy-lighthouse.jpg", categoryName: "Маяк", city: "Владивосток", totalScore: 4.7, lat: 43.0782, lng: 131.8745, street: null, state: "Приморский край", reviewsCount: 5000, address: "Владивосток", categories: ["Маяк"], temporarilyClosed: false, createdAt: new Date(), price: null },
   { id: "place-3", title: "Национальный парк Земля Леопарда", imageUrl: "/places/dummy-leopard-land.jpg", categoryName: "Национальный парк", city: "Хасанский район", totalScore: 4.8, lat: 43.0, lng: 131.0, street: null, state: "Приморский край", reviewsCount: 1500, address: "Хасанский район", categories: ["Национальный парк", "Природа"], temporarilyClosed: false, createdAt: new Date(), price: null },
   { id: "place-4", title: "Бухта Стеклянная", imageUrl: "/places/dummy-glass-bay.jpg", categoryName: "Пляж", city: "Владивосток", totalScore: 4.2, lat: 43.25, lng: 132.0, street: null, state: "Приморский край", reviewsCount: 3000, address: "Владивосток", categories: ["Пляж", "Природа"], temporarilyClosed: false, createdAt: new Date(), price: null },
    { id: "place-5", title: "Остров Русский", imageUrl: "/places/dummy-russian-island.jpg", categoryName: "Остров", city: "Владивосток", totalScore: 4.6, lat: 43.05, lng: 131.95, street: null, state: "Приморский край", reviewsCount: 8000, address: "Владивосток", categories: ["Остров", "Природа"], temporarilyClosed: false, createdAt: new Date(), price: null },
];

const dummyFeaturedPlaces = dummyPlaces.slice(0, 3); // Главные объявления для слайдера

const dummyThematicCollections = [
  { title: "Видовые площадки", places: dummyPlaces.filter(p => p.categoryName === "Достопримечательность") }, // Пример фильтрации по категории
  { title: "Пляжи и бухты", places: dummyPlaces.filter(p => p.categoryName === "Пляж") },
  { title: "Национальные парки", places: dummyPlaces.filter(p => p.categoryName === "Национальный парк") }
];

const dummyUserRoutes: UserRoute[] = [
    { id: "route-1", title: "Маршрут по югу Приморья", description: "Путешествие на выходные: маяки, пляжи и леопарды!", placesCount: 5, duration: "2 дня", imageUrl: "/routes/dummy-route1.jpg" },
    { id: "route-2", title: "Городские прогулки по Владивостоку", description: "Исследуйте знаковые места города у моря.", placesCount: 8, duration: "1 день", imageUrl: "/routes/dummy-route2.jpg" },
];

export default function PlacesList() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Логика загрузки реальных данных мест (уже есть)
    fetch("/api/places")
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // TODO: Добавить логику загрузки реальных данных для маршрутов

  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f8]"> {/* Добавляем отступ сверху для хедера */}

      {/* Главный слайдер - Рекомендованные места */}
      <section className="w-full py-8 bg-white shadow-sm pt-24">
         <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Рекомендованные места</h2>
             {loading ? (
                <Skeleton className="w-full h-[300px]" />
             ) : (
                <Carousel className="w-full">
                   <CarouselContent>
                      {dummyFeaturedPlaces.map((place) => (
                         <CarouselItem key={place.id}>
                            <Link href={`/places/${place.id}`}> {/* Ссылка на страницу деталей места */}
                               <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                                  <Image
                                     src={place.imageUrl || '/placeholder-image.jpg'} // Используем imageUrl или placeholder
                                     alt={place.title}
                                     fill
                                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                     className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                                     <h3 className="text-xl font-semibold text-white mb-1 drop-shadow">{place.title}</h3>
                                     <p className="text-sm text-gray-200 drop-shadow">{place.city}, {place.categoryName}</p>
                                  </div>
                               </div>
                            </Link>
                         </CarouselItem>
                      ))}
                   </CarouselContent>
                   <CarouselPrevious className="left-4" />
                   <CarouselNext className="right-4" />
                </Carousel>
             )}
         </div>
      </section>

      {/* Тематические подборки мест */}
      <section className="w-full py-8 bg-[#f0f2f8]">
         <div className="max-w-5xl mx-auto px-4">
            {loading ? (
                 <div className="flex space-x-4 overflow-hidden"><Skeleton className="w-64 h-40" /><Skeleton className="w-64 h-40" /></div>
            ) : (
               dummyThematicCollections.map((collection, index) => (
                  <div key={index} className="mb-8 last:mb-0">
                     <h3 className="text-xl font-semibold mb-4 text-[#2C3347]">{collection.title}</h3>
                     <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex w-max space-x-4 p-1">
                           {collection.places.map((place) => (
                               <Link key={place.id} href={`/places/${place.id}`}> {/* Ссылка на страницу деталей места */}
                                  <Card className="w-64 inline-block overflow-hidden">
                                     <div className="relative w-full h-40">
                                        <Image
                                           src={place.imageUrl || '/placeholder-image.jpg'}
                                           alt={place.title}
                                           fill
                                            sizes="(max-width: 768px) 50vw, 20vw"
                                           className="object-cover"
                                        />
                                     </div>
                                     <CardContent className="p-3">
                                        <h4 className="font-semibold text-lg text-[#2C3347] truncate">{place.title}</h4>
                                        <p className="text-sm text-gray-600 truncate">{place.city}</p>
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

       {/* Секция Пользовательские маршруты */}
      <section className="w-full py-8 bg-white">
         <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Популярные маршруты</h2>
            {loading ? (
                 <div className="flex space-x-4 overflow-hidden"><Skeleton className="w-64 h-40" /><Skeleton className="w-64 h-40" /></div>
            ) : ( // Используем dummyUserRoutes пока нет реальных данных
               <ScrollArea className="w-full whitespace-nowrap pb-4">
                  <div className="flex w-max space-x-4 p-1">
                     {dummyUserRoutes.map((route) => (
                         <Link key={route.id} href={`/routes/${route.id}`}> {/* Ссылка на страницу деталей маршрута - нужно создать */}
                            <Card className="w-64 inline-block overflow-hidden">
                               <div className="relative w-full h-40">
                                  <Image
                                     src={route.imageUrl || '/placeholder-route.jpg'} // Изображение маршрута или placeholder
                                     alt={route.title}
                                     fill
                                     sizes="(max-width: 768px) 50vw, 20vw"
                                     className="object-cover"
                                  />
                               </div>
                               <CardContent className="p-3">
                                  <h4 className="font-semibold text-lg text-[#2C3347] truncate mb-1">{route.title}</h4>
                                   <div className="flex items-center text-sm text-gray-600 mb-2">
                                       <MapPin className="w-4 h-4 mr-1" />
                                       <span>{route.placesCount} мест</span>
                                       {route.duration && (
                                           <>
                                            <Route className="w-4 h-4 ml-4 mr-1" />
                                            <span>{route.duration}</span>
                                           </>
                                       )}
                                   </div>
                                  <p className="text-sm text-gray-700 truncate">{route.description}</p>
                               </CardContent>
                            </Card>
                         </Link>
                     ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
               </ScrollArea>
            )}
         </div>
      </section>

      {/* Общий список всех мест */}
      <section className="w-full py-8 bg-[#f0f2f8]">
         <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Все места для посещения</h2>
             {loading ? (
                <div className="space-y-4"><Skeleton className="w-full h-[100px]" /><Skeleton className="w-full h-[100px]" /></div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {places.map((place) => (
                      <Link key={place.id} href={`/places/${place.id}`}> {/* Ссылка на страницу деталей места */}
                         <Card className="overflow-hidden h-full">
                            <div className="relative w-full h-48">
                               <Image
                                  src={place.imageUrl || '/placeholder-image.jpg'}
                                  alt={place.title}
                                  fill
                                   sizes="(max-width: 768px) 50vw, 33vw"
                                  className="object-cover"
                               />
                            </div>
                            <CardContent className="p-4">
                               <h3 className="font-semibold text-xl text-[#2C3347] mb-2">{place.title}</h3>
                               <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{place.address}</p>
                               <p className="text-sm text-gray-500 mt-1">{place.categoryName}</p>
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
  );
}