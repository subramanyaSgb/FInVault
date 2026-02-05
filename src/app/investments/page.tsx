'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  Building2,
  Eye,
  EyeOff,
  Wallet,
  Landmark,
  Coins,
  Gem,
  Bitcoin,
  BarChart3,
  RefreshCw,
  Clock,
} from 'lucide-react'
import { useInvestmentStore } from '@/stores/investmentStore'
import { useAuthStore } from '@/stores/authStore'
import type { Investment, InvestmentType } from '@/types'
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface InvestmentFormData {
  type: InvestmentType
  name: string
  symbol: string
  institution: string
  investedAmount: number
  currentValue: number
  units: number
  nav: number
  purchaseDate: Date
  isSip: boolean
  sipAmount: number
  sipDate: number
  isWatchlist: boolean
  folioNumber?: string
  fundCategory?: string
  exitLoad?: number
  exchange?: string
  sector?: string
  marketCapCategory?: string
  dividendYield?: number
  fdInterestRate?: number
  maturityDate?: string
  nominationDetails?: string
  ppfAccountNumber?: string
  maturityYear?: number
  uanNumber?: string
  employerName?: string
  employerContribution?: number
  goldForm?: string
  goldPurity?: string
  goldWeight?: number
  exchangePlatform?: string
  walletAddress?: string
  network?: string
  description?: string
  notes?: string
}

interface DynamicField {
  label: string
  field: keyof InvestmentFormData
  type: 'text' | 'number' | 'select' | 'date'
  placeholder: string
  options?: string[]
}

