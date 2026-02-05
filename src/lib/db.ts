import Dexie, { Table } from 'dexie'
import type {
  UserProfile,
  Transaction,
  Account,
  CreditCard,
  Subscription,
  Investment,
  Loan,
  Insurance,
  Document,
  Group,
  LendBorrow,
  FinancialGoal,
  DebtPayoffPlan,
  SearchIndex,
  SyncDevice,
  AIChatMessage,
  Budget,
  NotificationPayload,
  Category,
  Contact,
} from '@/types'

// Database version
const DB_VERSION = 3
const DB_NAME = 'FinVaultDB'

export class FinVaultDatabase extends Dexie {
  // Tables
  userProfiles!: Table<UserProfile>
  transactions!: Table<Transaction>
  accounts!: Table<Account>
  creditCards!: Table<CreditCard>
  subscriptions!: Table<Subscription>
  investments!: Table<Investment>
  loans!: Table<Loan>
  insurance!: Table<Insurance>
  documents!: Table<Document>
  groups!: Table<Group>
  lendBorrows!: Table<LendBorrow>
  goals!: Table<FinancialGoal>
  debtPayoffPlans!: Table<DebtPayoffPlan>
  searchIndex!: Table<SearchIndex>
  syncDevices!: Table<SyncDevice>
  aiChatMessages!: Table<AIChatMessage>
  budgets!: Table<Budget>
  notifications!: Table<NotificationPayload>
  categories!: Table<Category>
  contacts!: Table<Contact>

  constructor() {
    super(DB_NAME)

    this.version(DB_VERSION).stores({
      // User profiles - main entity
      userProfiles: 'id, name, email, phone, createdAt, updatedAt',

      // Transactions - core financial data
      transactions:
        '++id, profileId, type, category, date, amount, accountId, [profileId+date], [profileId+category], [profileId+type], merchant, aiCategorized, isRecurring, isSplit, isTemplate, isDuplicate, createdAt, updatedAt, *tags',

      // Financial accounts
      accounts:
        '++id, profileId, type, name, bankName, balance, currency, isActive, isArchived, order, groupId, createdAt, updatedAt',

      // Credit cards
      creditCards:
        '++id, profileId, accountId, bankName, cardName, creditLimit, currentOutstanding, billingDate, dueDate, isActive, createdAt, updatedAt',

      // Subscriptions
      subscriptions:
        '++id, profileId, name, provider, category, nextBillingDate, isActive, isTrial, createdAt, updatedAt',

      // Investments
      investments:
        '++id, profileId, type, name, symbol, institution, investedAmount, currentValue, isSip, sipDate, isWatchlist, maturityDate, createdAt, updatedAt',

      // Loans
      loans:
        '++id, profileId, type, lender, outstandingAmount, interestRate, emiDate, endDate, isActive, payoffStrategy, createdAt, updatedAt',

      // Insurance
      insurance:
        '++id, profileId, type, provider, policyName, nextPremiumDate, endDate, isActive, createdAt, updatedAt',

      // Documents
      documents: '++id, profileId, category, name, expiryDate, reminderDays, createdAt, updatedAt',

      // Group expenses
      groups: '++id, name, createdBy, createdAt, updatedAt',

      // Lend/Borrow
      lendBorrows:
        '++id, profileId, type, personName, amount, dueDate, status, createdAt, updatedAt',

      // Goals
      goals:
        '++id, profileId, name, targetAmount, targetDate, currentAmount, priority, isActive, isAchieved, createdAt, updatedAt',

      // Debt payoff plans
      debtPayoffPlans: '++id, profileId, strategy, isActive, createdAt, updatedAt',

      // Search index for full-text search
      searchIndex:
        '++id, entityType, entityId, profileId, title, *content, *tags, amount, date, category, type, createdAt, updatedAt',

      // P2P sync devices
      syncDevices:
        '++id, profileId, deviceId, deviceName, isConnected, isPaired, lastSyncAt, syncStatus, isActive, createdAt, updatedAt',

      // AI chat history
      aiChatMessages: '++id, profileId, role, timestamp, isError',

      // Budgets
      budgets:
        '++id, profileId, category, amount, period, startDate, isActive, createdAt, updatedAt',

      // Notifications
      notifications: '++id, profileId, type, timestamp, read',

      // Categories
      categories: '++id, profileId, type, name, isDefault, isActive, order, createdAt, updatedAt',

      // Contacts / People
      contacts: '++id, profileId, name, email, phone, relationship, isActive, createdAt, updatedAt',
    })

    // Hooks for data validation and encryption
    this.setupHooks()
  }

