'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAIInsightsStore } from '@/stores/aiInsightsStore'

interface Insight {
  type: 'warning' | 'alert' | 'tip' | 'info'
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
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
    const analysis = await getSpendingAnalysis(currentProfile.id, now.getMonth(), now.getFullYear())
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

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-bg-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">FinVault AI</h1>
            <p className="text-xs text-text-secondary">Your financial assistant</p>
          </div>
        </div>
      </header>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="p-4 border-b border-white/5">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex-shrink-0 w-48 p-3 rounded-card border ${
                  insight.type === 'warning'
                    ? 'bg-warning-bg border-warning/20'
                    : insight.type === 'alert'
                      ? 'bg-error-bg border-error/20'
                      : insight.type === 'tip'
                        ? 'bg-accent-alpha border-accent-primary/20'
                        : 'bg-info-bg border-info/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <insight.icon
                    className={`w-4 h-4 ${
                      insight.type === 'warning'
                        ? 'text-warning'
                        : insight.type === 'alert'
                          ? 'text-error'
                          : insight.type === 'tip'
                            ? 'text-accent-primary'
                            : 'text-info'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      insight.type === 'warning'
                        ? 'text-warning'
                        : insight.type === 'alert'
                          ? 'text-error'
                          : insight.type === 'tip'
                            ? 'text-accent-primary'
                            : 'text-info'
                    }`}
                  >
                    {insight.title}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{insight.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-accent-alpha flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-accent-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Ask me anything</h3>
            <p className="text-sm text-text-secondary mb-6">I can help analyze your finances</p>

            <div className="flex flex-wrap justify-center gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className="px-4 py-2 bg-bg-secondary text-text-secondary text-sm rounded-full hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {chatHistory.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-accent-primary text-bg-primary rounded-br-sm'
                    : message.isError
                      ? 'bg-error-bg text-error rounded-bl-sm'
                      : 'bg-bg-secondary text-text-primary rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-bg-secondary p-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-bg-primary">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your finances..."
              className="w-full pl-4 pr-12 py-3 bg-bg-secondary border border-white/10 rounded-full text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
              disabled={isProcessing}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-tertiary hover:text-text-primary"
              disabled={isProcessing}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-3 bg-accent-primary text-bg-primary rounded-full hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-text-tertiary mt-2">
          AI analyzes your data locally. No information leaves your device.
        </p>
      </div>
    </div>
  )
}
