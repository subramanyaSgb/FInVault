import { db } from './db'
import { encryptForExport, decryptForImport } from './crypto'

export interface BackupData {
  version: number
  exportedAt: string
  profileId: string
  data: {
    transactions: unknown[]
    accounts: unknown[]
    creditCards: unknown[]
    subscriptions: unknown[]
    investments: unknown[]
    loans: unknown[]
    insurance: unknown[]
    documents: unknown[]
    goals: unknown[]
    budgets: unknown[]
    lendBorrows: unknown[]
    debtPayoffPlans: unknown[]
    aiChatMessages: unknown[]
  }
}

const BACKUP_VERSION = 1

/**
 * Export all data for a profile as JSON
 */
export async function exportData(profileId: string): Promise<BackupData> {
  const [
    transactions,
    accounts,
    creditCards,
    subscriptions,
    investments,
    loans,
    insurance,
    documents,
    goals,
    budgets,
    lendBorrows,
    debtPayoffPlans,
    aiChatMessages,
  ] = await Promise.all([
    db.transactions.where('profileId').equals(profileId).toArray(),
    db.accounts.where('profileId').equals(profileId).toArray(),
    db.creditCards.where('profileId').equals(profileId).toArray(),
    db.subscriptions.where('profileId').equals(profileId).toArray(),
    db.investments.where('profileId').equals(profileId).toArray(),
    db.loans.where('profileId').equals(profileId).toArray(),
    db.insurance.where('profileId').equals(profileId).toArray(),
    db.documents.where('profileId').equals(profileId).toArray(),
    db.goals.where('profileId').equals(profileId).toArray(),
    db.budgets.where('profileId').equals(profileId).toArray(),
    db.lendBorrows.where('profileId').equals(profileId).toArray(),
    db.debtPayoffPlans.where('profileId').equals(profileId).toArray(),
    db.aiChatMessages.where('profileId').equals(profileId).toArray(),
  ])

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profileId,
    data: {
      transactions,
      accounts,
      creditCards,
      subscriptions,
      investments,
      loans,
      insurance,
      documents,
      goals,
      budgets,
      lendBorrows,
      debtPayoffPlans,
      aiChatMessages,
    },
  }
}

/**
 * Export data as encrypted JSON file
 */
export async function exportEncryptedBackup(profileId: string, password: string): Promise<Blob> {
  const data = await exportData(profileId)
  const encrypted = await encryptForExport(data as unknown as Record<string, unknown>, password, profileId)

  return new Blob([JSON.stringify(encrypted)], { type: 'application/json' })
}

/**
 * Export data as plain JSON file (unencrypted)
 */
