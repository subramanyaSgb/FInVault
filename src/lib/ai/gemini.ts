/**
 * Gemini AI Service for FinVault
 * Uses Google's Gemini Flash model for fast AI-powered features
 *
 * IMPORTANT: API key must be configured by the user in Settings > AI
 * Get your free API key at: https://aistudio.google.com/apikey
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// Runtime API key storage (set when user logs in with configured key)
let currentApiKey: string | null = null

/**
 * Set the Gemini API key at runtime
 * Called when user profile is loaded
 */
export function setGeminiApiKey(apiKey: string | undefined): void {
  currentApiKey = apiKey || null
}

/**
 * Check if Gemini AI is configured
 */
export function isGeminiConfigured(): boolean {
  return !!currentApiKey
}

/**
 * Get current API key (for debugging/status display)
 */
export function getGeminiKeyStatus(): { configured: boolean; masked: string | null } {
  if (!currentApiKey) {
    return { configured: false, masked: null }
  }
  // Return masked key for UI display (first 4 and last 4 chars)
  const masked = `${currentApiKey.slice(0, 4)}...${currentApiKey.slice(-4)}`
  return { configured: true, masked }
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
  error?: {
    message: string
  }
}

interface CategoryResult {
  category: string
  subcategory: string | undefined
  confidence: number
  suggestedTags?: string[]
}

interface ReceiptData {
  merchant: string
  amount: number
  date: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  category: string
  subcategory?: string
}

interface SpendingInsight {
  title: string
  description: string
  type: 'tip' | 'warning' | 'achievement' | 'suggestion'
  priority: number
}

interface BudgetRecommendation {
  category: string
  currentSpending: number
  recommendedBudget: number
  reason: string
}

/**
 * Make a request to the Gemini API
 * Requires API key to be configured via setGeminiApiKey()
 */
async function callGemini(prompt: string): Promise<string> {
  if (!currentApiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in Settings > AI.')
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${currentApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiResponse = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (error) {
    console.error('Gemini API call failed:', error)
    throw error
  }
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 */
function parseJsonResponse<T>(response: string): T | null {
  try {
    // Remove markdown code blocks if present
    let cleanJson = response.trim()
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7)
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3)
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3)
    }
    return JSON.parse(cleanJson.trim())
  } catch {
    console.error('Failed to parse Gemini JSON response:', response)
    return null
  }
}

// ============================================
// TRANSACTION CATEGORIZATION
// ============================================

/**
 * Categorize a transaction using Gemini AI
 */
export async function categorizeWithGemini(
  description: string,
  amount: number,
  type: 'expense' | 'income' | 'transfer'
): Promise<CategoryResult> {
  const prompt = `You are a financial transaction categorizer. Analyze this transaction and return the category.

Transaction:
- Description: "${description}"
- Amount: ${amount}
- Type: ${type}

Available expense categories with subcategories:
- Food: Food & Dining, Groceries, Beverages, Snacks
- Shopping: Clothing, Electronics, Accessories, Online Shopping
- Transportation: Fuel, Public Transport, Ride Sharing, Maintenance
- Utilities: Electricity, Water, Gas, Mobile & Internet
- Entertainment: Movies, Streaming, Gaming, Events
- Health: Medical, Pharmacy, Fitness, Insurance
- Education: Tuition, Books, Courses, Supplies
- Home: Rent, Maintenance, Furniture, Decor
- Personal: Salon & Spa, Grooming, Personal Care
- Gifts: Gifts, Charity, Donations

Available income categories:
- Salary: Monthly Salary, Bonus, Commission
- Freelance: Consulting, Projects, Services
- Investment: Dividend, Interest, Capital Gains
- Refund: Cashback, Reward, Reimbursement

Return ONLY valid JSON in this exact format:
{
  "category": "category name",
  "subcategory": "subcategory name or null",
  "confidence": 0.0 to 1.0,
  "suggestedTags": ["tag1", "tag2"]
}`

  try {
    const response = await callGemini(prompt)
    const result = parseJsonResponse<CategoryResult>(response)

    if (result) {
      return {
        category: result.category,
        subcategory: result.subcategory,
        confidence: Math.min(Math.max(result.confidence, 0), 1),
        suggestedTags: result.suggestedTags || []
      }
    }
  } catch (error) {
    console.error('Gemini categorization failed:', error)
  }

  // Fallback
  return {
    category: type === 'income' ? 'Salary' : 'Shopping',
    subcategory: undefined,
    confidence: 0.3,
    suggestedTags: []
  }
}

// ============================================
// RECEIPT SCANNING / OCR ANALYSIS
// ============================================

/**
 * Analyze receipt image data and extract transaction details
 */
