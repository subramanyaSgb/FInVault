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

    // Clear message after 5 seconds
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
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-bg-secondary rounded-card" />
          <div className="h-64 bg-bg-secondary rounded-card" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bg-secondary rounded-card" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Investments</p>
              <h1 className="text-lg font-semibold text-text-primary">Portfolio</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshPrices}
              disabled={isRefreshingPrices}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors disabled:opacity-50"
              title="Refresh Prices"
            >
              <RefreshCw
                className={`w-5 h-5 text-text-secondary ${isRefreshingPrices ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => {
                setEditingInvestment(null)
                resetForm()
                setShowAddModal(true)
              }}
              className="p-2 bg-accent-alpha rounded-full"
            >
              <Plus className="w-5 h-5 text-accent-primary" />
            </button>
          </div>
        </div>
        {/* Refresh Status Bar */}
        {(lastPriceRefresh || refreshMessage) && (
          <div className="px-4 pb-2 flex items-center justify-between">
            {lastPriceRefresh && (
              <div className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                <span>Updated {formatLastUpdate(lastPriceRefresh)}</span>
              </div>
            )}
            {refreshMessage && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs px-2 py-1 rounded ${
                  refreshMessage.type === 'success'
                    ? 'bg-success-bg text-success'
                    : 'bg-error-bg text-error'
                }`}
              >
                {refreshMessage.text}
              </motion.div>
            )}
          </div>
        )}
      </header>

      <main className="p-4 space-y-6">
        {/* Portfolio Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-card p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Value</p>
              <h2 className="text-display-sm font-bold text-text-primary font-display">
                {formatCurrency(portfolioSummary.currentValue)}
              </h2>
            </div>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                portfolioSummary.totalReturns >= 0 ? 'bg-success-bg' : 'bg-error-bg'
              }`}
            >
              {portfolioSummary.totalReturns >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-error" />
              )}
              <span
                className={`text-sm font-medium ${
                  portfolioSummary.totalReturns >= 0 ? 'text-success' : 'text-error'
                }`}
              >
                {portfolioSummary.returnsPercentage.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-text-tertiary mb-1">Invested</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatCurrency(portfolioSummary.totalInvested)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-1">Returns</p>
              <p
                className={`text-lg font-semibold ${
                  portfolioSummary.totalReturns >= 0 ? 'text-success' : 'text-error'
                }`}
              >
                {portfolioSummary.totalReturns >= 0 ? '+' : ''}
                {formatCurrency(portfolioSummary.totalReturns)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-1">Day Change</p>
              <p
                className={`text-lg font-semibold ${
                  portfolioSummary.dayChange >= 0 ? 'text-success' : 'text-error'
                }`}
              >
                {portfolioSummary.dayChange >= 0 ? '+' : ''}
                {formatCurrency(portfolioSummary.dayChange)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Asset Allocation Chart */}
        {assetAllocation.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-secondary rounded-card p-5 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-accent-primary" />
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
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
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
                  <span className="text-sm text-text-tertiary">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'sip', label: 'SIP' },
            { id: 'watchlist', label: 'Watchlist' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Investments List */}
        <div className="space-y-3">
          {filteredInvestments.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-card">
              <TrendingUp className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">
                {activeTab === 'watchlist' ? 'No watchlist items' : 'No investments added yet'}
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                {activeTab === 'watchlist'
                  ? 'Add investments to your watchlist'
                  : 'Start building your portfolio'}
              </p>
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-bg-secondary rounded-card p-4 border border-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-alpha flex items-center justify-center">
                        {getInvestmentIcon(investment.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{investment.name}</h3>
                        <p className="text-sm text-text-secondary">
                          {getInvestmentLabel(investment.type)} • {investment.institution}
                        </p>
                        {investment.isSip && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-accent-alpha rounded text-xs text-accent-primary">
                            SIP: {formatCurrency(investment.sipAmount || 0)}/month
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(investment)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(investment.id)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Invested</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCurrency(investment.investedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Current Value</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCurrency(investment.currentValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Returns</p>
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
                </motion.div>
              )
            })
          )}
        </div>
      </main>

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
              className="bg-bg-secondary rounded-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-semibold text-text-primary">
                  {editingInvestment ? 'Edit Investment' : 'Add Investment'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
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
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                          formData.type === it.type
                            ? 'border-accent-primary bg-accent-alpha'
                            : 'border-white/10 hover:bg-bg-tertiary'
                        }`}
                      >
                        <span className={formData.type === it.type ? 'text-accent-primary' : 'text-text-secondary'}>
                          {it.icon}
                        </span>
                        <span className="text-xs text-text-secondary">{it.label}</span>
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., INF179K01XX7"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Institution</label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    required
                  />
                </div>

                {/* SIP Toggle */}
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">SIP Investment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isSip: !formData.isSip })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isSip ? 'bg-accent-primary' : 'bg-bg-secondary'
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
                        className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                        className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                        required={formData.isSip}
                      />
                    </div>
                  </div>
                )}

                {/* Watchlist Toggle */}
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    {formData.isWatchlist ? <Eye className="w-4 h-4 text-accent-primary" /> : <EyeOff className="w-4 h-4 text-text-tertiary" />}
                    <span className="text-sm text-text-primary">Add to Watchlist</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isWatchlist: !formData.isWatchlist })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isWatchlist ? 'bg-accent-primary' : 'bg-bg-secondary'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isWatchlist ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors"
                >
                  {editingInvestment ? 'Update Investment' : 'Add Investment'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Padding */}
      <div className="h-20" />
    </div>
  )
}