export async function exportPlainBackup(profileId: string): Promise<Blob> {
  const data = await exportData(profileId)
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

/**
 * Export transactions as CSV
 */
export async function exportTransactionsCSV(profileId: string): Promise<Blob> {
  const transactions = await db.transactions.where('profileId').equals(profileId).toArray()

  const headers = [
    'Date',
    'Type',
    'Category',
    'Description',
    'Amount',
    'Currency',
    'Payment Method',
    'Merchant',
    'Tags',
    'Notes',
  ]

  const rows = transactions.map(t => [
    new Date(t.date).toISOString().split('T')[0],
    t.type,
    t.category,
    `"${t.description.replace(/"/g, '""')}"`,
    t.amount.toString(),
    t.currency,
    t.paymentMethod,
    t.merchant ? `"${t.merchant.replace(/"/g, '""')}"` : '',
    t.tags.join('; '),
    t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '',
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Import data from encrypted backup
 */
export async function importEncryptedBackup(
  file: File,
  password: string,
  profileId: string
): Promise<{ success: boolean; itemsImported: number; error?: string }> {
  try {
    const text = await file.text()
    const encryptedData = JSON.parse(text)
    const backup = await decryptForImport<BackupData>(encryptedData, password)

    return importBackupData(backup, profileId)
  } catch (error) {
    return {
      success: false,
      itemsImported: 0,
      error: error instanceof Error ? error.message : 'Failed to import backup',
    }
  }
}

/**
 * Import data from plain JSON backup
 */
export async function importPlainBackup(
  file: File,
  profileId: string
): Promise<{ success: boolean; itemsImported: number; error?: string }> {
  try {
    const text = await file.text()
    const backup: BackupData = JSON.parse(text)

    return importBackupData(backup, profileId)
  } catch (error) {
    return {
      success: false,
      itemsImported: 0,
      error: error instanceof Error ? error.message : 'Failed to import backup',
    }
  }
}

/**
 * Import backup data into database
 */
async function importBackupData(
  backup: BackupData,
  targetProfileId: string
): Promise<{ success: boolean; itemsImported: number; error?: string }> {
  if (backup.version !== BACKUP_VERSION) {
    return {
      success: false,
      itemsImported: 0,
      error: `Incompatible backup version: ${backup.version}`,
    }
  }

  let itemsImported = 0

  try {
    await db.transaction(
      'rw',
      [
        db.transactions,
        db.accounts,
        db.creditCards,
        db.subscriptions,
        db.investments,
        db.loans,
        db.insurance,
        db.documents,
        db.goals,
        db.budgets,
        db.lendBorrows,
        db.debtPayoffPlans,
        db.aiChatMessages,
      ],
      async () => {
        // Helper to update profileId and generate new IDs
        const prepareItems = <T extends { id?: string; profileId?: string }>(items: T[]): T[] =>
          items.map(item => ({
            ...item,
            id: crypto.randomUUID(),
            profileId: targetProfileId,
          }))

        const { data } = backup

        // Import all data types
        if (data.transactions.length > 0) {
          const items = prepareItems(data.transactions as { id?: string; profileId?: string }[])
          await db.transactions.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.accounts.length > 0) {
          const items = prepareItems(data.accounts as { id?: string; profileId?: string }[])
          await db.accounts.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.creditCards.length > 0) {
          const items = prepareItems(data.creditCards as { id?: string; profileId?: string }[])
          await db.creditCards.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.subscriptions.length > 0) {
          const items = prepareItems(data.subscriptions as { id?: string; profileId?: string }[])
          await db.subscriptions.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.investments.length > 0) {
          const items = prepareItems(data.investments as { id?: string; profileId?: string }[])
          await db.investments.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.loans.length > 0) {
          const items = prepareItems(data.loans as { id?: string; profileId?: string }[])
          await db.loans.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.insurance.length > 0) {
          const items = prepareItems(data.insurance as { id?: string; profileId?: string }[])
          await db.insurance.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.documents.length > 0) {
          const items = prepareItems(data.documents as { id?: string; profileId?: string }[])
          await db.documents.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.goals.length > 0) {
          const items = prepareItems(data.goals as { id?: string; profileId?: string }[])
          await db.goals.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.budgets.length > 0) {
          const items = prepareItems(data.budgets as { id?: string; profileId?: string }[])
          await db.budgets.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.lendBorrows.length > 0) {
          const items = prepareItems(data.lendBorrows as { id?: string; profileId?: string }[])
          await db.lendBorrows.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.debtPayoffPlans.length > 0) {
          const items = prepareItems(data.debtPayoffPlans as { id?: string; profileId?: string }[])
          await db.debtPayoffPlans.bulkAdd(items as never[])
          itemsImported += items.length
        }

        if (data.aiChatMessages.length > 0) {
          const items = prepareItems(data.aiChatMessages as { id?: string; profileId?: string }[])
          await db.aiChatMessages.bulkAdd(items as never[])
          itemsImported += items.length
        }
      }
    )

    return { success: true, itemsImported }
  } catch (error) {
    return {
      success: false,
      itemsImported,
      error: error instanceof Error ? error.message : 'Failed to import data',
    }
  }
}

/**
 * Generate a summary report as HTML
 */
export async function generateSummaryReport(profileId: string): Promise<string> {
  const [transactions, accounts, creditCards, loans, investments, goals] = await Promise.all([
    db.transactions.where('profileId').equals(profileId).toArray(),
    db.accounts.where('profileId').equals(profileId).toArray(),
    db.creditCards.where('profileId').equals(profileId).toArray(),
    db.loans.where('profileId').equals(profileId).toArray(),
    db.investments.where('profileId').equals(profileId).toArray(),
    db.goals.where('profileId').equals(profileId).toArray(),
  ])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const totalCredit = creditCards.reduce((s, c) => s + c.currentOutstanding, 0)
  const totalLoans = loans.filter(l => l.isActive).reduce((s, l) => s + l.outstandingAmount, 0)
  const totalInvestments = investments.reduce((s, i) => s + i.currentValue, 0)

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {}
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] ?? 0) + t.amount
    })

  const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>FinVault Financial Report</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .card { background: #f5f5f5; padding: 15px; border-radius: 8px; }
        .card-title { font-size: 12px; color: #666; text-transform: uppercase; }
        .card-value { font-size: 24px; font-weight: bold; color: #1a1a1a; }
        .card-value.positive { color: #22c55e; }
        .card-value.negative { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>FinVault Financial Report</h1>
      <p>Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>

      <h2>Overview</h2>
      <div class="summary">
        <div class="card">
          <div class="card-title">Total Income</div>
          <div class="card-value positive">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="card">
          <div class="card-title">Total Expenses</div>
          <div class="card-value negative">${formatCurrency(totalExpense)}</div>
        </div>
        <div class="card">
          <div class="card-title">Account Balance</div>
          <div class="card-value">${formatCurrency(totalBalance)}</div>
        </div>
        <div class="card">
          <div class="card-title">Credit Card Outstanding</div>
          <div class="card-value negative">${formatCurrency(totalCredit)}</div>
        </div>
        <div class="card">
          <div class="card-title">Active Loans</div>
          <div class="card-value negative">${formatCurrency(totalLoans)}</div>
        </div>
        <div class="card">
          <div class="card-title">Investments Value</div>
          <div class="card-value positive">${formatCurrency(totalInvestments)}</div>
        </div>
      </div>

      <h2>Net Worth</h2>
      <div class="card">
        <div class="card-title">Total Net Worth</div>
        <div class="card-value ${totalBalance + totalInvestments - totalCredit - totalLoans >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(totalBalance + totalInvestments - totalCredit - totalLoans)}
        </div>
      </div>

      <h2>Expenses by Category</h2>
      <table>
        <thead>
          <tr><th>Category</th><th>Amount</th><th>% of Total</th></tr>
        </thead>
        <tbody>
          ${sortedCategories
            .map(
              ([cat, amount]) => `
            <tr>
              <td>${cat}</td>
              <td>${formatCurrency(amount)}</td>
              <td>${((amount / totalExpense) * 100).toFixed(1)}%</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <h2>Financial Goals</h2>
      <table>
        <thead>
          <tr><th>Goal</th><th>Target</th><th>Current</th><th>Progress</th></tr>
        </thead>
        <tbody>
          ${goals
            .map(
              g => `
            <tr>
              <td>${g.name}</td>
              <td>${formatCurrency(g.targetAmount)}</td>
              <td>${formatCurrency(g.currentAmount)}</td>
              <td>${((g.currentAmount / g.targetAmount) * 100).toFixed(1)}%</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by FinVault - Your Privacy-First Finance Manager</p>
        <p>All data is stored locally on your device</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Download a file
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Print/save HTML report as PDF
 */
export function printReport(html: string): void {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
}
