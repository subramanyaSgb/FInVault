import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Transaction, AIChatMessage } from '@/types'

interface MonthlyData {
  month: string
  income: number
  expenses: number
  savings: number
}

interface AIInsightsState {
  chatHistory: AIChatMessage[]
  isProcessing: boolean
  lastAnalyzed: Date | null

  // Chat
  sendMessage: (profileId: string, message: string) => Promise<void>
  loadChatHistory: (profileId: string) => Promise<void>
  clearHistory: (profileId: string) => Promise<void>

  // Insights
  getSpendingAnalysis: (profileId: string, month: number, year: number) => Promise<SpendingAnalysis>
  getAnomalies: (profileId: string, days: number) => Promise<Anomaly[]>
  getBudgetRecommendations: (profileId: string) => Promise<BudgetRecommendation[]>
  predictBills: (profileId: string) => Promise<PredictedBill[]>
  getMonthlyTrend: (profileId: string, months: number) => Promise<MonthlyData[]>
}

interface SpendingAnalysis {
  totalSpent: number
  totalIncome: number
  savingsRate: number
  topCategories: { category: string; amount: number; percentage: number }[]
  monthOverMonthChange: number
  unusualSpending: string[]
}

interface Anomaly {
  transaction: Transaction
  reason: string
  severity: 'low' | 'medium' | 'high'
}

interface BudgetRecommendation {
  category: string
  currentBudget: number
  recommendedBudget: number
  reason: string
}

interface PredictedBill {
  category: string
  estimatedAmount: number
  dueDate: Date
  confidence: number
}

