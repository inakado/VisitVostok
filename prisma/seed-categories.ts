import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'Природа',
    subcategories: [
      'Водопады',
      'Пляжи', 
      'Горы',
      'Пещеры',
      'Озёра',
      'Реки',
      'Каньоны и скалы',
      'Заповедники и нац. парки',
      'Источники',
      'Панорамные виды'
    ],
    order: 1
  },
  {
    name: 'История и культура',
    subcategories: [
      'Архитектура',
      'Замки и крепости', 
      'Памятники и мемориалы',
      'Башни и смотровые',
      'Мосты',
      'Фонтаны',
      'Археология',
      'Скульптуры',
      'Площади'
    ],
    order: 2
  },
  {
    name: 'Музеи и выставки',
    subcategories: [
      'Исторические',
      'Военные',
      'Художественные',
      'Технические',
      'Природоведческие',
      'Дом-музеи',
      'Под открытым небом',
      'Планетарии/обсерватории',
      'Прочие музеи'
    ],
    order: 3
  },
  {
    name: 'Парки и животные',
    subcategories: [
      'Городские парки',
      'Зоопарки и аквариумы',
      'Ботанические сады',
      'Парк дикой природы',
      'Мемориальные парки'
    ],
    order: 4
  },
  {
    name: 'Развлечения и досуг',
    subcategories: [
      'Театры',
      'Кинотеатры',
      'Концертные',
      'Парки аттракционов',
      'Аквапарки',
      'Казино',
      'Ночная жизнь',
      'Цирки',
      'Детские центры'
    ],
    order: 5
  },
  {
    name: 'Спорт и активный отдых',
    subcategories: [
      'Горнолыжка и зимний спорт',
      'Водный спорт/дайвинг',
      'Фитнес/залы',
      'Стадионы',
      'Сауны и бани',
      'Приключенческие парки',
      'Альпинизм/треккинг',
      'Бассейны'
    ],
    order: 6
  },
  {
    name: 'Религия',
    subcategories: [
      'Православные храмы',
      'Соборы',
      'Монастыри',
      'Синагоги',
      'Прочие храмы'
    ],
    order: 7
  },
  {
    name: 'Проживание',
    subcategories: [
      'Отели/мотели',
      'Гостевые дома',
      'Кемпинги',
      'Хостелы',
      'Санатории'
    ],
    order: 8
  },
  {
    name: 'Транспорт и сервис',
    subcategories: [
      'Железнодорожный транспорт',
      'Автосервис',
      'АЗС и зарядки',
      'Прокат/каршеринг',
      'Пристани',
      'Банки/банкоматы',
      'Туристические инфоцентры',
      'Прочие сервисы'
    ],
    order: 9
  },
  {
    name: 'Покупки и рынки',
    subcategories: [
      'Магазины',
      'Торговые центры',
      'Рынки/ярмарки',
      'Винодельни',
      'Спецмагазины'
    ],
    order: 10
  },
  {
    name: 'Прочее',
    subcategories: [
      'Неклассифицированные'
    ],
    order: 11
  }
]

async function seedCategories() {
  console.log('🌱 Начинаем заполнение категорий...')

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        subcategories: category.subcategories,
        order: category.order
      },
      create: {
        name: category.name,
        subcategories: category.subcategories,
        order: category.order
      }
    })
    console.log(`✅ Категория "${category.name}" создана/обновлена`)
  }

  console.log('🎉 Заполнение категорий завершено!')
}

async function main() {
	try {
		await seedCategories()
	} catch (error) {
		console.error('❌ Ошибка при заполнении категорий:', error)
		throw error
	} finally {
		await prisma.$disconnect()
	}
}

// Запускаем только если файл вызван напрямую
main()

export { seedCategories } 