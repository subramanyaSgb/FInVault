'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Mic,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Bot,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAIInsightsStore } from '@/stores/aiInsightsStore'

interface Insight {
  type: 'warning' | 'alert' | 'tip' | 'info'
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
}

export default function AIChatPage() {
  const { currentProfile } = useAuthStore()
  const {
    chatHistory,
    isProcessing,
    loadChatHistory,
    sendMessage,
    getSpendingAnalysis,
    getAnomalies,
    getBudgetRecommendations,
    predictBills,
  } = useAIInsightsStore()
  const [input, setInput] = useState('')
  const [insights, setInsights] = useState<Insight[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadInsights = useCallback(async () => {
    if (!currentProfile) return

    const now = new Date()
    const newInsights: Insight[] = []

    // Spending analysis
    const analysis = await getSpendingAnalysis(
      currentProfile.id,
      now.getMonth(),
      now.getFullYear()
    )
    if (analysis.unusualSpending.length > 0) {
      newInsights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Unusual Spending',
        description: `High spending in: ${analysis.unusualSpending.join(', ')}`,
      })
    }

    // Anomalies
    const anomalies = await getAnomalies(currentProfile.id, 30)
    if (anomalies.length > 0) {
      newInsights.push({
        type: 'alert',
        icon: TrendingUp,
        title: `${anomalies.length} Unusual Transactions`,
        description: 'Review your recent transactions',
      })
    }

    // Budget recommendations
    const recommendations = await getBudgetRecommendations(currentProfile.id)
    if (recommendations.length > 0) {
      newInsights.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Budget Adjustments',
        description: `${recommendations.length} categories need attention`,
      })
    }

    // Upcoming bills
    const bills = await predictBills(currentProfile.id)
    if (bills.length > 0) {
      newInsights.push({
        type: 'info',
        icon: Calendar,
        title: 'Upcoming Bills',
        description: `${bills.length} bills predicted this month`,
      })
    }

    setInsights(newInsights)
  }, [currentProfile, getSpendingAnalysis, getAnomalies, getBudgetRecommendations, predictBills])

  useEffect(() => {
    if (currentProfile) {
      loadChatHistory(currentProfile.id)
      loadInsights()
    }
  }, [currentProfile, loadChatHistory, loadInsights])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSend = async () => {
    if (!input.trim() || !currentProfile || isProcessing) return

    const message = input
    setInput('')
    await sendMessage(currentProfile.id, message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    { label: 'Show my spending', action: () => setInput('How much did I spend this month?') },
    { label: 'Check budget', action: () => setInput('How am I doing with my budgets?') },
    {
      label: 'Unusual transactions',
      action: () => setInput('Are there any unusual transactions?'),
    },
    { label: 'Upcoming bills', action: () => setInput('What bills are coming up?') },
  ]

  const getInsightColors = (type: string) => {
    switch (type) {
      case 'warning':
        return 'from-warning/20 via-warning/10 to-transparent border-warning/30'
      case 'alert':
        return 'from-error/20 via-error/10 to-transparent border-error/30'
      case 'tip':
        return 'from-accent/20 via-accent/10 to-transparent border-accent/30'
      default:
        return 'from-info/20 via-info/10 to-transparent border-info/30'
    }
  }

  const getInsightTextColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-warning'
      case 'alert':
        return 'text-error'
      case 'tip':
        return 'text-accent'
      default:
        return 'text-info'
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col relative z-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">FinVault AI</h1>
              <p className="text-xs text-text-secondary">Your financial assistant</p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 border-b border-glass-border"
        >
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`flex-shrink-0 w-52 p-3 rounded-2xl border bg-gradient-to-br ${getInsightColors(insight.type)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      insight.type === 'warning'
                        ? 'bg-warning/20'
                        : insight.type === 'alert'
                          ? 'bg-error/20'
                          : insight.type === 'tip'
                            ? 'bg-accent/20'
                            : 'bg-info/20'
                    }`}
                  >
                    <insight.icon className={`w-4 h-4 ${getInsightTextColor(insight.type)}`} />
                  </div>
                  <span className={`text-xs font-medium ${getInsightTextColor(insight.type)}`}>
                    {insight.title}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{insight.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Ask me anything</h3>
            <p className="text-sm text-text-secondary mb-6">
              I can help analyze your finances locally
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={action.action}
                  className="px-4 py-2 bg-gradient-to-r from-bg-secondary to-bg-tertiary text-text-secondary text-sm rounded-xl border border-border-subtle hover:border-accent/30 hover:text-text-primary transition-all"
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {chatHistory.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[85%]">
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-accent to-accent-secondary text-bg-primary rounded-br-sm'
                      : message.isError
                        ? 'bg-gradient-to-br from-error/20 via-error/10 to-transparent border border-error/30 text-text-primary rounded-bl-sm'
                        : 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle text-text-primary rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${message.role === 'user' ? 'opacity-70' : 'text-text-tertiary'}`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-info/20 to-info/10 border border-info/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-info" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-accent rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-accent rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-accent rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <div className="p-4 border-t border-glass-border bg-bg-primary/60 backdrop-blur-xl">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your finances..."
              className="w-full pl-4 pr-12 py-3.5 bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle rounded-2xl text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              disabled={isProcessing}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-tertiary hover:text-accent rounded-xl transition-colors"
              disabled={isProcessing}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-3.5 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary rounded-2xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-text-tertiary mt-3">
          AI analyzes your data locally. No information leaves your device.
        </p>
      </div>
    </div>
  )
}