export const useAIInsightsStore = create<AIInsightsState>()((set, get) => ({
  chatHistory: [],
  isProcessing: false,
  lastAnalyzed: null,

  sendMessage: async (profileId, message) => {
    set({ isProcessing: true })

    try {
      // Add user message
      const userMessage: AIChatMessage = {
        id: generateId(),
        profileId,
        role: 'user',
        content: message,
        timestamp: new Date(),
        isError: false,
        hasVisualization: false,
      }

      await db.aiChatMessages.add(userMessage)

      // Process query and generate response
      const response = await processQuery(profileId, message)

      const assistantMessage: AIChatMessage = {
        id: generateId(),
        profileId,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        isError: false,
        hasVisualization: false,
      }

      await db.aiChatMessages.add(assistantMessage)
      await get().loadChatHistory(profileId)
    } catch (error) {
      console.error('AI processing error:', error)

      const errorMessage: AIChatMessage = {
        id: generateId(),
        profileId,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        hasVisualization: false,
      }

      await db.aiChatMessages.add(errorMessage)
    } finally {
      set({ isProcessing: false })
    }
  },

  loadChatHistory: async profileId => {
    const history = await db.aiChatMessages
      .where('profileId')
      .equals(profileId)
      .reverse()
      .limit(50)
      .toArray()

    set({ chatHistory: history.reverse() })
  },

  clearHistory: async profileId => {
    await db.aiChatMessages.where('profileId').equals(profileId).delete()

    set({ chatHistory: [] })
  },

  getSpendingAnalysis: async (profileId, month, year) => {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    const transactions = await db.transactions
      .where('[profileId+date]')
      .between([profileId, startOfMonth], [profileId, endOfMonth])
      .toArray()

    const expenses = transactions.filter(tx => tx.type === 'expense')
    const income = transactions.filter(tx => tx.type === 'income')

    const totalSpent = expenses.reduce((sum, tx) => sum + tx.amount, 0)
    const totalIncome = income.reduce((sum, tx) => sum + tx.amount, 0)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0

    // Category breakdown
    const byCategory = expenses.reduce(
      (acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount
        return acc
      },
      {} as Record<string, number>
    )

    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      }))

    // Compare with previous month
    const prevStart = new Date(year, month - 1, 1)
    const prevEnd = new Date(year, month, 0, 23, 59, 59)

    const prevTransactions = await db.transactions
      .where('[profileId+date]')
      .between([profileId, prevStart], [profileId, prevEnd])
      .toArray()

    const prevSpent = prevTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const monthOverMonthChange = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0

    // Detect unusual spending (categories with >50% increase)
    const prevByCategory = prevTransactions
      .filter(tx => tx.type === 'expense')
      .reduce(
        (acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount
          return acc
        },
        {} as Record<string, number>
      )

    const unusualSpending = Object.entries(byCategory)
      .filter(([cat, amount]) => {
        const prevAmount = prevByCategory[cat] || 0
        return prevAmount > 0 && (amount - prevAmount) / prevAmount > 0.5
      })
      .map(([cat]) => cat)

    return {
      totalSpent,
      totalIncome,
      savingsRate,
      topCategories,
      monthOverMonthChange,
      unusualSpending,
    }
  },

  getAnomalies: async (profileId, days) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const transactions = await db.transactions
      .where('[profileId+date]')
      .between([profileId, cutoffDate], [profileId, new Date()])
      .and(tx => tx.type === 'expense')
      .toArray()

    const anomalies: Anomaly[] = []

    // Get average spending per category
    const allTransactions = await db.transactions
      .where('profileId')
      .equals(profileId)
      .and(tx => tx.type === 'expense')
      .toArray()

    const categoryStats = allTransactions.reduce(
      (acc, tx) => {
        const catStats = acc[tx.category] || { total: 0, count: 0, amounts: [] as number[] }
        catStats.total += tx.amount
        catStats.count++
        catStats.amounts.push(tx.amount)
        acc[tx.category] = catStats
        return acc
      },
      {} as Record<string, { total: number; count: number; amounts: number[] }>
    )

    // Calculate standard deviation for each category
    const categoryStdDev: Record<string, number> = {}
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      if (stats.count > 5) {
        const mean = stats.total / stats.count
        const variance =
          stats.amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / stats.count
        categoryStdDev[cat] = Math.sqrt(variance)
      }
    })

    // Detect anomalies (transactions > 2 std dev from mean)
    transactions.forEach(tx => {
      const stats = categoryStats[tx.category]
      if (stats && stats.count > 5) {
        const mean = stats.total / stats.count
        const stdDev = categoryStdDev[tx.category]

        if (stdDev && tx.amount > mean + 2 * stdDev) {
          anomalies.push({
            transaction: tx,
            reason: `Unusually high ${tx.category} expense (${((tx.amount / mean) * 100).toFixed(0)}% above average)`,
            severity: tx.amount > mean + 3 * stdDev ? 'high' : 'medium',
          })
        }
      }
    })

    // Detect duplicate transactions
    const duplicates = findDuplicates(transactions)
    duplicates.forEach(({ original, duplicate }) => {
      anomalies.push({
        transaction: duplicate,
        reason: `Possible duplicate of transaction from ${new Date(original.date).toLocaleDateString()}`,
        severity: 'low',
      })
    })

    return anomalies
  },

  getBudgetRecommendations: async profileId => {
    // Get last 6 months of spending
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await db.transactions
      .where('[profileId+date]')
      .between([profileId, sixMonthsAgo], [profileId, new Date()])
      .and(tx => tx.type === 'expense')
      .toArray()

    // Get current budgets
    const budgets = await db.budgets.where('profileId').equals(profileId).toArray()

    const recommendations: BudgetRecommendation[] = []

    // Calculate average monthly spending by category
    const spendingByCategory: Record<string, number[]> = {}
    transactions.forEach(tx => {
      if (!spendingByCategory[tx.category]) {
        spendingByCategory[tx.category] = []
      }
      const categorySpending = spendingByCategory[tx.category]
      if (!categorySpending) return
      const month = new Date(tx.date).getMonth()
      if (categorySpending[month] === undefined) {
        categorySpending[month] = 0
      }
      categorySpending[month] += tx.amount
    })

    Object.entries(spendingByCategory).forEach(([category, monthlySpending]) => {
      const avgSpending = monthlySpending.reduce((a, b) => a + b, 0) / monthlySpending.length
      const currentBudget = budgets.find(b => b.category === category)

      if (currentBudget) {
        // If consistently over budget
        const overBudgetMonths = monthlySpending.filter(
          amount => amount > currentBudget.amount
        ).length
        if (overBudgetMonths >= 4) {
          recommendations.push({
            category,
            currentBudget: currentBudget.amount,
            recommendedBudget: Math.ceil((avgSpending * 1.1) / 100) * 100,
            reason: `You've exceeded your ${category} budget in ${overBudgetMonths} of the last 6 months`,
          })
        }
      }
    })

    return recommendations
  },

  predictBills: async profileId => {
    // Get recurring transactions from last 3 months
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const transactions = await db.transactions
      .where('[profileId+date]')
      .between([profileId, threeMonthsAgo], [profileId, new Date()])
      .and(tx => tx.type === 'expense' && tx.isRecurring)
      .toArray()

    const predictions: PredictedBill[] = []

    // Group by category and predict next occurrence
    const byCategory = transactions.reduce(
      (acc, tx) => {
        if (!acc[tx.category]) {
          acc[tx.category] = []
        }
        const categoryTxs = acc[tx.category]
        if (categoryTxs) {
          categoryTxs.push(tx)
        }
        return acc
      },
      {} as Record<string, Transaction[]>
    )

    for (const [category, txs] of Object.entries(byCategory)) {
      if (txs.length >= 2) {
        // Calculate average interval
        const dates = txs.map(tx => new Date(tx.date).getTime()).sort((a, b) => a - b)
        const intervals: number[] = []
        for (let i = 1; i < dates.length; i++) {
          const current = dates[i]
          const previous = dates[i - 1]
          if (current !== undefined && previous !== undefined) {
            intervals.push(current - previous)
          }
        }
        if (intervals.length === 0) continue
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

        // Predict next date
        const lastTimestamp = dates[dates.length - 1]
        if (lastTimestamp === undefined) continue
        const lastDate = new Date(lastTimestamp)
        const nextDate = new Date(lastDate.getTime() + avgInterval)

        // Calculate average amount
        const avgAmount = txs.reduce((sum, tx) => sum + tx.amount, 0) / txs.length

        predictions.push({
          category,
          estimatedAmount: avgAmount,
          dueDate: nextDate,
          confidence: Math.min(0.95, txs.length / 6),
        })
      }
    }

    return predictions.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  },

  getMonthlyTrend: async (profileId, months) => {
    const result: MonthlyData[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const transactions = await db.transactions
        .where('[profileId+date]')
        .between([profileId, startOfMonth], [profileId, endOfMonth])
        .toArray()

      const income = transactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0)

      const expenses = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0)

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[date.getMonth()]

      result.push({
        month: monthName || date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses,
        savings: income - expenses,
      })
    }

    return result
  },
}))

