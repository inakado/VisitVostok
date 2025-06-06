"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// Импортируем MapLibre Inspector только для development
import "@maplibre/maplibre-gl-inspect/dist/maplibre-gl-inspect.css";
import MaplibreInspect from "@maplibre/maplibre-gl-inspect";
import { Protocol, PMTiles } from "pmtiles";
import type { FeatureCollection, Point } from "geojson";
import { Place } from "@prisma/client";
import { 
  loadAllCategoryIcons, 
  getCategoryIconExpression,
  getCategoryIconId,
  loadMapIcon,
  loadFallbackIcon
} from "@/lib/utils/map-icons";

interface Props {
  places: Place[];
  onPlaceSelect: (place: Place | null) => void;
}

// Ключи для localStorage
const MAP_STATE_KEY = 'visitvostok_map_state';

// Утилита для отладки данных места
function debugPlaceData(place: Place | Record<string, unknown>, context: string) {
  console.log(`🔍 [${context}] Данные места:`, {
    id: place?.id,
    title: place?.title,
    lat: place?.lat,
    lng: place?.lng,
    categoryName: place?.categoryName,
    hasValidId: !!place?.id,
    hasValidTitle: !!place?.title,
    hasValidCoords: typeof place?.lat === 'number' && typeof place?.lng === 'number' &&
                   !isNaN(place.lat as number) && !isNaN(place.lng as number) &&
                   (place.lat as number) >= -90 && (place.lat as number) <= 90 &&
                   (place.lng as number) >= -180 && (place.lng as number) <= 180
  });
}

// Сохранение состояния карты
function saveMapState(center: [number, number], zoom: number) {
  if (typeof window === 'undefined') return;
  
  // Валидируем данные перед сохранением
  if (!center || center.length !== 2 || 
      isNaN(center[0]) || isNaN(center[1]) ||
      center[0] < -180 || center[0] > 180 ||
      center[1] < -90 || center[1] > 90 ||
      isNaN(zoom) || zoom < 0 || zoom > 24) {
    console.warn('⚠️ Некорректные данные для сохранения состояния карты:', { center, zoom });
    return;
  }
  
  const mapState = {
    center,
    zoom,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify(mapState));
  } catch (error) {
    console.warn('⚠️ Не удалось сохранить состояние карты:', error);
  }
}

// Загрузка состояния карты
function loadMapState(): { center: [number, number]; zoom: number } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(MAP_STATE_KEY);
    if (!saved) return null;
    
    const mapState = JSON.parse(saved);
    
    // Проверяем, что состояние не старше 24 часов
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    if (Date.now() - mapState.timestamp > maxAge) {
      localStorage.removeItem(MAP_STATE_KEY);
      return null;
    }
    
    return {
      center: mapState.center,
      zoom: mapState.zoom
    };
  } catch {
    return null;
  }
}

