"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { MapPin, Route } from "lucide-react";
import { usePlacesListData } from "@/lib/hooks";
import { PlaceFilters, SortUtils } from "@/lib/utils/filters";

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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [visiblePlacesCount, setVisiblePlacesCount] = useState(30); // Начинаем с 30 мест
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PLACES_INCREMENT = 30; // Подгружаем по 30 мест

  // Утилита для безопасного получения URL изображения
  const getSafeImageUrl = (imageUrl: string | null | undefined, itemId?: string): string => {
    const PLACEHOLDER = '/placeholder-image.svg';
    
    // Быстрая проверка null/undefined
    if (imageUrl === null || imageUrl === undefined) {
      return PLACEHOLDER;
    }
    
    // Проверка пустой строки или строки "null"
    if (typeof imageUrl === 'string' && (imageUrl.trim() === '' || imageUrl === 'null')) {
      return PLACEHOLDER;
    }
    
    // Проверка типа
    if (typeof imageUrl !== 'string') {
      return PLACEHOLDER;
    }
    
    // Если это изображение уже не загружалось - возвращаем placeholder
    if (itemId && failedImages.has(itemId)) {
      return PLACEHOLDER;
    }
    
    // Блокируем только известные проблемные URLs:
    // 1. Google URLs с конкретными проблемными параметрами
    if (imageUrl.includes('googleusercontent.com') && imageUrl.includes('=w408-h306-k-no')) {
      return PLACEHOLDER;
    }
    
    // 2. Dummy/тестовые URLs которые точно не существуют
    if (imageUrl.startsWith('/routes/dummy-') || imageUrl.includes('dummy-route')) {
      return PLACEHOLDER;
    }
    
    // 3. Явно невалидные URL форматы
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('./')) {
      return PLACEHOLDER;
    }
    
    // Все остальные URL пропускаем - пусть браузер попробует загрузить
    return imageUrl;
  };

  // Обработчик ошибок загрузки изображений
  const handleImageError = (imageUrl: string | null | undefined, itemId?: string) => {
    // Логируем только если это не Google/dummy URL (которые мы знаем что не работают)
    if (imageUrl && 
        !imageUrl.includes('googleusercontent.com') && 
        !imageUrl.includes('googleapis.com') && 
        !imageUrl.includes('dummy') &&
        imageUrl !== 'null' &&
        imageUrl !== null) {
      console.warn(`⚠️ PlacesList: Не удалось загрузить изображение для ${itemId}:`, imageUrl);
    }
    if (itemId) {
      setFailedImages(prev => new Set([...prev, itemId]));
    }
  };

  // Используем составной хук вместо прямого fetch
  const { places, categories, featured, topRated, isLoading, error, refetch } = usePlacesListData();

  // Показываем только первые 6 категорий на мобильных, если не раскрыто
  const displayedCategories = useMemo(() => {
    if (showAllCategories) return categories;
    return categories.slice(0, 6);
  }, [categories, showAllCategories]);

  // Фильтрация мест по выбранной категории - ИСПОЛЬЗУЕМ УТИЛИТУ
  const filteredPlaces = useMemo(() => {
    if (!selectedCategory) return places;
    return PlaceFilters.byCategory(places, selectedCategory);
  }, [places, selectedCategory]);

  // Показываем только определенное количество мест для infinite scroll
  const visiblePlaces = useMemo(() => {
    return filteredPlaces.slice(0, visiblePlacesCount);
  }, [filteredPlaces, visiblePlacesCount]);

  // Есть ли еще места для загрузки
  const hasMorePlaces = filteredPlaces.length > visiblePlacesCount;

  // Функция подгрузки следующей порции мест
  const loadMorePlaces = useCallback(() => {
    if (isLoadingMore || !hasMorePlaces) return;
    
    setIsLoadingMore(true);
    // Имитируем небольшую задержку для UX
    setTimeout(() => {
      setVisiblePlacesCount(prev => prev + PLACES_INCREMENT);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMorePlaces, PLACES_INCREMENT]);

  // Функция для скролла до отфильтрованного списка
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setVisiblePlacesCount(30); // Сбрасываем на начальное количество при смене категории
    // Скролл до секции с результатами
    setTimeout(() => {
      const element = document.getElementById('filtered-results');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Обработчик скролла для infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000) {
        loadMorePlaces();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePlaces]);

  // Тематические подборки на основе реальных данных - ИСПОЛЬЗУЕМ УТИЛИТЫ
  const thematicCollections = useMemo(() => {
    const collections = [];
    
    // Популярные достопримечательности - ИСПОЛЬЗУЕМ УТИЛИТУ
    const landmarks = SortUtils.byReviewsDesc(PlaceFilters.landmarks(places)).slice(0, 8);
    
    if (landmarks.length > 0) {
      collections.push({ title: "Популярные достопримечательности", places: landmarks });
    }

    // Места с высоким рейтингом (используем topRated из хука)
    if (topRated.length > 0) {
      collections.push({ title: "Места с высоким рейтингом", places: topRated.slice(0, 8) });
    }

    // Музеи и культурные места - ИСПОЛЬЗУЕМ УТИЛИТУ
    const museums = PlaceFilters.museums(places).slice(0, 8);
    
    if (museums.length > 0) {
      collections.push({ title: "Музеи и культурные места", places: museums });
    }

    // Природные места - ИСПОЛЬЗУЕМ УТИЛИТУ
    const nature = PlaceFilters.nature(places).slice(0, 8);
    
    if (nature.length > 0) {
      collections.push({ title: "Природные места", places: nature });
    }

    return collections;
  }, [places, topRated]);

  // Показываем ошибку с кнопкой повтора
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f0f2f8]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-[#2C3347] mb-4">Что-то пошло не так</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={refetch}
              className="bg-[#5783FF] text-white px-6 py-3 rounded-lg hover:bg-[#4a71e8] transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f8]">

      {/* Фильтр по категориям */}
      <section className="w-full py-4 bg-white shadow-sm pt-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Категория:</span>
            <button
              onClick={() => handleCategorySelect("")}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                !selectedCategory 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Все
            </button>
            {displayedCategories.map(category => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
            {categories.length > 6 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors md:hidden"
              >
                {showAllCategories ? "Скрыть" : "Показать все"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Главный слайдер - Рекомендованные места */}
      <section className="w-full py-8 bg-white shadow-sm">
         <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Рекомендованные места</h2>
             {isLoading ? (
                <Skeleton className="w-full h-[300px]" />
             ) : featured.length > 0 ? (
                <Carousel className="w-full" opts={{ align: "start", loop: true }}>
                   <CarouselContent className="-ml-2 md:-ml-4">
                      {featured.map((place) => (
                         <CarouselItem key={place.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                            <Link href={`/places/${place.id}`}>
                               <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg group">
                                  <Image
                                     src={getSafeImageUrl(place.imageUrl, `featured-${place.id}`)}
                                     alt={place.title}
                                     fill
                                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                     className="object-cover transition-transform duration-300 group-hover:scale-105"
                                     onError={() => {
                                       handleImageError(place.imageUrl, `featured-${place.id}`);
                                     }}
                                     unoptimized={true}
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
            {isLoading ? (
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
                                  <Card className="w-64 inline-block pt-0 overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                                     <div className="relative w-full h-40 -m-px">
                                        <Image
                                           src={getSafeImageUrl(place.imageUrl, `collection-${place.id}`)}
                                           alt={place.title}
                                           fill
                                           sizes="(max-width: 768px) 50vw, 20vw"
                                           className="object-cover group-hover:scale-105 transition-transform duration-300"
                                           onError={() => {
                                             handleImageError(place.imageUrl, `collection-${place.id}`);
                                           }}
                                           unoptimized={true}
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
            {isLoading ? (
                 <div className="flex space-x-4 overflow-hidden">
                   <Skeleton className="w-64 h-40" />
                   <Skeleton className="w-64 h-40" />
                 </div>
            ) : (
               <ScrollArea className="w-full whitespace-nowrap pb-4">
                  <div className="flex w-max space-x-4 p-1">
                     {dummyUserRoutes.map((route) => (
                         <Link key={route.id} href={`/routes/${route.id}`}>
                            <Card className="w-64 inline-block overflow-hidden pt-0 hover:shadow-lg transition-shadow duration-200">
                               <div className="relative w-full h-40">
                                  <Image
                                     src={getSafeImageUrl(route.imageUrl, `route-${route.id}`)}
                                     alt={route.title}
                                     fill
                                     sizes="(max-width: 768px) 50vw, 20vw"
                                     className="object-cover"
                                     onError={() => {
                                       handleImageError(route.imageUrl, `route-${route.id}`);
                                     }}
                                     unoptimized={true}
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
      <section id="filtered-results" className="w-full py-8 bg-[#f0f2f8]">
         <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">
              {selectedCategory ? `${selectedCategory} (${filteredPlaces.length})` : `Все места для посещения (${places.length})`}
              {hasMorePlaces && (
                <span className="text-base font-normal text-gray-600 ml-2">
                  - показано {visiblePlaces.length} из {filteredPlaces.length}
                </span>
              )}
            </h2>
             {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-[100px]" />
                  <Skeleton className="w-full h-[100px]" />
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {visiblePlaces.map((place) => (
                      <Link key={place.id} href={`/places/${place.id}`}>
                         <Card className="overflow-hidden h-full pt-0 hover:shadow-lg transition-shadow duration-200 group">
                            <div className="relative w-full h-48">
                               <Image
                                  src={getSafeImageUrl(place.imageUrl, `list-${place.id}`)}
                                  alt={place.title}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 33vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-lg"
                                  onError={() => {
                                    handleImageError(place.imageUrl, `list-${place.id}`);
                                  }}
                                  unoptimized={true}
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

             {/* Кнопка загрузки больше мест или индикатор загрузки */}
             {!isLoading && hasMorePlaces && (
               <div className="flex justify-center mt-8">
                 <button
                   onClick={loadMorePlaces}
                   disabled={isLoadingMore}
                   className="px-6 py-3 bg-[#5783FF] text-white rounded-lg hover:bg-[#4a71e8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   {isLoadingMore ? "Загружаем..." : "Загрузить еще"}
                 </button>
               </div>
             )}
             
             {/* Индикатор загрузки для infinite scroll */}
             {isLoadingMore && (
               <div className="flex justify-center mt-8">
                 <div className="flex items-center space-x-2">
                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5783FF]"></div>
                   <span className="text-gray-600">Загружаем еще места...</span>
                 </div>
               </div>
             )}
             
             {!isLoading && filteredPlaces.length === 0 && (
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