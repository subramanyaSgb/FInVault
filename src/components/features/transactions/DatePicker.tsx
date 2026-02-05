'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar, Check } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  subDays,
} from 'date-fns';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const QUICK_OPTIONS = [
  { label: 'Today', getValue: () => new Date() },
  { label: 'Yesterday', getValue: () => subDays(new Date(), 1) },
  { label: 'Last Week', getValue: () => subDays(new Date(), 7) },
  { label: 'Last Month', getValue: () => subDays(new Date(), 30) },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DatePicker({ value, onChange, minDate, maxDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate));
    const end = endOfWeek(endOfMonth(viewDate));
    const days: Date[] = [];

    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const handleSelectDate = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setViewDate(value || new Date());
          setIsOpen(true);
        }}
        className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-left transition-all hover:border-accent/30 flex items-center gap-3 group"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
          <Calendar className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-text-primary font-medium">
            {format(value, 'EEEE, MMM d')}
          </p>
          <p className="text-[10px] text-text-muted">
            {isToday(value) ? 'Today' : format(value, 'yyyy')}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
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
                {/* Glow decoration */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)' }}
                />

                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-accent font-medium tracking-wide uppercase">Select Date</p>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {format(value, 'MMMM d, yyyy')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl bg-surface-1 hover:bg-surface-2 transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              </div>

              {/* Quick Options */}
              <div className="p-3 border-b border-border-subtle">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {QUICK_OPTIONS.map((option) => {
                    const optionDate = option.getValue();
                    const isSelected = isSameDay(value, optionDate);
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => handleSelectDate(optionDate)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-accent text-bg-base shadow-[0_0_12px_rgba(201,165,92,0.3)]'
                            : 'bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl hover:bg-surface-1 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <h4 className="text-sm font-semibold text-text-primary">
                  {format(viewDate, 'MMMM yyyy')}
                </h4>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl hover:bg-surface-1 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="px-4 pb-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center py-2">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    const isSelected = isSameDay(day, value);
                    const isTodayDate = isToday(day);
                    const disabled = isDisabled(day);

                    return (
                      <motion.button
                        key={index}
                        type="button"
                        initial={false}
                        whileHover={disabled ? {} : { scale: 1.1 }}
                        whileTap={disabled ? {} : { scale: 0.95 }}
                        onClick={() => !disabled && handleSelectDate(day)}
                        disabled={disabled}
                        className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                          disabled
                            ? 'text-text-tertiary/30 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-br from-accent to-accent-light text-bg-base shadow-[0_0_15px_rgba(201,165,92,0.4)]'
                            : isTodayDate
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : isCurrentMonth
                            ? 'text-text-primary hover:bg-surface-1'
                            : 'text-text-tertiary/50 hover:bg-surface-1'
                        }`}
                      >
                        {format(day, 'd')}
                        {isSelected && (
                          <motion.div
                            layoutId="selected-date"
                            className="absolute inset-0 rounded-xl bg-accent -z-10"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border-subtle bg-bg-secondary/30 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-surface-1 text-text-secondary text-sm font-medium hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-bg-base text-sm font-semibold shadow-[0_0_15px_rgba(201,165,92,0.3)] hover:shadow-[0_0_20px_rgba(201,165,92,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default DatePicker;