async function processQuery(profileId: string, query: string): Promise<string> {
  const lowerQuery = query.toLowerCase()

  // Simple pattern matching for common queries
  if (lowerQuery.includes('spend') || lowerQuery.includes('spent')) {
    const now = new Date()
    const analysis = await useAIInsightsStore
      .getState()
      .getSpendingAnalysis(profileId, now.getMonth(), now.getFullYear())

    return (
      `This month, you've spent a total of ₹${analysis.totalSpent.toLocaleString()}. ` +
      `Your top spending categories are: ${analysis.topCategories
        .map(c => `${c.category} (₹${c.amount.toLocaleString()})`)
        .join(', ')}. ` +
      `Your savings rate is ${analysis.savingsRate.toFixed(1)}%.`
    )
  }

  if (lowerQuery.includes('anomal') || lowerQuery.includes('unusual')) {
    const anomalies = await useAIInsightsStore.getState().getAnomalies(profileId, 30)

    if (anomalies.length === 0) {
      return "I haven't detected any unusual transactions in the last 30 days. Your spending patterns look consistent!"
    }

    return (
      `I found ${anomalies.length} unusual transactions recently: ` +
      anomalies.map(a => `${a.transaction.description} - ${a.reason}`).join('; ')
    )
  }

  if (lowerQuery.includes('budget') || lowerQuery.includes('recommend')) {
    const recommendations = await useAIInsightsStore.getState().getBudgetRecommendations(profileId)

    if (recommendations.length === 0) {
      return "Your budgets look well-balanced! You're staying within your limits across all categories."
    }

    return (
      `I recommend adjusting these budgets: ` +
      recommendations
        .map(
          r =>
            `${r.category}: increase from ₹${r.currentBudget.toLocaleString()} to ₹${r.recommendedBudget.toLocaleString()} - ${r.reason}`
        )
        .join('; ')
    )
  }

  if (lowerQuery.includes('bill') || lowerQuery.includes('upcoming')) {
    const predictions = await useAIInsightsStore.getState().predictBills(profileId)

    if (predictions.length === 0) {
      return "I don't have enough data to predict your upcoming bills yet. Keep tracking your recurring expenses!"
    }

    return (
      `Here are your predicted upcoming bills: ` +
      predictions
        .slice(0, 5)
        .map(
          p =>
            `${p.category}: ₹${p.estimatedAmount.toLocaleString()} around ${p.dueDate.toLocaleDateString()}`
        )
        .join('; ')
    )
  }

  // Default response
  return "I'm here to help analyze your finances. You can ask me about your spending, budget recommendations, unusual transactions, or upcoming bills."
}

function findDuplicates(
  transactions: Transaction[]
): { original: Transaction; duplicate: Transaction }[] {
  const duplicates: { original: Transaction; duplicate: Transaction }[] = []

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i]
      const b = transactions[j]

      if (!a || !b) continue

      // Check if same amount, category, and within 1 day
      if (
        a.amount === b.amount &&
        a.category === b.category &&
        Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) < 24 * 60 * 60 * 1000
      ) {
        duplicates.push({ original: a, duplicate: b })
      }
    }
  }

  return duplicates
}

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
