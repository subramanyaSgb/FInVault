import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Category, CategoryType } from '@/types'

// Default categories that come with the app
const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[] = [
  { type: 'expense', name: 'Food', icon: 'utensils', color: '#EF4444', subcategories: ['Food & Dining', 'Groceries', 'Beverages', 'Snacks'], isDefault: true, isActive: true, order: 0 },
  { type: 'expense', name: 'Shopping', icon: 'shopping-bag', color: '#F59E0B', subcategories: ['Clothing', 'Electronics', 'Accessories', 'Online Shopping'], isDefault: true, isActive: true, order: 1 },
  { type: 'expense', name: 'Transport', icon: 'car', color: '#3B82F6', subcategories: ['Fuel', 'Public Transport', 'Ride Sharing', 'Maintenance'], isDefault: true, isActive: true, order: 2 },
  { type: 'expense', name: 'Utilities', icon: 'zap', color: '#FBBF24', subcategories: ['Electricity', 'Water', 'Gas', 'Mobile & Internet'], isDefault: true, isActive: true, order: 3 },
  { type: 'expense', name: 'Entertainment', icon: 'film', color: '#8B5CF6', subcategories: ['Movies', 'Streaming', 'Gaming', 'Events'], isDefault: true, isActive: true, order: 4 },
  { type: 'expense', name: 'Health', icon: 'heart', color: '#EC4899', subcategories: ['Medical', 'Pharmacy', 'Fitness', 'Insurance'], isDefault: true, isActive: true, order: 5 },
  { type: 'expense', name: 'Education', icon: 'graduation-cap', color: '#10B981', subcategories: ['Tuition', 'Books', 'Courses', 'Supplies'], isDefault: true, isActive: true, order: 6 },
  { type: 'expense', name: 'Home', icon: 'home', color: '#6366F1', subcategories: ['Rent', 'Maintenance', 'Furniture', 'Decor'], isDefault: true, isActive: true, order: 7 },
  { type: 'expense', name: 'Personal', icon: 'sparkles', color: '#14B8A6', subcategories: ['Salon & Spa', 'Grooming', 'Personal Care'], isDefault: true, isActive: true, order: 8 },
  { type: 'expense', name: 'Gifts', icon: 'gift', color: '#F472B6', subcategories: ['Gifts', 'Charity', 'Donations'], isDefault: true, isActive: true, order: 9 },
]

const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[] = [
  { type: 'income', name: 'Salary', icon: 'wallet', color: '#22C55E', subcategories: ['Monthly Salary', 'Bonus', 'Commission'], isDefault: true, isActive: true, order: 0 },
  { type: 'income', name: 'Freelance', icon: 'trending-up', color: '#3B82F6', subcategories: ['Consulting', 'Projects', 'Services'], isDefault: true, isActive: true, order: 1 },
  { type: 'income', name: 'Investment', icon: 'bar-chart', color: '#8B5CF6', subcategories: ['Dividend', 'Interest', 'Capital Gains'], isDefault: true, isActive: true, order: 2 },
  { type: 'income', name: 'Refund', icon: 'arrow-left-right', color: '#F59E0B', subcategories: ['Cashback', 'Reward', 'Reimbursement'], isDefault: true, isActive: true, order: 3 },
]

