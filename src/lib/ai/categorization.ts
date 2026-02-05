import type { TransactionType } from '@/types';
import { categorizeWithGemini } from './gemini';

interface CategorizationResult {
  category: string;
  subcategory: string | undefined;
  confidence: number;
  suggestedTags?: string[] | undefined;
}

interface CategoryRule {
  keywords: string[];
  category: string;
  subcategory: string | undefined;
  weight: number;
  type: TransactionType[] | undefined;
}

// Category definitions with keywords
const CATEGORY_RULES: CategoryRule[] = [
  // Food & Dining
  {
    keywords: ['swiggy', 'zomato', 'uber eats', 'foodpanda', 'dominos', 'pizza', 'burger', 'kfc', 'mcdonalds', 'starbucks', 'cafe', 'restaurant', 'dining', 'food'],
    category: 'Food',
    subcategory: 'Food & Dining',
    weight: 1.0,
    type: ['expense'],
  },
  {
    keywords: ['groceries', 'bigbasket', 'blinkit', 'zepto', 'instamart', 'grocery', 'supermarket', 'big bazaar', 'dmart', 'reliance fresh', 'more'],
    category: 'Food',
    subcategory: 'Groceries',
    weight: 1.0,
    type: ['expense'],
  },
  
  // Shopping
  {
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'shopping', 'e-commerce', 'online purchase'],
    category: 'Shopping',
    subcategory: 'Online Shopping',
    weight: 1.0,
    type: ['expense'],
  },
  {
    keywords: ['mall', 'store', 'retail', 'fashion', 'clothing', 'apparel', 'garments'],
    category: 'Shopping',
    subcategory: 'Retail',
    weight: 0.9,
    type: ['expense'],
  },
  
  // Transportation
  {
    keywords: ['uber', 'ola', 'rapido', 'auto', 'taxi', 'cab', 'ride', 'travel'],
    category: 'Transportation',
    subcategory: 'Ride Sharing',
    weight: 1.0,
    type: ['expense'],
  },
  {
    keywords: ['petrol', 'diesel', 'fuel', 'gas station', 'bp', 'shell', 'indian oil', 'hp'],
    category: 'Transportation',
    subcategory: 'Fuel',
    weight: 1.0,
    type: ['expense'],
  },
  {
    keywords: ['train', 'irctc', 'railway', 'bus', 'metro', 'ticket'],
    category: 'Transportation',
    subcategory: 'Public Transport',
    weight: 0.9,
    type: ['expense'],
  },
  
  // Utilities
  {
    keywords: ['electricity', 'water', 'gas', 'utility', 'bill', 'bills'],
    category: 'Utilities',
    subcategory: 'Bills',
    weight: 0.95,
    type: ['expense'],
  },
  {
    keywords: ['recharge', 'mobile', 'broadband', 'wifi', 'internet', 'airtel', 'jio', 'vi', 'vodafone'],
    category: 'Utilities',
    subcategory: 'Mobile & Internet',
    weight: 0.9,
    type: ['expense'],
  },
  
  // Entertainment
  {
    keywords: ['netflix', 'prime', 'hotstar', 'disney', 'sony liv', 'zee5', 'streaming', 'subscription', 'ott'],
    category: 'Entertainment',
    subcategory: 'Streaming',
    weight: 1.0,
    type: ['expense'],
  },
  {
    keywords: ['movie', 'cinema', 'theatre', 'pvr', 'inox', 'cinepolis', 'bookmyshow'],
    category: 'Entertainment',
    subcategory: 'Movies',
    weight: 0.95,
    type: ['expense'],
  },
  {
    keywords: ['game', 'gaming', 'playstation', 'xbox', 'steam', 'pubg', 'bgmi'],
    category: 'Entertainment',
    subcategory: 'Gaming',
    weight: 0.9,
    type: ['expense'],
  },
  
  // Health
  {
    keywords: ['hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'medicine', 'apollo', 'fortis', 'medanta'],
    category: 'Health',
    subcategory: 'Medical',
    weight: 1.0,
    type: ['expense'],
  },
  {
    keywords: ['pharmeasy', '1mg', 'netmeds', 'medplus', 'pharmacy'],
    category: 'Health',
    subcategory: 'Pharmacy',
    weight: 0.95,
    type: ['expense'],
  },
  {
    keywords: ['gym', 'fitness', 'yoga', 'sports', 'workout'],
    category: 'Health',
    subcategory: 'Fitness',
    weight: 0.9,
    type: ['expense'],
  },
  
  // Education
  {
    keywords: ['school', 'college', 'university', 'tuition', 'course', 'education', 'udemy', 'coursera', 'byju'],
    category: 'Education',
    subcategory: 'Learning',
    weight: 0.95,
    type: ['expense'],
  },
  {
    keywords: ['books', 'book', 'stationery', 'pen', 'notebook'],
    category: 'Education',
    subcategory: 'Books & Supplies',
    weight: 0.85,
    type: ['expense'],
  },
  
  // Home
  {
    keywords: ['rent', 'maintenance', 'society', 'housing', 'mortgage', 'emi'],
    category: 'Home',
    subcategory: 'Housing',
    weight: 0.95,
    type: ['expense'],
  },
  {
    keywords: ['furniture', 'decor', 'home', 'interior', 'ikea', 'pepperfry', 'urban ladder'],
    category: 'Home',
    subcategory: 'Furniture & Decor',
    weight: 0.9,
    type: ['expense'],
  },
  
  // Personal Care
  {
    keywords: ['salon', 'spa', 'haircut', 'beauty', 'personal care', 'grooming'],
    category: 'Personal Care',
    subcategory: 'Salon & Spa',
    weight: 0.9,
    type: ['expense'],
  },
  
  // Insurance
  {
    keywords: ['insurance', 'lic', 'policy', 'premium', 'health insurance', 'life insurance'],
    category: 'Insurance',
    subcategory: 'Premium',
    weight: 0.95,
    type: ['expense'],
  },
  
  // Investments
  {
    keywords: ['mutual fund', 'sip', 'investment', 'stock', 'shares', 'trading', 'demat', 'zerodha', 'groww', 'upstox'],
    category: 'Investments',
    subcategory: 'Investment',
    weight: 0.95,
    type: ['expense'],
  },
  
  // Income
  {
    keywords: ['salary', 'wage', 'payroll', 'income', 'remuneration'],
    category: 'Income',
    subcategory: 'Salary',
    weight: 1.0,
    type: ['income'],
  },
  {
    keywords: ['freelance', 'consulting', 'contract', 'project', 'payment received'],
    category: 'Income',
    subcategory: 'Freelance',
    weight: 0.9,
    type: ['income'],
  },
  {
    keywords: ['dividend', 'interest', 'return', 'profit', 'gain'],
    category: 'Income',
    subcategory: 'Investment Income',
    weight: 0.85,
    type: ['income'],
  },
  {
    keywords: ['refund', 'cashback', 'reward', 'reimbursement'],
    category: 'Income',
    subcategory: 'Refund',
    weight: 0.8,
    type: ['income'],
  },
  
  // Transfer
  {
    keywords: ['transfer', 'sent', 'received', 'upi', 'imps', 'neft', 'rtgs', 'bank transfer'],
    category: 'Transfer',
    subcategory: 'Bank Transfer',
    weight: 0.9,
    type: ['transfer'],
  },
  
  // Gifts & Donations
  {
    keywords: ['gift', 'donation', 'charity', 'ngo', 'help', 'contribution'],
    category: 'Gifts',
    subcategory: 'Gifts & Donations',
    weight: 0.85,
    type: ['expense'],
  },
];

