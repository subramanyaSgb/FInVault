'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Shield,
  Bell,
  Palette,
  Globe,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Info,
  LogOut,
  FileJson,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation,
  Check,
  Tags,
  Sparkles,
  ExternalLink,
  Fingerprint,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { checkBiometricAvailability, getBiometricErrorMessage } from '@/lib/biometric'
import { useRouter } from 'next/navigation'
import {
  exportEncryptedBackup,
  exportPlainBackup,
  exportTransactionsCSV,
  importPlainBackup,
  importEncryptedBackup,
  generateSummaryReport,
  downloadFile,
  printReport,
} from '@/lib/backup'
import { allNavItems, defaultBottomNavItems } from '@/components/layouts/BottomNav'
import { setGeminiApiKey, getGeminiKeyStatus } from '@/lib/ai/gemini'

type SettingsSection = 'main' | 'profile' | 'security' | 'notifications' | 'appearance' | 'navigation' | 'ai' | 'data' | 'about'

const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

const themes = [
  { id: 'dark', name: 'Dark', description: 'Default dark theme' },
  { id: 'light', name: 'Light', description: 'Light mode' },
  { id: 'system', name: 'System', description: 'Follow system preference' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { currentProfile, updateSettings, changePIN, logout, enrollBiometric, disableBiometric } = useAuthStore()
  const [section, setSection] = useState<SettingsSection>('main')
  const [showChangePIN, setShowChangePIN] = useState(false)
  const [pinData, setPinData] = useState({ oldPin: '', newPin: '', confirmPin: '' })
  const [showOldPin, setShowOldPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricStatus, setBiometricStatus] = useState<string>('')
  const [showBiometricEnroll, setShowBiometricEnroll] = useState(false)
  const [biometricPin, setBiometricPin] = useState('')
  const [biometricError, setBiometricError] = useState('')
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [showBiometricPin, setShowBiometricPin] = useState(false)

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      const availability = await checkBiometricAvailability()
      setBiometricAvailable(availability === 'available')
      if (availability !== 'available') {
        setBiometricStatus(getBiometricErrorMessage(availability))
      }
    }
    checkBiometric()
  }, [])

  // Data management state
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [dataMessage, setDataMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showExportPassword, setShowExportPassword] = useState(false)
  const [exportPassword, setExportPassword] = useState('')
  const [showImportPassword, setShowImportPassword] = useState(false)
  const [importPassword, setImportPassword] = useState('')
  const importFileRef = useRef<HTMLInputElement>(null)
  const [importFile, setImportFile] = useState<File | null>(null)

  // AI settings state
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false)
  const geminiStatus = getGeminiKeyStatus()

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-secondary">Please log in to access settings</p>
      </div>
    )
  }

  const handleChangePIN = async () => {
    setPinError('')
    setPinSuccess(false)

    if (pinData.newPin !== pinData.confirmPin) {
      setPinError('New PIN and confirmation do not match')
      return
    }

    if (pinData.newPin.length < 4) {
      setPinError('PIN must be at least 4 digits')
      return
    }

    try {
      await changePIN(pinData.oldPin, pinData.newPin)
      setPinSuccess(true)
      setPinData({ oldPin: '', newPin: '', confirmPin: '' })
      setTimeout(() => {
        setShowChangePIN(false)
        setPinSuccess(false)
      }, 2000)
    } catch (error) {
      setPinError(error instanceof Error ? error.message : 'Failed to change PIN')
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout()
      router.push('/')
    }
  }

  // Data export handlers
  const handleExportEncrypted = async () => {
    if (!currentProfile || !exportPassword) return
    setIsExporting(true)
    setDataMessage(null)
    try {
      const blob = await exportEncryptedBackup(currentProfile.id, exportPassword)
      const date = new Date().toISOString().split('T')[0]
      downloadFile(blob, `finvault-backup-${date}.encrypted.json`)
      setDataMessage({ type: 'success', text: 'Encrypted backup downloaded successfully!' })
      setExportPassword('')
      setShowExportPassword(false)
    } catch (error) {
      setDataMessage({ type: 'error', text: error instanceof Error ? error.message : 'Export failed' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPlain = async () => {
    if (!currentProfile) return
    setIsExporting(true)
    setDataMessage(null)
    try {
      const blob = await exportPlainBackup(currentProfile.id)
      const date = new Date().toISOString().split('T')[0]
      downloadFile(blob, `finvault-backup-${date}.json`)
      setDataMessage({ type: 'success', text: 'Backup downloaded successfully!' })
    } catch (error) {
      setDataMessage({ type: 'error', text: error instanceof Error ? error.message : 'Export failed' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    if (!currentProfile) return
    setIsExporting(true)
    setDataMessage(null)
    try {
      const blob = await exportTransactionsCSV(currentProfile.id)
      const date = new Date().toISOString().split('T')[0]
      downloadFile(blob, `finvault-transactions-${date}.csv`)
      setDataMessage({ type: 'success', text: 'Transactions CSV downloaded!' })
    } catch (error) {
      setDataMessage({ type: 'error', text: error instanceof Error ? error.message : 'Export failed' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!currentProfile) return
    setIsExporting(true)
    setDataMessage(null)
    try {
      const html = await generateSummaryReport(currentProfile.id)
      printReport(html)
      setDataMessage({ type: 'success', text: 'Report opened in new window!' })
    } catch (error) {
      setDataMessage({ type: 'error', text: error instanceof Error ? error.message : 'Report generation failed' })
    } finally {
      setIsExporting(false)
    }
  }

  // Data import handlers
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      // Check if it's an encrypted backup
      if (file.name.includes('.encrypted.')) {
        setShowImportPassword(true)
      }
    }
  }

  const handleImport = async () => {
    if (!currentProfile || !importFile) return
    setIsImporting(true)
    setDataMessage(null)
    try {
      let result
      if (importFile.name.includes('.encrypted.') && importPassword) {
        result = await importEncryptedBackup(importFile, importPassword, currentProfile.id)
      } else {
        result = await importPlainBackup(importFile, currentProfile.id)
      }

      if (result.success) {
        setDataMessage({ type: 'success', text: `Imported ${result.itemsImported} items successfully!` })
        setImportFile(null)
        setImportPassword('')
        setShowImportPassword(false)
      } else {
        setDataMessage({ type: 'error', text: result.error ?? 'Import failed' })
      }
    } catch (error) {
      setDataMessage({ type: 'error', text: error instanceof Error ? error.message : 'Import failed' })
    } finally {
      setIsImporting(false)
    }
  }

  const renderMainMenu = () => (
    <div className="space-y-3">
      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-alpha to-transparent overflow-hidden border border-glass-border">
            {currentProfile.avatar ? (
              <img src={currentProfile.avatar} alt={currentProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-display text-accent-primary">
                {currentProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary">{currentProfile.name}</h3>
            {currentProfile.email && (
              <p className="text-sm text-text-secondary">{currentProfile.email}</p>
            )}
            <p className="text-xs text-text-tertiary">
              Member since {new Date(currentProfile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setSection('profile')}
            className="p-2.5 hover:bg-accent-alpha rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>
      </motion.div>

      {/* Settings Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card divide-y divide-glass-border overflow-hidden"
      >
        <MenuItem
          icon={<Shield className="w-5 h-5" />}
          label="Security"
          description="PIN, biometrics, privacy"
          onClick={() => setSection('security')}
        />
        <MenuItem
          icon={<Bell className="w-5 h-5" />}
          label="Notifications"
          description="Reminders, alerts"
          onClick={() => setSection('notifications')}
        />
        <MenuItem
          icon={<Palette className="w-5 h-5" />}
          label="Appearance"
          description="Theme, currency, language"
          onClick={() => setSection('appearance')}
        />
        <MenuItem
          icon={<Navigation className="w-5 h-5" />}
          label="Navigation"
          description="Customize bottom navigation"
          onClick={() => setSection('navigation')}
        />
        <MenuItem
          icon={<Tags className="w-5 h-5" />}
          label="Categories"
          description="Manage transaction categories"
          onClick={() => router.push('/settings/categories')}
        />
        <MenuItem
          icon={<Sparkles className="w-5 h-5" />}
          label="AI Features"
          description={geminiStatus.configured ? 'Gemini AI configured' : 'Configure Gemini API'}
          onClick={() => setSection('ai')}
        />
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card divide-y divide-glass-border overflow-hidden"
      >
        <MenuItem
          icon={<Download className="w-5 h-5" />}
          label="Data Management"
          description="Export, import, backup"
          onClick={() => setSection('data')}
        />
      </motion.div>

      {/* About & Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card divide-y divide-glass-border overflow-hidden"
      >
        <MenuItem
          icon={<Info className="w-5 h-5" />}
          label="About"
          description="Version info, licenses"
          onClick={() => setSection('about')}
        />
      </motion.div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={handleLogout}
        className="w-full bg-error-bg/50 backdrop-blur-sm rounded-2xl p-4 border border-error/20 flex items-center gap-3 hover:bg-error-bg transition-colors"
      >
        <LogOut className="w-5 h-5 text-error" />
        <span className="text-error font-medium">Log Out</span>
      </motion.button>
    </div>
  )

  const renderProfileSection = () => (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-card p-6 border border-white/5 text-center">
        <div className="w-24 h-24 rounded-full bg-accent-alpha mx-auto overflow-hidden mb-4">
          {currentProfile.avatar ? (
            <img src={currentProfile.avatar} alt={currentProfile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-accent-primary">
              {currentProfile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold text-text-primary">{currentProfile.name}</h3>
        {currentProfile.email && <p className="text-text-secondary">{currentProfile.email}</p>}
        {currentProfile.phone && <p className="text-text-tertiary">{currentProfile.phone}</p>}
      </div>

      <div className="bg-bg-secondary rounded-card p-4 border border-white/5 space-y-4">
        <div>
          <label className="text-sm text-text-secondary block mb-2">Display Name</label>
          <input
            type="text"
            value={currentProfile.name}
            disabled
            className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary opacity-50"
          />
          <p className="text-xs text-text-tertiary mt-1">Name editing coming soon</p>
        </div>
      </div>

      <div className="bg-error-bg rounded-card p-4 border border-error/20">
        <h4 className="font-semibold text-error mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Danger Zone
        </h4>
        <p className="text-sm text-text-secondary mb-3">
          Deleting your profile will permanently remove all your data.
        </p>
        <button
          onClick={() => alert('Profile deletion requires confirmation - feature coming soon')}
          className="px-4 py-2 bg-error text-white rounded-button text-sm"
        >
          Delete Profile
        </button>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-4">
      {/* PIN Management */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-accent-primary" />
          PIN Security
        </h4>
        <button
          onClick={() => setShowChangePIN(true)}
          className="w-full py-3 bg-accent-alpha text-accent-primary font-medium rounded-button hover:bg-accent-primary hover:text-bg-primary transition-colors"
        >
          Change PIN
        </button>
      </div>

      {/* Biometric */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5 text-text-secondary" />
            <div>
              <p className="text-text-primary font-medium">Biometric Login</p>
              <p className="text-xs text-text-tertiary">
                {!biometricAvailable
                  ? biometricStatus || 'Not available on this device'
                  : currentProfile.biometricEnabled
                    ? 'Enabled - Use fingerprint or face ID'
                    : 'Use fingerprint or face ID'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentProfile.biometricEnabled}
              disabled={!biometricAvailable}
              onChange={() => {
                if (currentProfile.biometricEnabled) {
                  // Disable biometric
                  if (confirm('Disable biometric login?')) {
                    disableBiometric()
                  }
                } else {
                  // Show enrollment modal
                  setShowBiometricEnroll(true)
                }
              }}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary ${!biometricAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
          </label>
        </div>
        {currentProfile.biometricEnabled && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-success flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              Biometric authentication is active
            </p>
          </div>
        )}
      </div>

      {/* Auto Lock */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3">Auto Lock Timeout</h4>
        <select
          value={currentProfile.settings.autoLockTimeout}
          onChange={e => updateSettings({ autoLockTimeout: Number(e.target.value) })}
          className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary"
        >
          <option value={1}>1 minute</option>
          <option value={5}>5 minutes</option>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={0}>Never</option>
        </select>
      </div>

      {/* Screenshot Protection */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary font-medium">Screenshot Protection</p>
            <p className="text-xs text-text-tertiary">Prevent screenshots in the app</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentProfile.settings.screenshotProtection}
              onChange={e => updateSettings({ screenshotProtection: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5 space-y-4">
        <NotificationToggle
          label="Bill Reminders"
          description="Get notified about upcoming bills"
          checked={currentProfile.settings.notifications.billReminders}
          onChange={checked =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, billReminders: checked },
            })
          }
        />
        <NotificationToggle
          label="Budget Alerts"
          description="When you're close to budget limits"
          checked={currentProfile.settings.notifications.budgetAlerts}
          onChange={checked =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, budgetAlerts: checked },
            })
          }
        />
        <NotificationToggle
          label="Investment Updates"
          description="Portfolio changes and dividends"
          checked={currentProfile.settings.notifications.investmentUpdates}
          onChange={checked =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, investmentUpdates: checked },
            })
          }
        />
        <NotificationToggle
          label="Policy Renewals"
          description="Insurance policy reminders"
          checked={currentProfile.settings.notifications.policyRenewals}
          onChange={checked =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, policyRenewals: checked },
            })
          }
        />
        <NotificationToggle
          label="Document Expiry"
          description="When documents are about to expire"
          checked={currentProfile.settings.notifications.documentExpiry}
          onChange={checked =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, documentExpiry: checked },
            })
          }
        />
        <NotificationToggle
          label="Subscription Renewals"
          description="Upcoming subscription charges"
          checked={currentProfile.settings.notifications.subscriptionRenewals}
          onChange={checked =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, subscriptionRenewals: checked },
            })
          }
        />
        <NotificationToggle
          label="Goal Milestones"
          description="When you reach savings goals"
          checked={currentProfile.settings.notifications.goalMilestones}
          onChange={checked =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, goalMilestones: checked },
            })
          }
        />
      </div>

      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3">Reminder Days Before</h4>
        <select
          value={currentProfile.settings.notifications.reminderDays}
          onChange={e =>
            updateSettings({
              notifications: { ...currentProfile.settings.notifications, reminderDays: Number(e.target.value) },
            })
          }
          className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary"
        >
          <option value={1}>1 day</option>
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
        </select>
      </div>
    </div>
  )

  const renderAppearanceSection = () => (
    <div className="space-y-4">
      {/* Currency */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent-primary" />
          Currency
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {currencies.map(c => (
            <button
              key={c.code}
              onClick={() => updateSettings({ currency: c.code })}
              className={`p-3 rounded-lg border text-left transition-colors ${
                currentProfile.settings.currency === c.code
                  ? 'border-accent-primary bg-accent-alpha'
                  : 'border-white/10 hover:bg-bg-tertiary'
              }`}
            >
              <p className="text-lg font-semibold text-text-primary">
                {c.symbol} {c.code}
              </p>
              <p className="text-xs text-text-tertiary">{c.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
          <Palette className="w-5 h-5 text-accent-primary" />
          Theme
        </h4>
        <div className="space-y-2">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => updateSettings({ theme: t.id as 'dark' | 'light' | 'system' })}
              className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center justify-between ${
                currentProfile.settings.theme === t.id
                  ? 'border-accent-primary bg-accent-alpha'
                  : 'border-white/10 hover:bg-bg-tertiary'
              }`}
            >
              <div>
                <p className="font-medium text-text-primary">{t.name}</p>
                <p className="text-xs text-text-tertiary">{t.description}</p>
              </div>
              {currentProfile.settings.theme === t.id && (
                <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-bg-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date Format */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3">Date Format</h4>
        <select
          value={currentProfile.settings.dateFormat}
          onChange={e => updateSettings({ dateFormat: e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' })}
          className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary"
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      {/* Number Format */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3">Number Format</h4>
        <select
          value={currentProfile.settings.numberFormat}
          onChange={e => updateSettings({ numberFormat: e.target.value as 'indian' | 'international' })}
          className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary"
        >
          <option value="indian">Indian (1,00,000)</option>
          <option value="international">International (100,000)</option>
        </select>
      </div>
    </div>
  )

  const renderNavigationSection = () => {
    const currentNavItems = currentProfile.settings.bottomNavItems || defaultBottomNavItems
    const maxItems = 4

    const toggleNavItem = (itemId: string) => {
      let newItems: string[]

      if (currentNavItems.includes(itemId)) {
        // Remove item
        newItems = currentNavItems.filter(id => id !== itemId)
      } else {
        // Add item (if under max)
        if (currentNavItems.length >= maxItems) {
          // Replace the last item
          newItems = [...currentNavItems.slice(0, maxItems - 1), itemId]
        } else {
          newItems = [...currentNavItems, itemId]
        }
      }

      updateSettings({ bottomNavItems: newItems })
    }

    const moveItem = (itemId: string, direction: 'up' | 'down') => {
      const index = currentNavItems.indexOf(itemId)
      if (index === -1) return

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= currentNavItems.length) return

      const newItems = [...currentNavItems]
      const temp = newItems[index]
      newItems[index] = newItems[newIndex] as string
      newItems[newIndex] = temp as string

      updateSettings({ bottomNavItems: newItems })
    }

    return (
      <div className="space-y-4">
        {/* Info */}
        <div className="bg-accent-alpha/30 rounded-card p-4 border border-accent-primary/20">
          <p className="text-sm text-text-secondary">
            <strong className="text-accent-primary">Tip:</strong> Select up to {maxItems} items to show in your bottom navigation bar.
            Other items will appear in the &quot;More&quot; menu.
          </p>
        </div>

        {/* Selected Items (Primary Nav) */}
        <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
          <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-accent-primary" />
            Primary Navigation ({currentNavItems.length}/{maxItems})
          </h4>
          <div className="space-y-2">
            {currentNavItems.map((itemId, index) => {
              const item = allNavItems.find(nav => nav.id === itemId)
              if (!item) return null
              const Icon = item.icon

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg border border-accent-primary/30"
                >
                  <Icon className="w-5 h-5 text-accent-primary" />
                  <span className="flex-1 text-text-primary font-medium">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveItem(item.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4 text-text-tertiary rotate-90" />
                    </button>
                    <button
                      onClick={() => moveItem(item.id, 'down')}
                      disabled={index === currentNavItems.length - 1}
                      className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4 text-text-tertiary -rotate-90" />
                    </button>
                    <button
                      onClick={() => toggleNavItem(item.id)}
                      className="p-1.5 rounded hover:bg-error/20 text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Available Items */}
        <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
          <h4 className="font-semibold text-text-primary mb-4">Available Items</h4>
          <div className="grid grid-cols-2 gap-2">
            {allNavItems.map(item => {
              const isSelected = currentNavItems.includes(item.id)
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  onClick={() => toggleNavItem(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-accent-primary bg-accent-alpha text-accent-primary'
                      : 'border-white/10 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => updateSettings({ bottomNavItems: defaultBottomNavItems })}
          className="w-full py-3 border border-white/10 text-text-secondary rounded-button hover:bg-bg-tertiary transition-colors"
        >
          Reset to Default
        </button>
      </div>
    )
  }

  const renderDataSection = () => (
    <div className="space-y-4">
      {/* Status Message */}
      {dataMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-card flex items-center gap-3 ${
            dataMessage.type === 'success' ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
          }`}
        >
          {dataMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{dataMessage.text}</p>
        </motion.div>
      )}

      {/* Export Options */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-accent-primary" />
          Export Data
        </h4>
        <div className="space-y-3">
          <button
            onClick={() => setShowExportPassword(true)}
            disabled={isExporting}
            className="w-full flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <FileJson className="w-5 h-5 text-accent-primary" />
            <div className="flex-1">
              <p className="text-text-primary font-medium">Encrypted Backup</p>
              <p className="text-xs text-text-tertiary">Password-protected JSON file</p>
            </div>
          </button>

          <button
            onClick={handleExportPlain}
            disabled={isExporting}
            className="w-full flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <FileJson className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-text-primary font-medium">Plain JSON Backup</p>
              <p className="text-xs text-text-tertiary">Unencrypted, readable format</p>
            </div>
            {isExporting && <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="w-full flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <FileSpreadsheet className="w-5 h-5 text-success" />
            <div className="flex-1">
              <p className="text-text-primary font-medium">Transactions CSV</p>
              <p className="text-xs text-text-tertiary">Import into spreadsheets</p>
            </div>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isExporting}
            className="w-full flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <FileText className="w-5 h-5 text-warning" />
            <div className="flex-1">
              <p className="text-text-primary font-medium">Financial Report</p>
              <p className="text-xs text-text-tertiary">Print or save as PDF</p>
            </div>
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-accent-primary" />
          Import Data
        </h4>
        <input
          ref={importFileRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />
        {!importFile ? (
          <button
            onClick={() => importFileRef.current?.click()}
            className="w-full p-6 border-2 border-dashed border-white/10 rounded-lg hover:border-accent-primary/50 transition-colors"
          >
            <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-text-secondary">Click to select a backup file</p>
            <p className="text-xs text-text-tertiary mt-1">Supports .json and .encrypted.json</p>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <FileJson className="w-5 h-5 text-accent-primary" />
              <div className="flex-1">
                <p className="text-text-primary font-medium">{importFile.name}</p>
                <p className="text-xs text-text-tertiary">
                  {(importFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  setImportFile(null)
                  setShowImportPassword(false)
                  setImportPassword('')
                }}
                className="text-text-tertiary hover:text-error"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {showImportPassword && (
              <div>
                <label className="text-sm text-text-secondary block mb-2">Backup Password</label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={e => setImportPassword(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary"
                  placeholder="Enter backup password"
                />
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={isImporting || (showImportPassword && !importPassword)}
              className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Backup
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="bg-warning-bg rounded-card p-4 border border-warning/20">
        <p className="text-sm text-warning">
          <strong>Note:</strong> Importing data will add to your existing data, not replace it.
          Duplicate entries may be created.
        </p>
      </div>
    </div>
  )

  const handleSaveApiKey = async () => {
    if (!currentProfile || !apiKeyInput.trim()) return

    // Update profile AI settings
    const updatedAI = {
      ...currentProfile.ai,
      apiKey: apiKeyInput.trim(),
      apiProvider: 'gemini' as const,
    }

    // Update in store (which persists to DB)
    await useAuthStore.getState().updateAISettings(updatedAI)

    // Update runtime API key
    setGeminiApiKey(apiKeyInput.trim())

    setAiSaveSuccess(true)
    setApiKeyInput('')
    setTimeout(() => setAiSaveSuccess(false), 3000)
  }

  const handleRemoveApiKey = async () => {
    if (!currentProfile) return

    if (!confirm('Remove your Gemini API key? AI features will stop working.')) return

    // Update profile AI settings - remove apiKey by spreading without it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey: _, ...restAI } = currentProfile.ai
    const updatedAI = {
      ...restAI,
      apiKey: '', // Set to empty string to clear it
    }

    await useAuthStore.getState().updateAISettings(updatedAI)
    setGeminiApiKey(undefined)
  }

  const renderAISection = () => (
    <div className="space-y-4">
      {/* AI Status */}
      <div className={`rounded-card p-4 border ${geminiStatus.configured ? 'bg-success-bg/30 border-success/20' : 'bg-accent-alpha/30 border-accent-primary/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${geminiStatus.configured ? 'bg-success/20' : 'bg-accent-alpha'}`}>
            <Sparkles className={`w-5 h-5 ${geminiStatus.configured ? 'text-success' : 'text-accent-primary'}`} />
          </div>
          <div className="flex-1">
            <p className="text-text-primary font-medium">
              {geminiStatus.configured ? 'AI Features Active' : 'AI Not Configured'}
            </p>
            <p className="text-xs text-text-tertiary">
              {geminiStatus.configured
                ? `API Key: ${geminiStatus.masked}`
                : 'Add your Gemini API key to enable AI features'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {aiSaveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-card bg-success-bg text-success flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm">API key saved successfully!</p>
        </motion.div>
      )}

      {/* API Key Input */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-primary" />
          Gemini API Key
        </h4>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary pr-10"
              placeholder={geminiStatus.configured ? 'Enter new API key to update' : 'Enter your Gemini API key'}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={handleSaveApiKey}
            disabled={!apiKeyInput.trim()}
            className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {geminiStatus.configured ? 'Update API Key' : 'Save API Key'}
          </button>

          {geminiStatus.configured && (
            <button
              onClick={handleRemoveApiKey}
              className="w-full py-3 border border-error/30 text-error rounded-button hover:bg-error/10 transition-colors"
            >
              Remove API Key
            </button>
          )}
        </div>
      </div>

      {/* Get API Key Instructions */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3">How to get your API key</h4>
        <ol className="space-y-2 text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="text-accent-primary font-semibold">1.</span>
            <span>Visit Google AI Studio</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent-primary font-semibold">2.</span>
            <span>Sign in with your Google account</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent-primary font-semibold">3.</span>
            <span>Click &quot;Get API key&quot; and create a new key</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent-primary font-semibold">4.</span>
            <span>Copy the key and paste it above</span>
          </li>
        </ol>

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full py-3 border border-accent-primary/30 text-accent-primary rounded-button hover:bg-accent-alpha transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open Google AI Studio
        </a>
      </div>

      {/* AI Features Info */}
      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-3">Powered AI Features</h4>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            Smart transaction categorization
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            Receipt scanning with OCR
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            Spending insights & analysis
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            Budget recommendations
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            Financial Q&A assistant
          </li>
        </ul>
      </div>

      {/* Privacy Note */}
      <div className="bg-accent-alpha/20 rounded-card p-4 border border-accent-primary/20">
        <p className="text-sm text-text-secondary">
          <strong className="text-accent-primary">Privacy:</strong> Your API key is stored locally on your device.
          When using AI features, only transaction descriptions (not amounts or personal data) are sent to Google&apos;s servers.
        </p>
      </div>
    </div>
  )

  const renderAboutSection = () => (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-card p-6 border border-white/5 text-center">
        <div className="w-20 h-20 rounded-2xl bg-accent-alpha mx-auto mb-4 flex items-center justify-center">
          <span className="text-4xl">💰</span>
        </div>
        <h3 className="text-xl font-bold text-text-primary">FinVault</h3>
        <p className="text-text-secondary">Privacy-First Finance Manager</p>
        <p className="text-sm text-text-tertiary mt-2">Version 1.0.0</p>
      </div>

      <div className="bg-bg-secondary rounded-card p-4 border border-white/5 space-y-3">
        <div className="flex justify-between">
          <span className="text-text-secondary">Build</span>
          <span className="text-text-primary">2024.02.05</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Environment</span>
          <span className="text-text-primary">Production</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Storage</span>
          <span className="text-text-primary">Local (IndexedDB)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Encryption</span>
          <span className="text-accent-primary">AES-256-GCM</span>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
        <h4 className="font-medium text-text-primary mb-2">Privacy</h4>
        <p className="text-sm text-text-secondary">
          All your data is stored locally on your device and encrypted with AES-256-GCM.
          No data is sent to any server unless you explicitly enable cloud backup.
        </p>
      </div>
    </div>
  )

  const getSectionTitle = () => {
    switch (section) {
      case 'profile':
        return 'Profile'
      case 'security':
        return 'Security'
      case 'notifications':
        return 'Notifications'
      case 'appearance':
        return 'Appearance'
      case 'navigation':
        return 'Navigation'
      case 'ai':
        return 'AI Features'
      case 'data':
        return 'Data Management'
      case 'about':
        return 'About'
      default:
        return 'Settings'
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20 relative z-10">
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (section === 'main' ? router.back() : setSection('main'))}
            className="p-2.5 bg-bg-secondary/50 hover:bg-bg-tertiary rounded-xl border border-glass-border transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <p className="text-xs text-accent-primary font-medium tracking-[0.15em] uppercase">Settings</p>
            <h1 className="text-lg font-semibold text-text-primary">{getSectionTitle()}</h1>
          </div>
        </div>
      </header>

      <main className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {section === 'main' && renderMainMenu()}
            {section === 'profile' && renderProfileSection()}
            {section === 'security' && renderSecuritySection()}
            {section === 'notifications' && renderNotificationsSection()}
            {section === 'appearance' && renderAppearanceSection()}
            {section === 'navigation' && renderNavigationSection()}
            {section === 'ai' && renderAISection()}
            {section === 'data' && renderDataSection()}
            {section === 'about' && renderAboutSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Export Password Modal */}
      <AnimatePresence>
        {showExportPassword && (
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
              className="bg-bg-secondary rounded-card p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-2">Encrypted Backup</h3>
              <p className="text-sm text-text-secondary mb-4">
                Enter a password to encrypt your backup. You&apos;ll need this password to restore the backup.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Backup Password</label>
                  <input
                    type="password"
                    value={exportPassword}
                    onChange={e => setExportPassword(e.target.value)}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary"
                    placeholder="Enter a strong password"
                  />
                  <p className="text-xs text-text-tertiary mt-1">Minimum 6 characters recommended</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExportPassword(false)
                      setExportPassword('')
                    }}
                    className="flex-1 py-3 border border-white/10 text-text-primary rounded-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExportEncrypted}
                    disabled={!exportPassword || exportPassword.length < 4 || isExporting}
                    className="flex-1 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric Enrollment Modal */}
      <AnimatePresence>
        {showBiometricEnroll && (
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
              className="bg-bg-secondary rounded-card p-6 w-full max-w-sm"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent-alpha mx-auto mb-4 flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-accent-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Enable Biometric Login</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Enter your PIN to confirm and enable biometric authentication
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Current PIN</label>
                  <div className="relative">
                    <input
                      type={showBiometricPin ? 'text' : 'password'}
                      value={biometricPin}
                      onChange={e => {
                        setBiometricPin(e.target.value)
                        setBiometricError('')
                      }}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary pr-10"
                      placeholder="Enter your PIN"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowBiometricPin(!showBiometricPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    >
                      {showBiometricPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {biometricError && (
                  <div className="p-3 rounded-lg bg-error-bg border border-error/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                    <p className="text-sm text-error">{biometricError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowBiometricEnroll(false)
                      setBiometricPin('')
                      setBiometricError('')
                    }}
                    disabled={biometricLoading}
                    className="flex-1 py-3 border border-white/10 text-text-primary rounded-button disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!biometricPin || biometricPin.length < 4) {
                        setBiometricError('Please enter your PIN')
                        return
                      }

                      setBiometricLoading(true)
                      setBiometricError('')

                      try {
                        const result = await enrollBiometric(biometricPin)

                        if (result.success) {
                          setShowBiometricEnroll(false)
                          setBiometricPin('')
                        } else {
                          setBiometricError(result.error || 'Enrollment failed')
                        }
                      } catch (err) {
                        setBiometricError(err instanceof Error ? err.message : 'Enrollment failed')
                      } finally {
                        setBiometricLoading(false)
                      }
                    }}
                    disabled={!biometricPin || biometricPin.length < 4 || biometricLoading}
                    className="flex-1 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {biometricLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        Enable
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change PIN Modal */}
      <AnimatePresence>
        {showChangePIN && (
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
              className="bg-bg-secondary rounded-card p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4">Change PIN</h3>

              {pinSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-success-bg mx-auto mb-4 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-success font-medium">PIN changed successfully!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Current PIN</label>
                    <div className="relative">
                      <input
                        type={showOldPin ? 'text' : 'password'}
                        value={pinData.oldPin}
                        onChange={e => setPinData({ ...pinData, oldPin: e.target.value })}
                        className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary pr-10"
                        placeholder="Enter current PIN"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPin(!showOldPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                      >
                        {showOldPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">New PIN</label>
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        value={pinData.newPin}
                        onChange={e => setPinData({ ...pinData, newPin: e.target.value })}
                        className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary pr-10"
                        placeholder="Enter new PIN"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                      >
                        {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Confirm New PIN</label>
                    <input
                      type="password"
                      value={pinData.confirmPin}
                      onChange={e => setPinData({ ...pinData, confirmPin: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary"
                      placeholder="Confirm new PIN"
                    />
                  </div>

                  {pinError && <p className="text-sm text-error">{pinError}</p>}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowChangePIN(false)
                        setPinData({ oldPin: '', newPin: '', confirmPin: '' })
                        setPinError('')
                      }}
                      className="flex-1 py-3 border border-white/10 text-text-primary rounded-button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePIN}
                      disabled={!pinData.oldPin || !pinData.newPin || !pinData.confirmPin}
                      className="flex-1 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button disabled:opacity-50"
                    >
                      Change PIN
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 hover:bg-accent-alpha/30 transition-all duration-300 group">
      <div className="w-10 h-10 rounded-xl bg-bg-tertiary/50 flex items-center justify-center text-text-secondary group-hover:text-accent-primary group-hover:bg-accent-alpha transition-all duration-300">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-text-primary font-medium group-hover:text-accent-primary transition-colors">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-accent-primary transition-colors" />
    </button>
  )
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-text-primary font-medium">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
      </label>
    </div>
  )
}
