import { NextResponse } from 'next/server'
import { CategoryService } from '@/services/category.service'

export async function GET() {
	try {
		const categories = await CategoryService.getAllWithIcons()
		
		// Добавляем полные пути к иконкам
		const categoriesWithPaths = categories.map(category => ({
			...category,
			iconPath: CategoryService.getIconPath(category.icon)
		}))
		
		return NextResponse.json(categoriesWithPaths)
	} catch (error) {
		console.error('Ошибка получения категорий:', error)
		return NextResponse.json(
			{ error: 'Не удалось получить категории' },
			{ status: 500 }
		)
	}
} 