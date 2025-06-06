"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminSimple, useAdminPlaces } from "@/lib/hooks";

export default function NewPlacePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdminSimple();
  const { createPlace } = useAdminPlaces();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    lat: '',
    lng: '',
    categoryName: '',
    street: '',
    address: '',
    description: '',
    imageUrl: '',
    price: '',
    temporarilyClosed: false
  });

  // Проверка авторизации
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Проверка авторизации...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/admin/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createPlace({
        title: formData.title,
        city: formData.city,
        lat: parseFloat(formData.lat) || 0,
        lng: parseFloat(formData.lng) || 0,
        categoryName: formData.categoryName,
        street: formData.street,
        state: "Приморский край",
        address: formData.address,
        categories: formData.categoryName ? [formData.categoryName] : [],
        temporarilyClosed: formData.temporarilyClosed,
        description: formData.description,
        imageUrl: formData.imageUrl,
        price: formData.price,
        totalScore: null,
        reviewsCount: null
      });

      if (result.success) {
        router.push("/admin/places");
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch {
      alert('Ошибка создания места');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 pt-16 sm:pt-24">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Шапка */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <Button variant="outline" onClick={() => router.push("/admin/places")} size="sm">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Назад к списку</span>
            <span className="sm:hidden">Назад</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Добавить новое место</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Заполните информацию о месте</p>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Основные поля */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                    placeholder="Название места"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Город *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                    placeholder="Город"
                  />
                </div>
              </div>

              {/* Координаты */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Широта *</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => handleChange('lat', e.target.value)}
                    required
                    placeholder="43.1332"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Долгота *</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => handleChange('lng', e.target.value)}
                    required
                    placeholder="131.9113"
                  />
                </div>
              </div>

              {/* Категория и адрес */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Категория</Label>
                  <Input
                    id="categoryName"
                    value={formData.categoryName}
                    onChange={(e) => handleChange('categoryName', e.target.value)}
                    placeholder="Достопримечательность"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Улица</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                    placeholder="Название улицы"
                  />
                </div>
              </div>

              {/* Полный адрес */}
              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Полный адрес"
                />
              </div>

              {/* Описание */}
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Описание места"
                  rows={4}
                />
              </div>

              {/* Дополнительные поля */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL изображения</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Цена</Label>
                  <Input
                    id="price"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="Бесплатно / 500 руб"
                  />
                </div>
              </div>

              {/* Чекбокс */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temporarilyClosed"
                  checked={formData.temporarilyClosed}
                  onCheckedChange={(checked) => handleChange('temporarilyClosed', checked)}
                />
                <Label htmlFor="temporarilyClosed">Временно закрыто</Label>
              </div>

              {/* Кнопки */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/places")}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
} 