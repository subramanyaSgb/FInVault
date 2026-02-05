/**
 * Calculate EMI (Equated Monthly Installment)
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate (percentage)
 * @param tenureMonths - Loan tenure in months
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  if (annualRate === 0) {
    return principal / tenureMonths
  }

  const monthlyRate = annualRate / 12 / 100
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1)

  return Math.round(emi * 100) / 100
}

/**
 * Calculate loan amortization schedule
 */
export interface AmortizationEntry {
  month: number
  emi: number
  principal: number
  interest: number
  balance: number
  totalPrincipal: number
  totalInterest: number
}

export function calculateAmortization(
  principal: number,
  annualRate: number,
  tenureMonths: number
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = []
  const emi = calculateEMI(principal, annualRate, tenureMonths)
  const monthlyRate = annualRate / 12 / 100

  let balance = principal
  let totalPrincipal = 0
  let totalInterest = 0

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = balance * monthlyRate
    const principalPaid = emi - interest
    balance -= principalPaid
    totalPrincipal += principalPaid
    totalInterest += interest

    schedule.push({
      month,
      emi: Math.round(emi * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    })
  }

  return schedule
}

/**
 * Calculate total interest payable
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  const emi = calculateEMI(principal, annualRate, tenureMonths)
  const totalPayment = emi * tenureMonths
  return Math.round((totalPayment - principal) * 100) / 100
}

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  compoundingFrequency: number = 12 // Monthly by default
): number {
  const rate = annualRate / 100
  const amount =
    principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * years)
  return Math.round(amount * 100) / 100
}

/**
 * Calculate SIP (Systematic Investment Plan) future value
 */
export function calculateSIPFutureValue(
  monthlyInvestment: number,
  annualRate: number,
  years: number
): number {
  const months = years * 12
  const monthlyRate = annualRate / 12 / 100

  if (monthlyRate === 0) {
    return monthlyInvestment * months
  }

  const futureValue =
    monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
    (1 + monthlyRate)

  return Math.round(futureValue * 100) / 100
}

/**
 * Calculate required SIP for target amount
 */
export function calculateRequiredSIP(
  targetAmount: number,
  annualRate: number,
  years: number
): number {
  const months = years * 12
  const monthlyRate = annualRate / 12 / 100

  if (monthlyRate === 0) {
    return targetAmount / months
  }

  const sip =
    targetAmount /
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))

  return Math.round(sip * 100) / 100
}

/**
 * Calculate FIRE (Financial Independence, Retire Early) number
 * Based on the 4% rule
 */
export function calculateFIRENumber(annualExpenses: number, safeWithdrawalRate: number = 4): number {
  return Math.round((annualExpenses * 100) / safeWithdrawalRate)
}

/**
 * Calculate years to FIRE
 */
export function calculateYearsToFIRE(
  currentSavings: number,
  annualSavings: number,
  targetAmount: number,
  annualReturn: number = 7
): number {
  if (currentSavings >= targetAmount) return 0
  if (annualSavings <= 0) return Infinity

  const monthlyRate = annualReturn / 12 / 100
  const monthlySavings = annualSavings / 12
  let balance = currentSavings
  let months = 0

  while (balance < targetAmount && months < 1200) {
    // Max 100 years
    balance = balance * (1 + monthlyRate) + monthlySavings
    months++
  }

  return Math.round((months / 12) * 10) / 10
}

/**
 * Calculate net worth
 */
export interface NetWorthInput {
  bankAccounts: number
  investments: number
  property: number
  otherAssets: number
  creditCards: number
  loans: number
  otherLiabilities: number
}

