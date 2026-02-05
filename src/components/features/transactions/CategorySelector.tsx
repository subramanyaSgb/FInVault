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
  { id: 'food', name: 'Food', icon: <Utensils className="w-6 h-6" />, color: '#EF4444', subcategories: ['Food & Dining', 'Groceries', 'Beverages', 'Snacks'] },
  { id: 'shopping', name: 'Shopping', icon: <ShoppingBag className="w-6 h-6" />, color: '#F59E0B', subcategories: ['Clothing', 'Electronics', 'Accessories', 'Online Shopping'] },
  { id: 'transportation', name: 'Transport', icon: <Car className="w-6 h-6" />, color: '#3B82F6', subcategories: ['Fuel', 'Public Transport', 'Ride Sharing', 'Maintenance'] },
  { id: 'utilities', name: 'Utilities', icon: <Zap className="w-6 h-6" />, color: '#FBBF24', subcategories: ['Electricity', 'Water', 'Gas', 'Mobile & Internet'] },
  { id: 'entertainment', name: 'Entertainment', icon: <Film className="w-6 h-6" />, color: '#8B5CF6', subcategories: ['Movies', 'Streaming', 'Gaming', 'Events'] },
  { id: 'health', name: 'Health', icon: <Heart className="w-6 h-6" />, color: '#EC4899', subcategories: ['Medical', 'Pharmacy', 'Fitness', 'Insurance'] },
  { id: 'education', name: 'Education', icon: <GraduationCap className="w-6 h-6" />, color: '#10B981', subcategories: ['Tuition', 'Books', 'Courses', 'Supplies'] },
  { id: 'home', name: 'Home', icon: <Home className="w-6 h-6" />, color: '#6366F1', subcategories: ['Rent', 'Maintenance', 'Furniture', 'Decor'] },
  { id: 'personal', name: 'Personal', icon: <Sparkles className="w-6 h-6" />, color: '#14B8A6', subcategories: ['Salon & Spa', 'Grooming', 'Personal Care'] },
  { id: 'gifts', name: 'Gifts', icon: <Gift className="w-6 h-6" />, color: '#F472B6', subcategories: ['Gifts', 'Charity', 'Donations'] },
];

const DEFAULT_INCOME_CATEGORIES: DisplayCategory[] = [
  { id: 'salary', name: 'Salary', icon: <Wallet className="w-6 h-6" />, color: '#22C55E', subcategories: ['Monthly Salary', 'Bonus', 'Commission'] },
  { id: 'freelance', name: 'Freelance', icon: <TrendingUp className="w-6 h-6" />, color: '#3B82F6', subcategories: ['Consulting', 'Projects', 'Services'] },
  { id: 'investment', name: 'Investment', icon: <TrendingUp className="w-6 h-6" />, color: '#8B5CF6', subcategories: ['Dividend', 'Interest', 'Capital Gains'] },
  { id: 'refund', name: 'Refund', icon: <ArrowLeftRight className="w-6 h-6" />, color: '#F59E0B', subcategories: ['Cashback', 'Reward', 'Reimbursement'] },
];

const DEFAULT_TRANSFER_CATEGORIES: DisplayCategory[] = [
  { id: 'transfer', name: 'Transfer', icon: <ArrowLeftRight className="w-6 h-6" />, color: '#6B7280', subcategories: ['Bank Transfer', 'UPI', 'IMPS', 'NEFT'] },
];

function renderIcon(iconName: string): React.ReactNode {
  const IconComponent = ICON_MAP[iconName] || Sparkles;
  return <IconComponent className="w-6 h-6" />;
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
        // No subcategories, select directly
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

  return (
    <div className="flex flex-col h-full bg-bg-secondary rounded-card">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-bg-tertiary">
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeftRight className="w-5 h-5 rotate-180" />
          </motion.button>
        )}

        <h2 className="text-h3 text-text-primary flex-1">
          {selectedCat ? 'Select Subcategory' : 'Select Category'}
        </h2>

        {onClose && !selectedCat && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Search */}
      {!selectedCat && (
        <div className="p-4 border-b border-bg-tertiary">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-3 bg-bg-tertiary rounded-button text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
              className="space-y-3"
            >
              {/* Selected Category Header */}
              <div className="flex items-center gap-3 p-4 bg-accent-alpha rounded-card mb-4">
                <div
                  className="w-12 h-12 rounded-button flex items-center justify-center"
                  style={{ backgroundColor: currentCategory.color + '20', color: currentCategory.color }}
                >
                  {currentCategory.icon}
                </div>
                <div>
                  <h3 className="text-h4 text-text-primary">{currentCategory.name}</h3>
                  <p className="text-caption text-text-secondary">Select a subcategory</p>
                </div>
              </div>

              {/* Subcategories */}
              {currentCategory.subcategories.map((sub) => (
                <motion.button
                  key={sub}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubcategorySelect(sub)}
                  className={`w-full flex items-center justify-between p-4 rounded-card transition-colors ${
                    selectedSubcategory === sub
                      ? 'bg-accent-primary text-bg-primary'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <span className="text-body font-medium">{sub}</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {filteredCategories.map((category) => (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-card transition-all ${
                    selectedCategory === category.name
                      ? 'bg-accent-primary text-bg-primary'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-button flex items-center justify-center transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-white/20'
                        : ''
                    }`}
                    style={
                      selectedCategory !== category.name
                        ? { backgroundColor: category.color + '20', color: category.color }
                        : {}
                    }
                  >
                    {category.icon}
                  </div>
                  <span className="text-body-sm font-medium text-center">{category.name}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CategorySelector;
