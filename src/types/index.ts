// FinVault Core Types
// Comprehensive type definitions for the personal finance manager

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  pinHash: string;
  passwordHash?: string;
  biometricEnabled: boolean;
  biometricCredentials?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
  security: SecuritySettings;
  ai: AISettings;
  accessibility: AccessibilitySettings;
}

export interface UserSettings {
  currency: string;
  language: string;
  theme: 'dark' | 'light' | 'system';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 'sunday' | 'monday';
  numberFormat: 'indian' | 'international';
  notifications: NotificationPreferences;
  cloudBackupEnabled: boolean;
  lastBackupAt?: Date;
  p2pSyncEnabled: boolean;
  autoLockTimeout: number;
  screenshotProtection: boolean;
  bottomNavItems?: string[]; // IDs of nav items to show in primary bottom nav (max 4)
}

export interface SecuritySettings {
  appLockEnabled: boolean;
  appLockSections: string[];
  decoyModeEnabled: boolean;
  decoyPinHash?: string;
  breakInAlertsEnabled: boolean;
  duressPasswordHash?: string;
  autoLockEnabled: boolean;
  lastActivityAt: Date;
  failedAttempts: number;
  lockoutUntil?: Date;
}

export interface AISettings {
  processingMode: 'on-device' | 'hybrid' | 'user-api' | 'local-llm';
  apiProvider?: 'claude' | 'openai' | 'gemini';
  apiKey?: string;
  apiEndpoint?: string;
  ollamaUrl?: string;
  anonymizationEnabled: boolean;
  voiceInputEnabled: boolean;
  chatHistoryEnabled: boolean;
  learningEnabled: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

export interface NotificationPreferences {
  billReminders: boolean;
  budgetAlerts: boolean;
  investmentUpdates: boolean;
  policyRenewals: boolean;
  documentExpiry: boolean;
  lendBorrowReminders: boolean;
  subscriptionRenewals: boolean;
  weeklySummary: boolean;
  goalMilestones: boolean;
  smartReminders: boolean;
  reminderDays: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ============================================
// TRANSACTIONS
// ============================================

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  profileId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  originalAmount?: number | undefined;
  originalCurrency?: string | undefined;
  exchangeRate?: number | undefined;
  category: string;
  subcategory?: string | undefined | null;
  description: string;
  date: Date;
  paymentMethod: string;
  accountId: string;
  toAccountId?: string | undefined;
  tags: string[];
  attachments: Attachment[];
  isRecurring: boolean;
  recurringConfig?: RecurringConfig | undefined;
  location?: GeoLocation | undefined;
  merchant?: string | undefined;
  notes?: string | undefined;
  aiCategorized: boolean;
  aiConfidence?: number | undefined;
  splits?: TransactionSplit[] | undefined;
  isSplit: boolean;
  parentTransactionId?: string | undefined;
  isTemplate: boolean;
  templateName?: string | undefined;
  isDuplicate: boolean;
  duplicateOf?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
  searchVector?: string | undefined;
}

export interface TransactionSplit {
  id: string;
  transactionId: string;
  category: string;
  subcategory?: string;
  amount: number;
  description?: string;
  tags: string[];
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  startDate: Date;
  endDate?: Date;
  endAfterOccurrences?: number;
  nextOccurrence: Date;
  lastOccurrence?: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  skipWeekends: boolean;
}

export interface Attachment {
  id: string;
  transactionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  file: Blob;
  thumbnail?: Blob;
  ocrText?: string;
  extractedData?: ReceiptData;
  createdAt: Date;
}

export interface ReceiptData {
  merchant: string;
  date: Date;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  currency: string;
  lineItems?: LineItem[];
  paymentMethod?: string;
  receiptNumber?: string;
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

// ============================================
// ACCOUNTS & CREDIT CARDS
// ============================================

export type AccountType = 'savings' | 'current' | 'wallet' | 'cash' | 'credit_card' | 'investment';

export interface Account {
  id: string;
  profileId: string;
  type: AccountType;
  name: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
  balance: number;
  currency: string;
  creditLimit?: number;
  availableCredit?: number;
  icon: string;
  color: string;
  isActive: boolean;
  isArchived: boolean;
  order: number;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCard {
  id: string;
  profileId: string;
  accountId: string;
  bankName: string;
  cardName: string;
  cardNumber?: string;
  lastFourDigits: string;
  creditLimit: number;
  currency: string;
  currentOutstanding: number;
  availableLimit: number;
  billingDate: number;
  dueDate: number;
  minimumPaymentPercent: number;
  interestRate: number;
  annualFee?: number;
  feeDate?: Date;
  feeCurrency?: string;
  rewardPoints?: number;
  rewardProgram?: string;
  color: string;
  isActive: boolean;
  statements: CardStatement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CardStatement {
  id: string;
  cardId: string;
  statementDate: Date;
  dueDate: Date;
  totalAmount: number;
  minimumPayment: number;
  pdfFile?: Blob;
  transactions: string[];
  isPaid: boolean;
  paymentDate?: Date;
  paymentAmount?: number;
}

// ============================================
// SUBSCRIPTIONS
// ============================================

export type BillingCycle = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';

export interface Subscription {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  provider: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  customDays?: number;
  nextBillingDate: Date;
  previousBillingDate?: Date;
  startDate: Date;
  endDate?: Date;
  isTrial: boolean;
  trialEndsAt?: Date;
  paymentMethod: string;
  accountId?: string;
  website?: string;
  cancellationUrl?: string;
  notes?: string;
  isActive: boolean;
  isShared: boolean;
  sharedWith?: string[];
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INVESTMENTS
// ============================================

export type InvestmentType = 
  | 'mutual_fund' 
  | 'stock' 
  | 'fd' 
  | 'rd' 
  | 'ppf' 
  | 'epf' 
  | 'nps' 
  | 'gold' 
  | 'real_estate' 
  | 'crypto' 
  | 'bond' 
  | 'etf' 
  | 'other';

export interface Investment {
  id: string;
  profileId: string;
  type: InvestmentType;
  name: string;
  symbol?: string;
  institution: string;
  accountId?: string;
  investedAmount: number;
  currentValue: number;
  units?: number;
  nav?: number;
  purchaseDate: Date;
  purchasePrice?: number;
  maturityDate?: Date;
  maturityAmount?: number;
  interestRate?: number;
  interestType?: 'simple' | 'compound' | 'cumulative' | 'payout';
  isSip: boolean;
  sipAmount?: number;
  sipDate?: number;
  sipFrequency?: 'monthly' | 'quarterly';
  isRd: boolean;
  rdMonthlyAmount?: number;
  folioNumber?: string;
  isin?: string;
  isWatchlist: boolean;
  goalIds?: string[];
  dividends: Dividend[];
  notes?: string;
  lastPriceUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dividend {
  id: string;
  investmentId: string;
  amount: number;
  date: Date;
  type: 'dividend' | 'interest' | 'bonus' | 'rights';
  reinvested: boolean;
}

// ============================================
// LOANS
// ============================================

export type LoanType = 
  | 'home' 
  | 'car' 
  | 'personal' 
  | 'education' 
  | 'gold' 
  | 'lap' 
  | 'business' 
  | 'credit_card' 
  | 'bnpl' 
  | 'other';

export interface Loan {
  id: string;
  profileId: string;
  type: LoanType;
  lender: string;
  accountId?: string;
  accountNumber?: string;
  principalAmount: number;
  outstandingAmount: number;
  currency: string;
  interestRate: number;
  interestType: 'fixed' | 'floating' | 'reducing_balance';
  emiAmount: number;
  tenure: number;
  emiDate: number;
  startDate: Date;
  endDate: Date;
  prepayments: Prepayment[];
  amortizationSchedule?: AmortizationEntry[];
  payoffStrategy?: 'snowball' | 'avalanche' | 'custom';
  payoffPriority?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prepayment {
  id: string;
  loanId: string;
  date: Date;
  amount: number;
  principalReduced: number;
  interestSaved: number;
  newEmi?: number;
  tenureReduced?: number;
}

export interface AmortizationEntry {
  month: number;
  date: Date;
  emiAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingPrincipal: number;
  isPaid: boolean;
  paymentDate?: Date;
}

// ============================================
// INSURANCE
// ============================================

export type InsuranceType = 'life' | 'health' | 'vehicle' | 'property' | 'travel' | 'disability' | 'other';

export interface Insurance {
  id: string;
  profileId: string;
  type: InsuranceType;
  subtype?: string;
  provider: string;
  policyNumber: string;
  policyName: string;
  sumAssured: number;
  currency: string;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'single';
  nextPremiumDate: Date;
  lastPremiumDate?: Date;
  startDate: Date;
  endDate: Date;
  nominees: Nominee[];
  documents: Attachment[];
  claims: Claim[];
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Nominee {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  dateOfBirth?: Date;
  contact?: string;
}

export interface Claim {
  id: string;
  insuranceId: string;
  claimNumber?: string;
  date: Date;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  description: string;
  documents: Attachment[];
  settlementAmount?: number;
  settlementDate?: Date;
}

// ============================================
// DOCUMENTS
// ============================================

export type DocumentCategory = 
  | 'identity' 
  | 'financial' 
  | 'property' 
  | 'vehicle' 
  | 'medical' 
  | 'education' 
  | 'legal' 
  | 'employment' 
  | 'travel' 
  | 'other';

export interface Document {
  id: string;
  profileId: string;
  category: DocumentCategory;
  subcategory?: string;
  name: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  file: Blob;
  fileType: string;
  fileSize: number;
  thumbnail?: Blob;
  ocrText?: string;
  extractedFields?: Record<string, string>;
  tags: string[];
  notes?: string;
  version: number;
  previousVersions?: DocumentVersion[];
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  version: number;
  file: Blob;
  updatedAt: Date;
  changes?: string;
}

// ============================================
// GROUP EXPENSES
// ============================================

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  settlements: Settlement[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  profileId?: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  joinedAt: Date;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  paidBy: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: Date;
  splitType: 'equal' | 'percentage' | 'custom';
  splits: ExpenseSplit[];
  attachments: Attachment[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  percentage?: number;
  isSettled: boolean;
  settledAt?: Date;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: string;
  date: Date;
  relatedExpenses?: string[];
  notes?: string;
  createdAt: Date;
}

// ============================================
// LEND / BORROW
// ============================================

export interface LendBorrow {
  id: string;
  profileId: string;
  type: 'lent' | 'borrowed';
  personName: string;
  personPhone?: string;
  personEmail?: string;
  contactId?: string;
  amount: number;
  currency: string;
  reason?: string;
  date: Date;
  dueDate?: Date;
  interestRate?: number;
  interestType?: 'simple' | 'compound';
  settlements: Settlement[];
  status: 'pending' | 'partial' | 'settled';
  remainingAmount: number;
  reminderDays: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// FINANCIAL GOALS
// ============================================

export interface FinancialGoal {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  targetAmount: number;
  targetDate: Date;
  currency: string;
  currentAmount: number;
  monthlySavingsRequired: number;
  linkedInvestments?: string[];
  linkedAccount?: string;
  priority: 'high' | 'medium' | 'low';
  order: number;
  isActive: boolean;
  isAchieved: boolean;
  achievedAt?: Date;
  milestones: GoalMilestone[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalMilestone {
  percentage: number;
  amount: number;
  reachedAt?: Date;
  isReached: boolean;
}

// ============================================
// DEBT PAYOFF PLAN
// ============================================

export interface DebtPayoffPlan {
  id: string;
  profileId: string;
  strategy: 'snowball' | 'avalanche' | 'custom';
  startDate: Date;
  estimatedEndDate: Date;
  monthsToPayoff: number;
  totalDebt: number;
  totalInterest: number;
  interestSaved: number;
  extraPaymentAmount: number;
  extraPaymentFrequency: 'monthly' | 'one_time';
  loans: PayoffLoan[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoffLoan {
  loanId: string;
  order: number;
  priority: number;
  payoffDate: Date;
  totalInterest: number;
}

// ============================================
// SEARCH & SYNC
// ============================================

export interface SearchIndex {
  id: string;
  entityType: 'transaction' | 'document' | 'investment' | 'subscription';
  entityId: string;
  profileId: string;
  title: string;
  description?: string;
  tags: string[];
  amount?: number;
  date?: Date;
  content: string;
  category?: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncDevice {
  id: string;
  profileId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
  deviceId: string;
  isConnected: boolean;
  lastConnectedAt?: Date;
  isPaired: boolean;
  pairedAt?: Date;
  lastSyncAt?: Date;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncError?: string;
  webRtcId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AI CHAT
// ============================================

export interface AIChatMessage {
  id: string;
  profileId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  referencedTransactions?: string[];
  generatedQuery?: string;
  responseTime?: number;
  aiProvider?: string;
  isError: boolean;
  errorMessage?: string;
  hasVisualization: boolean;
  visualizationType?: 'chart' | 'table' | 'summary';
  visualizationData?: any;
  timestamp: Date;
}

// ============================================
// BUDGET
// ============================================

export interface Budget {
  id: string;
  profileId: string;
  category: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  rollover: boolean;
  alertThresholds: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// UTILITY TYPES
// ============================================

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD' | 'AED' | 'CHF';

export type LanguageCode = 'en' | 'es' | 'hi' | 'fr' | 'de' | 'ja' | 'ar' | 'pt' | 'ta' | 'te' | 'kn' | 'mr';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: '.' | ',';
  thousandSeparator: ',' | '.' | ' ';
  decimalPlaces: number;
}

export interface NotificationPayload {
  id: string;
  type: 'bill' | 'budget' | 'investment' | 'policy' | 'document' | 'lend' | 'subscription' | 'goal';
  title: string;
  message: string;
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
}

// ============================================
// API & FORM TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOptions {
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  minAmount?: number | undefined;
  maxAmount?: number | undefined;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  paymentMethods?: string[] | undefined;
  accounts?: string[] | undefined;
  type?: TransactionType | undefined;
  searchQuery?: string | undefined;
}

export type SortField = 'date' | 'amount' | 'description' | 'category' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  currency: string;
}

export interface MonthlyComparison {
  currentMonth: number;
  previousMonth: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'flat';
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  budgetAmount?: number;
  budgetUsed?: number;
}

// ============================================
// ENCRYPTION TYPES
// ============================================

export interface EncryptedField {
  encryptedData: string;
  iv: string;
  authTag: string;
  algorithm: 'AES-256-GCM';
  version: number;
}

export interface MasterKeyData {
  key: CryptoKey;
  salt: Uint8Array;
  iterations: number;
}

export interface ExportData {
  version: number;
  exportDate: Date;
  profile: UserProfile;
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  investments: Investment[];
  loans: Loan[];
  insurance: Insurance[];
  documents: Document[];
  budgets: Budget[];
  subscriptions: Subscription[];
  groups: Group[];
  lendBorrows: LendBorrow[];
  goals: FinancialGoal[];
}
