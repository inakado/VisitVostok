// src/app/places/[id]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { Place, Review } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MapPin, Clock, Phone, Globe } from "lucide-react";
import Link from "next/link";

interface PlaceWithDetails extends Place {
  reviews: Review[];
  workingHours?: string;
  phone?: string;
  website?: string;
}

export default function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [place, setPlace] = useState<PlaceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/places/${id}`)
      .then(res => res.json())
      .then(data => {
        setPlace(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!place) {
    return <div className="p-4">Место не найдено</div>;
  }

  return (
    <main className="min-h-screen bg-[#f0f2f8]">
      {/* Шапка */}
      <div className="bg-white p-4 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-4">← Назад</Button>
          </Link>
          <h1 className="text-2xl font-bold">{place.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <span>{place.categoryName}</span>
            {place.totalScore && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{place.totalScore.toFixed(1)}</span>
                <span>({place.reviewsCount} отзывов)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Адрес */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <h2 className="font-semibold">Адрес</h2>
              <p className="text-gray-600">
                {place.state}, {place.city}
                {place.street && <>, {place.street}</>}
              </p>
            </div>
          </div>
        </Card>

        {/* Время работы */}
        {place.workingHours && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <h2 className="font-semibold">Время работы</h2>
                <p className="text-gray-600">{place.workingHours}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Контакты */}
        {(place.phone || place.website) && (
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Контакты</h2>
            <div className="space-y-2">
              {place.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${place.phone}`} className="text-blue-600">
                    {place.phone}
                  </a>
                </div>
              )}
              {place.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <a 
                    href={place.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600"
                  >
                    {place.website}
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Отзывы */}
        {place.reviews.length > 0 && (
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Отзывы</h2>
            <div className="space-y-4">
              {place.reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{review.rating}</span>
                  </div>
                  <p className="text-gray-600">{review.text}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}