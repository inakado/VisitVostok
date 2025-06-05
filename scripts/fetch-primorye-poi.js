import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

/**
 * Клиент для работы с OpenTripMap API
 * 
 * API Documentation: https://opentripmap.io/docs
 * Rate Limits: 10 RPS for free tier
 * 
 * Эндпоинты:
 * - /0.1/{lang}/places/bbox - получение POI в bounding box
 * - /0.1/{lang}/places/xid/{xid} - детальная информация о POI
 */
class OpenTripMapClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.opentripmap.com';
    this.rateLimit = 110; // минимум 110 мс между группами запросов (10 RPS)
  }

  // Функция для ожидания
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Проверка доступности API
  async checkApiStatus() {
    try {
      // Простой запрос для проверки API ключа - используем маленький bbox
      const url = `${this.baseUrl}/0.1/ru/places/bbox?lon_min=131&lat_min=43&lon_max=132&lat_max=44&limit=1&format=json&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Неверный API ключ. Проверьте APIKEY_OPENTRIPMAP в .env файле');
      }
      
      if (response.status === 200) {
        console.log('✅ API ключ валиден');
        return true;
      }
      
      console.log('⚠️  API доступен, но возможны ограничения');
      return true;
    } catch (error) {
      console.error('❌ Ошибка проверки API:', error.message);
      throw error;
    }
  }

  // Функция для retry с экспоненциальным backoff
  async makeRequest(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 Запрос: ${url.replace(this.apiKey, '***')}`);
        const response = await fetch(url);
        
        if (response.status === 200) {
          const data = await response.json();
          return data;
        } else if (response.status === 429) {
          // Rate limit exceeded
          const waitTime = Math.pow(2, attempt) * 1000; // экспоненциальный backoff
          console.log(`⚠️  Rate limit exceeded. Ожидание ${waitTime}ms перед повтором...`);
          await this.delay(waitTime);
          continue;
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Ошибка авторизации. Проверьте API ключ');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (attempt === retries) {
          console.error(`❌ Ошибка после ${retries} попыток:`, error.message);
          throw error;
        }
        
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⚠️  Попытка ${attempt} неудачна. Ожидание ${waitTime}ms...`);
        await this.delay(waitTime);
      }
    }
  }

  // Разделение bbox на сетку 1x1 градус
  createBboxGrid(bbox) {
    const grid = [];
    const gridSize = 1.0; // 1 градус
    
    for (let lat = bbox.lat_min; lat < bbox.lat_max; lat += gridSize) {
      for (let lon = bbox.lon_min; lon < bbox.lon_max; lon += gridSize) {
        grid.push({
          lon_min: lon,
          lat_min: lat,
          lon_max: Math.min(lon + gridSize, bbox.lon_max),
          lat_max: Math.min(lat + gridSize, bbox.lat_max)
        });
      }
    }
    
    console.log(`📐 Создана сетка из ${grid.length} ячеек (${gridSize}° x ${gridSize}°)`);
    return grid;
  }

  // Получение POI в одной ячейке bbox
  async getPOIsInCell(cellBbox, kinds = 'interesting_places', rate = 0) {
    const allPOIs = [];
    let offset = 0;
    const limit = 999; // Уменьшенный лимит
    
    console.log(`🔍 Поиск в ячейке: ${cellBbox.lon_min.toFixed(2)},${cellBbox.lat_min.toFixed(2)} → ${cellBbox.lon_max.toFixed(2)},${cellBbox.lat_max.toFixed(2)}`);
    
    while (true) {
      const url = `${this.baseUrl}/0.1/ru/places/bbox?lon_min=${cellBbox.lon_min}&lat_min=${cellBbox.lat_min}&lon_max=${cellBbox.lon_max}&lat_max=${cellBbox.lat_max}&kinds=${kinds}&rate=${rate}&limit=${limit}&offset=${offset}&format=json&apikey=${this.apiKey}`;
      
      const data = await this.makeRequest(url);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        break;
      }
      
      allPOIs.push(...data);
      offset += limit;
      
      console.log(`   📊 +${data.length} POI (всего в ячейке: ${allPOIs.length})`);
      
      // Пауза между запросами
      await this.delay(this.rateLimit);
      
      // Защита от бесконечного цикла
      if (data.length < limit) {
        break;
      }
    }
    
    return allPOIs;
  }

  // Получение POI во всем регионе через сетку
  async getPOIsInRegion(bbox, kinds = 'interesting_places', rate = 0) {
    const grid = this.createBboxGrid(bbox);
    const allPOIs = [];
    
    for (let i = 0; i < grid.length; i++) {
      const cell = grid[i];
      console.log(`\n🗺️  Обработка ячейки ${i + 1}/${grid.length}`);
      
      try {
        const cellPOIs = await this.getPOIsInCell(cell, kinds, rate);
        allPOIs.push(...cellPOIs);
        
        console.log(`✅ Ячейка ${i + 1}: ${cellPOIs.length} POI`);
      } catch (error) {
        console.error(`❌ Ошибка в ячейке ${i + 1}:`, error.message);
      }
      
      // Пауза между ячейками
      if (i < grid.length - 1) {
        await this.delay(this.rateLimit);
      }
    }
    
    return allPOIs;
  }

  // Получение детальной информации о POI пакетами
  async getPOIDetails(pois) {
    const detailedPOIs = [];
    const batchSize = 10; // 10 параллельных запросов
    
    console.log(`\n🔍 Получение детальной информации для ${pois.length} POI...`);
    
    for (let i = 0; i < pois.length; i += batchSize) {
      const batch = pois.slice(i, i + batchSize);
      const batchPromises = batch.map(async (poi) => {
        if (!poi.xid) return null;
        
        const url = `${this.baseUrl}/0.1/ru/places/xid/${poi.xid}?format=json&apikey=${this.apiKey}`;
        try {
          return await this.makeRequest(url);
        } catch (error) {
          console.error(`❌ Ошибка получения деталей для ${poi.xid}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null);
      
      detailedPOIs.push(...validResults);
      
      const progress = Math.round(((i + batchSize) / pois.length) * 100);
      console.log(`🔍 Обработано ${Math.min(i + batchSize, pois.length)}/${pois.length} POI (${progress}%)`);
      
      // Пауза между пакетами для соблюдения rate limit
      if (i + batchSize < pois.length) {
        await this.delay(this.rateLimit);
      }
    }
    
    return detailedPOIs;
  }
}

