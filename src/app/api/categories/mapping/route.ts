import { NextResponse } from 'next/server'
import { CategoryService } from '@/services/category.service'

export async function GET() {
  try {
    const mapping = await CategoryService.getCategoryIconMapping()
    
    // Добавляем полные пути к иконкам
    const mappingWithPaths: Record<string, { fileName: string; path: string }> = {}
    
    Object.entries(mapping).forEach(([categoryName, iconFileName]) => {
      mappingWithPaths[categoryName] = {
        fileName: iconFileName,
        path: CategoryService.getIconPath(iconFileName)
      }
    })
    
    return NextResponse.json(mappingWithPaths)
  } catch (error) {
    console.error('Ошибка получения маппинга категорий:', error)
    return NextResponse.json(
      { error: 'Не удалось получить маппинг категорий' },
      { status: 500 }
    )
  }
} 