const DEFAULT_TRANSFER_CATEGORIES: Omit<Category, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[] = [
  { type: 'transfer', name: 'Transfer', icon: 'arrow-left-right', color: '#6B7280', subcategories: ['Bank Transfer', 'UPI', 'IMPS', 'NEFT'], isDefault: true, isActive: true, order: 0 },
]

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  error: string | null

  // Actions
  loadCategories: (profileId: string) => Promise<void>
  initializeDefaultCategories: (profileId: string) => Promise<void>
  createCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Category>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  addSubcategory: (categoryId: string, subcategory: string) => Promise<void>
  removeSubcategory: (categoryId: string, subcategory: string) => Promise<void>
  reorderCategories: (profileId: string, type: CategoryType, orderedIds: string[]) => Promise<void>

  // Getters
  getCategoriesByType: (type: CategoryType) => Category[]
  getCategoryByName: (name: string, type: CategoryType) => Category | undefined
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  loadCategories: async (profileId: string) => {
    set({ isLoading: true, error: null })
    try {
      const categories = await db.categories
        .where('profileId')
        .equals(profileId)
        .and(c => c.isActive)
        .sortBy('order')

      // If no categories exist, initialize defaults
      if (categories.length === 0) {
        await get().initializeDefaultCategories(profileId)
        return
      }

      set({ categories, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  initializeDefaultCategories: async (profileId: string) => {
    try {
      const now = new Date()
      const allDefaults = [
        ...DEFAULT_EXPENSE_CATEGORIES,
        ...DEFAULT_INCOME_CATEGORIES,
        ...DEFAULT_TRANSFER_CATEGORIES,
      ]

      const categoriesToAdd: Category[] = allDefaults.map((cat, index) => ({
        ...cat,
        id: `cat_${cat.type}_${index}_${Date.now()}`,
        profileId,
        createdAt: now,
        updatedAt: now,
      }))

      await db.categories.bulkAdd(categoriesToAdd)
      set({ categories: categoriesToAdd, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createCategory: async (category) => {
    try {
      const now = new Date()
      const newCategory: Category = {
        ...category,
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      }

      await db.categories.add(newCategory)
      set(state => ({ categories: [...state.categories, newCategory] }))
      return newCategory
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    try {
      await db.categories.update(id, { ...updates, updatedAt: new Date() })
      set(state => ({
        categories: state.categories.map(cat =>
          cat.id === id ? { ...cat, ...updates, updatedAt: new Date() } : cat
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  deleteCategory: async (id: string) => {
    try {
      const category = get().categories.find(c => c.id === id)
      if (category?.isDefault) {
        // Don't delete default categories, just mark as inactive
        await db.categories.update(id, { isActive: false, updatedAt: new Date() })
        set(state => ({
          categories: state.categories.filter(cat => cat.id !== id),
        }))
      } else {
        await db.categories.delete(id)
        set(state => ({
          categories: state.categories.filter(cat => cat.id !== id),
        }))
      }
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  addSubcategory: async (categoryId: string, subcategory: string) => {
    try {
      const category = get().categories.find(c => c.id === categoryId)
      if (!category) throw new Error('Category not found')

      const updatedSubcategories = [...category.subcategories, subcategory]
      await db.categories.update(categoryId, {
        subcategories: updatedSubcategories,
        updatedAt: new Date(),
      })

      set(state => ({
        categories: state.categories.map(cat =>
          cat.id === categoryId
            ? { ...cat, subcategories: updatedSubcategories, updatedAt: new Date() }
            : cat
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  removeSubcategory: async (categoryId: string, subcategory: string) => {
    try {
      const category = get().categories.find(c => c.id === categoryId)
      if (!category) throw new Error('Category not found')

      const updatedSubcategories = category.subcategories.filter(s => s !== subcategory)
      await db.categories.update(categoryId, {
        subcategories: updatedSubcategories,
        updatedAt: new Date(),
      })

      set(state => ({
        categories: state.categories.map(cat =>
          cat.id === categoryId
            ? { ...cat, subcategories: updatedSubcategories, updatedAt: new Date() }
            : cat
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  reorderCategories: async (_profileId: string, _type: CategoryType, orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        order: index,
        updatedAt: new Date(),
      }))

      await Promise.all(
        updates.map(u => db.categories.update(u.id, { order: u.order, updatedAt: u.updatedAt }))
      )

      set(state => ({
        categories: state.categories.map(cat => {
          const update = updates.find(u => u.id === cat.id)
          return update ? { ...cat, order: update.order, updatedAt: update.updatedAt } : cat
        }),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  getCategoriesByType: (type: CategoryType) => {
    return get()
      .categories.filter(c => c.type === type && c.isActive)
      .sort((a, b) => a.order - b.order)
  },

  getCategoryByName: (name: string, type: CategoryType) => {
    return get().categories.find(c => c.name === name && c.type === type && c.isActive)
  },
}))
