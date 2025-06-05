"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminSimple } from "@/lib/hooks";
import { Place } from "@/types";

export default function PlaceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdminSimple();
  
  // Обрабатываем async params для Next.js 15
  const resolvedParams = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Загрузка данных места
  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/places/${resolvedParams.id}`);
        const data: Place = await response.json();

        if (response.ok) {
          setFormData({
            title: data.title,
            city: data.city || '',
            lat: data.lat.toString(),
            lng: data.lng.toString(),
            categoryName: data.categoryName,
            street: data.street || '',
            address: data.address || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            price: data.price || '',
            temporarilyClosed: data.temporarilyClosed || false
          });
        } else {
          setError('Место не найдено');
        }
      } catch {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchPlace();
  }, [resolvedParams.id]);

  // Редирект, если не авторизован
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/places/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          price: formData.price
        })
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/admin/places/${resolvedParams.id}`);
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch {
      alert('Ошибка сохранения места');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Показываем загрузку авторизации
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Проверка авторизации...</div>
      </div>
    );
  }

  // Если не авторизован, компонент не рендерится (происходит редирект)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Загрузка данных...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/admin/places")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">
                  <strong>Ошибка:</strong> {error}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Шапка */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/admin/places/${resolvedParams.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к просмотру
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Редактирование места</h1>
            <p className="text-slate-600">Изменение данных места</p>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Основные поля */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/places/${resolvedParams.id}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Просмотр
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/places")}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
} 