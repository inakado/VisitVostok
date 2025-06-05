import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface TransformedPlace {
	title: string
	city: string | null
	totalScore: number | null
	location: {
		lat: number
		lng: number
	}
	categoryName: string
	street: string | null
	state: string
	reviewsCount: number | null
	imageUrl: string | null
	price: string | null
	description?: string | null
	address: string
	categories: string[]
	temporarilyClosed: boolean
	website?: string
}

// Функция для создания уникального ID на основе координат и названия
function createPlaceHash(title: string, lat: number, lng: number): string {
	return `${title.toLowerCase().trim()}_${lat.toFixed(6)}_${lng.toFixed(6)}`
}

async function importTransformedPlaces() {
	console.log('🚀 Начинаю импорт преобразованных мест...\n')
	
	try {
		// Читаем файл
		const filePath = path.join(process.cwd(), 'public', 'transformed_places.json')
		const fileContent = await fs.readFile(filePath, 'utf8')
		const transformedPlaces: TransformedPlace[] = JSON.parse(fileContent)
		
		console.log(`📊 Найдено ${transformedPlaces.length} преобразованных мест для импорта`)
		
		// Получаем текущее количество мест в БД
		const existingCount = await prisma.place.count()
		console.log(`📈 Текущих мест в БД: ${existingCount}`)
		
		// Создаём индекс существующих мест для быстрой проверки
		console.log('🔍 Создаю индекс существующих мест...')
		const existingPlaces = await prisma.place.findMany({
			select: { title: true, lat: true, lng: true }
		})
		
		const existingHashes = new Set(
			existingPlaces.map(place => 
				createPlaceHash(place.title, place.lat, place.lng)
			)
		)
		
		console.log(`📋 Загружено ${existingHashes.size} существующих мест в индекс`)
		
		// Фильтруем новые места
		const newPlaces = transformedPlaces.filter(place => {
			const hash = createPlaceHash(place.title, place.location.lat, place.location.lng)
			return !existingHashes.has(hash)
		})
		
		console.log(`✨ Найдено ${newPlaces.length} новых мест для импорта`)
		
		if (newPlaces.length === 0) {
			console.log('✅ Все преобразованные места уже импортированы!')
			return
		}
		
		// Статистика по категориям новых мест
		const categoryStats = new Map<string, number>()
		const subcategoryStats = new Map<string, number>()
		
		for (const place of newPlaces) {
			categoryStats.set(place.categoryName, (categoryStats.get(place.categoryName) || 0) + 1)
			for (const subcategory of place.categories) {
				subcategoryStats.set(subcategory, (subcategoryStats.get(subcategory) || 0) + 1)
			}
		}
		
		console.log(`\n📂 Категории новых мест:`)
		Array.from(categoryStats.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.forEach(([category, count]) => {
				console.log(`   • ${category}: ${count} мест`)
			})
		
		// Батчевый импорт для эффективности
		const batchSize = 500
		let importedCount = 0
		
		for (let i = 0; i < newPlaces.length; i += batchSize) {
			const batch = newPlaces.slice(i, i + batchSize)
			
			console.log(`⏳ Импортирую батч ${Math.floor(i / batchSize) + 1}/${Math.ceil(newPlaces.length / batchSize)} (${batch.length} мест)...`)
			
			try {
				// Преобразуем данные для createMany
				const placesToCreate = batch.map(place => ({
					title: place.title,
					city: place.city,
					totalScore: place.totalScore,
					lat: place.location.lat,
					lng: place.location.lng,
					categoryName: place.categoryName,
					street: place.street,
					state: place.state || 'Приморский край',
					reviewsCount: place.reviewsCount,
					imageUrl: place.imageUrl,
					price: place.price,
					description: place.description,
					address: place.address,
					categories: place.categories,
					temporarilyClosed: place.temporarilyClosed || false
				}))
				
				// Bulk создание с пропуском дубликатов
				const result = await prisma.place.createMany({
					data: placesToCreate,
					skipDuplicates: true
				})
				
				importedCount += result.count
				
				// Показываем прогресс
				const progress = (((i + batch.length) / newPlaces.length) * 100).toFixed(1)
				console.log(`📊 Прогресс: ${progress}% | Импортировано в этом батче: ${result.count}`)
				
			} catch (error) {
				console.error(`❌ Ошибка при импорте батча:`, error)
				
				// Fallback: импортируем по одному месту из проблемного батча
				console.log('🔄 Пробую импортировать места по одному...')
				for (const place of batch) {
					try {
						await prisma.place.create({
							data: {
								title: place.title,
								city: place.city,
								totalScore: place.totalScore,
								lat: place.location.lat,
								lng: place.location.lng,
								categoryName: place.categoryName,
								street: place.street,
								state: place.state || 'Приморский край',
								reviewsCount: place.reviewsCount,
								imageUrl: place.imageUrl,
								price: place.price,
								description: place.description,
								address: place.address,
								categories: place.categories,
								temporarilyClosed: place.temporarilyClosed || false
							}
						})
						importedCount++
					} catch (singleError) {
						console.error(`❌ Не удалось импортировать место "${place.title}":`, singleError)
					}
				}
			}
		}
		
		// Финальная статистика
		const finalCount = await prisma.place.count()
		const finalCategoryStats = await prisma.place.groupBy({
			by: ['categoryName'],
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } }
		})
		
		console.log(`
🎉 Импорт преобразованных мест завершён успешно!
📈 Статистика:
   • Преобразованных мест в файле: ${transformedPlaces.length}
   • Новых мест для импорта: ${newPlaces.length}
   • Успешно импортировано: ${importedCount}
   • Пропущено дубликатов: ${transformedPlaces.length - newPlaces.length}
   • Было в БД: ${existingCount}
   • Стало в БД: ${finalCount}
   • Реально добавлено: ${finalCount - existingCount}

📂 Итоговые категории в БД:`)
		
		finalCategoryStats.slice(0, 10).forEach((stat, index) => {
			console.log(`${index + 1}. ${stat.categoryName}: ${stat._count.id} мест`)
		})
		
	} catch (error) {
		console.error('❌ Критическая ошибка при импорте:', error)
		throw error
	}
}

async function main() {
	try {
		await importTransformedPlaces()
	} catch (error) {
		console.error('❌ Ошибка выполнения импорта:', error)
		process.exit(1)
	} finally {
		await prisma.$disconnect()
	}
}

// Запускаем только если файл вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { importTransformedPlaces } 