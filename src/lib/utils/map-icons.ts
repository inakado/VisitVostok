import maplibregl from 'maplibre-gl'

export interface IconInfo {
  fileName: string
  path: string
  categoryName: string
}

/**
 * Загружает иконку в MapLibre
 */
export async function loadMapIcon(
  map: maplibregl.Map,
  iconId: string,
  iconPath: string
): Promise<boolean> {
  return new Promise((resolve) => {
    if (map.hasImage(iconId)) {
      resolve(true)
      return
    }

    // Создаем новое изображение для лучшей совместимости с SVG
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        if (!map.hasImage(iconId)) {
          // Конвертируем SVG в canvas для лучшей совместимости
          const canvas = document.createElement('canvas')
          canvas.width = 32
          canvas.height = 32
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, 32, 32)
            const imageData = ctx.getImageData(0, 0, 32, 32)
            
            // MapLibre требует объект с явными размерами
            const mapLibreImageData = {
              width: 32,
              height: 32,
              data: imageData.data
            }
            
            map.addImage(iconId, mapLibreImageData, { sdf: false })
            console.log(`✅ Иконка ${iconId} загружена через canvas`)
            resolve(true)
          } else {
            console.error(`Ошибка создания canvas для ${iconId}`)
            resolve(false)
          }
        } else {
          resolve(true)
        }
      } catch (err) {
        console.error(`Ошибка добавления иконки ${iconId}:`, err)
        resolve(false)
      }
    }
    
    img.onerror = (error) => {
      console.error(`Ошибка загрузки иконки ${iconId}:`, error)
      resolve(false)
    }
    
    img.src = iconPath
  })
}

/**
 * Загружает все иконки для категорий
 */
export async function loadAllCategoryIcons(
  map: maplibregl.Map,
  categoryMapping: Record<string, { fileName: string; path: string }>
): Promise<void> {
  const loadPromises: Promise<boolean>[] = []

  // Загружаем иконки для каждой категории
  Object.entries(categoryMapping).forEach(([categoryName, iconInfo]) => {
    const iconId = `category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`
    loadPromises.push(loadMapIcon(map, iconId, iconInfo.path))
  })

  // Загружаем fallback иконку
  loadPromises.push(loadMapIcon(map, 'category-fallback', '/pin-icons-vv/other.svg'))

  try {
    const results = await Promise.allSettled(loadPromises)
    const successes = results.filter(result => result.status === 'fulfilled' && result.value).length
    const failures = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)).length
    
    console.log(`✅ Иконки категорий загружены: ${successes} успешно, ${failures} ошибок`)
    
    if (failures > 0) {
      console.warn('⚠️ Некоторые иконки не удалось загрузить, будет использована fallback иконка')
    }
  } catch (error) {
    console.error('❌ Критическая ошибка загрузки иконок:', error)
  }
}

/**
 * Получает ID иконки для категории
 */
export function getCategoryIconId(categoryName: string): string {
  if (!categoryName) return 'category-fallback'
  return `category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`
}

/**
 * Проверяет загружена ли иконка для категории
 */
export function isCategoryIconLoaded(map: maplibregl.Map, categoryName: string): boolean {
  const iconId = getCategoryIconId(categoryName)
  return map.hasImage(iconId) || map.hasImage('category-fallback')
}

/**
 * Получает выражение для выбора иконки на основе категории
 */
export function getCategoryIconExpression(
  categoryMapping: Record<string, { fileName: string; path: string }>
): (string | unknown[])[] | string {
  if (Object.keys(categoryMapping).length === 0) {
    console.log('⚠️ categoryMapping пустой, возвращаем fallback')
    return 'category-fallback'
  }

  const cases: (string | unknown[])[] = ['case']
  
  // Добавляем случаи для каждой категории
  Object.keys(categoryMapping).forEach(categoryName => {
    const iconId = getCategoryIconId(categoryName)
    cases.push(['==', ['get', 'categoryName'], categoryName])
    cases.push(iconId)
    console.log(`🎯 Добавлен case: ${categoryName} -> ${iconId}`)
  })
  
  // Fallback иконка
  cases.push('category-fallback')
  
  console.log('🎨 Сгенерированное expression:', cases)
  return cases
}

/**
 * Загружает простую fallback иконку в виде круга
 */
export async function loadFallbackIcon(map: maplibregl.Map): Promise<boolean> {
  const iconId = 'category-fallback'
  
  if (map.hasImage(iconId)) {
    return true
  }

  return new Promise((resolve) => {
    // Создаем простую иконку в виде синего круга на canvas
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Рисуем синий круг как fallback иконку
      ctx.fillStyle = '#6366F1'
      ctx.beginPath()
      ctx.arc(16, 16, 12, 0, 2 * Math.PI)
      ctx.fill()
      
      // Добавляем белую обводку
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()
      
      const imageData = ctx.getImageData(0, 0, 32, 32)
      
      const mapLibreImageData = {
        width: 32,
        height: 32,
        data: imageData.data
      }
      
      try {
        map.addImage(iconId, mapLibreImageData, { sdf: false })
        console.log('✅ Fallback иконка (синий круг) загружена')
        resolve(true)
      } catch (err) {
        console.error('❌ Ошибка добавления fallback иконки:', err)
        resolve(false)
      }
    } else {
      console.error('❌ Не удалось создать canvas для fallback иконки')
      resolve(false)
    }
  })
} 