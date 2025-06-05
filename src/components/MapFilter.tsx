"use client"

import { useState } from "react"
import { Search, Filter, X, ChevronRight, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MapFilters, CategoryWithSubcategories, FilterTab } from "@/types"

interface MapFilterProps {
	filters: MapFilters
	onFiltersChange: (filters: MapFilters) => void
	categories: CategoryWithSubcategories[]
	totalPlaces: number
	onToggleCategoryExpansion: (categoryId: string) => void
	className?: string
}

export default function MapFilter({
	filters,
	onFiltersChange,
	categories,
	totalPlaces,
	onToggleCategoryExpansion,
	className = "",
}: MapFilterProps) {
	const [activeTab, setActiveTab] = useState<FilterTab>("catalog")
	const [isCollapsed, setIsCollapsed] = useState(false)

	const handleSearchChange = (value: string) => {
		onFiltersChange({
			...filters,
			searchQuery: value,
		})
	}

	const handleCategoryToggle = (categoryName: string, checked: boolean) => {
		const updatedCategories = checked
			? [...filters.selectedCategories, categoryName]
			: filters.selectedCategories.filter(c => c !== categoryName)

		onFiltersChange({
			...filters,
			selectedCategories: updatedCategories,
		})
	}

	const handleSubcategoryToggle = (subcategoryName: string, checked: boolean) => {
		const updatedSubcategories = checked
			? [...filters.selectedSubcategories, subcategoryName]
			: filters.selectedSubcategories.filter(s => s !== subcategoryName)

		onFiltersChange({
			...filters,
			selectedSubcategories: updatedSubcategories,
		})
	}

	const clearAllFilters = () => {
		onFiltersChange({
			searchQuery: "",
			selectedCategories: [],
			selectedSubcategories: [],
		})
	}

	const activeFiltersCount = [
		filters.searchQuery,
		...filters.selectedCategories,
		...filters.selectedSubcategories,
	].filter(Boolean).length

	// Компактная версия для мобильных
	if (isCollapsed) {
		return (
			<div className={`${className}`}>
				<Button
					onClick={() => setIsCollapsed(false)}
					variant="default"
					size="sm"
					className="bg-white text-gray-700 border shadow-md hover:bg-gray-50"
				>
					<Filter className="h-4 w-4 mr-2" />
					Фильтры
					{activeFiltersCount > 0 && (
						<Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
							{activeFiltersCount}
						</Badge>
					)}
				</Button>
			</div>
		)
	}

	return (
		<Card className={`w-full max-w-sm bg-white shadow-lg border-0 transition-all duration-300 ease-in-out ${className}`}>
			<CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
				<h3 className="text-sm font-semibold text-gray-900">Фильтры</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsCollapsed(true)}
					className="h-6 w-6 p-0 lg:hidden transition-colors duration-200"
				>
					<X className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent className="pt-0 space-y-4">
				{/* Поиск */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors duration-200" />
					<Input
						placeholder="Место, адрес..."
						value={filters.searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all duration-200 ease-in-out"
					/>
				</div>

				{/* Табы */}
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
					<TabsList className="grid w-full grid-cols-4 bg-gray-100">
						<TabsTrigger value="catalog" className="text-xs transition-all duration-200">Каталог</TabsTrigger>
						<TabsTrigger value="list" className="text-xs transition-all duration-200">Список</TabsTrigger>
						<TabsTrigger value="favorites" className="text-xs transition-all duration-200">Избранное</TabsTrigger>
						<TabsTrigger value="route" className="text-xs transition-all duration-200">Маршрут</TabsTrigger>
					</TabsList>

					<TabsContent value="catalog" className="mt-4">
						<div className="space-y-2">
							{/* Активные фильтры */}
							{activeFiltersCount > 0 && (
								<div className="flex items-center justify-between animate-in fade-in-50 duration-300">
									<Badge variant="secondary" className="text-xs transition-all duration-200">
										{activeFiltersCount} {activeFiltersCount === 1 ? 'фильтр' : 'фильтров'}
									</Badge>
									<Button
										variant="ghost"
										size="sm"
										onClick={clearAllFilters}
										className="text-xs h-6 px-2 transition-colors duration-200 hover:bg-gray-100"
									>
										Очистить
									</Button>
								</div>
							)}

							{/* Список категорий */}
							<ScrollArea className="h-[300px] pr-4">
								<div className="space-y-1">
									{categories.map((category) => (
										<Collapsible
											key={category.id}
											open={category.isExpanded}
										>
											<div className="space-y-1">
												{/* Основная категория */}
												<div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 ease-in-out">
													<div className="flex items-center space-x-2 flex-1">
														<Checkbox
															id={category.id}
															checked={filters.selectedCategories.includes(category.name)}
															onCheckedChange={(checked) => 
																handleCategoryToggle(category.name, checked as boolean)
															}
															className="transition-all duration-200"
														/>
														<label 
															htmlFor={category.id} 
															className="text-sm font-medium text-gray-700 flex-1 cursor-pointer transition-colors duration-200"
														>
															{category.name}
														</label>
														<Badge variant="outline" className="text-xs transition-all duration-200">
															{category.count}
														</Badge>
													</div>
													{category.subcategories.length > 0 && (
														<CollapsibleTrigger asChild>
															<Button 
																variant="ghost" 
																size="sm" 
																className="h-6 w-6 p-0 transition-all duration-200"
																onClick={() => onToggleCategoryExpansion(category.id)}
															>
																{category.isExpanded ? (
																	<ChevronDown className="h-3 w-3 transition-transform duration-200" />
																) : (
																	<ChevronRight className="h-3 w-3 transition-transform duration-200" />
																)}
															</Button>
														</CollapsibleTrigger>
													)}
												</div>

												{/* Подкатегории */}
												{category.subcategories.length > 0 && (
													<CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
														<div className="ml-6 space-y-1">
															{category.subcategories.map((subcategory) => (
																<div 
																	key={subcategory}
																	className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50 transition-all duration-200 ease-in-out"
																>
																	<Checkbox
																		id={`${category.id}-${subcategory}`}
																		checked={filters.selectedSubcategories.includes(subcategory)}
																		onCheckedChange={(checked) => 
																			handleSubcategoryToggle(subcategory, checked as boolean)
																		}
																		className="transition-all duration-200"
																	/>
																	<label 
																		htmlFor={`${category.id}-${subcategory}`}
																		className="text-xs text-gray-600 cursor-pointer transition-colors duration-200"
																	>
																		{subcategory}
																	</label>
																</div>
															))}
														</div>
													</CollapsibleContent>
												)}
											</div>
										</Collapsible>
									))}
								</div>
							</ScrollArea>
						</div>
					</TabsContent>

					<TabsContent value="list" className="mt-4">
						<div className="text-center text-gray-500 py-8 animate-in fade-in-50 duration-300">
							Список мест - в разработке
						</div>
					</TabsContent>

					<TabsContent value="favorites" className="mt-4">
						<div className="text-center text-gray-500 py-8 animate-in fade-in-50 duration-300">
							Избранное - в разработке
						</div>
					</TabsContent>

					<TabsContent value="route" className="mt-4">
						<div className="text-center text-gray-500 py-8 animate-in fade-in-50 duration-300">
							Маршруты - в разработке
						</div>
					</TabsContent>
				</Tabs>

				{/* Итого мест */}
				<div className="text-xs text-gray-500 text-center pt-2 border-t">
					Найдено мест: {totalPlaces}
				</div>
			</CardContent>
		</Card>
	)
} 