export async function analyzeReceiptWithGemini(
  imageBase64: string
): Promise<ReceiptData | null> {
  const prompt = `Analyze this receipt image and extract the following information.

Return ONLY valid JSON in this exact format:
{
  "merchant": "store/restaurant name",
  "amount": total amount as number,
  "date": "YYYY-MM-DD format",
  "items": [
    {"name": "item name", "quantity": 1, "price": 10.00}
  ],
  "category": "most appropriate category",
  "subcategory": "most appropriate subcategory"
}

Categories: Food, Shopping, Transportation, Utilities, Entertainment, Health, Education, Home, Personal, Gifts

If you cannot extract any field, use reasonable defaults. For date, use today if not visible.`

  if (!currentApiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in Settings > AI.')
  }

  try {
    // For image analysis, we need to use multimodal endpoint
    const response = await fetch(`${GEMINI_API_URL}?key=${currentApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiResponse = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return parseJsonResponse<ReceiptData>(text)
  } catch (error) {
    console.error('Receipt analysis failed:', error)
    return null
  }
}

// ============================================
// SPENDING INSIGHTS
// ============================================

/**
 * Generate personalized spending insights
 */
export async function generateSpendingInsights(
  transactions: Array<{
    category: string
    amount: number
    date: string
    type: 'expense' | 'income' | 'transfer'
  }>,
  totalIncome: number,
  totalExpenses: number
): Promise<SpendingInsight[]> {
  const categoryTotals: Record<string, number> = {}
  transactions.forEach(t => {
    if (t.type === 'expense') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    }
  })

  const prompt = `You are a personal finance advisor. Analyze this user's spending data and provide actionable insights.

Monthly Summary:
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpenses}
- Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%

Spending by Category:
${Object.entries(categoryTotals).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')}

Provide 3-5 personalized insights. Return ONLY valid JSON array:
[
  {
    "title": "short title",
    "description": "detailed insight under 100 characters",
    "type": "tip|warning|achievement|suggestion",
    "priority": 1-5
  }
]

Focus on:
- Unusual spending patterns
- Savings opportunities
- Positive achievements
- Budget warnings if overspending`

  try {
    const response = await callGemini(prompt)
    const insights = parseJsonResponse<SpendingInsight[]>(response)
    return insights || []
  } catch (error) {
    console.error('Failed to generate insights:', error)
    return []
  }
}

// ============================================
// BUDGET RECOMMENDATIONS
// ============================================

/**
 * Get AI-powered budget recommendations
 */
export async function getBudgetRecommendations(
  monthlyIncome: number,
  currentSpending: Record<string, number>,
  existingBudgets: Record<string, number>
): Promise<BudgetRecommendation[]> {
  const prompt = `You are a financial planner. Create budget recommendations based on this data.

Monthly Income: ₹${monthlyIncome}

Current Monthly Spending:
${Object.entries(currentSpending).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')}

Existing Budgets:
${Object.entries(existingBudgets).length > 0
  ? Object.entries(existingBudgets).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')
  : 'No budgets set yet'}

Recommend budgets following the 50/30/20 rule (50% needs, 30% wants, 20% savings).
Return ONLY valid JSON array:
[
  {
    "category": "category name",
    "currentSpending": current amount,
    "recommendedBudget": recommended amount,
    "reason": "brief explanation"
  }
]`

  try {
    const response = await callGemini(prompt)
    const recommendations = parseJsonResponse<BudgetRecommendation[]>(response)
    return recommendations || []
  } catch (error) {
    console.error('Failed to get budget recommendations:', error)
    return []
  }
}

// ============================================
// FINANCIAL CHAT / Q&A
// ============================================

/**
 * Answer financial questions using AI
 */
export async function askFinancialQuestion(
  question: string,
  context: {
    totalBalance?: number
    monthlyIncome?: number
    monthlyExpenses?: number
    topCategories?: Array<{ category: string; amount: number }>
  }
): Promise<string> {
  const prompt = `You are a helpful financial assistant for a personal finance app called FinVault.

User's Financial Context:
- Total Balance: ₹${context.totalBalance || 'Unknown'}
- Monthly Income: ₹${context.monthlyIncome || 'Unknown'}
- Monthly Expenses: ₹${context.monthlyExpenses || 'Unknown'}
${context.topCategories?.length ? `- Top Spending: ${context.topCategories.map(c => `${c.category}: ₹${c.amount}`).join(', ')}` : ''}

User Question: "${question}"

Provide a helpful, concise answer (under 200 words). Be specific with numbers when relevant. Use Indian Rupees (₹) for currency.`

  try {
    return await callGemini(prompt)
  } catch (error) {
    console.error('Failed to answer question:', error)
    return "I'm sorry, I couldn't process your question right now. Please try again later."
  }
}

// ============================================
// ANOMALY DETECTION
// ============================================

/**
 * Detect unusual transactions
 */
export async function detectAnomalies(
  recentTransactions: Array<{
    description: string
    amount: number
    category: string
    date: string
  }>,
  averageByCategory: Record<string, number>
): Promise<Array<{ transactionIndex: number; reason: string; severity: 'low' | 'medium' | 'high' }>> {
  const prompt = `Analyze these recent transactions for anomalies (unusual amounts, frequency, or patterns).

Recent Transactions:
${recentTransactions.map((t, i) => `${i}. ${t.description} - ₹${t.amount} (${t.category}) on ${t.date}`).join('\n')}

Average Spending by Category:
${Object.entries(averageByCategory).map(([cat, avg]) => `- ${cat}: ₹${avg}`).join('\n')}

Flag any suspicious or unusual transactions. Return ONLY valid JSON array:
[
  {
    "transactionIndex": index number,
    "reason": "why it's unusual",
    "severity": "low|medium|high"
  }
]

Return empty array [] if no anomalies found.`

  try {
    const response = await callGemini(prompt)
    const anomalies = parseJsonResponse<Array<{ transactionIndex: number; reason: string; severity: 'low' | 'medium' | 'high' }>>(response)
    return anomalies || []
  } catch (error) {
    console.error('Anomaly detection failed:', error)
    return []
  }
}

// ============================================
// BILL PREDICTION
// ============================================

/**
 * Predict upcoming bills based on transaction history
 */
export async function predictUpcomingBills(
  recurringTransactions: Array<{
    description: string
    amount: number
    category: string
    dates: string[]
  }>
): Promise<Array<{ name: string; amount: number; expectedDate: string; confidence: number }>> {
  const prompt = `Analyze these recurring transactions and predict upcoming bills.

Recurring Transactions:
${recurringTransactions.map(t => `- ${t.description}: ₹${t.amount} (${t.category}), occurred on: ${t.dates.join(', ')}`).join('\n')}

Today's date: ${new Date().toISOString().split('T')[0]}

Predict the next occurrence of each bill. Return ONLY valid JSON array:
[
  {
    "name": "bill name",
    "amount": expected amount,
    "expectedDate": "YYYY-MM-DD",
    "confidence": 0.0 to 1.0
  }
]`

  try {
    const response = await callGemini(prompt)
    const predictions = parseJsonResponse<Array<{ name: string; amount: number; expectedDate: string; confidence: number }>>(response)
    return predictions || []
  } catch (error) {
    console.error('Bill prediction failed:', error)
    return []
  }
}

// ============================================
// SMART SEARCH
// ============================================

/**
 * Perform smart search on transactions using natural language
 */
export async function smartSearch(
  query: string,
  transactions: Array<{
    id: string
    description: string
    amount: number
    category: string
    date: string
  }>
): Promise<string[]> {
  const prompt = `You are a smart search assistant. Find transactions matching this natural language query.

Query: "${query}"

Transactions:
${transactions.slice(0, 50).map(t => `ID:${t.id} - ${t.description} - ₹${t.amount} (${t.category}) on ${t.date}`).join('\n')}

Return ONLY a JSON array of matching transaction IDs:
["id1", "id2", ...]

Interpret the query intelligently:
- "food last week" = food category transactions from last 7 days
- "big expenses" = transactions above average
- "uber" = ride sharing or any uber-related
- etc.`

  try {
    const response = await callGemini(prompt)
    const ids = parseJsonResponse<string[]>(response)
    return ids || []
  } catch (error) {
    console.error('Smart search failed:', error)
    return []
  }
}

// ============================================
// SAVINGS GOALS ADVICE
// ============================================

/**
 * Get advice for achieving savings goals
 */
export async function getSavingsAdvice(
  goalName: string,
  targetAmount: number,
  currentAmount: number,
  targetDate: string,
  monthlyIncome: number,
  monthlyExpenses: number
): Promise<string> {
  const remainingAmount = targetAmount - currentAmount
  const today = new Date()
  const target = new Date(targetDate)
  const monthsRemaining = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  const monthlySavingsNeeded = remainingAmount / monthsRemaining

  const prompt = `You are a savings coach. Provide actionable advice for this savings goal.

Goal: ${goalName}
- Target: ₹${targetAmount}
- Current: ₹${currentAmount} (${((currentAmount / targetAmount) * 100).toFixed(1)}% complete)
- Remaining: ₹${remainingAmount}
- Target Date: ${targetDate}
- Months Remaining: ${monthsRemaining}
- Monthly Savings Needed: ₹${monthlySavingsNeeded.toFixed(0)}

User's Finances:
- Monthly Income: ₹${monthlyIncome}
- Monthly Expenses: ₹${monthlyExpenses}
- Current Monthly Savings: ₹${monthlyIncome - monthlyExpenses}

Provide specific, actionable advice (3-4 bullet points, under 150 words total) on how to reach this goal. Be encouraging but realistic.`

  try {
    return await callGemini(prompt)
  } catch (error) {
    console.error('Failed to get savings advice:', error)
    return "Keep saving consistently! Every rupee counts towards your goal."
  }
}
