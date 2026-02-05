'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Clock, Smile, ShoppingBag, Utensils, Car, Home, Heart, Gamepad2, Briefcase, Plane, Gift, Sparkles } from 'lucide-react'

interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
  selectedEmoji?: string
}

const EMOJI_CATEGORIES = [
  {
    id: 'recent',
    name: 'Recent',
    icon: Clock,
    emojis: [] as string[], // Will be populated from localStorage
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: ShoppingBag,
    emojis: ['🛒', '🛍️', '👜', '👛', '💳', '💰', '💵', '💴', '💶', '💷', '💸', '💲', '🏦', '🏧', '📦', '🎁', '🎀', '🧧', '🎫', '🎟️', '🎪', '🪙', '💎', '👗', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👒', '🎩', '🧢', '👑', '💍', '👓', '🕶️', '👝', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '👢', '👙', '👘', '🥻', '🩴', '🩱', '🩲', '🩳'],
  },
  {
    id: 'food',
    name: 'Food',
    icon: Utensils,
    emojis: ['🍔', '🍕', '🌮', '🌯', '🥗', '🥘', '🍲', '🍛', '🍜', '🍝', '🍣', '🍤', '🍿', '🧁', '🍰', '🎂', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍳', '🥚', '🧀', '🥓', '🥩', '🍗', '🍖', '🌭', '🍟', '🥪', '🥙', '🧆', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🥕', '🌽', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧇', '🥞', '🧈', '🍽️', '🥢', '🍴'],
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: Car,
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥'],
  },
  {
    id: 'home',
    name: 'Home',
    icon: Home,
    emojis: ['🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '🛖', '⛺', '🏕️', '🏗️', '🧱', '🪵', '🪨', '🏘️', '🏚️', '🛏️', '🛋️', '🪑', '🚿', '🛁', '🚽', '🪠', '🧻', '🧹', '🧺', '🪣', '🧽', '🪥', '🧴', '🛒', '🚪', '🪞', '🪟', '🛗', '🧲', '🧭', '🗺️', '🧳'],
  },
  {
    id: 'health',
    name: 'Health',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💝', '💘', '💌', '💊', '💉', '🩹', '🩺', '🏥', '🩻', '🩼', '🦽', '🦼', '🏋️', '🤸', '🧘', '🏃', '🚴', '🏊', '⛹️', '🧗', '🤺', '🥊', '🥋', '🎿', '⛷️', '🏂', '🏄', '🚣', '🤽', '🤾', '🏌️', '🧖', '💪', '🦵', '🦶', '🦷', '🦴', '👁️', '👀', '👃', '👂', '🧠'],
  },
  {
    id: 'entertainment',
    name: 'Fun',
    icon: Gamepad2,
    emojis: ['🎮', '🕹️', '🎲', '🎯', '🎳', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎵', '🎶', '🎙️', '📻', '📺', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💾', '💿', '📀', '🧮', '📼', '🎰', '🃏', '🀄', '🎴', '🎁', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧'],
  },
  {
    id: 'work',
    name: 'Work',
    icon: Briefcase,
    emojis: ['💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💡', '🔦', '🏮', '🪔'],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: Plane,
    emojis: ['🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪'],
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: Gift,
    emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️'],
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: Sparkles,
    emojis: ['✨', '⭐', '🌟', '💫', '🔥', '💥', '⚡', '💢', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🔔', '🔕', '🎵', '🎶', '💹', '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝'],
  },
]

// Get recent emojis from localStorage
const getRecentEmojis = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('finvault-recent-emojis')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save recent emoji to localStorage
const saveRecentEmoji = (emoji: string) => {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentEmojis().filter(e => e !== emoji)
    recent.unshift(emoji)
    localStorage.setItem('finvault-recent-emojis', JSON.stringify(recent.slice(0, 20)))
  } catch {
    // Ignore errors
  }
}

export function EmojiPicker({ isOpen, onClose, onSelect, selectedEmoji }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('recent')

  const recentEmojis = useMemo(() => getRecentEmojis(), [])

  const categories = useMemo(() => {
    const cats = EMOJI_CATEGORIES.map((cat, index) => {
      if (index === 0) {
        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          emojis: recentEmojis,
        }
      }
      return cat
    })
    return cats
  }, [recentEmojis])

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null

    const allEmojis: string[] = []
    categories.forEach(cat => {
      if (cat.id !== 'recent') {
        allEmojis.push(...cat.emojis)
      }
    })
    return [...new Set(allEmojis)]
  }, [searchQuery, categories])

  const handleSelect = (emoji: string) => {
    saveRecentEmoji(emoji)
    onSelect(emoji)
    onClose()
  }

  const activeEmojis = filteredEmojis || categories.find(c => c.id === activeCategory)?.emojis || []

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-4 border-b border-glass-border bg-bg-secondary/50">
              <div
                className="absolute -top-10 -right-10 w-32 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)' }}
              />
              <div className="relative flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] text-accent font-medium tracking-wide uppercase">Choose</p>
                  <h3 className="text-lg font-semibold text-text-primary">Emoji Icon</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-surface-1 hover:bg-surface-2 transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emojis..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
              <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide border-b border-glass-border bg-bg-secondary/30">
                {categories.map((cat) => {
                  const Icon = cat.icon
                  const isActive = activeCategory === cat.id
                  const isEmpty = cat.id === 'recent' && recentEmojis.length === 0

                  if (isEmpty) return null

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-accent text-bg-base'
                          : 'text-text-muted hover:bg-surface-1 hover:text-text-primary'
                      }`}
                      title={cat.name}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Emoji Grid */}
            <div className="p-3 max-h-[300px] overflow-y-auto">
              {activeEmojis.length > 0 ? (
                <div className="grid grid-cols-8 gap-1">
                  {activeEmojis.map((emoji, index) => (
                    <motion.button
                      key={`${emoji}-${index}`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelect(emoji)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-accent/20 ring-2 ring-accent'
                          : 'hover:bg-surface-1'
                      }`}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted">
                    {searchQuery ? 'No emojis found' : 'No recent emojis'}
                  </p>
                  {!searchQuery && activeCategory === 'recent' && (
                    <p className="text-xs text-text-tertiary mt-1">
                      Select an emoji to add it here
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Preview */}
            {selectedEmoji && (
              <div className="p-3 border-t border-glass-border bg-bg-secondary/30 flex items-center justify-between">
                <span className="text-xs text-text-muted">Selected:</span>
                <span className="text-3xl">{selectedEmoji}</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EmojiPicker