function placesToGeoJSON(places: Place[]): FeatureCollection<Point> {
  // Валидация входных данных
  if (!Array.isArray(places)) {
    console.warn('⚠️ placesToGeoJSON: некорректные данные places');
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  console.log('🔧 Обрабатываем places в GeoJSON:', places.length);
  let invalidPlaces = 0;

  const validFeatures = places
    .filter((place) => {
      // Валидируем, что у места есть все необходимые данные
      const hasValidCoords = typeof place.lat === "number" && typeof place.lng === "number" 
        && !isNaN(place.lat) && !isNaN(place.lng)
        && place.lat >= -90 && place.lat <= 90 
        && place.lng >= -180 && place.lng <= 180;
      const hasId = place.id;
      const hasTitle = place.title;
      
      if (!hasValidCoords || !hasId || !hasTitle) {
        invalidPlaces++;
        if (invalidPlaces <= 3) { // Показываем первые 3 ошибки
          console.warn('⚠️ Отклоняем место:', {
            id: place.id,
            title: place.title,
            lat: place.lat,
            lng: place.lng,
            hasValidCoords,
            hasId,
            hasTitle
          });
        }
        return false;
      }
      
      return true;
    })
    .map((place) => {
      // Создаем полностью очищенные properties без null значений
      const cleanProperties: Record<string, unknown> = {};
      
      // Копируем все properties и заменяем null на safe значения
      Object.entries(place).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          // Определяем тип по ключу и ставим безопасное значение
          switch (key) {
            case 'totalScore':
            case 'reviewsCount':
            case 'lat':
            case 'lng':
              cleanProperties[key] = 0;
              break;
            case 'temporarilyClosed':
              cleanProperties[key] = false;
              break;
            case 'categories':
              cleanProperties[key] = [];
              break;
            default:
              cleanProperties[key] = '';
          }
        } else {
          // Дополнительная проверка на числовые поля
          if ((key === 'totalScore' || key === 'reviewsCount' || key === 'lat' || key === 'lng') && 
              (typeof value !== 'number' || isNaN(value as number))) {
            cleanProperties[key] = 0;
          } else {
            cleanProperties[key] = value;
          }
        }
      });
      
      // Дополнительная защита - убеждаемся что критически важные поля числовые
      ['totalScore', 'reviewsCount', 'lat', 'lng'].forEach(numField => {
        if (typeof cleanProperties[numField] !== 'number' || isNaN(cleanProperties[numField])) {
          cleanProperties[numField] = 0;
        }
      });
      
      // Специальная обработка categoryName
      if (!cleanProperties.categoryName || cleanProperties.categoryName === '') {
        cleanProperties.categoryName = 'Прочее';
      }

      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [place.lng, place.lat] as [number, number],
        },
        properties: cleanProperties,
      };
    });

  if (invalidPlaces > 0) {
    console.warn(`⚠️ Отклонено ${invalidPlaces} некорректных мест из ${places.length}`);
  }
  
  console.log(`✅ Создано ${validFeatures.length} валидных features для карты`);

  return {
    type: "FeatureCollection",
    features: validFeatures,
  };
}

