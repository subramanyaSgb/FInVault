'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Film,
  Heart,
  GraduationCap,
  Home,
  Sparkles,
  Gift,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  Plane,
  Phone,
  Dumbbell,
  Baby,
  PawPrint,
  Gamepad2,
  Music,
  Camera,
  Book,
  Coffee,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Category, CategoryType } from '@/types'

// Icon mapping for rendering
const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  car: Car,
  zap: Zap,
  film: Film,
  heart: Heart,
  'graduation-cap': GraduationCap,
  home: Home,
  sparkles: Sparkles,
  gift: Gift,
  wallet: Wallet,
  'trending-up': TrendingUp,
  'arrow-left-right': ArrowLeftRight,
  'bar-chart': BarChart3,
  briefcase: Briefcase,
  plane: Plane,
  phone: Phone,
  dumbbell: Dumbbell,
  baby: Baby,
  'paw-print': PawPrint,
  gamepad: Gamepad2,
  music: Music,
  camera: Camera,
  book: Book,
  coffee: Coffee,
}

const AVAILABLE_ICONS = Object.keys(ICON_MAP)

const AVAILABLE_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#FBBF24',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F472B6',
  '#6B7280',
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3 } },
}

interface CategoryFormData {
  name: string
  icon: string
  color: string
  subcategories: string[]
}

