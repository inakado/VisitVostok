import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const categories = await prisma.category.findMany({
			orderBy: {
				order: 'asc'
			}
		})

		return NextResponse.json(categories)
	} catch (error) {
		console.error('Ошибка при получении категорий:', error)
		return NextResponse.json(
			{ error: 'Ошибка при получении категорий' },
			{ status: 500 }
		)
	}
} 