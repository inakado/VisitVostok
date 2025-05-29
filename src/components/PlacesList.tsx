"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Place } from "@prisma/client";
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
import { MapPin, Route, Filter } from "lucide-react";

// Тип данных для маршрута (заглушка)
interface UserRoute {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  placesCount: number;
  duration?: string;
}

// Примерные данные маршрутов (заглушка)
const dummyUserRoutes: UserRoute[] = [
  { id: "route-1", title: "Маршрут по югу Приморья", description: "Путешествие на выходные: маяки, пляжи и леопарды!", placesCount: 5, duration: "2 дня", imageUrl: "/routes/dummy-route1.jpg" },
  { id: "route-2", title: "Городские прогулки по Владивостоку", description: "Исследуйте знаковые места города у моря.", placesCount: 8, duration: "1 день", imageUrl: "/routes/dummy-route2.jpg" },
];

export default function PlacesList() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("/api/places")
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Получение уникальных категорий
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(places.map(place => place.categoryName).filter(Boolean))];
    return uniqueCategories.sort();
  }, [places]);

  // Фильтрация мест по выбранной категории
  const filteredPlaces = useMemo(() => {
    if (!selectedCategory) return places;
    return places.filter(place => place.categoryName === selectedCategory);
  }, [places, selectedCategory]);

  // Рекомендованные места (топ по рейтингу)
  const featuredPlaces = useMemo(() => {
    return places
      .filter(place => place.totalScore && place.totalScore >= 4.0)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 6);
  }, [places]);

  // Тематические подборки на основе реальных данных
  const thematicCollections = useMemo(() => {
    const collections = [];
    
    // Популярные достопримечательности
    const landmarks = places
      .filter(p => p.categoryName?.includes('достопримечательность') || p.categoryName?.includes('Достопримечательность'))
      .sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
      .slice(0, 8);
    
    if (landmarks.length > 0) {
      collections.push({ title: "Популярные достопримечательности", places: landmarks });
    }

    // Места с высоким рейтингом
    const topRated = places
      .filter(p => p.totalScore && p.totalScore >= 4.5)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 8);
    
    if (topRated.length > 0) {
      collections.push({ title: "Места с высоким рейтингом", places: topRated });
    }

    // Музеи и культурные места
    const museums = places
      .filter(p => p.categoryName?.toLowerCase().includes('музей') || 
                   p.categoryName?.toLowerCase().includes('театр') ||
                   p.categoryName?.toLowerCase().includes('культур'))
      .slice(0, 8);
    
    if (museums.length > 0) {
      collections.push({ title: "Музеи и культурные места", places: museums });
    }

    // Природные места
    const nature = places
      .filter(p => p.categoryName?.toLowerCase().includes('парк') || 
                   p.categoryName?.toLowerCase().includes('природ') ||
                   p.categoryName?.toLowerCase().includes('заповедник'))
      .slice(0, 8);
    
    if (nature.length > 0) {
      collections.push({ title: "Природные места", places: nature });
    }

    return collections;
  }, [places]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f8]">

      {/* Фильтр по категориям */}
      <section className="w-full py-4 bg-white shadow-sm pt-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 mr-2">Категория:</span>
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                !selectedCategory 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Все
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Главный слайдер - Рекомендованные места */}
      <section className="w-full py-8 bg-white shadow-sm">
         <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Рекомендованные места</h2>
             {loading ? (
                <Skeleton className="w-full h-[300px]" />
             ) : featuredPlaces.length > 0 ? (
                <Carousel className="w-full" opts={{ align: "start", loop: true }}>
                   <CarouselContent className="-ml-2 md:-ml-4">
                      {featuredPlaces.map((place) => (
                         <CarouselItem key={place.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                            <Link href={`/places/${place.id}`}>
                               <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg group">
                                  <Image
                                     src={place.imageUrl || '/placeholder-image.jpg'}
                                     alt={place.title}
                                     fill
                                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                     className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                                     <h3 className="text-lg font-semibold text-white mb-1 drop-shadow line-clamp-2">{place.title}</h3>
                                     <p className="text-sm text-gray-200 drop-shadow">{place.city}</p>
                                     {place.totalScore && (
                                       <div className="flex items-center mt-2">
                                         <span className="text-yellow-400 text-sm">★</span>
                                         <span className="text-white text-sm ml-1">{place.totalScore.toFixed(1)}</span>
                                         {place.reviewsCount && (
                                           <span className="text-gray-300 text-xs ml-1">({place.reviewsCount})</span>
                                         )}
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </Link>
                         </CarouselItem>
                      ))}
                   </CarouselContent>
                   <CarouselPrevious className="left-4" />
                   <CarouselNext className="right-4" />
                </Carousel>
             ) : (
               <div className="text-center py-8 text-gray-500">
                 Нет рекомендованных мест
               </div>
             )}
         </div>
      </section>

      {/* Тематические подборки мест */}
      <section className="w-full py-8 bg-[#f0f2f8]">
         <div className="max-w-5xl mx-auto px-4">
            {loading ? (
                 <div className="flex space-x-4 overflow-hidden">
                   <Skeleton className="w-64 h-40" />
                   <Skeleton className="w-64 h-40" />
                 </div>
            ) : (
               thematicCollections.map((collection, index) => (
                  <div key={index} className="mb-8 last:mb-0">
                     <h3 className="text-xl font-semibold mb-4 text-[#2C3347]">{collection.title}</h3>
                     <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex w-max space-x-4 p-1">
                           {collection.places.map((place) => (
                               <Link key={place.id} href={`/places/${place.id}`}>
                                  <Card className="w-64 inline-block overflow-hidden hover:shadow-lg transition-shadow duration-200">
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
                                        <h4 className="font-semibold text-lg text-[#2C3347] line-clamp-1">{place.title}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-1">{place.city}</p>
                                        {place.totalScore && (
                                          <div className="flex items-center mt-1">
                                            <span className="text-yellow-500 text-sm">★</span>
                                            <span className="text-gray-700 text-sm ml-1">{place.totalScore.toFixed(1)}</span>
                                          </div>
                                        )}
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
                 <div className="flex space-x-4 overflow-hidden">
                   <Skeleton className="w-64 h-40" />
                   <Skeleton className="w-64 h-40" />
                 </div>
            ) : (
               <ScrollArea className="w-full whitespace-nowrap pb-4">
                  <div className="flex w-max space-x-4 p-1">
                     {dummyUserRoutes.map((route) => (
                         <Link key={route.id} href={`/routes/${route.id}`}>
                            <Card className="w-64 inline-block overflow-hidden hover:shadow-lg transition-shadow duration-200">
                               <div className="relative w-full h-40">
                                  <Image
                                     src={route.imageUrl || '/placeholder-image.jpg'}
                                     alt={route.title}
                                     fill
                                     sizes="(max-width: 768px) 50vw, 20vw"
                                     className="object-cover"
                                  />
                               </div>
                               <CardContent className="p-3">
                                  <h4 className="font-semibold text-lg text-[#2C3347] line-clamp-1 mb-1">{route.title}</h4>
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
                                  <p className="text-sm text-gray-700 line-clamp-2">{route.description}</p>
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
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">
              {selectedCategory ? `${selectedCategory} (${filteredPlaces.length})` : `Все места для посещения (${places.length})`}
            </h2>
             {loading ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-[100px]" />
                  <Skeleton className="w-full h-[100px]" />
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredPlaces.map((place) => (
                      <Link key={place.id} href={`/places/${place.id}`}>
                         <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-200">
                            <div className="relative w-full h-48">
                               <Image
                                  src={place.imageUrl || '/placeholder-image.jpg'}
                                  alt={place.title}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 33vw"
                                  className="object-cover"
                               />
                               {place.totalScore && (
                                 <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                                   ★ {place.totalScore.toFixed(1)}
                                 </div>
                               )}
                            </div>
                            <CardContent className="p-4">
                               <h3 className="font-semibold text-xl text-[#2C3347] mb-2 line-clamp-2">{place.title}</h3>
                               <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-2">{place.address}</p>
                               <div className="flex items-center justify-between">
                                 <p className="text-sm text-gray-500">{place.categoryName}</p>
                                 {place.reviewsCount && (
                                   <p className="text-xs text-gray-400">{place.reviewsCount} отзывов</p>
                                 )}
                               </div>
                            </CardContent>
                         </Card>
                      </Link>
                   ))}
                </div>
             )}
             
             {!loading && filteredPlaces.length === 0 && (
               <div className="text-center py-12">
                 <p className="text-gray-500">
                   {selectedCategory 
                     ? `Нет мест в категории "${selectedCategory}"`
                     : "Нет доступных мест"}
                 </p>
               </div>
             )}
         </div>
      </section>

    </div>
  );
}