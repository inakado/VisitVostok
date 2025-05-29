"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Download, LogOut, Edit2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Place {
  id?: string;
  title: string;
  lat: number;
  lng: number;
  categoryName: string;
  city: string;
  state: string;
  address: string;
  totalScore?: number;
  reviewsCount?: number;
}

export default function AdminPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const response = await fetch("/api/places");
      const data = await response.json();
      setPlaces(data);
    } catch (error) {
      console.error("Ошибка загрузки мест:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  const openEditDialog = (place?: Place) => {
    if (place) {
      setEditingPlace(place);
    } else {
      setEditingPlace({
        title: "",
        lat: 0,
        lng: 0,
        categoryName: "",
        city: "",
        state: "Приморский край",
        address: ""
      });
    }
    setIsDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsDialogOpen(false);
    setEditingPlace(null);
  };

  const savePlace = async () => {
    if (!editingPlace) return;

    try {
      const method = editingPlace.id ? "PUT" : "POST";
      const url = editingPlace.id ? `/api/places/${editingPlace.id}` : "/api/places";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlace),
      });

      if (response.ok) {
        await fetchPlaces();
        closeEditDialog();
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    }
  };

  const deletePlace = async (id: string) => {
    if (!confirm("Удалить это место?")) return;

    try {
      const response = await fetch(`/api/places/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPlaces();
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredPlaces, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'primorsky_krai.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Получение уникальных категорий для фильтра
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(places.map(place => place.categoryName).filter(Boolean))];
    return uniqueCategories.sort();
  }, [places]);

  // Фильтрация и поиск мест
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchesSearch = searchQuery === "" || 
        (place.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (place.categoryName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (place.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (place.address?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "" || place.categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [places, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Шапка */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Админ панель</h1>
            <p className="text-muted-foreground">Управление местами в Приморском крае</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
            <Button variant="outline" onClick={exportToJSON}>
              <Download className="w-4 h-4 mr-2" />
              Экспорт JSON
            </Button>
            <Button onClick={() => openEditDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить место
            </Button>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по названию, категории, городу или адресу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 focus:border-primary"
                  />
                </div>
              </div>
              <div className="lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Все категории</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-medium">
                Показано: <span className="text-primary font-semibold">{filteredPlaces.length}</span> из <span className="text-primary font-semibold">{places.length}</span> мест
              </span>
              {searchQuery || selectedCategory ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  Очистить фильтры
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Список мест */}
        <div className="grid gap-4">
          {filteredPlaces.map((place) => (
            <Card key={place.id} className="hover:shadow-lg transition-all duration-200 border-2 border-border/50 hover:border-border">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">{place.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{place.categoryName || "Без категории"}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <strong>Город:</strong> {place.city || "Не указан"}
                      </div>
                      <div>
                        <strong>Регион:</strong> {place.state || "Не указан"}
                      </div>
                      <div className="md:col-span-2">
                        <strong>Адрес:</strong> {place.address || "Не указан"}
                      </div>
                      <div>
                        <strong>Координаты:</strong> {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
                      </div>
                      {place.totalScore && place.reviewsCount && (
                        <div>
                          <strong>Рейтинг:</strong> {place.totalScore.toFixed(1)} ({place.reviewsCount} отзывов)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(place)}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => place.id && deletePlace(place.id)}
                      className="hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPlaces.length === 0 && (
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory 
                  ? "Не найдено мест по заданным критериям"
                  : "Нет добавленных мест"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Модальное окно редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlace?.id ? "Редактировать место" : "Новое место"}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о месте. Все поля обязательны для заполнения.
            </DialogDescription>
          </DialogHeader>
          
          {editingPlace && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    value={editingPlace.title}
                    onChange={(e) => setEditingPlace({
                      ...editingPlace,
                      title: e.target.value
                    })}
                    placeholder="Введите название места"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Категория *</Label>
                  <Input
                    id="category"
                    value={editingPlace.categoryName}
                    onChange={(e) => setEditingPlace({
                      ...editingPlace,
                      categoryName: e.target.value
                    })}
                    placeholder="Введите категорию"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lat">Широта *</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={editingPlace.lat}
                    onChange={(e) => setEditingPlace({
                      ...editingPlace,
                      lat: parseFloat(e.target.value) || 0
                    })}
                    placeholder="Например: 43.1056"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Долгота *</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={editingPlace.lng}
                    onChange={(e) => setEditingPlace({
                      ...editingPlace,
                      lng: parseFloat(e.target.value) || 0
                    })}
                    placeholder="Например: 131.8735"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Город *</Label>
                  <Input
                    id="city"
                    value={editingPlace.city}
                    onChange={(e) => setEditingPlace({
                      ...editingPlace,
                      city: e.target.value
                    })}
                    placeholder="Введите город"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Регион *</Label>
                  <Input
                    id="state"
                    value={editingPlace.state}
                    onChange={(e) => setEditingPlace({
                      ...editingPlace,
                      state: e.target.value
                    })}
                    placeholder="Приморский край"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес *</Label>
                <Textarea
                  id="address"
                  value={editingPlace.address}
                  onChange={(e) => setEditingPlace({
                    ...editingPlace,
                    address: e.target.value
                  })}
                  placeholder="Введите полный адрес"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Отмена
            </Button>
            <Button onClick={savePlace}>
              {editingPlace?.id ? "Сохранить изменения" : "Создать место"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 