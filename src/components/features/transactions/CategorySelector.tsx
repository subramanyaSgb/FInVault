'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  TrendingUp,
  ArrowLeftRight,
  Wallet,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
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
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAuthStore } from '@/stores/authStore';

// Icon mapping for rendering stored categories
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
};

interface DisplayCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  subcategories: string[];
}

interface CategorySelectorProps {
  selectedCategory?: string;
  selectedSubcategory?: string | undefined;
  onSelect: (category: string, subcategory?: string) => void;
  type?: 'expense' | 'income' | 'transfer';
  onClose?: () => void;
  showBack?: boolean;
}

// Fallback default categories (used if store is empty)
const DEFAULT_EXPENSE_CATEGORIES: DisplayCategory[] = [
  { id: 'food', name: 'Food', icon: <Utensils className="w-5 h-5" />, color: '#EF4444', subcategories: ['Food & Dining', 'Groceries', 'Beverages', 'Snacks'] },
  { id: 'shopping', name: 'Shopping', icon: <ShoppingBag className="w-5 h-5" />, color: '#F59E0B', subcategories: ['Clothing', 'Electronics', 'Accessories', 'Online Shopping'] },
  { id: 'transportation', name: 'Transport', icon: <Car className="w-5 h-5" />, color: '#3B82F6', subcategories: ['Fuel', 'Public Transport', 'Ride Sharing', 'Maintenance'] },
  { id: 'utilities', name: 'Utilities', icon: <Zap className="w-5 h-5" />, color: '#FBBF24', subcategories: ['Electricity', 'Water', 'Gas', 'Mobile & Internet'] },
  { id: 'entertainment', name: 'Entertainment', icon: <Film className="w-5 h-5" />, color: '#8B5CF6', subcategories: ['Movies', 'Streaming', 'Gaming', 'Events'] },
  { id: 'health', name: 'Health', icon: <Heart className="w-5 h-5" />, color: '#EC4899', subcategories: ['Medical', 'Pharmacy', 'Fitness', 'Insurance'] },
  { id: 'education', name: 'Education', icon: <GraduationCap className="w-5 h-5" />, color: '#10B981', subcategories: ['Tuition', 'Books', 'Courses', 'Supplies'] },
  { id: 'home', name: 'Home', icon: <Home className="w-5 h-5" />, color: '#6366F1', subcategories: ['Rent', 'Maintenance', 'Furniture', 'Decor'] },
  { id: 'personal', name: 'Personal', icon: <Sparkles className="w-5 h-5" />, color: '#14B8A6', subcategories: ['Salon & Spa', 'Grooming', 'Personal Care'] },
  { id: 'gifts', name: 'Gifts', icon: <Gift className="w-5 h-5" />, color: '#F472B6', subcategories: ['Gifts', 'Charity', 'Donations'] },
  { id: 'travel', name: 'Travel', icon: <Plane className="w-5 h-5" />, color: '#0EA5E9', subcategories: ['Flights', 'Hotels', 'Vacation', 'Local Travel'] },
  { id: 'pets', name: 'Pets', icon: <PawPrint className="w-5 h-5" />, color: '#A855F7', subcategories: ['Pet Food', 'Vet', 'Grooming', 'Supplies'] },
];

const DEFAULT_INCOME_CATEGORIES: DisplayCategory[] = [
  { id: 'salary', name: 'Salary', icon: <Wallet className="w-5 h-5" />, color: '#22C55E', subcategories: ['Monthly Salary', 'Bonus', 'Commission'] },
  { id: 'freelance', name: 'Freelance', icon: <Briefcase className="w-5 h-5" />, color: '#3B82F6', subcategories: ['Consulting', 'Projects', 'Services'] },
  { id: 'investment', name: 'Investment', icon: <TrendingUp className="w-5 h-5" />, color: '#8B5CF6', subcategories: ['Dividend', 'Interest', 'Capital Gains'] },
  { id: 'refund', name: 'Refund', icon: <ArrowLeftRight className="w-5 h-5" />, color: '#F59E0B', subcategories: ['Cashback', 'Reward', 'Reimbursement'] },
  { id: 'rental', name: 'Rental', icon: <Home className="w-5 h-5" />, color: '#EC4899', subcategories: ['Property Rent', 'Equipment Rental'] },
  { id: 'other', name: 'Other', icon: <Sparkles className="w-5 h-5" />, color: '#6B7280', subcategories: ['Gift Received', 'Lottery', 'Other Income'] },
];

const DEFAULT_TRANSFER_CATEGORIES: DisplayCategory[] = [
  { id: 'transfer', name: 'Transfer', icon: <ArrowLeftRight className="w-5 h-5" />, color: '#6B7280', subcategories: ['Bank Transfer', 'UPI', 'IMPS', 'NEFT'] },
];

function renderIcon(iconName: string): React.ReactNode {
  const IconComponent = ICON_MAP[iconName] || Sparkles;
  return <IconComponent className="w-5 h-5" />;
}