const investmentTypeSpecificFields: Record<InvestmentType, DynamicField[]> = {
  mutual_fund: [
    { label: 'Folio Number', field: 'folioNumber', type: 'text', placeholder: 'Enter folio number' },
    { label: 'Fund Category', field: 'fundCategory', type: 'select', placeholder: 'Select category', options: ['Equity - Large Cap', 'Equity - Mid Cap', 'Equity - Small Cap', 'Equity - Multi Cap', 'Debt - Liquid', 'Debt - Short Term', 'Debt - Long Term', 'Hybrid - Balanced', 'Index Fund', 'ELSS', 'Other'] },
    { label: 'Exit Load (%)', field: 'exitLoad', type: 'number', placeholder: '1' },
  ],
  stock: [
    { label: 'Exchange', field: 'exchange', type: 'select', placeholder: 'Select exchange', options: ['NSE', 'BSE', 'NASDAQ', 'NYSE', 'Other'] },
    { label: 'Sector', field: 'sector', type: 'select', placeholder: 'Select sector', options: ['Technology', 'Banking', 'Finance', 'Healthcare', 'Consumer', 'Energy', 'Auto', 'Infrastructure', 'Pharma', 'FMCG', 'Other'] },
    { label: 'Market Cap', field: 'marketCapCategory', type: 'select', placeholder: 'Select category', options: ['Large Cap', 'Mid Cap', 'Small Cap', 'Micro Cap'] },
    { label: 'Dividend Yield (%)', field: 'dividendYield', type: 'number', placeholder: '2.5' },
  ],
  fd: [
    { label: 'Interest Rate (%)', field: 'fdInterestRate', type: 'number', placeholder: '7.5' },
    { label: 'Maturity Date', field: 'maturityDate', type: 'date', placeholder: '' },
    { label: 'Nomination Details', field: 'nominationDetails', type: 'text', placeholder: 'Nominee name' },
  ],
  rd: [
    { label: 'Monthly Deposit', field: 'fdInterestRate', type: 'number', placeholder: '5000' },
    { label: 'Maturity Date', field: 'maturityDate', type: 'date', placeholder: '' },
    { label: 'Nomination Details', field: 'nominationDetails', type: 'text', placeholder: 'Nominee name' },
  ],
  ppf: [
    { label: 'PPF Account Number', field: 'ppfAccountNumber', type: 'text', placeholder: 'Account number' },
    { label: 'Maturity Year', field: 'maturityYear', type: 'number', placeholder: '2039' },
  ],
  epf: [
    { label: 'UAN Number', field: 'uanNumber', type: 'text', placeholder: '100123456789' },
    { label: 'Employer Name', field: 'employerName', type: 'text', placeholder: 'Company name' },
    { label: 'Employer Contribution (Monthly)', field: 'employerContribution', type: 'number', placeholder: '1800' },
  ],
  nps: [
    { label: 'PRAN Number', field: 'uanNumber', type: 'text', placeholder: '110012345678' },
    { label: 'Tier', field: 'fundCategory', type: 'select', placeholder: 'Select tier', options: ['Tier I', 'Tier II'] },
    { label: 'Investment Choice', field: 'sector', type: 'select', placeholder: 'Select choice', options: ['Auto Choice - Aggressive', 'Auto Choice - Moderate', 'Auto Choice - Conservative', 'Active Choice'] },
  ],
  gold: [
    { label: 'Form', field: 'goldForm', type: 'select', placeholder: 'Select form', options: ['Physical - Jewelry', 'Physical - Coins', 'Physical - Bars', 'Digital Gold', 'Sovereign Gold Bond (SGB)', 'Gold ETF'] },
    { label: 'Purity', field: 'goldPurity', type: 'select', placeholder: 'Select purity', options: ['24K (99.9%)', '22K (91.6%)', '18K (75%)'] },
    { label: 'Weight (grams)', field: 'goldWeight', type: 'number', placeholder: '10' },
  ],
  real_estate: [
    { label: 'Property Address', field: 'description', type: 'text', placeholder: 'Full property address' },
    { label: 'Property Type', field: 'sector', type: 'select', placeholder: 'Select type', options: ['Residential - Apartment', 'Residential - Villa', 'Commercial - Office', 'Commercial - Shop', 'Plot/Land', 'Warehouse'] },
    { label: 'Registration Number', field: 'folioNumber', type: 'text', placeholder: 'Property registration number' },
  ],
  crypto: [
    { label: 'Exchange Platform', field: 'exchangePlatform', type: 'select', placeholder: 'Select platform', options: ['Binance', 'CoinDCX', 'WazirX', 'Coinbase', 'Zebpay', 'Other'] },
    { label: 'Wallet Address', field: 'walletAddress', type: 'text', placeholder: '0x...' },
    { label: 'Network', field: 'network', type: 'select', placeholder: 'Select network', options: ['Ethereum', 'Bitcoin', 'BSC', 'Polygon', 'Solana', 'Other'] },
  ],
  bond: [
    { label: 'Bond Type', field: 'fundCategory', type: 'select', placeholder: 'Select type', options: ['Government Bond', 'Corporate Bond', 'Tax-Free Bond', 'RBI Bond', 'Municipal Bond'] },
    { label: 'Coupon Rate (%)', field: 'fdInterestRate', type: 'number', placeholder: '7.5' },
    { label: 'Face Value', field: 'notes', type: 'text', placeholder: '1000' },
  ],
  etf: [
    { label: 'ETF Category', field: 'fundCategory', type: 'select', placeholder: 'Select category', options: ['Index ETF', 'Gold ETF', 'Sectoral ETF', 'Debt ETF', 'International ETF'] },
    { label: 'Exchange', field: 'exchange', type: 'select', placeholder: 'Select exchange', options: ['NSE', 'BSE'] },
    { label: 'Expense Ratio (%)', field: 'exitLoad', type: 'number', placeholder: '0.1' },
  ],
  other: [
    { label: 'Description', field: 'description', type: 'text', placeholder: 'Describe this investment' },
    { label: 'Notes', field: 'notes', type: 'text', placeholder: 'Additional notes' },
  ],
}

const INVESTMENT_TYPES: { type: InvestmentType; label: string; icon: React.ReactNode }[] = [
  { type: 'mutual_fund', label: 'Mutual Fund', icon: <BarChart3 className="w-5 h-5" /> },
  { type: 'stock', label: 'Stock', icon: <TrendingUp className="w-5 h-5" /> },
  { type: 'fd', label: 'Fixed Deposit', icon: <Landmark className="w-5 h-5" /> },
  { type: 'ppf', label: 'PPF', icon: <Wallet className="w-5 h-5" /> },
  { type: 'epf', label: 'EPF', icon: <Building2 className="w-5 h-5" /> },
  { type: 'gold', label: 'Gold', icon: <Gem className="w-5 h-5" /> },
  { type: 'crypto', label: 'Crypto', icon: <Bitcoin className="w-5 h-5" /> },
  { type: 'other', label: 'Other', icon: <Coins className="w-5 h-5" /> },
]