export default function CategoriesPage() {
  const { currentProfile } = useAuthStore()
  const {
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    removeSubcategory,
    getCategoriesByType,
  } = useCategoryStore()

  const [activeTab, setActiveTab] = useState<CategoryType>('expense')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon: 'sparkles',
    color: '#3B82F6',
    subcategories: [],
  })
  const [newSubcategory, setNewSubcategory] = useState('')

  useEffect(() => {
    if (currentProfile) {
      loadCategories(currentProfile.id)
    }
  }, [currentProfile, loadCategories])

  const displayCategories = getCategoriesByType(activeTab)

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'sparkles',
      color: '#3B82F6',
      subcategories: [],
    })
    setEditingCategory(null)
    setNewSubcategory('')
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        subcategories: [...category.subcategories],
      })
    } else {
      resetForm()
    }
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    resetForm()
  }

  const handleAddSubcategoryToForm = () => {
    if (newSubcategory.trim() && !formData.subcategories.includes(newSubcategory.trim())) {
      setFormData({
        ...formData,
        subcategories: [...formData.subcategories, newSubcategory.trim()],
      })
      setNewSubcategory('')
    }
  }

  const handleRemoveSubcategoryFromForm = (sub: string) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter(s => s !== sub),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile || !formData.name.trim()) return

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          subcategories: formData.subcategories,
        })
      } else {
        const maxOrder = displayCategories.reduce((max, c) => Math.max(max, c.order), -1)
        await createCategory({
          profileId: currentProfile.id,
          type: activeTab,
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          subcategories: formData.subcategories,
          isDefault: false,
          isActive: true,
          order: maxOrder + 1,
        })
      }
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save category:', error)
    }
  }

  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      if (
        !confirm('This is a default category. It will be hidden but can be restored. Continue?')
      ) {
        return
      }
    } else {
      if (!confirm('Delete this category? This cannot be undone.')) {
        return
      }
    }
    await deleteCategory(category.id)
  }

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = ICON_MAP[iconName] || Sparkles
    return <IconComponent className={className || 'w-5 h-5'} />
  }

  const getTabColors = (type: CategoryType) => {
    if (type === 'expense')
      return {
        active:
          'from-error/20 via-error/10 to-transparent border-error/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        text: 'text-error',
      }
    if (type === 'income')
      return {
        active:
          'from-success/20 via-success/10 to-transparent border-success/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
        text: 'text-success',
      }
    return {
      active:
        'from-accent/20 via-accent/10 to-transparent border-accent/50 shadow-[0_0_15px_rgba(201,165,92,0.15)]',
      text: 'text-accent',
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20 relative z-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-accent font-medium tracking-wide uppercase">Settings</p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">Categories</h1>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleOpenModal()}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Plus className="w-5 h-5 text-accent" />
          </motion.button>
        </div>

        {/* Premium Tabs */}
        <div className="flex gap-2 px-4 pb-4">
          {(['expense', 'income', 'transfer'] as CategoryType[]).map(type => {
            const colors = getTabColors(type)
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                  activeTab === type
                    ? `bg-gradient-to-br ${colors.active} ${colors.text}`
                    : 'border-border-subtle text-text-secondary hover:border-border-default bg-bg-secondary'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            )
          })}
        </div>
      </header>

      {/* Categories List */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-3"
      >
        {displayCategories.length === 0 ? (
          <motion.div variants={itemVariants} className="card-elevated p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-accent" />
            </div>
            <p className="text-text-primary font-semibold mb-1">No {activeTab} categories</p>
            <p className="text-sm text-text-tertiary mb-4">Add your first category</p>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
            >
              Add Category
            </button>
          </motion.div>
        ) : (
          displayCategories.map(category => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)] transition-all duration-300"
            >
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />

              {/* Category Header */}
              <div
                className="relative flex items-center justify-between p-4 cursor-pointer"
                onClick={() =>
                  setExpandedCategory(expandedCategory === category.id ? null : category.id)
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: category.color + '20',
                      borderColor: category.color + '40',
                      color: category.color,
                    }}
                  >
                    {renderIcon(category.icon, 'w-6 h-6')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{category.name}</h3>
                    <p className="text-xs text-text-tertiary">
                      {category.subcategories.length} subcategories
                      {category.isDefault && (
                        <span className="ml-2 px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px] border border-accent/20">
                          Default
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleOpenModal(category)
                    }}
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-text-secondary hover:text-accent" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(category)
                    }}
                    className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-text-secondary hover:text-error" />
                  </button>
                  <ChevronRight
                    className={`w-5 h-5 text-text-tertiary transition-transform duration-300 ${
                      expandedCategory === category.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Subcategories */}
              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border-subtle overflow-hidden"
                  >
                    <div className="p-4 space-y-2">
                      {category.subcategories.map((sub, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between py-2 px-3 bg-bg-tertiary/50 rounded-xl border border-border-subtle"
                        >
                          <span className="text-sm text-text-primary">{sub}</span>
                          <button
                            onClick={() => removeSubcategory(category.id, sub)}
                            className="p-1 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                      {/* Add Subcategory Inline */}
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="New subcategory"
                          value={newSubcategory}
                          onChange={e => setNewSubcategory(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (newSubcategory.trim()) {
                                addSubcategory(category.id, newSubcategory.trim())
                                setNewSubcategory('')
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-tertiary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                        />
                        <button
                          onClick={() => {
                            if (newSubcategory.trim()) {
                              addSubcategory(category.id, newSubcategory.trim())
                              setNewSubcategory('')
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary rounded-xl text-sm font-semibold shadow-[0_0_15px_rgba(201,165,92,0.2)] hover:shadow-[0_0_20px_rgba(201,165,92,0.3)] transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </motion.main>

      {/* Add/Edit Category Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="card-elevated p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative"
            >
              {/* Glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)',
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category Name */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Category Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="e.g., Pet Expenses"
                      required
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Icon</label>
                    <div className="grid grid-cols-5 gap-2">
                      {AVAILABLE_ICONS.map(iconName => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: iconName })}
                          className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                            formData.icon === iconName
                              ? 'border-accent bg-accent/10 shadow-[0_0_12px_rgba(201,169,98,0.25)]'
                              : 'border-border-subtle hover:border-accent/30 bg-bg-tertiary'
                          }`}
                          style={{
                            color: formData.icon === iconName ? formData.color : '#6B7280',
                          }}
                        >
                          {renderIcon(iconName)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-10 h-10 rounded-xl transition-all duration-300 ${
                            formData.color === color
                              ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary shadow-[0_0_12px_rgba(201,169,98,0.4)]'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Preview</label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border"
                        style={{
                          backgroundColor: formData.color + '20',
                          borderColor: formData.color + '40',
                          color: formData.color,
                        }}
                      >
                        {renderIcon(formData.icon, 'w-6 h-6')}
                      </div>
                      <span className="font-semibold text-text-primary">
                        {formData.name || 'Category Name'}
                      </span>
                    </div>
                  </div>

                  {/* Subcategories */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Subcategories</label>
                    <div className="space-y-2">
                      {formData.subcategories.map((sub, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 px-3 bg-bg-tertiary/50 rounded-xl border border-border-subtle"
                        >
                          <span className="text-sm text-text-primary">{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategoryFromForm(sub)}
                            className="p-1 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add subcategory"
                          value={newSubcategory}
                          onChange={e => setNewSubcategory(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddSubcategoryToForm()
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-tertiary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubcategoryToForm}
                          className="p-2 bg-bg-tertiary text-text-secondary rounded-xl hover:bg-accent/10 hover:text-accent transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
