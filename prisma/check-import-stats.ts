import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImportStats() {
	console.log('📊 Проверяю статистику импортированных данных...\n')
	
	try {
		// Общая статистика
		const totalPlaces = await prisma.place.count()
		console.log(`🏛️  Всего мест в БД: ${totalPlaces}`)
		
		// Статистика по категориям
		console.log('\n📂 Топ-10 категорий:')
		const categoryStats = await prisma.place.groupBy({
			by: ['categoryName'],
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } },
			take: 10
		})
		
		categoryStats.forEach((stat, index) => {
			console.log(`${index + 1}. ${stat.categoryName}: ${stat._count.id} мест`)
		})
		
		// Статистика по городам
		console.log('\n🏙️  Топ-10 городов:')
		const cityStats = await prisma.place.groupBy({
			by: ['city'],
			where: { city: { not: null } },
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } },
			take: 10
		})
		
		cityStats.forEach((stat, index) => {
			console.log(`${index + 1}. ${stat.city}: ${stat._count.id} мест`)
		})
		
		// Места без города
		const noCity = await prisma.place.count({
			where: { city: null }
		})
		console.log(`\n🌍 Мест без указания города: ${noCity}`)
		
		// Статистика по состоянию (state)
		console.log('\n📍 По регионам:')
		const stateStats = await prisma.place.groupBy({
			by: ['state'],
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } }
		})
		
		stateStats.forEach((stat, index) => {
			console.log(`${index + 1}. ${stat.state}: ${stat._count.id} мест`)
		})
		
		// Места с изображениями
		const withImages = await prisma.place.count({
			where: { imageUrl: { not: null } }
		})
		console.log(`\n🖼️  Мест с изображениями: ${withImages} (${((withImages / totalPlaces) * 100).toFixed(1)}%)`)
		
		// Места с описанием
		const withDescription = await prisma.place.count({
			where: { description: { not: null } }
		})
		console.log(`📝 Мест с описанием: ${withDescription} (${((withDescription / totalPlaces) * 100).toFixed(1)}%)`)
		
		// Места с рейтингом
		const withRating = await prisma.place.count({
			where: { totalScore: { not: null } }
		})
		console.log(`⭐ Мест с рейтингом: ${withRating} (${((withRating / totalPlaces) * 100).toFixed(1)}%)`)
		
		// Временно закрытые места
		const temporarilyClosed = await prisma.place.count({
			where: { temporarilyClosed: true }
		})
		console.log(`🚫 Временно закрытых мест: ${temporarilyClosed}`)
		
		// Последние добавленные места
		console.log('\n🕒 Последние 5 добавленных мест:')
		const recentPlaces = await prisma.place.findMany({
			take: 5,
			orderBy: { createdAt: 'desc' },
			select: {
				title: true,
				city: true,
				categoryName: true,
				createdAt: true
			}
		})
		
		recentPlaces.forEach((place, index) => {
			const date = place.createdAt.toLocaleDateString('ru-RU')
			const time = place.createdAt.toLocaleTimeString('ru-RU')
			console.log(`${index + 1}. "${place.title}" (${place.city || 'без города'}) - ${place.categoryName} [${date} ${time}]`)
		})
		
		// Географический разброс
		console.log('\n🗺️  Географический разброс:')
		const geoStats = await prisma.place.aggregate({
			_min: { lat: true, lng: true },
			_max: { lat: true, lng: true },
			_avg: { lat: true, lng: true }
		})
		
		console.log(`   Широта: ${geoStats._min.lat?.toFixed(4)} — ${geoStats._max.lat?.toFixed(4)} (центр: ${geoStats._avg.lat?.toFixed(4)})`)
		console.log(`   Долгота: ${geoStats._min.lng?.toFixed(4)} — ${geoStats._max.lng?.toFixed(4)} (центр: ${geoStats._avg.lng?.toFixed(4)})`)
		
		console.log('\n✅ Статистика собрана успешно!')
		
	} catch (error) {
		console.error('❌ Ошибка при сборе статистики:', error)
		throw error
	}
}

async function main() {
	try {
		await checkImportStats()
	} catch (error) {
		console.error('❌ Ошибка выполнения:', error)
		process.exit(1)
	} finally {
		await prisma.$disconnect()
	}
}

// Запускаем только если файл вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { checkImportStats } 