const COLORS = ['#C9A962', '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6B7280']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } }
}

export default function InvestmentsPage() {
  const { currentProfile } = useAuthStore()
  const {
    investments,
    isLoading,
    isRefreshingPrices,
    lastPriceRefresh,
    loadInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    refreshPrices,
    getPortfolioSummary,
    getAssetAllocation,
  } = useInvestmentStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturns: 0,
    returnsPercentage: 0,
    dayChange: 0,
    dayChangePercentage: 0,
  })
  const [assetAllocation, setAssetAllocation] = useState<{ type: string; value: number; percentage: number }[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'sip' | 'watchlist'>('all')
  const [refreshMessage, setRefreshMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState<InvestmentFormData>({
    type: 'mutual_fund',
    name: '',
    symbol: '',
    institution: '',
    investedAmount: 0,
    currentValue: 0,
    units: 0,
    nav: 0,
    purchaseDate: new Date(),
    isSip: false,
    sipAmount: 0,
    sipDate: 1,
    isWatchlist: false,
  })

  useEffect(() => {
    if (currentProfile) {
      loadInvestments(currentProfile.id)
      getPortfolioSummary(currentProfile.id).then(setPortfolioSummary)
      getAssetAllocation(currentProfile.id).then(setAssetAllocation)
    }
  }, [currentProfile, loadInvestments, getPortfolioSummary, getAssetAllocation])

  const formatCurrency = (amount: number) => {
    if (!currentProfile) return ''
    const symbol =
      currentProfile.settings.currency === 'INR'
        ? '₹'
        : currentProfile.settings.currency === 'USD'
          ? '$'
          : currentProfile.settings.currency === 'EUR'
            ? '€'
            : '₹'
    return `${symbol}${amount.toLocaleString('en-IN')}`
  }

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return null
    const now = new Date()
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000 / 60)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
  }

  const handleRefreshPrices = async () => {
    if (!currentProfile || isRefreshingPrices) return

    setRefreshMessage(null)
    const result = await refreshPrices(currentProfile.id)

    if (result.updated > 0) {
      setRefreshMessage({
        type: 'success',
        text: `Updated ${result.updated} investment${result.updated > 1 ? 's' : ''}`,
      })
      getPortfolioSummary(currentProfile.id).then(setPortfolioSummary)
    } else if (result.failed > 0) {
      setRefreshMessage({
        type: 'error',
        text: `Failed to fetch prices. ${result.errors[0] || ''}`,
      })
    } else {
      setRefreshMessage({
        type: 'error',
        text: 'No investments with symbols to update',
      })
    }

    setTimeout(() => setRefreshMessage(null), 5000)
  }

  const filteredInvestments = useMemo(() => {
    switch (activeTab) {
      case 'sip':
        return investments.filter((inv) => inv.isSip)
      case 'watchlist':
        return investments.filter((inv) => inv.isWatchlist)
      default:
        return investments.filter((inv) => !inv.isWatchlist)
    }
  }, [investments, activeTab])

  const chartData = useMemo(() => {
    return assetAllocation.map((item) => ({
      name: item.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: item.value,
      percentage: item.percentage,
    }))
  }, [assetAllocation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile) return

    try {
      if (editingInvestment) {
        await updateInvestment(editingInvestment.id, {
          type: formData.type,
          name: formData.name,
          symbol: formData.symbol,
          institution: formData.institution,
          investedAmount: formData.investedAmount,
          currentValue: formData.currentValue,
          units: formData.units,
          nav: formData.nav,
          purchaseDate: formData.purchaseDate,
          isSip: formData.isSip,
          sipAmount: formData.sipAmount,
          sipDate: formData.sipDate,
          isWatchlist: formData.isWatchlist,
        })
      } else {
        await createInvestment({
          type: formData.type,
          name: formData.name,
          symbol: formData.symbol,
          institution: formData.institution,
          investedAmount: formData.investedAmount,
          currentValue: formData.currentValue,
          units: formData.units,
          nav: formData.nav,
          purchaseDate: formData.purchaseDate,
          profileId: currentProfile.id,
          isSip: formData.isSip,
          sipAmount: formData.sipAmount,
          sipDate: formData.sipDate,
          isRd: false,
          isWatchlist: formData.isWatchlist,
          folioNumber: '',
          dividends: [],
        })
      }
      setShowAddModal(false)
      setEditingInvestment(null)
      resetForm()
      getPortfolioSummary(currentProfile.id).then(setPortfolioSummary)
      getAssetAllocation(currentProfile.id).then(setAssetAllocation)
    } catch (error) {
      console.error('Failed to save investment:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'mutual_fund',
      name: '',
      symbol: '',
      institution: '',
      investedAmount: 0,
      currentValue: 0,
      units: 0,
      nav: 0,
      purchaseDate: new Date(),
      isSip: false,
      sipAmount: 0,
      sipDate: 1,
      isWatchlist: false,
    })
  }

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment)
    setFormData({
      type: investment.type,
      name: investment.name,
      symbol: investment.symbol || '',
      institution: investment.institution,
      investedAmount: investment.investedAmount,
      currentValue: investment.currentValue,
      units: investment.units || 0,
      nav: investment.nav || 0,
      purchaseDate: new Date(investment.purchaseDate),
      isSip: investment.isSip,
      sipAmount: investment.sipAmount || 0,
      sipDate: investment.sipDate || 1,
      isWatchlist: investment.isWatchlist,
    })
    setShowAddModal(true)
  }

  const handleDelete = async (investmentId: string) => {
    if (!currentProfile) return
    if (confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteInvestment(investmentId)
        getPortfolioSummary(currentProfile.id).then(setPortfolioSummary)
        getAssetAllocation(currentProfile.id).then(setAssetAllocation)
      } catch (error) {
        console.error('Failed to delete investment:', error)
      }
    }
  }

  const getInvestmentIcon = (type: InvestmentType) => {
    const invType = INVESTMENT_TYPES.find((it) => it.type === type)
    return invType?.icon || <Coins className="w-5 h-5" />
  }

  const getInvestmentLabel = (type: InvestmentType) => {
    const invType = INVESTMENT_TYPES.find((it) => it.type === type)
    return invType?.label || 'Investment'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="space-y-4">
          <div className="h-8 w-32 skeleton rounded-lg" />
          <div className="h-44 skeleton rounded-2xl" />
          <div className="h-72 skeleton rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2.5 bg-bg-secondary/50 hover:bg-bg-tertiary rounded-xl border border-glass-border transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Wealth</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Investments</h1>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={handleRefreshPrices}
              disabled={isRefreshingPrices}
              className="p-2.5 text-text-secondary hover:text-accent rounded-xl hover:bg-accent/10 border border-glass-border transition-all duration-300 disabled:opacity-50"
              title="Refresh Prices"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshingPrices ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setEditingInvestment(null)
                resetForm()
                setShowAddModal(true)
              }}
              className="p-2.5 bg-accent/20 hover:bg-accent/30 rounded-xl border border-accent/30 transition-all duration-300"
            >
              <Plus className="w-5 h-5 text-accent" />
            </button>
          </motion.div>
        </div>

        {/* Refresh Status Bar */}
        {(lastPriceRefresh || refreshMessage) && (
          <div className="px-4 pb-3 flex items-center justify-between">
            {lastPriceRefresh && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                <span>Updated {formatLastUpdate(lastPriceRefresh)}</span>
              </div>
            )}
            {refreshMessage && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  refreshMessage.type === 'success'
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-error/10 text-error border border-error/20'
                }`}
              >
                {refreshMessage.text}
              </motion.div>
            )}
          </div>
        )}
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-5"
      >
        {/* Premium Portfolio Summary Card */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 p-5">
            {/* Background glow decoration */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 165, 92, 0.15) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Value</p>
                  <h2 className="text-3xl font-display font-bold text-gradient-gold">
                    {formatCurrency(portfolioSummary.currentValue)}
                  </h2>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                    portfolioSummary.totalReturns >= 0
                      ? 'bg-success/10 border-success/30'
                      : 'bg-error/10 border-error/30'
                  }`}
                >
                  {portfolioSummary.totalReturns >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-error" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      portfolioSummary.totalReturns >= 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {portfolioSummary.returnsPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Invested</p>
                  <p className="text-base font-semibold text-text-primary">
                    {formatCurrency(portfolioSummary.totalInvested)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Returns</p>
                  <p
                    className={`text-base font-semibold ${
                      portfolioSummary.totalReturns >= 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {portfolioSummary.totalReturns >= 0 ? '+' : ''}
                    {formatCurrency(portfolioSummary.totalReturns)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Day Change</p>
                  <p
                    className={`text-base font-semibold ${
                      portfolioSummary.dayChange >= 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {portfolioSummary.dayChange >= 0 ? '+' : ''}
                    {formatCurrency(portfolioSummary.dayChange)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Asset Allocation Chart */}
        {assetAllocation.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5">
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-text-primary">Asset Allocation</h3>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((_item, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A0A0A',
                          border: '1px solid rgba(201, 165, 92, 0.2)',
                          borderRadius: '12px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {chartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-text-secondary">{item.name}</span>
                      <span className="text-sm text-text-muted">{item.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Premium Tabs */}
        <motion.div variants={itemVariants} className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'sip', label: 'SIP' },
            { id: 'watchlist', label: 'Watchlist' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-accent text-bg-primary shadow-[0_0_15px_rgba(201,165,92,0.3)]'
                  : 'bg-bg-secondary/50 text-text-secondary hover:bg-bg-tertiary border border-glass-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Premium Investments List */}
        <motion.div variants={itemVariants} className="space-y-3">
          {filteredInvestments.length === 0 ? (
            /* Premium Empty State */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-accent/60" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">
                  {activeTab === 'watchlist' ? 'No watchlist items' : 'No investments added yet'}
                </p>
                <p className="text-xs text-text-muted mb-4">
                  {activeTab === 'watchlist'
                    ? 'Add investments to your watchlist'
                    : 'Start building your portfolio'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg-primary font-semibold rounded-xl hover:bg-accent-light transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Investment
                </button>
              </div>
            </div>
          ) : (
            filteredInvestments.map((investment, index) => {
              const returns = investment.currentValue - investment.investedAmount
              const returnsPercentage = investment.investedAmount > 0
                ? (returns / investment.investedAmount) * 100
                : 0

              return (
                <motion.div
                  key={investment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-tertiary border border-border-subtle p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(201,165,92,0.08)]"
                >
                  {/* Hover glow effect */}
                  <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all duration-300" />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                          {getInvestmentIcon(investment.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">{investment.name}</h3>
                          <p className="text-sm text-text-secondary">
                            {getInvestmentLabel(investment.type)} • {investment.institution}
                          </p>
                          {investment.isSip && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-lg text-xs text-accent">
                              SIP: {formatCurrency(investment.sipAmount || 0)}/month
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(investment)}
                          className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-text-tertiary hover:text-accent" />
                        </button>
                        <button
                          onClick={() => handleDelete(investment.id)}
                          className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-text-tertiary hover:text-error" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Invested</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(investment.investedAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Current Value</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(investment.currentValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Returns</p>
                        <p
                          className={`text-sm font-semibold ${
                            returns >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {returns >= 0 ? '+' : ''}
                          {returnsPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </motion.main>

      {/* Add/Edit Investment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative overflow-hidden bg-bg-secondary rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-glass-border"
            >
              {/* Modal glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {editingInvestment ? 'Edit Investment' : 'Add Investment'}
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Investment Type */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {INVESTMENT_TYPES.map((it) => (
                        <button
                          key={it.type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: it.type })}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                            formData.type === it.type
                              ? 'border-accent bg-accent/15 shadow-[0_0_12px_rgba(201,169,98,0.25)] scale-[1.02]'
                              : 'border-white/10 hover:bg-bg-tertiary hover:border-white/20'
                          }`}
                        >
                          <span className={formData.type === it.type ? 'text-accent' : 'text-text-tertiary'}>
                            {it.icon}
                          </span>
                          <span className={`text-xs font-medium transition-colors ${
                            formData.type === it.type ? 'text-accent' : 'text-text-secondary'
                          }`}>{it.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      placeholder="e.g., HDFC Top 200"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Symbol/Code</label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      placeholder="e.g., INF179K01XX7"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      placeholder="e.g., HDFC Mutual Fund"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Invested Amount</label>
                      <input
                        type="number"
                        value={formData.investedAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, investedAmount: Number(e.target.value) })
                        }
                        className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                        placeholder="10000"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Current Value</label>
                      <input
                        type="number"
                        value={formData.currentValue}
                        onChange={(e) =>
                          setFormData({ ...formData, currentValue: Number(e.target.value) })
                        }
                        className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                        placeholder="12000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Units (optional)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.units}
                        onChange={(e) =>
                          setFormData({ ...formData, units: Number(e.target.value) })
                        }
                        className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">NAV (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.nav}
                        onChange={(e) =>
                          setFormData({ ...formData, nav: Number(e.target.value) })
                        }
                        className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchaseDate.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: new Date(e.target.value) })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* SIP Toggle */}
                  <div className="flex items-center justify-between p-4 bg-bg-tertiary/50 rounded-xl border border-white/5">
                    <span className="text-sm text-text-primary">SIP Investment</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isSip: !formData.isSip })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isSip ? 'bg-accent' : 'bg-bg-secondary'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.isSip ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {formData.isSip && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-text-secondary block mb-2">SIP Amount</label>
                        <input
                          type="number"
                          value={formData.sipAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, sipAmount: Number(e.target.value) })
                          }
                          className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                          placeholder="5000"
                          required={formData.isSip}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary block mb-2">SIP Date</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.sipDate}
                          onChange={(e) =>
                            setFormData({ ...formData, sipDate: Number(e.target.value) })
                          }
                          className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                          required={formData.isSip}
                        />
                      </div>
                    </div>
                  )}

                  {/* Watchlist Toggle */}
                  <div className="flex items-center justify-between p-4 bg-bg-tertiary/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      {formData.isWatchlist ? <Eye className="w-4 h-4 text-accent" /> : <EyeOff className="w-4 h-4 text-text-tertiary" />}
                      <span className="text-sm text-text-primary">Add to Watchlist</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isWatchlist: !formData.isWatchlist })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isWatchlist ? 'bg-accent' : 'bg-bg-secondary'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.isWatchlist ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dynamic Type-Specific Fields */}
                  {investmentTypeSpecificFields[formData.type]?.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-accent uppercase tracking-wider mb-4">
                        {INVESTMENT_TYPES.find(it => it.type === formData.type)?.label} Details
                      </p>
                      <div className="space-y-4">
                        {investmentTypeSpecificFields[formData.type].map((fieldConfig) => (
                          <div key={fieldConfig.field}>
                            <label className="text-sm text-text-secondary block mb-2">
                              {fieldConfig.label}
                            </label>
                            {fieldConfig.type === 'select' ? (
                              <select
                                value={(formData[fieldConfig.field] as string) || ''}
                                onChange={(e) =>
                                  setFormData({ ...formData, [fieldConfig.field]: e.target.value })
                                }
                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                              >
                                <option value="">{fieldConfig.placeholder}</option>
                                {fieldConfig.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : fieldConfig.type === 'date' ? (
                              <input
                                type="date"
                                value={(formData[fieldConfig.field] as string) || ''}
                                onChange={(e) =>
                                  setFormData({ ...formData, [fieldConfig.field]: e.target.value })
                                }
                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                              />
                            ) : (
                              <input
                                type={fieldConfig.type}
                                value={(formData[fieldConfig.field] as string | number) || ''}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    [fieldConfig.field]:
                                      fieldConfig.type === 'number'
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  })
                                }
                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                                placeholder={fieldConfig.placeholder}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-accent text-bg-primary font-semibold rounded-xl hover:bg-accent-light transition-colors"
                  >
                    {editingInvestment ? 'Update Investment' : 'Add Investment'}
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