async function main() {
  try {
    const apiKey = process.env.APIKEY_OPENTRIPMAP;
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.error(`
❌ API ключ не настроен!

Для использования скрипта:
1. Получите API ключ на https://opentripmap.io/keys
2. Создайте файл .env в корне проекта
3. Добавьте строку: APIKEY_OPENTRIPMAP=ваш_ключ_здесь

Подробная инструкция: scripts/README-primorye-poi.md
      `);
      process.exit(1);
    }

    console.log('🔑 API ключ:', apiKey);

    // ====== НАСТРОЙКИ ПОИСКА ======
    // Rate (рейтинг интересности):
    const rate = 0;
    
    // Категории POI для поиска:
    const kinds = [
      'campsites'
      /*'natural', 
      '*/
    ].join(',');
    
    // Генерируем имя файла на основе настроек
    const kindsShort = kinds.split(',').join('_');
    const outputFile = `POI_${kindsShort}.json`;
    // =============================

    console.log('🚀 Начинаю получение POI для Приморского края...');
    console.log(`📋 Используемые категории: ${kinds}`);
    console.log(`🎯 Rate: ${rate}`);
    console.log(`📄 Файл результата: ${outputFile}`);
    console.log('📐 Метод: разбиение на сетку 1×1° для избежания лимитов API');
    
    const client = new OpenTripMapClient(apiKey);
    
    // Проверяем API
    console.log('🔐 Проверка API ключа...');
    await client.checkApiStatus();
    
    // Фиксированный bbox для Приморского края
    const bbox = {
      lon_min: 130.38,
      lat_min: 42.30,
      lon_max: 139.44,
      lat_max: 48.48
    };
    
    console.log('📍 Используемый bbox Приморского края:', bbox);
    console.log(`📏 Площадь: ${(bbox.lon_max - bbox.lon_min) * (bbox.lat_max - bbox.lat_min)} кв.градусов`);
    
    // 
    console.log('\n🗺️  Получение списка POI через сетку...');
    
    const pois = await client.getPOIsInRegion(bbox, kinds, rate);
    console.log(`\n✅ Получено ${pois.length} уникальных POI`);
    
    if (pois.length === 0) {
      console.log('⚠️  POI не найдены. Попробуйте изменить rate на -3 для получения всех объектов.');
      console.log('   Или проверьте, есть ли данные в OpenTripMap для этого региона.');
      return;
    }
    
    // Удаляем дубликаты по xid
    const uniquePois = Array.from(
      new Map(pois.map(poi => [poi.xid, poi])).values()
    );
    
    console.log(`🔄 После удаления дубликатов: ${uniquePois.length} POI`);
    
    // Получаем детальную информацию
    console.log('\n🔍 Получение детальной информации о POI...');
    const detailedPOIs = await client.getPOIDetails(uniquePois);
    console.log(`✅ Получена детальная информация для ${detailedPOIs.length} POI`);
    
    // Сохраняем результат
    console.log('\n💾 Сохранение результата...');
    const result = {
      metadata: {
        region: 'Приморский край',
        bbox: bbox,
        grid_size: '1x1 градус',
        total_pois: detailedPOIs.length,
        rate_filter: rate,
        categories: kinds.split(','),
        generated_at: new Date().toISOString(),
        api_source: 'OpenTripMap',
        script_version: '2.0.0'
      },
      pois: detailedPOIs
    };
    
    await fs.writeFile(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log('✅ Данные сохранены в файл', outputFile);
    
    // Статистика
    const categories = {};
    detailedPOIs.forEach(poi => {
      if (poi.kinds) {
        poi.kinds.split(',').forEach(kind => {
          categories[kind] = (categories[kind] || 0) + 1;
        });
      }
    });
    
    console.log('\n📊 Статистика по категориям:');
    Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
    
    console.log(`\n🎉 Скрипт завершен успешно!`);
    console.log(`📄 Результат сохранен в: ${outputFile}`);
    console.log(`📈 Общее количество POI: ${detailedPOIs.length}`);
    console.log(`🎯 Использованный rate: ${rate}`);
    
  } catch (error) {
    console.error('💥 Ошибка выполнения скрипта:', error.message);
    process.exit(1);
  }
}

// Запускаем скрипт только если запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 