  private setupHooks() {
    // Transaction hooks for validation
    this.transactions.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = obj.createdAt || new Date()
      obj.updatedAt = new Date()
      obj.tags = obj.tags || []
      obj.attachments = obj.attachments || []
      obj.isRecurring = obj.isRecurring || false
      obj.isSplit = obj.isSplit || false
      obj.isTemplate = obj.isTemplate || false
      obj.isDuplicate = obj.isDuplicate || false
      obj.aiCategorized = obj.aiCategorized || false
      return undefined // Continue with default behavior
    })

    this.transactions.hook('updating', function (modifications, _primKey, _obj, _trans) {
      ;(modifications as unknown as { updatedAt: Date }).updatedAt = new Date()
      return modifications
    })

    // Account hooks
    this.accounts.hook('creating', function (_primKey, obj, _trans) {
      const o = obj as unknown as {
        createdAt: Date
        updatedAt: Date
        isActive: boolean
        isArchived: boolean
        order: number
      }
      o.createdAt = o.createdAt || new Date()
      o.updatedAt = new Date()
      o.isActive = o.isActive ?? true
      o.isArchived = o.isArchived ?? false
      o.order = o.order ?? 0
      return undefined
    })

    this.accounts.hook('updating', function (modifications, _primKey, _obj, _trans) {
      ;(modifications as unknown as { updatedAt: Date }).updatedAt = new Date()
      return modifications
    })

    // Add similar hooks for other tables...
  }

  // Utility methods
  async resetDatabase(): Promise<void> {
    await this.delete()
    await this.open()
  }

  async exportProfileData(profileId: string): Promise<{
    transactions: Transaction[]
    accounts: Account[]
    creditCards: CreditCard[]
    investments: Investment[]
    loans: Loan[]
    insurance: Insurance[]
    subscriptions: Subscription[]
    documents: Document[]
    goals: FinancialGoal[]
    lendBorrows: LendBorrow[]
    budgets: Budget[]
  }> {
    const [
      transactions,
      accounts,
      creditCards,
      investments,
      loans,
      insurance,
      subscriptions,
      documents,
      goals,
      lendBorrows,
      budgets,
    ] = await Promise.all([
      this.transactions.where('profileId').equals(profileId).toArray(),
      this.accounts.where('profileId').equals(profileId).toArray(),
      this.creditCards.where('profileId').equals(profileId).toArray(),
      this.investments.where('profileId').equals(profileId).toArray(),
      this.loans.where('profileId').equals(profileId).toArray(),
      this.insurance.where('profileId').equals(profileId).toArray(),
      this.subscriptions.where('profileId').equals(profileId).toArray(),
      this.documents.where('profileId').equals(profileId).toArray(),
      this.goals.where('profileId').equals(profileId).toArray(),
      this.lendBorrows.where('profileId').equals(profileId).toArray(),
      this.budgets.where('profileId').equals(profileId).toArray(),
    ])

    return {
      transactions,
      accounts,
      creditCards,
      investments,
      loans,
      insurance,
      subscriptions,
      documents,
      goals,
      lendBorrows,
      budgets,
    }
  }

  async getStats(): Promise<{
    totalTransactions: number
    totalAccounts: number
    totalDocuments: number
    databaseSize: number
  }> {
    const [totalTransactions, totalAccounts, totalDocuments] = await Promise.all([
      this.transactions.count(),
      this.accounts.count(),
      this.documents.count(),
    ])

    // Estimate database size (rough calculation)
    let databaseSize = 0
    try {
      const storage = await navigator.storage?.estimate?.()
      databaseSize = storage?.usage || 0
    } catch {
      // Storage estimate not available
    }

    return {
      totalTransactions,
      totalAccounts,
      totalDocuments,
      databaseSize,
    }
  }

  // Search functionality
  async searchTransactions(profileId: string, query: string): Promise<Transaction[]> {
    const lowerQuery = query.toLowerCase()

    return this.transactions
      .where('profileId')
      .equals(profileId)
      .filter((tx: Transaction) => {
        const descMatch = tx.description.toLowerCase().includes(lowerQuery)
        const catMatch = tx.category.toLowerCase().includes(lowerQuery)
        const merchantMatch = tx.merchant?.toLowerCase().includes(lowerQuery) ?? false
        const tagsMatch = tx.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        const notesMatch = tx.notes?.toLowerCase().includes(lowerQuery) ?? false
        return descMatch || catMatch || merchantMatch || tagsMatch || notesMatch
      })
      .toArray()
  }

  // Get transactions by date range
  async getTransactionsByDateRange(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return this.transactions
      .where('[profileId+date]')
      .between([profileId, startDate], [profileId, endDate])
      .toArray()
  }

  // Get monthly summary
  async getMonthlySummary(
    profileId: string,
    year: number,
    month: number
  ): Promise<{
    income: number
    expenses: number
    savings: number
    transactions: Transaction[]
  }> {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59)

    const transactions = await this.getTransactionsByDateRange(profileId, startDate, endDate)

    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const expenses = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)

    return {
      income,
      expenses,
      savings: income - expenses,
      transactions,
    }
  }
}

// Create singleton instance
export const db = new FinVaultDatabase()

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open()
    console.log('FinVault database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Export database instance for use in components
export default db
