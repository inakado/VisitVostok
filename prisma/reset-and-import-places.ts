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

async function resetAndImportPlaces() {
	console.log('🔥 ПОЛНАЯ ОЧИСТКА И ИМПОРТ ПРЕОБРАЗОВАННЫХ МЕСТ')
	console.log('⚠️  ВНИМАНИЕ: Все существующие места будут удалены!\n')
	
	try {
		// Читаем файл с преобразованными местами
		const filePath = path.join(process.cwd(), 'public', 'transformed_places.json')
		const fileContent = await fs.readFile(filePath, 'utf8')
		const transformedPlaces: TransformedPlace[] = JSON.parse(fileContent)
		
		console.log(`📊 Найдено ${transformedPlaces.length} преобразованных мест для импорта`)
		
		// Получаем текущее количество мест в БД
		const existingCount = await prisma.place.count()
		console.log(`📈 Текущих мест в БД: ${existingCount}`)
		
		// ШАГ 1: Полная очистка таблицы places
		console.log('\n🗑️  ШАГ 1: Очищаю таблицу places...')
		await prisma.place.deleteMany({})
		
		const afterDeleteCount = await prisma.place.count()
		console.log(`✅ Удалено ${existingCount} мест. Осталось: ${afterDeleteCount}`)
		
		// ШАГ 2: Импорт всех преобразованных мест
		console.log('\n📥 ШАГ 2: Импортирую все преобразованные места...')
		
		// Статистика по категориям
		const categoryStats = new Map<string, number>()
		const subcategoryStats = new Map<string, number>()
		
		for (const place of transformedPlaces) {
			categoryStats.set(place.categoryName, (categoryStats.get(place.categoryName) || 0) + 1)
			for (const subcategory of place.categories) {
				subcategoryStats.set(subcategory, (subcategoryStats.get(subcategory) || 0) + 1)
			}
		}
		
		console.log(`\n📂 Категории для импорта:`)
		Array.from(categoryStats.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.forEach(([category, count]) => {
				console.log(`   • ${category}: ${count} мест`)
			})
		
		// Батчевый импорт для эффективности
		const batchSize = 500
		let importedCount = 0
		let failedCount = 0
		
		for (let i = 0; i < transformedPlaces.length; i += batchSize) {
			const batch = transformedPlaces.slice(i, i + batchSize)
			
			console.log(`⏳ Импортирую батч ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedPlaces.length / batchSize)} (${batch.length} мест)...`)
			
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
				
				// Bulk создание
				const result = await prisma.place.createMany({
					data: placesToCreate,
					skipDuplicates: false // не нужно пропускать, так как БД пустая
				})
				
				importedCount += result.count
				
				// Показываем прогресс
				const progress = (((i + batch.length) / transformedPlaces.length) * 100).toFixed(1)
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
						failedCount++
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
🎉 ПОЛНАЯ ПЕРЕУСТАНОВКА ЗАВЕРШЕНА УСПЕШНО!
📈 Итоговая статистика:
   • Удалено старых мест: ${existingCount}
   • Мест для импорта: ${transformedPlaces.length}
   • Успешно импортировано: ${importedCount}
   • Ошибок импорта: ${failedCount}
   • Итого мест в БД: ${finalCount}
   • Уникальных категорий: ${categoryStats.size}
   • Уникальных подкатегорий: ${subcategoryStats.size}

📂 Итоговые категории в БД:`)
		
		finalCategoryStats.slice(0, 12).forEach((stat, index) => {
			console.log(`${index + 1}. ${stat.categoryName}: ${stat._count.id} мест`)
		})
		
		console.log(`\n✨ Все места теперь имеют правильные категории из маппинга!`)
		
	} catch (error) {
		console.error('❌ Критическая ошибка при переустановке:', error)
		throw error
	}
}

async function main() {
	try {
		await resetAndImportPlaces()
	} catch (error) {
		console.error('❌ Ошибка выполнения переустановки:', error)
		process.exit(1)
	} finally {
		await prisma.$disconnect()
	}
}

// Запускаем только если файл вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { resetAndImportPlaces } 