export function CategorySelector({
  selectedCategory,
  selectedSubcategory,
  onSelect,
  type = 'expense',
  onClose,
  showBack = true,
}: CategorySelectorProps) {
  const { currentProfile } = useAuthStore();
  const { categories: storeCategories, loadCategories, getCategoriesByType } = useCategoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Load categories from store
  useEffect(() => {
    if (currentProfile) {
      loadCategories(currentProfile.id);
    }
  }, [currentProfile, loadCategories]);

  // Convert store categories to display format or use defaults
  const categories: DisplayCategory[] = useMemo(() => {
    const storedCategories = getCategoriesByType(type);

    if (storedCategories.length > 0) {
      return storedCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: renderIcon(cat.icon),
        color: cat.color,
        subcategories: cat.subcategories,
      }));
    }

    // Fall back to defaults if no stored categories
    switch (type) {
      case 'income':
        return DEFAULT_INCOME_CATEGORIES;
      case 'transfer':
        return DEFAULT_TRANSFER_CATEGORIES;
      default:
        return DEFAULT_EXPENSE_CATEGORIES;
    }
  }, [type, storeCategories, getCategoriesByType]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const query = searchQuery.toLowerCase();
    return categories.filter(
      cat =>
        cat.name.toLowerCase().includes(query) ||
        cat.subcategories.some(sub => sub.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  const currentCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCat || c.name === selectedCategory);
  }, [categories, selectedCat, selectedCategory]);

  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      if (category.subcategories.length === 0) {
        onSelect(category.name);
      } else if (category.subcategories.length === 1) {
        onSelect(category.name, category.subcategories[0]);
      } else {
        setSelectedCat(categoryId);
      }
    }
  };

  const handleSubcategorySelect = (subcategory: string) => {
    if (currentCategory) {
      onSelect(currentCategory.name, subcategory);
      setSelectedCat(null);
    }
  };

  const handleBack = () => {
    if (selectedCat) {
      setSelectedCat(null);
    } else if (onClose) {
      onClose();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-border-subtle">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(201, 165, 92, 0.08) 0%, transparent 60%)' }}
        />

        <div className="relative flex items-center gap-3 p-4">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-surface-1 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}

          <div className="flex-1">
            <p className="text-[10px] text-accent font-medium tracking-[0.15em] uppercase">
              {type === 'income' ? 'Income' : type === 'transfer' ? 'Transfer' : 'Expense'}
            </p>
            <h2 className="text-base font-semibold text-text-primary">
              {selectedCat ? 'Choose Subcategory' : 'Choose Category'}
            </h2>
          </div>

          {onClose && !selectedCat && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-surface-1 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-error hover:border-error/30 transition-all"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {!selectedCat && (
        <div className="p-4 border-b border-border-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {selectedCat && currentCategory ? (
            <motion.div
              key="subcategories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              {/* Selected Category Card */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-4 mb-4"
                style={{
                  background: `linear-gradient(135deg, ${currentCategory.color}15 0%, ${currentCategory.color}05 100%)`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `${currentCategory.color}30`
                }}
              >
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl"
                  style={{ backgroundColor: `${currentCategory.color}20` }}
                />
                <div className="relative flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border transition-transform hover:scale-105"
                    style={{
                      backgroundColor: `${currentCategory.color}20`,
                      borderColor: `${currentCategory.color}30`,
                      color: currentCategory.color
                    }}
                  >
                    {currentCategory.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">{currentCategory.name}</h3>
                    <p className="text-xs text-text-tertiary">{currentCategory.subcategories.length} subcategories</p>
                  </div>
                </div>
              </motion.div>

              {/* Subcategories List */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {currentCategory.subcategories.map((sub) => {
                  const isSelected = selectedSubcategory === sub;
                  return (
                    <motion.button
                      key={sub}
                      variants={itemVariants}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubcategorySelect(sub)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'border-accent/50 shadow-[0_0_20px_rgba(201,165,92,0.15)]'
                          : 'border-border-subtle hover:border-accent/30'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'rgba(201, 165, 92, 0.1)' : '#111111',
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    >
                      <span className={`text-sm font-medium ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                        {sub}
                      </span>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-bg-base" />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="categories"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-2"
            >
              {filteredCategories.map((category) => {
                const isSelected = selectedCategory === category.name;
                return (
                  <motion.button
                    key={category.id}
                    variants={itemVariants}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategorySelect(category.id)}
                    className="group relative overflow-hidden rounded-xl p-3 transition-all duration-200"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${category.color}20 0%, ${category.color}10 100%)`
                        : 'linear-gradient(135deg, #111111 0%, #171717 100%)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: isSelected ? `${category.color}50` : 'rgba(255,255,255,0.06)'
                    }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute -top-6 -right-6 w-14 h-14 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ backgroundColor: `${category.color}30` }}
                    />

                    <div className="relative flex flex-col items-center gap-2">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-110"
                        style={{
                          backgroundColor: `${category.color}15`,
                          borderColor: `${category.color}30`,
                          color: category.color
                        }}
                      >
                        {category.icon}
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight ${
                        isSelected ? 'text-accent' : 'text-text-primary'
                      }`}>
                        {category.name}
                      </span>

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-lg"
                        >
                          <Check className="w-3 h-3 text-bg-base" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {filteredCategories.length === 0 && !selectedCat && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border-subtle flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary">No categories found</p>
            <p className="text-xs text-text-muted mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategorySelector;