export function calculateNetWorth(input: NetWorthInput): {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
} {
  const totalAssets =
    input.bankAccounts + input.investments + input.property + input.otherAssets
  const totalLiabilities = input.creditCards + input.loans + input.otherLiabilities
  const netWorth = totalAssets - totalLiabilities

  return { totalAssets, totalLiabilities, netWorth }
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDTI(monthlyDebtPayments: number, monthlyIncome: number): number {
  if (monthlyIncome === 0) return 0
  return Math.round((monthlyDebtPayments / monthlyIncome) * 100 * 100) / 100
}

/**
 * Calculate savings rate
 */
export function calculateSavingsRate(monthlySavings: number, monthlyIncome: number): number {
  if (monthlyIncome === 0) return 0
  return Math.round((monthlySavings / monthlyIncome) * 100 * 100) / 100
}

/**
 * Calculate emergency fund coverage (months)
 */
export function calculateEmergencyFundMonths(
  emergencyFund: number,
  monthlyExpenses: number
): number {
  if (monthlyExpenses === 0) return Infinity
  return Math.round((emergencyFund / monthlyExpenses) * 10) / 10
}

/**
 * Debt payoff strategies
 */
export interface Debt {
  name: string
  balance: number
  interestRate: number
  minimumPayment: number
}

export interface PayoffScheduleEntry {
  debtName: string
  month: number
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}

/**
 * Calculate debt payoff using Snowball method (lowest balance first)
 */
export function calculateSnowballPayoff(
  debts: Debt[],
  extraPayment: number = 0
): { schedule: PayoffScheduleEntry[]; totalInterest: number; monthsToPayoff: number } {
  // Sort by balance (lowest first)
  const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance)
  return calculateDebtPayoff(sortedDebts, extraPayment)
}

/**
 * Calculate debt payoff using Avalanche method (highest interest first)
 */
export function calculateAvalanchePayoff(
  debts: Debt[],
  extraPayment: number = 0
): { schedule: PayoffScheduleEntry[]; totalInterest: number; monthsToPayoff: number } {
  // Sort by interest rate (highest first)
  const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate)
  return calculateDebtPayoff(sortedDebts, extraPayment)
}

function calculateDebtPayoff(
  debts: Debt[],
  extraPayment: number
): { schedule: PayoffScheduleEntry[]; totalInterest: number; monthsToPayoff: number } {
  const schedule: PayoffScheduleEntry[] = []
  const balances = debts.map(d => d.balance)
  let totalInterest = 0
  let month = 0
  let availableExtra = extraPayment

  while (balances.some(b => b > 0) && month < 600) {
    // Max 50 years
    month++
    availableExtra = extraPayment

    for (let i = 0; i < debts.length; i++) {
      const debt = debts[i]
      const currentBalance = balances[i]
      if (!debt || currentBalance === undefined || currentBalance <= 0) continue

      const monthlyRate = debt.interestRate / 12 / 100
      const interest = currentBalance * monthlyRate
      totalInterest += interest

      let payment = debt.minimumPayment

      // Add extra payment to the first debt with balance
      if (availableExtra > 0 && i === balances.findIndex(b => b > 0)) {
        payment += availableExtra
        availableExtra = 0
      }

      const principal = Math.min(payment - interest, currentBalance)
      const newBalance = Math.max(0, currentBalance - principal)
      balances[i] = newBalance

      schedule.push({
        debtName: debt.name,
        month,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: Math.round(newBalance * 100) / 100,
      })
    }

    // Redistribute freed up minimum payments
    if (balances.some(b => b <= 0)) {
      const freedPayments = debts
        .filter((_, i) => {
          const bal = balances[i]
          return bal !== undefined && bal <= 0
        })
        .reduce((sum, d) => sum + d.minimumPayment, 0)
      availableExtra += freedPayments
    }
  }

  return {
    schedule,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthsToPayoff: month,
  }
}

/**
 * Calculate credit utilization ratio
 */
export function calculateCreditUtilization(
  totalOutstanding: number,
  totalLimit: number
): number {
  if (totalLimit === 0) return 0
  return Math.round((totalOutstanding / totalLimit) * 100 * 100) / 100
}

/**
 * Calculate goal progress
 */
export function calculateGoalProgress(
  currentAmount: number,
  targetAmount: number
): { percentage: number; remaining: number } {
  const percentage = Math.min(100, Math.round((currentAmount / targetAmount) * 100 * 100) / 100)
  const remaining = Math.max(0, targetAmount - currentAmount)
  return { percentage, remaining }
}

/**
 * Calculate monthly savings needed for goal
 */
export function calculateMonthlySavingsForGoal(
  targetAmount: number,
  currentAmount: number,
  monthsRemaining: number,
  expectedReturn: number = 0
): number {
  const remaining = targetAmount - currentAmount

  if (monthsRemaining <= 0) return remaining
  if (expectedReturn === 0) return remaining / monthsRemaining

  const monthlyRate = expectedReturn / 12 / 100
  const monthlySavings =
    remaining / (((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate) * (1 + monthlyRate))

  return Math.round(monthlySavings * 100) / 100
}