// User learning data - stored locally
interface UserCorrection {
  description: string;
  category: string;
  subcategory: string | undefined;
  timestamp: Date;
}

class CategorizationEngine {
  private userCorrections: Map<string, UserCorrection> = new Map();
  private readonly STORAGE_KEY = 'finvault_categorization_learning';
  
  constructor() {
    this.loadLearningData();
  }
  
  private loadLearningData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.userCorrections = new Map(Object.entries(data));
      }
    } catch {
      // Ignore storage errors
    }
  }
  
  private saveLearningData() {
    try {
      const data = Object.fromEntries(this.userCorrections);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }
  
  categorize(description: string, _amount: number, type: TransactionType): CategorizationResult {
    const normalizedDesc = description.toLowerCase().trim();
    
    // Check user corrections first (highest priority)
    const userCorrection = this.userCorrections.get(normalizedDesc);
    if (userCorrection) {
      return {
        category: userCorrection.category,
        subcategory: userCorrection.subcategory,
        confidence: 1.0,
      };
    }
    
    // Score each category
    const scores: Map<string, { category: string; subcategory: string | undefined; score: number; matches: number }> = new Map();
    
    for (const rule of CATEGORY_RULES) {
      // Skip if type doesn't match
      if (rule.type && !rule.type.includes(type)) {
        continue;
      }
      
      let ruleScore = 0;
      let matches = 0;
      
      for (const keyword of rule.keywords) {
        if (normalizedDesc.includes(keyword.toLowerCase())) {
          ruleScore += rule.weight;
          matches++;
        }
      }
      
      if (matches > 0) {
        const key = `${rule.category}-${rule.subcategory || 'default'}`;
        const existing = scores.get(key);
        
        if (!existing || ruleScore > existing.score) {
          scores.set(key, {
            category: rule.category,
            subcategory: rule.subcategory,
            score: ruleScore,
            matches,
          });
        }
      }
    }
    
    // Find best match
    let bestMatch: { category: string; subcategory: string | undefined; score: number; matches: number } | null = null;
    
    for (const [, score] of scores) {
      if (!bestMatch || score.score > bestMatch.score) {
        bestMatch = score;
      }
    }
    
    if (bestMatch) {
      // Calculate confidence based on score and matches
      let confidence = Math.min(bestMatch.score / 2, 1.0);
      
      // Boost confidence for exact matches
      if (bestMatch.matches >= 2) {
        confidence = Math.min(confidence * 1.2, 1.0);
      }
      
      return {
        category: bestMatch.category,
        subcategory: bestMatch.subcategory,
        confidence: Math.round(confidence * 100) / 100,
      };
    }
    
    // Default categorization based on type
    if (type === 'income') {
      return { category: 'Income', subcategory: 'Other Income', confidence: 0.3 };
    } else if (type === 'transfer') {
      return { category: 'Transfer', subcategory: 'Other Transfer', confidence: 0.3 };
    } else {
      return { category: 'Uncategorized', subcategory: undefined, confidence: 0.0 };
    }
  }
  
  learn(description: string, category: string, subcategory: string | undefined) {
    const normalizedDesc = description.toLowerCase().trim();
    
    this.userCorrections.set(normalizedDesc, {
      description: normalizedDesc,
      category,
      subcategory,
      timestamp: new Date(),
    });
    
    this.saveLearningData();
  }
  
  getLearningStats() {
    return {
      totalCorrections: this.userCorrections.size,
      recentCorrections: Array.from(this.userCorrections.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
    };
  }
  
  clearLearning() {
    this.userCorrections.clear();
    this.saveLearningData();
  }
}

// Singleton instance
const categorizationEngine = new CategorizationEngine();

/**
 * Categorize a transaction based on description, amount, and type
 * Uses rule-based matching with keyword detection
 */
/**
 * Categorize transaction using local rules (fast, synchronous)
 */
export function categorizeTransaction(
  description: string,
  amount: number,
  type: TransactionType
): CategorizationResult {
  return categorizationEngine.categorize(description, amount, type);
}

/**
 * Categorize transaction using Gemini AI (async, more accurate)
 * Falls back to local categorization on error
 */
export async function categorizeTransactionWithAI(
  description: string,
  amount: number,
  type: TransactionType
): Promise<CategorizationResult> {
  try {
    const result = await categorizeWithGemini(description, amount, type);
    return {
      category: result.category,
      subcategory: result.subcategory,
      confidence: result.confidence,
      suggestedTags: result.suggestedTags
    };
  } catch (error) {
    console.warn('Gemini categorization failed, using local fallback:', error);
    return categorizationEngine.categorize(description, amount, type);
  }
}

/**
 * Learn from user correction to improve future categorizations
 */
export function learnFromCorrection(
  description: string,
  category: string,
  subcategory: string | undefined
): void {
  categorizationEngine.learn(description, category, subcategory);
}

/**
 * Get statistics about the learning data
 */
export function getCategorizationStats() {
  return categorizationEngine.getLearningStats();
}

/**
 * Clear all learned categorizations
 */
export function clearCategorizationLearning() {
  categorizationEngine.clearLearning();
}

/**
 * Batch categorize multiple transactions
 */
export function batchCategorize(
  transactions: Array<{ description: string; amount: number; type: TransactionType }>
): CategorizationResult[] {
  return transactions.map(tx => categorizeTransaction(tx.description, tx.amount, tx.type));
}

/**
 * Get all available categories with their subcategories
 */
export function getAvailableCategories(): Map<string, string[]> {
  const categories = new Map<string, string[]>();
  
  for (const rule of CATEGORY_RULES) {
    const existing = categories.get(rule.category) || [];
    if (rule.subcategory && !existing.includes(rule.subcategory)) {
      existing.push(rule.subcategory);
    }
    categories.set(rule.category, existing);
  }
  
  // Add default categories
  if (!categories.has('Income')) {
    categories.set('Income', ['Salary', 'Freelance', 'Investment Income', 'Other Income']);
  }
  if (!categories.has('Uncategorized')) {
    categories.set('Uncategorized', []);
  }
  
  return categories;
}

/**
 * Suggest categories for a given description
 * Returns top 3 suggestions with confidence scores
 */
export function suggestCategories(
  description: string,
  type: TransactionType
): CategorizationResult[] {
  const normalizedDesc = description.toLowerCase().trim();
  const scores: Array<{ category: string; subcategory: string | undefined; score: number }> = [];

  for (const rule of CATEGORY_RULES) {
    if (rule.type && !rule.type.includes(type)) {
      continue;
    }

    let ruleScore = 0;

    for (const keyword of rule.keywords) {
      if (normalizedDesc.includes(keyword.toLowerCase())) {
        ruleScore += rule.weight;
      }
    }

    if (ruleScore > 0) {
      scores.push({
        category: rule.category,
        subcategory: rule.subcategory,
        score: ruleScore,
      });
    }
  }

  // Sort by score and remove duplicates
  const uniqueScores = scores
    .sort((a, b) => b.score - a.score)
    .filter((item, index, self) =>
      index === self.findIndex(t => t.category === item.category && t.subcategory === item.subcategory)
    )
    .slice(0, 3);

  return uniqueScores.map(s => ({
    category: s.category,
    subcategory: s.subcategory,
    confidence: Math.min(s.score / 2, 1.0),
  }));
}

// ============================================
// AUTO-SUGGESTION FOR DESCRIPTIONS
// ============================================

export interface TransactionSuggestion {
  description: string;
  category: string;
  subcategory: string | undefined;
  frequency: number;
  lastUsed: Date;
  useCount?: number; // Alias for frequency for UI display
}

class AutoSuggestionEngine {
  private suggestions: Map<string, TransactionSuggestion> = new Map();
  private readonly STORAGE_KEY = 'finvault_description_suggestions';
  private readonly MAX_SUGGESTIONS = 100;

  constructor() {
    this.loadSuggestions();
  }

  private loadSuggestions() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.suggestions = new Map(
          Object.entries(data).map(([key, value]) => [
            key,
            { ...(value as TransactionSuggestion), lastUsed: new Date((value as TransactionSuggestion).lastUsed) },
          ])
        );
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveSuggestions() {
    try {
      const data = Object.fromEntries(this.suggestions);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Record a transaction for future suggestions
   */
  recordTransaction(description: string, category: string, subcategory?: string) {
    const normalizedDesc = description.trim();
    if (!normalizedDesc || normalizedDesc.length < 2) return;

    const key = normalizedDesc.toLowerCase();
    const existing = this.suggestions.get(key);

    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date();
      existing.category = category;
      existing.subcategory = subcategory;
    } else {
      this.suggestions.set(key, {
        description: normalizedDesc,
        category,
        subcategory,
        frequency: 1,
        lastUsed: new Date(),
      });
    }

    // Prune old suggestions if exceeding limit
    if (this.suggestions.size > this.MAX_SUGGESTIONS) {
      const sorted = Array.from(this.suggestions.entries())
        .sort((a, b) => {
          // Sort by frequency (desc) then by lastUsed (desc)
          if (b[1].frequency !== a[1].frequency) {
            return b[1].frequency - a[1].frequency;
          }
          return b[1].lastUsed.getTime() - a[1].lastUsed.getTime();
        })
        .slice(0, this.MAX_SUGGESTIONS);
      this.suggestions = new Map(sorted);
    }

    this.saveSuggestions();
  }

  /**
   * Get description suggestions based on partial input
   */
  getSuggestions(query: string, limit = 5): TransactionSuggestion[] {
    if (!query || query.length < 1) return [];

    const normalizedQuery = query.toLowerCase().trim();

    return Array.from(this.suggestions.values())
      .filter(s => s.description.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        // Prioritize starts-with matches
        const aStarts = a.description.toLowerCase().startsWith(normalizedQuery) ? 1 : 0;
        const bStarts = b.description.toLowerCase().startsWith(normalizedQuery) ? 1 : 0;
        if (bStarts !== aStarts) return bStarts - aStarts;

        // Then by frequency
        if (b.frequency !== a.frequency) return b.frequency - a.frequency;

        // Then by recency
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      })
      .slice(0, limit)
      .map(s => ({ ...s, useCount: s.frequency }));
  }

  /**
   * Get frequently used descriptions
   */
  getFrequentDescriptions(limit = 10): TransactionSuggestion[] {
    return Array.from(this.suggestions.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(s => ({ ...s, useCount: s.frequency }));
  }

  /**
   * Get recent descriptions
   */
  getRecentDescriptions(limit = 10): TransactionSuggestion[] {
    return Array.from(this.suggestions.values())
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, limit)
      .map(s => ({ ...s, useCount: s.frequency }));
  }

  /**
   * Clear all suggestions
   */
  clearSuggestions() {
    this.suggestions.clear();
    this.saveSuggestions();
  }
}

// Singleton instance
const autoSuggestionEngine = new AutoSuggestionEngine();

/**
 * Record a transaction for future auto-suggestions
 */
export function recordTransactionForSuggestions(
  description: string,
  category: string,
  subcategory?: string
): void {
  autoSuggestionEngine.recordTransaction(description, category, subcategory);
}

/**
 * Get auto-suggestions for a description input
 */
export function getDescriptionSuggestions(query: string, limit = 5): TransactionSuggestion[] {
  return autoSuggestionEngine.getSuggestions(query, limit);
}

/**
 * Get frequently used descriptions
 */
export function getFrequentDescriptions(limit = 10): TransactionSuggestion[] {
  return autoSuggestionEngine.getFrequentDescriptions(limit);
}

/**
 * Get recently used descriptions
 */
export function getRecentDescriptions(limit = 10): TransactionSuggestion[] {
  return autoSuggestionEngine.getRecentDescriptions(limit);
}

/**
 * Clear all auto-suggestion data
 */
export function clearAutoSuggestions(): void {
  autoSuggestionEngine.clearSuggestions();
}