export default function MapLibreMap({ places, onPlaceSelect }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sourceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [categoryMapping, setCategoryMapping] = useState<Record<string, { fileName: string; path: string }>>({});
  const [iconsLoaded, setIconsLoaded] = useState(false);

  // Отдельная функция для обработчика styleimagemissing для удобства удаления
  const handleStyleImageMissing = useCallback(async (e: { id: string }) => {
    const id = e.id;
    const map = mapInstanceRef.current;
    if (!map) return;

    console.log('🔍 Запрошена отсутствующая иконка:', id);

    // Обработка иконок категорий
    if (id.startsWith('category-')) {
      if (id === 'category-fallback') {
        console.log('🎨 Загружаем fallback иконку через styleimagemissing');
        // Загружаем fallback иконку как оранжевый круг
        try {
          await loadFallbackIcon(map);
        } catch (err) {
          console.error("❌ Ошибка загрузки fallback иконки:", err);
        }
      } else {
        // Пытаемся найти соответствующую категорию и загрузить её иконку
        const categoryName = Object.keys(categoryMapping).find(name => 
          getCategoryIconId(name) === id
        );
        
        if (categoryName && categoryMapping[categoryName]) {
          const iconPath = categoryMapping[categoryName].path;
          console.log(`🎨 Загружаем недостающую иконку ${id} из ${iconPath}`);
          try {
            await loadMapIcon(map, id, iconPath);
          } catch (err) {
            console.error(`❌ Ошибка загрузки иконки категории ${id}:`, err);
            // Если не удалось загрузить иконку категории, загружаем fallback
            await loadFallbackIcon(map);
          }
        } else {
          console.log(`⚠️ Категория для ${id} не найдена, загружаем fallback`);
          // Если категория не найдена, загружаем fallback
          try {
            await loadFallbackIcon(map);
          } catch (err) {
            console.error(`❌ Ошибка загрузки fallback иконки для ${id}:`, err);
          }
        }
      }
    }
    // Обработка старых иконок (для совместимости)
    else {
      console.log(`⚠️ Запрошена неизвестная иконка ${id}, загружаем fallback`);
      try {
        await loadFallbackIcon(map);
      } catch (err) {
        console.error(`❌ Ошибка загрузки fallback для неизвестной иконки ${id}:`, err);
      }
    }
  }, [categoryMapping]);

  // Загружаем маппинг категорий при инициализации
  useEffect(() => {
    const loadCategoryMapping = async () => {
      try {
        const response = await fetch('/api/categories/mapping');
        if (response.ok) {
          const mapping = await response.json();
          setCategoryMapping(mapping);
          console.log('✅ Маппинг категорий загружен:', mapping);
        } else {
          console.error('❌ Ошибка загрузки маппинга категорий');
        }
      } catch (error) {
        console.error('❌ Ошибка при запросе маппинга категорий:', error);
      }
    };

    loadCategoryMapping();
  }, []);

  // Загружаем иконки когда маппинг категорий готов и карта инициализирована
  useEffect(() => {
    const loadIcons = async () => {
      const map = mapInstanceRef.current;
      if (!map || !mapReady || Object.keys(categoryMapping).length === 0 || iconsLoaded) {
        console.log('⏭️ Пропускаем загрузку иконок:', {
          mapExists: !!map,
          mapReady,
          categoryMappingCount: Object.keys(categoryMapping).length,
          iconsLoaded
        });
        return;
      }

      console.log('🎨 Загружаем иконки категорий после готовности карты...');
      try {
        // Загружаем fallback если еще не загружен
        if (!map.hasImage('category-fallback')) {
          await loadFallbackIcon(map);
        }
        
        await loadAllCategoryIcons(map, categoryMapping);
        setIconsLoaded(true);
        
        // Обновляем слой с иконками если он уже существует
        if (map.getLayer("unclustered-point")) {
          const newExpression = getCategoryIconExpression(categoryMapping);
          console.log('🔄 Обновляем слой с новыми иконками, expression:', newExpression);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.setLayoutProperty("unclustered-point", "icon-image", newExpression as any);
          console.log('✅ Слой обновлен с новыми иконками');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки иконок:', error);
      }
    };

    loadIcons();
  }, [categoryMapping, mapReady, iconsLoaded]); // categoryMapping и iconsLoaded используются внутри

  // Фильтрация через GPU когда карта готова
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Устанавливаем небольшую задержку для предотвращения множественных срабатываний
    filterTimeoutRef.current = setTimeout(() => {
      const map = mapInstanceRef.current;
      if (!map || !mapReady) {
        console.log('⏳ Ждем готовности карты:', { 
          mapExists: !!map, 
          mapReady, 
        });
        return;
      }

      // Для первого рендера не применяем фильтры для избежания мерцания
      if (isFirstRender) {
        console.log('🎬 Первый рендер - пропускаем фильтрацию');
        setIsFirstRender(false);
        return;
      }

      console.log('🎯 Применяем фильтрацию:', {
        filteredPlaces: places.length
      });

      // ИСПРАВЛЕНИЕ: НЕ сбрасываем встроенные фильтры слоев!
      // Встроенные фильтры кластеризации должны работать автоматически:
      // - clusters: ["has", "point_count"] - только кластеры  
      // - unclustered-point: ["!", ["has", "point_count"]] - только отдельные места
      // - cluster-count: ["has", "point_count"] - текст только для кластеров
      
      console.log('✅ Фильтрация завершена - используем встроенные фильтры слоев');
    }, isFirstRender ? 0 : 50); // Для первого рендера без задержки, потом 50ms
    
    // Cleanup функция
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [places, mapReady, isFirstRender]); // places, mapReady и isFirstRender используются

  // Обновляем источник данных карты при изменении places
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (sourceUpdateTimeoutRef.current) {
      clearTimeout(sourceUpdateTimeoutRef.current);
    }
    
    // Устанавливаем задержку для предотвращения race conditions
    sourceUpdateTimeoutRef.current = setTimeout(() => {
      const map = mapInstanceRef.current;
      if (!map || !mapReady) {
        console.log('⏳ Карта еще не готова для обновления данных');
        return;
      }
      
      try {
        // Дополнительная проверка что карта полностью готова
        if (!map.isStyleLoaded || !map.isStyleLoaded()) {
          console.log('⏳ Стиль карты еще загружается, пропускаем обновление');
          return;
        }
        
        const source = map.getSource("places") as maplibregl.GeoJSONSource;
        if (source && source.setData) {
          console.log('🔄 Обновляем источник карты с данными:', places.length, 'мест');
          const geoJsonData = placesToGeoJSON(places);
          source.setData(geoJsonData);
          
          // Принудительно обновляем слой иконок после обновления данных
          setTimeout(() => {
            const currentMap = mapInstanceRef.current;
            if (currentMap && currentMap.isStyleLoaded && currentMap.isStyleLoaded() && currentMap.getLayer && currentMap.getLayer("unclustered-point") && iconsLoaded && Object.keys(categoryMapping).length > 0) {
              console.log('🔄 Принудительно обновляем слой unclustered-point с иконками');
              try {
                // Временно скрываем слой
                currentMap.setLayoutProperty("unclustered-point", "visibility", "none");
                
                // Через небольшую задержку показываем снова с обновленным expression
                setTimeout(() => {
                  const finalMap = mapInstanceRef.current;
                  if (finalMap && finalMap.isStyleLoaded && finalMap.isStyleLoaded() && finalMap.getLayer && finalMap.getLayer("unclustered-point")) {
                    const currentExpression = getCategoryIconExpression(categoryMapping);
                    console.log('🔄 Обновляем expression на:', currentExpression);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    finalMap.setLayoutProperty("unclustered-point", "icon-image", currentExpression as any);
                    finalMap.setLayoutProperty("unclustered-point", "visibility", "visible");
                    console.log('✅ Слой unclustered-point обновлен и показан');
                  }
                }, 100);
              } catch (updateError) {
                console.error('❌ Ошибка обновления слоя:', updateError);
              }
            } else {
              console.log('⏭️ Пропускаем обновление слоя: карта, слой или иконки не готовы');
            }
          }, 200);
        } else {
          console.log('⚠️ Источник данных карты не найден');
        }
      } catch (error) {
        console.error('❌ Ошибка обновления источника карты:', error);
      }
    }, 50); // Уменьшаем задержку
    
    // Cleanup функция
    return () => {
      if (sourceUpdateTimeoutRef.current) {
        clearTimeout(sourceUpdateTimeoutRef.current);
      }
    };
  }, [mapReady, places, categoryMapping, iconsLoaded]); // Реагируем на готовность карты И сами places

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Проверяем, что контейнер имеет корректные размеры
    const container = mapRef.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('⚠️ Контейнер карты имеет нулевые размеры, откладываем инициализацию');
      // Попробуем позже
      const retryTimeout = setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          // Повторно запускаем эффект
          container.dispatchEvent(new Event('resize'));
        }
      }, 100);
      return () => clearTimeout(retryTimeout);
    }

    // PMTiles protocol
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));
    const pm = new PMTiles("https://s3.ru1.storage.beget.cloud/b8118b5036f9-vv-map/pm-tiles-area/my_area.pmtiles");
    protocol.add(pm);

    // Загружаем сохраненное состояние карты
    const savedState = loadMapState();
    const defaultCenter: [number, number] = [135.0, 48.5];
    const defaultZoom = 4;

    // Валидируем сохраненное состояние
    const validCenter = savedState?.center && 
      !isNaN(savedState.center[0]) && 
      !isNaN(savedState.center[1]) && 
      savedState.center[0] >= -180 && 
      savedState.center[0] <= 180 && 
      savedState.center[1] >= -90 && 
      savedState.center[1] <= 90 
      ? savedState.center 
      : defaultCenter;
    
    const validZoom = savedState?.zoom && 
      !isNaN(savedState.zoom) && 
      savedState.zoom >= 4 && 
      savedState.zoom <= 18 
      ? savedState.zoom 
      : defaultZoom;

    // Init map
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "style.json",
      center: validCenter,
      zoom: validZoom,
      minZoom: 4,
      maxZoom: 18,
    });
    mapInstanceRef.current = map;

    // Сохраняем состояние карты при изменении центра или зума
    const saveCurrentState = () => {
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        // Дополнительная валидация получаемых данных
        if (!center || isNaN(center.lng) || isNaN(center.lat) || isNaN(zoom)) {
          console.warn('⚠️ Некорректные данные карты при сохранении:', { center, zoom });
          return;
        }
        
        saveMapState([center.lng, center.lat], zoom);
      } catch (error) {
        console.warn('⚠️ Ошибка при получении состояния карты:', error);
      }
    };

    // Слушаем события изменения карты (с дебаунсом для производительности)
    let saveTimeout: NodeJS.Timeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveCurrentState, 1000); // Сохраняем через 1 секунду после остановки движения
    };

    map.on('moveend', debouncedSave);
    map.on('zoomend', debouncedSave);

    // Слушаем событие, когда изображению не удалось загрузиться
    map.on("styleimagemissing", handleStyleImageMissing);

    // Добавляем обработчик ошибок карты
    map.on('error', (e) => {
      console.warn('⚠️ Ошибка карты:', e.error);
    });

    map.on("load", async () => {
      console.log('🗺️ Инициализируем карту');
      
      // ШАГ 1: Всегда загружаем fallback иконку первой
      console.log('🎨 Загружаем fallback иконку...');
      await loadFallbackIcon(map);
      
      // ШАГ 2: ЖДЕМ categoryMapping если он еще не загружен
      let finalCategoryMapping = categoryMapping;
      if (Object.keys(categoryMapping).length === 0) {
        console.log('⏳ categoryMapping пустой, ждем загрузки...');
        // Даем время на загрузку categoryMapping
        await new Promise(resolve => setTimeout(resolve, 500));
        // Проверяем снова
        if (Object.keys(categoryMapping).length > 0) {
          finalCategoryMapping = categoryMapping;
          console.log('✅ categoryMapping загружен после ожидания:', Object.keys(finalCategoryMapping).length, 'категорий');
        } else {
          console.log('⚠️ categoryMapping все еще пустой, используем fallback');
          finalCategoryMapping = {};
        }
      }
      
      // ШАГ 3: Загружаем иконки категорий если маппинг готов
      if (Object.keys(finalCategoryMapping).length > 0) {
        console.log('🎨 Загружаем иконки категорий...');
        await loadAllCategoryIcons(map, finalCategoryMapping);
        setIconsLoaded(true);
        console.log('✅ Все иконки загружены, finalCategoryMapping имеет', Object.keys(finalCategoryMapping).length, 'категорий');
      } else {
        console.log('⚠️ Используем только fallback иконку');
      }
      
      // ШАГ 3: Проверяем, что источник еще не существует
      // Дополнительная проверка готовности карты
      if (!map.isStyleLoaded || !map.isStyleLoaded()) {
        console.log('⏳ Ждем полной загрузки стиля карты...');
        return;
      }
      
      if (!map.getSource("places")) {
        // Добавляем GeoJSON-источник с кластеризацией
        map.addSource("places", {
          type: "geojson",
          data: placesToGeoJSON([]), // Начинаем с пустых данных
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
        console.log('✅ Источник данных "places" добавлен');
      }

      // Добавляем слои только если они еще не существуют
      // ВАЖНО: Порядок слоев критически важен! Кластеры СНИЗУ, иконки СВЕРХУ
      
      if (map.getLayer && !map.getLayer("clusters")) {
        // Слой кластеров - ДОБАВЛЯЕМ ПЕРВЫМ (нижний уровень)
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "places",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#5783FF",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              16,
              10, 22,
              30, 28
            ],
            "circle-opacity": [
              "step",
              ["get", "point_count"],
              0.9,
              10, 0.95,
              30, 1.0
            ],
            "circle-stroke-width": 0,
            "circle-stroke-opacity": 0
          },
          layout: {
            "circle-sort-key": ["get", "point_count"]
          }
        });
        console.log('✅ Слой "clusters" добавлен (нижний уровень)');
      }

      if (map.getLayer && !map.getLayer("cluster-count")) {
        // Слой текста для кластеров - СРЕДНИЙ уровень
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "places",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Noto Sans Bold"],
            "text-size": [
              "step",
              ["get", "point_count"],
              13,
              10, 15,
              30, 17
            ],
            "symbol-sort-key": ["literal", 1000],
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            "text-color": "#ffffff",
            "text-opacity": 1.0,
            "text-halo-width": 0
          }
        });
        console.log('✅ Слой "cluster-count" добавлен (средний уровень)');
      }

      if (map.getLayer && !map.getLayer("unclustered-point")) {
        // Слой одиночных маркеров с иконками - ДОБАВЛЯЕМ ПОСЛЕДНИМ (верхний уровень)
        map.addLayer({
          id: "unclustered-point",
          type: "symbol",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": (() => {
              const expression = getCategoryIconExpression(finalCategoryMapping);
              console.log('🎨 Используем icon-image expression:', expression);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return expression as any; // MapLibre expression typing
            })(),
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4, 0.4,
              10, 0.6,
              15, 0.8
            ],
            "icon-allow-overlap": false,
            "icon-ignore-placement": false,
            "symbol-sort-key": ["literal", 2000], // Высокий приоритет для иконок
            // Добавляем текст к иконкам
            "text-field": ["get", "title"],
            "text-font": ["Noto Sans Bold"],
            "text-offset": [0, 2],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8, 10,
              12, 12,
              15, 14
            ],
            "text-anchor": "top",
            "text-max-width": 8,
            "text-allow-overlap": false,
            "text-ignore-placement": false
          },
          paint: {
            "icon-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 0.9,
              22, 1
            ],
            // Стили для текста
            "text-color": "#1F2937",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
            "text-halo-blur": 1,
            "text-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8, 0,
              10, 0.9,
              22, 1
            ]
          }
        });
        console.log('✅ Слой "unclustered-point" с иконками добавлен (верхний уровень)');
      }

            // ============================================================================
      // 🎯 БЕЗОПАСНЫЙ ЕДИНЫЙ ОБРАБОТЧИК КЛИКОВ - БЕЗ РЕКУРСИИ
      // ============================================================================
      
      // Флаг защиты от повторных вызовов
      let isProcessingClick = false;
      
      map.on("click", (e) => {
        // ЗАЩИТА ОТ РЕКУРСИИ - если уже обрабатываем клик, игнорируем
        if (isProcessingClick) {
          console.log('⚠️ Клик уже обрабатывается - игнорируем');
          return;
        }
        
        console.log('🎯 БЕЗОПАСНЫЙ обработчик кликов');
        isProcessingClick = true;
        
        try {
          // Останавливаем всплытие
          e.originalEvent.stopImmediatePropagation();
          e.originalEvent.preventDefault();
          
          // Получаем features ТОЛЬКО нужных слоев
          const clusterFeatures = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"]
          });
          
          const placeFeatures = map.queryRenderedFeatures(e.point, {
            layers: ["unclustered-point"]
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Clusters:', clusterFeatures.length, 'Places:', placeFeatures.length);
          }
          
          // ПРИОРИТЕТ 1: Кластеры
          if (clusterFeatures.length > 0) {
            const cluster = clusterFeatures[0];
            if (cluster.properties?.cluster === true) {
              console.log('🎯 Обрабатываем КЛАСТЕР');
              handleClusterClick(cluster);
            }
          }
          // ПРИОРИТЕТ 2: Места (только если НЕТ кластеров)
          else if (placeFeatures.length > 0) {
            const place = placeFeatures[0];
            if (place.properties?.id && place.properties?.title) {
              console.log('🎯 Обрабатываем МЕСТО');
              handlePlaceClick(place);
            }
          }
          
        } catch (error) {
          console.error('❌ Ошибка в обработчике кликов:', error);
        } finally {
          // Сбрасываем флаг через небольшую задержку
          setTimeout(() => {
            isProcessingClick = false;
          }, 100);
        }
      });

      // Функция обработки кликов по кластерам
      const handleClusterClick = (feature: maplibregl.MapGeoJSONFeature) => {
        console.log('🔧 Обрабатываем клик по кластеру');
        
        // Валидируем geometry кластера
        if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
          console.error('❌ Некорректная геометрия кластера:', feature.geometry);
          return;
        }
        
        const coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2 || 
            typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
            isNaN(coords[0]) || isNaN(coords[1])) {
          console.error('❌ Некорректные координаты кластера:', coords);
          return;
        }
        
        const clusterId = feature.properties?.cluster_id;
        if (!clusterId && clusterId !== 0) {
          console.error('❌ Отсутствует cluster_id:', feature.properties);
          return;
        }

        const currentMap = mapInstanceRef.current;
        if (!currentMap || !currentMap.getSource || typeof currentMap.getSource !== 'function') {
          console.log('⚠️ Карта недоступна для обработки клика по кластеру');
          return;
        }
        
        try {
          const source = currentMap.getSource("places") as maplibregl.GeoJSONSource;
          if (source && source.getClusterExpansionZoom && typeof source.getClusterExpansionZoom === 'function') {
            source.getClusterExpansionZoom(clusterId).then(zoom => {
              // Валидируем полученный зум
              if (typeof zoom !== 'number' || isNaN(zoom) || zoom < 4 || zoom > 18) {
                console.error('❌ getClusterExpansionZoom вернул некорректный зум:', zoom, 'для кластера:', clusterId);
                return;
              }
              
              setTimeout(() => {
                const finalMap = mapInstanceRef.current;
                if (finalMap && finalMap.easeTo && finalMap.getCanvas && finalMap.isStyleLoaded()) {
                  try {
                    const canvas = finalMap.getCanvas();
                    if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) {
                      console.warn('⚠️ Canvas карты недоступен для анимации кластера');
                      return;
                    }
                    
                    const currentZoom = finalMap.getZoom();
                    if (isNaN(currentZoom)) {
                      console.error('❌ Текущий зум карты некорректен:', currentZoom);
                      return;
                    }
                    
                    const centerCoords = coords as [number, number];
                    if (centerCoords[0] < -180 || centerCoords[0] > 180 || 
                        centerCoords[1] < -90 || centerCoords[1] > 90) {
                      console.error('❌ Координаты кластера вне допустимого диапазона:', centerCoords);
                      return;
                    }
                    
                    finalMap.easeTo({
                      center: centerCoords,
                      zoom: zoom,
                      duration: 500
                    });
                  } catch (animationError) {
                    console.error('❌ Ошибка анимации при раскрытии кластера:', animationError);
                  }
                }
              }, 100);
            }).catch(error => {
              console.error('❌ Ошибка при раскрытии кластера:', error);
            });
          }
        } catch (error) {
          console.error('❌ Ошибка при обработке клика по кластеру:', error);
        }
      };

      // Функция обработки кликов по местам
      const handlePlaceClick = (feature: maplibregl.MapGeoJSONFeature) => {
        console.log('🔧 Обрабатываем клик по месту');
        
        // Валидируем geometry маркера
        if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
          console.error('❌ Некорректная геометрия маркера:', feature.geometry);
          return;
        }
        
        const coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2 || 
            typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
            isNaN(coords[0]) || isNaN(coords[1])) {
          console.error('❌ Некорректные координаты маркера:', coords);
          return;
        }
        
        if (coords[0] < -180 || coords[0] > 180 || coords[1] < -90 || coords[1] > 90) {
          console.error('❌ Координаты маркера вне допустимого диапазона:', coords);
          return;
        }

        // Валидируем properties места
        const clickedPlace = feature.properties as Place;
        if (!clickedPlace || !clickedPlace.id) {
          console.error('❌ Некорректные properties места:', clickedPlace);
          debugPlaceData(clickedPlace, 'Ошибка в обработчике клика');
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          debugPlaceData(clickedPlace, 'Клик по маркеру');
        }

        // Вызываем функцию выбора места для открытия боттом-шита
        onPlaceSelect(clickedPlace);
        
        const clickedLngLat = coords as [number, number];

        setTimeout(() => {
          const currentMap = mapInstanceRef.current;
          if (currentMap && currentMap.getCanvas && currentMap.panTo && currentMap.isStyleLoaded()) {
            try {
              const canvas = currentMap.getCanvas();
              if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) {
                console.warn('⚠️ Canvas карты недоступен для анимации');
                return;
              }
              
              const currentZoom = currentMap.getZoom();
              const currentCenter = currentMap.getCenter();
              if (isNaN(currentZoom) || !currentCenter || 
                  isNaN(currentCenter.lng) || isNaN(currentCenter.lat)) {
                console.error('❌ Текущее состояние карты некорректно:', { currentZoom, currentCenter });
                return;
              }
              
              const mapContainerHeight = canvas.clientHeight;
              if (mapContainerHeight <= 0) {
                console.warn('⚠️ Некорректная высота контейнера карты');
                return;
              }
              
              const offsetPixels = -mapContainerHeight * 0.3;
              currentMap.panTo(clickedLngLat, { offset: [0, offsetPixels], duration: 500 });
            } catch (error) {
              console.error('❌ Ошибка при перемещении карты к пину:', error);
            }
          }
        }, 50);
      };

      // Добавляем курсор-палец при наведении на кликабельные слои (в правильном порядке приоритета)
      ['unclustered-point', 'cluster-count', 'clusters'].forEach(layerId => {
        map.on("mouseenter", layerId, () => { 
          const canvas = map.getCanvas();
          if (canvas) canvas.style.cursor = "pointer"; 
        });
        map.on("mouseleave", layerId, () => { 
          const canvas = map.getCanvas();
          if (canvas) canvas.style.cursor = ""; 
        });
      });

      // Отладка слоев - проверяем что именно отображается
      setTimeout(() => {
        if (map.isStyleLoaded()) {
          console.log('🔍 ОТЛАДКА СЛОЕВ:');
          console.log('📊 Источник places:', map.getSource('places'));
          
          // Проверяем загруженные изображения
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedImages = Object.keys((map as any).style.imageManager.images || {});
          console.log('🖼️ Загруженные изображения:', loadedImages.filter(img => img.startsWith('category')));
          
          // Проверяем видимость слоев
          ['unclustered-point', 'clusters', 'cluster-count'].forEach(layerId => {
            const layer = map.getLayer(layerId);
            if (layer) {
              console.log(`🎨 Слой ${layerId}:`, {
                type: layer.type,
                visibility: map.getLayoutProperty(layerId, 'visibility'),
                iconImage: layerId === 'unclustered-point' ? map.getLayoutProperty(layerId, 'icon-image') : 'N/A'
              });
            }
          });
        }
      }, 1000);

      // Карта полностью готова к работе
      console.log('✅ Карта инициализирована и готова к фильтрации');
      setMapReady(true);
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    // Добавляем MapLibre Inspector только в режиме разработки и после полной инициализации
    if (process.env.NODE_ENV === "development") {
      // Добавляем с небольшой задержкой для гарантии готовности карты
      setTimeout(() => {
        const currentMap = mapInstanceRef.current;
        if (currentMap && currentMap.isStyleLoaded && currentMap.isStyleLoaded()) {
          try {
            currentMap.addControl(
              new MaplibreInspect({
                popup: new maplibregl.Popup({
                  closeButton: false,
                  closeOnClick: false
                }),
                showInspectButton: true,
                showInspectMap: false,
                showMapPopup: true,
                showMapPopupOnHover: true,
                showInspectMapPopupOnHover: true
              }),
              "top-right"
            );
            console.log('🔧 MapLibre Inspector добавлен');
          } catch (error) {
            console.warn('⚠️ Не удалось добавить MapLibre Inspector:', error);
          }
        }
      }, 1000); // 1 секунда задержки для полной готовности
    }

    return () => {
      // Очищаем таймер фильтрации
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
      
      // Очищаем таймер обновления источника
      if (sourceUpdateTimeoutRef.current) {
        clearTimeout(sourceUpdateTimeoutRef.current);
        sourceUpdateTimeoutRef.current = null;
      }
      
      const mapInstance = mapInstanceRef.current;
      if (mapInstance) {
        try {
          // Проверяем, что карта еще доступна для операций
          if (mapInstance.getCanvas && mapInstance.getCanvas()) {
            // Сохраняем состояние перед уничтожением карты
            saveCurrentState();
          }
          
          // Очищаем обработчики событий
          if (mapInstance.off) {
            mapInstance.off('moveend', debouncedSave);
            mapInstance.off('zoomend', debouncedSave);
            mapInstance.off("styleimagemissing", handleStyleImageMissing);
          }
          
          // Удаляем карту
          if (mapInstance.remove) {
            mapInstance.remove();
          }
          mapInstanceRef.current = null;
          
          // Очищаем таймер
          clearTimeout(saveTimeout);
        } catch (error) {
          console.error('❌ Ошибка при очистке карты:', error);
          // Принудительно очищаем ссылку даже при ошибке
          mapInstanceRef.current = null;
        }
      }
    };
  }, [onPlaceSelect, categoryMapping, handleStyleImageMissing]); // onPlaceSelect и categoryMapping используются

  return <div 
    ref={mapRef} 
    className="h-[100vh] w-full map-no-flicker" 
    style={{
      transition: 'opacity 0.15s ease-in-out',
      minHeight: '200px', // Минимальная высота для предотвращения проблем с размерами
      minWidth: '200px'   // Минимальная ширина
    }} 
  />;
} 