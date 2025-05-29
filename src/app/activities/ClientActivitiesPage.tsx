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

interface Activity {
  id: string;
  title: string;
  imageUrl: string;
  excerpt: string;
  category: string;
  location: string;
  rating?: number;
  reviewsCount: number;
  coordinates: { lat: number; lng: number };
  price?: string;
}

interface ThematicCollection {
  title: string;
  activities: Activity[];
}

export default function ClientActivitiesPage() {
  const [featuredActivities, setFeaturedActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [thematicCollections, setThematicCollections] = useState<ThematicCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Загружаем featured активности
        const featuredResponse = await fetch('/api/activities?featured=true&limit=5');
        if (!featuredResponse.ok) throw new Error('Failed to fetch featured activities');
        const featured = await featuredResponse.json();
        
        // Загружаем все активности
        const allResponse = await fetch('/api/activities?limit=50');
        if (!allResponse.ok) throw new Error('Failed to fetch all activities');
        const all = await allResponse.json();
        
        setFeaturedActivities(featured);
        setAllActivities(all);
        
        // Создаем тематические коллекции
        const collections = createThematicCollections(all);
        setThematicCollections(collections);
        
        setError(null);
      } catch (err) {
        console.error('Ошибка загрузки активностей:', err);
        setError('Не удалось загрузить активности. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Создаем тематические коллекции на основе категорий
  const createThematicCollections = (activities: Activity[]): ThematicCollection[] => {
    const categoryGroups: Record<string, Activity[]> = {};
    
    activities.forEach(activity => {
      if (!categoryGroups[activity.category]) {
        categoryGroups[activity.category] = [];
      }
      categoryGroups[activity.category].push(activity);
    });

    // Выбираем только категории с достаточным количеством активностей
    const collections: ThematicCollection[] = [];
    
    if (categoryGroups["Парк"]?.length >= 2) {
      collections.push({
        title: "Природные парки и заповедники",
        activities: categoryGroups["Парк"].concat(categoryGroups["Природный заповедник"] || []).slice(0, 6)
      });
    }
    
    if (categoryGroups["Музей"]?.length >= 2) {
      collections.push({
        title: "Музеи и культурные объекты",
        activities: categoryGroups["Музей"].concat(categoryGroups["Театр"] || []).slice(0, 6)
      });
    }
    
    if (categoryGroups["Пляж"]?.length >= 2) {
      collections.push({
        title: "Морские развлечения",
        activities: categoryGroups["Пляж"].concat(categoryGroups["Водопад"] || []).slice(0, 6)
      });
    }

    return collections;
  };

  // Структурированные данные для активностей
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Активности и события на Дальнем Востоке",
    description: "Список туристических активностей в Приморском крае",
    numberOfItems: allActivities.length,
    itemListElement: allActivities.slice(0, 10).map((activity, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristAttraction",
        name: activity.title,
        description: activity.excerpt,
        category: activity.category,
        image: activity.imageUrl.startsWith('http') ? activity.imageUrl : `https://visitvostok.ru${activity.imageUrl}`,
        geo: {
          "@type": "GeoCoordinates",
          latitude: activity.coordinates.lat,
          longitude: activity.coordinates.lng
        }
      }
    }))
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen pt-14">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-[#2C3347] mb-4">Что-то пошло не так</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#5783FF] text-white px-6 py-3 rounded-lg hover:bg-[#4a71e8]"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col min-h-screen pt-14">
        <h1 className="sr-only">Что поделать? Активности и события на Дальнем Востоке России</h1>
        
        {/* Главный слайдер */}
        <section className="w-full py-8 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Главные события</h2>
            {loading ? (
              <Skeleton className="w-full h-[300px] rounded-lg" />
            ) : featuredActivities.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {featuredActivities.map((activity) => (
                    <CarouselItem key={activity.id}>
                      <div className="relative w-full aspect-video overflow-hidden rounded-lg group">
                        <Image
                          src={activity.imageUrl}
                          alt={activity.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-300 bg-black/30 px-2 py-1 rounded">{activity.category}</span>
                            {activity.rating && (
                              <span className="text-xs text-gray-300 bg-black/30 px-2 py-1 rounded">
                                ⭐ {activity.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-1 drop-shadow">{activity.title}</h3>
                          <p className="text-sm text-gray-200 drop-shadow">{activity.excerpt}</p>
                          <p className="text-xs text-gray-300 mt-1">📍 {activity.location}</p>
                        </div>
                        <Link href={`/places/${activity.id}`} className="absolute inset-0">
                          <span className="sr-only">Подробнее о {activity.title}</span>
                        </Link>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Пока нет рекомендуемых активностей</p>
              </div>
            )}
          </div>
        </section>

        {/* Тематические подборки */}
        <section className="w-full py-8 bg-[#f0f2f8]">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Популярные подборки</h2>
            {loading ? (
              <div className="space-y-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex space-x-4 overflow-hidden">
                      {[1, 2, 3, 4].map(j => (
                        <Skeleton key={j} className="w-64 h-56 flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : thematicCollections.length > 0 ? (
              thematicCollections.map((collection, index) => (
                <div key={index} className="mb-8 last:mb-0">
                  <h3 className="text-xl font-semibold mb-4 text-[#2C3347]">{collection.title}</h3>
                  <ScrollArea className="w-full whitespace-nowrap pb-4">
                    <div className="flex w-max space-x-4 p-1">
                      {collection.activities.map((activity) => (
                        <Link key={activity.id} href={`/places/${activity.id}`}>
                          <Card className="w-64 inline-block overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative w-full h-40">
                              <Image
                                src={activity.imageUrl}
                                alt={activity.title}
                                fill
                                sizes="(max-width: 768px) 50vw, 20vw"
                                className="object-cover"
                              />
                              {activity.price && (
                                <div className="absolute top-2 left-2 bg-[#5783FF] text-white text-xs px-2 py-1 rounded">
                                  {activity.price}
                                </div>
                              )}
                            </div>
                            <CardContent className="p-3">
                              <h4 className="font-semibold text-lg text-[#2C3347] truncate">{activity.title}</h4>
                              <p className="text-sm text-gray-600 truncate">{activity.excerpt}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">📍 {activity.location}</span>
                                {activity.rating && (
                                  <span className="text-xs text-gray-500">⭐ {activity.rating.toFixed(1)}</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Подборки активностей пока не готовы</p>
              </div>
            )}
          </div>
        </section>

        {/* Общий список всех активностей */}
        <section className="w-full py-8 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#2C3347]">Все активности</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="w-full h-48" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : allActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allActivities.map((activity) => (
                  <Link key={activity.id} href={`/places/${activity.id}`}>
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                      <div className="relative w-full h-48">
                        <Image
                          src={activity.imageUrl}
                          alt={activity.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {activity.price && (
                          <div className="absolute top-2 left-2 bg-[#5783FF] text-white text-xs px-2 py-1 rounded">
                            {activity.price}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{activity.category}</span>
                          {activity.rating && (
                            <span className="text-xs text-gray-500">⭐ {activity.rating.toFixed(1)}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-xl text-[#2C3347] mb-2">{activity.title}</h3>
                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-2">{activity.excerpt}</p>
                        <p className="text-xs text-gray-500">📍 {activity.location}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Активности пока не загружены</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
} 