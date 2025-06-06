import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CategoryWithIcon {
  id: string
  name: string
  icon: string | null
  subcategories: string[]
  description: string | null
  order: number
}

export class CategoryService {
  /**
   * Получить все категории с иконками
   */
  static async getAllWithIcons(): Promise<CategoryWithIcon[]> {
    try {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          icon: true,
          subcategories: true,
          description: true,
          order: true
        },
        orderBy: { order: 'asc' }
      })

      return categories
    } catch (error) {
      console.error('Ошибка получения категорий:', error)
      throw error
    }
  }

  /**
   * Получить иконку для категории по названию
   */
  static async getIconByName(categoryName: string): Promise<string | null> {
    try {
      const category = await prisma.category.findUnique({
        where: { name: categoryName },
        select: { icon: true }
      })

      return category?.icon || null
    } catch (error) {
      console.error('Ошибка получения иконки категории:', error)
      return null
    }
  }

  /**
   * Получить маппинг категорий к иконкам (для быстрого доступа)
   */
  static async getCategoryIconMapping(): Promise<Record<string, string>> {
    try {
      const categories = await prisma.category.findMany({
        select: {
          name: true,
          icon: true
        }
      })

      const mapping: Record<string, string> = {}
      categories.forEach(category => {
        if (category.icon) {
          mapping[category.name] = category.icon
        }
      })

      return mapping
    } catch (error) {
      console.error('Ошибка получения маппинга категорий:', error)
      return {}
    }
  }

  /**
   * Получить полный путь к иконке
   */
  static getIconPath(iconFileName: string | null): string {
    if (!iconFileName) {
      return '/pin-icons-vv/other.svg' // fallback
    }
    return `/pin-icons-vv/${iconFileName}`
  }

  /**
   * Получить иконку для места по его categoryName с fallback
   */
  static async getIconForPlace(categoryName: string): Promise<string> {
    const iconFileName = await this.getIconByName(categoryName)
    return this.getIconPath(iconFileName)
  }
} 