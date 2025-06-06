import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CategoryData {
  name: string
  icon: string
  subcategories: string[]
  order: number
}

const categories: CategoryData[] = [
  {
    name: 'Природа',
    icon: 'nature.svg',
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
    icon: 'history.svg',
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
    icon: 'museum.svg',
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
    icon: 'parks.svg',
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
    icon: 'entertainment.svg',
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
    icon: 'sport.svg',
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
    icon: 'religion.svg',
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
    icon: 'accommodation.svg',
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
    icon: 'transport.svg',
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
    icon: 'market.svg',
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
    icon: 'other.svg',
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
        icon: category.icon,
        order: category.order
      },
      create: {
        name: category.name,
        subcategories: category.subcategories,
        icon: category.icon,
        order: category.order
      }
    })
    console.log(`✅ Категория "${category.name}" создана/обновлена с иконкой ${category.icon}`)
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