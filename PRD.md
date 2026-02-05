# Product Requirements Document (PRD)
# Personal Finance Manager — "FinVault"

**Version:** 1.0  
**Date:** January 2026  
**Status:** Draft for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Target Users & Personas](#3-target-users--personas)
4. [Feature Requirements](#4-feature-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Models](#6-data-models)
7. [Security & Privacy](#7-security--privacy)
8. [AI Integration](#8-ai-integration)
9. [UI/UX Design System](#9-uiux-design-system)
10. [PWA Requirements](#10-pwa-requirements)
11. [Localization & Multi-Currency](#11-localization--multi-currency)
12. [Release Phases](#12-release-phases)
13. [Success Metrics](#13-success-metrics)
14. [Future Roadmap](#14-future-roadmap)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary

**Product Name:** FinVault (suggested — open to change)

**Tagline:** "Your finances. Your device. Your control."

**Overview:**  
FinVault is a privacy-first, offline-capable Progressive Web App (PWA) that serves as a comprehensive personal finance management platform. It enables users to track expenses, investments, credit cards, loans, insurance policies, and documents — all stored locally on their device with optional encrypted cloud backup.

**Key Differentiators:**
- **Privacy-First:** All data stored locally by default; no mandatory cloud accounts
- **AI-Powered:** Smart categorization, receipt scanning, and financial insights
- **All-in-One:** Single platform for expenses, investments, loans, insurance, and documents
- **Premium Experience:** High-end, CRED-inspired dark UI with smooth animations
- **Multi-User:** Family members can have separate profiles on the same device
- **Offline-First:** Full functionality without internet connection

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

To become the most trusted, comprehensive, and beautifully designed personal finance manager that respects user privacy while providing powerful AI-driven insights.

### 2.2 Goals

| Goal | Description | Success Metric |
|------|-------------|----------------|
| **Privacy** | Users feel 100% confident their financial data is secure | Zero cloud dependency for core features |
| **Completeness** | One app replaces 5+ finance tools | Users track 3+ financial categories |
| **Simplicity** | Complex finances made simple | < 30 seconds to log an expense |
| **Intelligence** | AI reduces manual work | 80%+ auto-categorization accuracy |
| **Delight** | Premium experience users love | 4.5+ app store rating |

### 2.3 Problems We Solve

1. **Fragmented Tracking:** Users currently use multiple apps/spreadsheets for expenses, investments, loans
2. **Privacy Concerns:** Fear of financial data being sold or leaked by cloud-based apps
3. **Manual Drudgery:** Tedious categorization and data entry
4. **Lack of Visibility:** No single view of complete financial health
5. **Missed Payments:** Forgetting bill due dates, policy renewals

---

## 3. Target Users & Personas

### 3.1 Primary Persona: "Rahul" — The Conscious Saver

- **Age:** 28-40
- **Occupation:** Working professional
- **Income:** ₹8-25 LPA
- **Tech Savvy:** Moderate to high
- **Goals:** Track spending, grow savings, avoid debt
- **Pain Points:** Uses 3 apps + Excel, worried about data privacy
- **Quote:** "I want to see my complete financial picture without my data going to some server"

### 3.2 Secondary Persona: "Priya" — The Family CFO

- **Age:** 35-50
- **Occupation:** Homemaker or working professional
- **Responsibilities:** Manages household finances for family
- **Goals:** Budget management, track family expenses, manage insurance/investments
- **Pain Points:** Can't share access with spouse without sharing login credentials
- **Quote:** "I need one place to manage everything — from groceries to life insurance"

### 3.3 Tertiary Persona: "Arjun" — The Investor

- **Age:** 25-35
- **Occupation:** IT professional
- **Goals:** Track investment portfolio, optimize returns
- **Pain Points:** Portfolio scattered across platforms, no unified view
- **Quote:** "I want to see all my mutual funds, stocks, and FDs in one dashboard"

---

## 4. Feature Requirements

### 4.1 Phase 1: MVP — Core Finance Tracking

**Target:** 8-10 weeks development

#### 4.1.1 User Authentication & Profiles

| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-user profiles | Multiple family members on same device | P0 |
| PIN authentication | 4-6 digit PIN for app access | P0 |
| Biometric auth | Fingerprint/Face ID support | P0 |
| Password option | Traditional password as fallback | P0 |
| Profile avatars | Customizable user avatars | P1 |
| Profile switching | Quick switch between family profiles | P0 |

#### 4.1.2 Dashboard

| Feature | Description | Priority |
|---------|-------------|----------|
| Net worth display | Total assets minus liabilities | P0 |
| Monthly summary | Income vs expenses overview | P0 |
| Quick actions | Add expense, income, transfer buttons | P0 |
| Recent transactions | Last 5-10 transactions list | P0 |
| Budget status | Visual progress bars for budgets | P1 |
| Upcoming bills | Next 7 days payment reminders | P1 |

#### 4.1.3 Expense Tracking

| Feature | Description | Priority |
|---------|-------------|----------|
| Manual entry | Add expense with amount, category, date, notes | P0 |
| Categories | Pre-defined + custom categories | P0 |
| AI auto-categorization | Suggest category based on description | P0 |
| Recurring expenses | Set up repeating expenses | P1 |
| Tags | Custom tags for filtering | P1 |
| Payment method | Track which account/card was used | P0 |
| Attachments | Add receipt photos | P1 |

**Default Expense Categories:**
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Personal Care
- Travel
- Groceries
- Rent/Housing
- EMI Payments
- Subscriptions
- Gifts & Donations
- Other

#### 4.1.4 Income Tracking

| Feature | Description | Priority |
|---------|-------------|----------|
| Salary income | Regular salary with tax breakdown | P0 |
| Freelance income | Project-based income tracking | P1 |
| Investment returns | Dividends, interest, capital gains | P1 |
| Other income | Gifts, refunds, cashbacks | P0 |
| Recurring income | Auto-repeat monthly income | P0 |

#### 4.1.5 Basic Budgeting

| Feature | Description | Priority |
|---------|-------------|----------|
| Monthly budgets | Set budget per category | P0 |
| Budget vs actual | Visual comparison | P0 |
| Overspend alerts | Notification at 80%, 100% | P0 |
| Rollover option | Carry unused budget to next month | P2 |

#### 4.1.6 Bank Accounts

| Feature | Description | Priority |
|---------|-------------|----------|
| Add accounts | Savings, current, wallet accounts | P0 |
| Manual balance | Update balance manually | P0 |
| Account transfers | Track money movement between accounts | P0 |
| Account icons | Visual bank logos | P1 |

---

### 4.2 Phase 2: Investments & Credit Management

**Target:** 6-8 weeks development

#### 4.2.1 Credit Card Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Add credit cards | Store card details (last 4 digits, bank, limit) | P0 |
| Track utilization | Current outstanding vs credit limit | P0 |
| Due date reminders | Notifications before due date | P0 |
| Minimum vs full payment | Track payment type | P0 |
| Statement upload | Parse PDF statements | P1 |
| Reward points | Track points balance | P2 |
| Annual fee tracking | Remember fee due dates | P2 |

**Credit Card Dashboard Widgets:**
- Total credit limit across cards
- Total current utilization
- Utilization percentage (with color coding: green <30%, yellow 30-70%, red >70%)
- Upcoming due dates
- Credit score impact indicator

#### 4.2.2 Loan Tracking

| Feature | Description | Priority |
|---------|-------------|----------|
| Add loans | Home, car, personal, education loans | P0 |
| EMI tracking | Monthly EMI with principal/interest split | P0 |
| Outstanding balance | Auto-calculate remaining principal | P0 |
| Prepayment tracking | Log extra payments | P1 |
| Loan comparison | Interest saved by prepayment | P2 |
| Amortization schedule | Full payment schedule view | P1 |

**Supported Loan Types:**
- Home Loan
- Car/Vehicle Loan
- Personal Loan
- Education Loan
- Gold Loan
- Loan Against Property
- Business Loan
- Credit Card Loan
- Other

#### 4.2.3 Investment Portfolio

| Feature | Description | Priority |
|---------|-------------|----------|
| Mutual funds | Track SIPs and lumpsum investments | P0 |
| Stocks | Individual stock holdings | P0 |
| Fixed deposits | FD with maturity tracking | P0 |
| Recurring deposits | RD with maturity tracking | P0 |
| PPF/EPF | Provident fund tracking | P1 |
| NPS | National Pension System | P1 |
| Gold/Silver | Physical and digital gold | P1 |
| Real estate | Property investments | P2 |
| Crypto | Cryptocurrency holdings | P2 |

**Investment Dashboard:**
- Total portfolio value
- Day change (₹ and %)
- Asset allocation pie chart
- Top gainers/losers
- Upcoming maturities
- SIP calendar

#### 4.2.4 FD/RD Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Add FD/RD | Bank, amount, interest rate, tenure | P0 |
| Maturity calculator | Auto-calculate maturity amount | P0 |
| Maturity alerts | Remind before maturity date | P0 |
| Auto-renewal tracking | Track if FD was renewed | P1 |
| Interest payout | Monthly/quarterly/cumulative tracking | P1 |
| Laddering view | Visualize FD maturity ladder | P2 |

---

### 4.3 Phase 3: Documents, Insurance & AI Insights

**Target:** 6-8 weeks development

#### 4.3.1 Insurance Tracking

| Feature | Description | Priority |
|---------|-------------|----------|
| Life insurance | Term, whole life, ULIP policies | P0 |
| Health insurance | Individual and family floater | P0 |
| Vehicle insurance | Car, bike insurance | P0 |
| Property insurance | Home insurance | P1 |
| Travel insurance | Trip-based insurance | P2 |
| Premium reminders | Alert before due date | P0 |
| Claim tracking | Log and track claims | P1 |
| Nominee details | Store nominee information | P0 |
| Policy documents | Attach PDF copies | P0 |

**Insurance Dashboard:**
- Total coverage summary
- Premium calendar
- Upcoming renewals
- Coverage gaps analysis (AI-powered)

#### 4.3.2 Policy Tracking (LIC, etc.)

| Feature | Description | Priority |
|---------|-------------|----------|
| LIC policies | Endowment, money-back, term plans | P0 |
| Premium tracking | Due dates and payment history | P0 |
| Maturity tracking | Expected maturity amounts | P0 |
| Loan against policy | Track if loan taken | P1 |
| Bonus tracking | Track declared bonuses | P2 |

#### 4.3.3 Document Vault

| Feature | Description | Priority |
|---------|-------------|----------|
| Document categories | PAN, Aadhaar, Passport, etc. | P0 |
| Secure storage | Encrypted local storage | P0 |
| Document scanning | Camera capture with edge detection | P0 |
| OCR extraction | Auto-fill details from scanned docs | P1 |
| Expiry reminders | Passport, license expiry alerts | P0 |
| Quick access | Biometric-protected quick view | P0 |
| Sharing | Secure temporary sharing | P2 |

**Document Categories:**
- Identity: PAN Card, Aadhaar, Passport, Driving License, Voter ID
- Financial: Bank statements, IT returns, Form 16, Investment proofs
- Property: Sale deeds, Registry documents, Property tax receipts
- Vehicle: RC, Insurance, PUC, Service records
- Medical: Health records, Prescriptions, Test reports
- Education: Certificates, Marksheets, Degrees
- Legal: Contracts, Agreements, Wills
- Other: Warranties, Manuals, Receipts

#### 4.3.4 Banking Information Storage

| Feature | Description | Priority |
|---------|-------------|----------|
| Bank account details | Account numbers, IFSC, branch | P0 |
| Debit card info | Card numbers (masked), expiry | P0 |
| Net banking notes | Store login hints (not passwords) | P1 |
| UPI IDs | All UPI handles | P0 |
| Nominee details | Bank account nominees | P0 |
| Customer care | Quick access to bank helplines | P1 |

#### 4.3.5 AI-Powered Insights

| Feature | Description | Priority |
|---------|-------------|----------|
| Spending analysis | "You spent 40% more on dining this month" | P0 |
| Savings suggestions | "Switch to X to save ₹500/month" | P1 |
| Anomaly detection | "Unusual expense of ₹15,000 detected" | P0 |
| Budget recommendations | AI-suggested budget based on history | P1 |
| Financial health score | Overall score with improvement tips | P1 |
| Bill prediction | Predict upcoming bills based on history | P1 |
| Category insights | Deep dive into spending patterns | P0 |

---

### 4.4 Phase 4: Advanced Features

**Target:** 8-10 weeks development

#### 4.4.1 Lend & Borrow Tracking

| Feature | Description | Priority |
|---------|-------------|----------|
| Money lent | Track money given to others | P0 |
| Money borrowed | Track money taken from others | P0 |
| Due dates | Set expected return dates | P0 |
| Reminders | Notify when amount is due | P0 |
| Partial settlements | Track partial repayments | P0 |
| Interest calculation | Optional interest on amounts | P2 |
| Settlement history | Complete transaction log | P1 |
| Contact integration | Link to phone contacts | P1 |

#### 4.4.2 Advanced Budgeting

| Feature | Description | Priority |
|---------|-------------|----------|
| Goal-based savings | Save for specific goals | P0 |
| 50/30/20 rule | Needs/Wants/Savings allocation | P1 |
| Zero-based budgeting | Allocate every rupee | P1 |
| Budget templates | Pre-made budget plans | P1 |
| Family budgeting | Shared budgets across profiles | P2 |
| Seasonal budgets | Different budgets for festivals, etc. | P2 |

#### 4.4.3 Data Import

| Feature | Description | Priority |
|---------|-------------|----------|
| CSV import | Import from Excel/CSV | P0 |
| Bank statement parsing | PDF statement auto-import | P0 |
| SMS parsing | Extract transactions from SMS (Android) | P1 |
| Receipt scanning | AI-powered receipt OCR | P0 |
| Bulk categorization | AI-categorize imported transactions | P0 |

**Receipt Scanning Flow:**
1. User opens camera or selects image
2. AI detects receipt boundaries and crops
3. OCR extracts: Merchant, Amount, Date, Items
4. AI suggests category based on merchant/items
5. User confirms or edits
6. Transaction saved with receipt attached

#### 4.4.4 Reports & Analytics

| Feature | Description | Priority |
|---------|-------------|----------|
| Monthly reports | Detailed monthly financial summary | P0 |
| Annual reports | Year-end financial review | P0 |
| Tax reports | Tax-saving investments summary | P1 |
| Custom reports | User-defined date ranges and filters | P1 |
| PDF export | Download reports as PDF | P0 |
| Excel export | Export data to Excel/CSV | P0 |
| Charts & graphs | Visual analytics | P0 |
| Comparison reports | Month-over-month, year-over-year | P1 |

#### 4.4.5 Notifications System

| Feature | Description | Priority |
|---------|-------------|----------|
| Bill reminders | X days before due date | P0 |
| Budget alerts | 50%, 80%, 100% thresholds | P0 |
| Investment updates | NAV updates, maturity alerts | P1 |
| Policy renewals | Insurance premium reminders | P0 |
| Document expiry | Passport, license expiry alerts | P0 |
| Lend/borrow reminders | Due date for settlements | P0 |
| Weekly summary | Optional weekly digest | P1 |
| Custom notifications | User-defined reminders | P2 |

**Notification Channels:**
- In-app notifications
- Push notifications (PWA)
- Email notifications (optional, requires cloud)

---

## 5. Technical Architecture

### 5.1 Recommended Tech Stack

#### Frontend
| Component | Technology | Reason |
|-----------|------------|--------|
| Framework | **Next.js 14+** (App Router) | Best PWA support, great DX, excellent performance |
| Language | **TypeScript** | Type safety, better maintainability |
| Styling | **Tailwind CSS** | Rapid development, consistent design system |
| Animations | **Framer Motion** | Smooth, premium animations |
| State Management | **Zustand** | Lightweight, perfect for local-first apps |
| Forms | **React Hook Form + Zod** | Validation with great UX |
| Charts | **Recharts** or **Chart.js** | Beautiful, responsive charts |

#### Local Database & Storage
| Component | Technology | Reason |
|-----------|------------|--------|
| Primary Database | **IndexedDB** via **Dexie.js** | Large storage, structured queries, offline-first |
| Simple Storage | **localStorage** | Settings, preferences |
| File Storage | **IndexedDB Blobs** | Document and image storage |
| Encryption | **Web Crypto API** | Native browser encryption |

#### AI Integration
| Component | Technology | Reason |
|-----------|------------|--------|
| On-device AI | **TensorFlow.js** or **ONNX Runtime Web** | Privacy-preserving, offline capable |
| Cloud AI | **Claude API** (Anthropic) | Advanced insights, natural language |
| OCR | **Tesseract.js** (offline) or **Google Vision API** (cloud) | Receipt and document scanning |
| Categorization | Custom trained model | Expense auto-categorization |

#### PWA & Offline
| Component | Technology | Reason |
|-----------|------------|--------|
| Service Worker | **Workbox** | Caching, offline support |
| Manifest | Web App Manifest | Installability |
| Background Sync | Background Sync API | Queue actions when offline |

#### Optional Cloud Backup
| Component | Technology | Reason |
|-----------|------------|--------|
| Backend | **Supabase** or **Firebase** | Easy setup, good free tier |
| Encryption | **Client-side encryption** | Data encrypted before upload |
| Storage | **Cloud Storage** | Encrypted backup blobs |

### 5.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Device                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js PWA App                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   React UI  │  │   Zustand   │  │  Service Worker │   │  │
│  │  │  Components │  │    Store    │  │    (Workbox)    │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │  │
│  │         │                │                   │            │  │
│  │         └────────────────┼───────────────────┘            │  │
│  │                          │                                 │  │
│  │  ┌───────────────────────┴───────────────────────────┐   │  │
│  │  │              Data Layer (Dexie.js)                 │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │   │  │
│  │  │  │ IndexedDB│  │Encryption│  │ File/Blob Store  │ │   │  │
│  │  │  │  Tables  │  │  Layer   │  │   (Documents)    │ │   │  │
│  │  │  └──────────┘  └──────────┘  └──────────────────┘ │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │                 AI Layer                           │   │  │
│  │  │  ┌────────────────┐    ┌────────────────────────┐ │   │  │
│  │  │  │ On-Device AI   │    │ Tesseract.js (OCR)     │ │   │  │
│  │  │  │ (TensorFlow.js)│    │                        │ │   │  │
│  │  │  └────────────────┘    └────────────────────────┘ │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Optional (User Consent)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Cloud Services                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Claude API     │  │  Cloud Backup   │  │  Google Vision  │  │
│  │  (Insights)     │  │  (Encrypted)    │  │  (OCR - opt)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Folder Structure

```
/personal-finance-manager
├── /app                          # Next.js App Router
│   ├── /(auth)                   # Auth routes (login, PIN)
│   │   ├── /login
│   │   └── /setup
│   ├── /(main)                   # Main app routes
│   │   ├── /dashboard
│   │   ├── /expenses
│   │   ├── /income
│   │   ├── /budget
│   │   ├── /investments
│   │   ├── /credit-cards
│   │   ├── /loans
│   │   ├── /insurance
│   │   ├── /documents
│   │   ├── /lend-borrow
│   │   ├── /reports
│   │   └── /settings
│   ├── /api                      # API routes (for cloud AI)
│   ├── layout.tsx
│   └── page.tsx
├── /components
│   ├── /ui                       # Base UI components
│   ├── /features                 # Feature-specific components
│   ├── /layouts                  # Layout components
│   └── /charts                   # Chart components
├── /lib
│   ├── /db                       # Dexie.js database setup
│   ├── /ai                       # AI integration
│   ├── /crypto                   # Encryption utilities
│   ├── /hooks                    # Custom React hooks
│   └── /utils                    # Utility functions
├── /stores                       # Zustand stores
├── /types                        # TypeScript types
├── /public
│   ├── /icons                    # App icons
│   └── manifest.json             # PWA manifest
├── /styles
│   └── globals.css               # Global styles
└── /workers
    └── sw.js                     # Service worker
```

---

## 6. Data Models

### 6.1 Core Entities

#### User Profile
```typescript
interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  pinHash: string;
  biometricEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
}

interface UserSettings {
  currency: string;
  language: string;
  theme: 'dark' | 'light' | 'system';
  notifications: NotificationPreferences;
  cloudBackupEnabled: boolean;
  lastBackupAt?: Date;
}
```

#### Transaction
```typescript
interface Transaction {
  id: string;
  profileId: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  category: string;
  subcategory?: string;
  description: string;
  date: Date;
  paymentMethod: string;
  accountId: string;
  tags: string[];
  attachments: Attachment[];
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  location?: GeoLocation;
  merchant?: string;
  notes?: string;
  aiCategorized: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Account
```typescript
interface Account {
  id: string;
  profileId: string;
  type: 'savings' | 'current' | 'wallet' | 'cash' | 'credit_card';
  name: string;
  bankName?: string;
  accountNumber?: string; // Encrypted
  ifscCode?: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Credit Card
```typescript
interface CreditCard {
  id: string;
  profileId: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  creditLimit: number;
  currentOutstanding: number;
  availableLimit: number;
  billingDate: number; // Day of month
  dueDate: number; // Day of month
  minimumPaymentPercent: number;
  interestRate: number;
  rewardPoints?: number;
  annualFee?: number;
  feeDate?: Date;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Investment
```typescript
interface Investment {
  id: string;
  profileId: string;
  type: 'mutual_fund' | 'stock' | 'fd' | 'rd' | 'ppf' | 'epf' | 'nps' | 'gold' | 'real_estate' | 'crypto' | 'other';
  name: string;
  institution: string;
  investedAmount: number;
  currentValue: number;
  units?: number;
  nav?: number;
  purchaseDate: Date;
  maturityDate?: Date;
  interestRate?: number;
  sipAmount?: number;
  sipDate?: number;
  folioNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Loan
```typescript
interface Loan {
  id: string;
  profileId: string;
  type: 'home' | 'car' | 'personal' | 'education' | 'gold' | 'lap' | 'business' | 'credit_card' | 'other';
  lender: string;
  accountNumber?: string; // Encrypted
  principalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  emiAmount: number;
  tenure: number; // In months
  startDate: Date;
  endDate: Date;
  emiDate: number; // Day of month
  prepayments: Prepayment[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Insurance
```typescript
interface Insurance {
  id: string;
  profileId: string;
  type: 'life' | 'health' | 'vehicle' | 'property' | 'travel' | 'other';
  subtype?: string; // Term, whole life, ULIP, etc.
  provider: string;
  policyNumber: string; // Encrypted
  policyName: string;
  sumAssured: number;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  nextPremiumDate: Date;
  startDate: Date;
  endDate: Date;
  nominees: Nominee[];
  documents: Attachment[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Document
```typescript
interface Document {
  id: string;
  profileId: string;
  category: string;
  subcategory?: string;
  name: string;
  documentNumber?: string; // Encrypted
  issueDate?: Date;
  expiryDate?: Date;
  file: Blob; // Encrypted
  fileType: string;
  fileSize: number;
  thumbnail?: Blob;
  ocrText?: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Lend/Borrow
```typescript
interface LendBorrow {
  id: string;
  profileId: string;
  type: 'lent' | 'borrowed';
  personName: string;
  personPhone?: string;
  amount: number;
  currency: string;
  reason?: string;
  date: Date;
  dueDate?: Date;
  interestRate?: number;
  settlements: Settlement[];
  status: 'pending' | 'partial' | 'settled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Budget
```typescript
interface Budget {
  id: string;
  profileId: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  rollover: boolean;
  alertThresholds: number[]; // [50, 80, 100]
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7. Security & Privacy

### 7.1 Authentication

#### PIN Authentication
- 4-6 digit numeric PIN
- Stored as salted hash (PBKDF2)
- Rate limiting: 5 attempts, then 30-second lockout
- Progressive lockout: 5min → 15min → 1hour after repeated failures

#### Biometric Authentication
- Web Authentication API (WebAuthn)
- Fingerprint and Face ID support
- Fallback to PIN always available
- Optional for quick access

#### Password Authentication
- Minimum 8 characters
- Must include: uppercase, lowercase, number
- Stored as salted hash (Argon2 or PBKDF2)

### 7.2 Data Encryption

#### At-Rest Encryption
```
User PIN/Password
       │
       ▼
┌──────────────┐
│   PBKDF2     │
│ (100K iter)  │
└──────┬───────┘
       │
       ▼
   Master Key
       │
       ▼
┌──────────────┐
│  AES-256-GCM │
│  Encryption  │
└──────┬───────┘
       │
       ▼
 Encrypted Data
 (IndexedDB)
```

#### Sensitive Fields (Always Encrypted)
- Account numbers
- Card numbers (full)
- Policy numbers
- Document files
- Personal identification numbers

#### Standard Fields (Database-level encryption)
- Transaction details
- Investment details
- All user-generated content

### 7.3 Cloud Backup Security

If user enables cloud backup:

1. **Client-Side Encryption:**
   - Data encrypted on device before upload
   - Encryption key derived from user password
   - Server never sees unencrypted data

2. **Zero-Knowledge Architecture:**
   - Server stores only encrypted blobs
   - Server cannot decrypt user data
   - Password required to restore backup

3. **Backup Process:**
   ```
   Local Data → Compress → Encrypt (AES-256) → Upload to Cloud
   ```

4. **Restore Process:**
   ```
   Download → Decrypt (requires password) → Decompress → Import to Local
   ```

### 7.4 Privacy Principles

1. **Local-First:** All core features work without internet
2. **No Tracking:** No analytics or telemetry without explicit consent
3. **No Ads:** Never show advertisements
4. **Data Ownership:** Users can export all data anytime
5. **Right to Delete:** Complete data deletion capability
6. **Transparency:** Clear privacy policy explaining data handling

---

## 8. AI Integration

### 8.1 AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Layer                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Privacy-First AI Router                    │ │
│  │                                                         │ │
│  │  User Settings:                                         │ │
│  │  □ On-device AI only (maximum privacy)                  │ │
│  │  □ Cloud AI allowed (better insights)                   │ │
│  │  □ Hybrid (on-device + cloud for complex)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│           ┌──────────────┼──────────────┐                   │
│           ▼              ▼              ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  On-Device   │ │   Hybrid     │ │  Cloud AI    │        │
│  │              │ │              │ │              │        │
│  │ • Category   │ │ • Complex    │ │ • Advanced   │        │
│  │   classify   │ │   queries    │ │   insights   │        │
│  │ • Basic OCR  │ │   use cloud  │ │ • Natural    │        │
│  │ • Pattern    │ │ • Simple     │ │   language   │        │
│  │   detection  │ │   tasks      │ │ • Complex    │        │
│  │ • Anomaly    │ │   on-device  │ │   analysis   │        │
│  │   detection  │ │              │ │              │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 AI Features by Processing Location

#### On-Device AI (TensorFlow.js)

| Feature | Description | Model |
|---------|-------------|-------|
| Auto-categorization | Classify expenses into categories | Custom trained classifier |
| Merchant detection | Identify merchant from description | NER model |
| Anomaly detection | Flag unusual transactions | Isolation Forest |
| Pattern recognition | Identify recurring transactions | Time series model |
| Basic OCR | Extract text from receipts | Tesseract.js |

#### Cloud AI (Claude API)

| Feature | Description | When Used |
|---------|-------------|-----------|
| Natural language queries | "How much did I spend on food last month?" | User query |
| Financial advice | Personalized savings/investment suggestions | Weekly insights |
| Complex analysis | Tax optimization, portfolio rebalancing | On-demand |
| Receipt understanding | Parse complex receipts with multiple items | When on-device fails |
| Document analysis | Extract details from financial documents | Document upload |

### 8.3 Auto-Categorization Flow

```
Transaction Input: "Swiggy order #12345 - ₹450"
                              │
                              ▼
              ┌───────────────────────────────┐
              │     On-Device Classifier      │
              │                               │
              │  1. Tokenize description      │
              │  2. Extract features          │
              │  3. Run through model         │
              │  4. Get probability scores    │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │    Category: Food & Dining    │
              │    Confidence: 94%            │
              │    Subcategory: Delivery      │
              │    Merchant: Swiggy           │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   If confidence > 85%:        │
              │   → Auto-apply category       │
              │                               │
              │   If confidence 50-85%:       │
              │   → Suggest, ask user         │
              │                               │
              │   If confidence < 50%:        │
              │   → Ask user to categorize    │
              └───────────────────────────────┘
```

### 8.4 Receipt Scanning Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Capture    │ ──▶ │   Process    │ ──▶ │   Extract    │
│   Image      │     │   Image      │     │   Data       │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
  • Camera/Gallery    • Edge detection     • Merchant name
  • Auto-crop         • Perspective fix    • Total amount
  • Light correction  • Enhance contrast   • Date/time
                      • Reduce noise       • Items list
                                           • Tax breakdown
                                           │
                                           ▼
                      ┌──────────────────────────────────┐
                      │      AI-Powered Extraction       │
                      │                                  │
                      │  On-Device (Tesseract.js):       │
                      │  • Basic receipt parsing         │
                      │  • Simple layouts                │
                      │                                  │
                      │  Cloud AI (if enabled):          │
                      │  • Complex receipts              │
                      │  • Multiple items                │
                      │  • Handwritten notes             │
                      └──────────────────────────────────┘
                                           │
                                           ▼
                      ┌──────────────────────────────────┐
                      │       Auto-Fill Transaction      │
                      │                                  │
                      │  Amount: ₹1,250.00               │
                      │  Merchant: Big Bazaar            │
                      │  Date: 15 Jan 2026               │
                      │  Category: Groceries (suggested) │
                      │                                  │
                      │  [Confirm]  [Edit]               │
                      └──────────────────────────────────┘
```

### 8.5 AI Privacy Controls

User can configure:

```
AI Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Processing Mode
○ Maximum Privacy (On-device only)
  All AI runs locally. Some advanced features limited.

○ Balanced (Recommended)
  Simple tasks on-device, complex tasks use cloud.

○ Maximum Features (Cloud AI)
  Best insights and accuracy. Data sent to AI service.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When sending data to cloud AI:
☑ Remove personal identifiers
☑ Anonymize transaction descriptions
☐ Allow transaction patterns (for better insights)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 9. UI/UX Design System

### 9.1 Design Philosophy

**Core Principles:**
- **Premium & Exclusive:** Like entering a private financial club
- **Dark-First:** Deep blacks, charcoal backgrounds
- **Minimalist:** Generous whitespace, focused content
- **Confident:** Bold typography, clear hierarchy
- **Animated:** Smooth, purposeful micro-interactions

**Inspiration:** CRED, Robinhood Black, Revolut Premium, Apple Card

### 9.2 Color Palette

#### Primary Colors
```css
:root {
  /* Backgrounds */
  --bg-primary: #000000;      /* Pure black - main background */
  --bg-secondary: #0A0A0A;    /* Near black - cards */
  --bg-tertiary: #141414;     /* Charcoal - elevated surfaces */
  --bg-hover: #1A1A1A;        /* Hover states */
  
  /* Accent - Choose ONE (Gold shown as default) */
  --accent-primary: #C9A962;   /* Gold - primary accent */
  --accent-secondary: #D4B872; /* Light gold - hover */
  --accent-muted: #8B7355;     /* Muted gold - subtle */
  
  /* Alternative Accents (pick one per deployment) */
  /* --accent-primary: #00D09C;  Mint green */
  /* --accent-primary: #7C5DFA;  Purple */
  /* --accent-primary: #3B82F6;  Electric blue */
  
  /* Text */
  --text-primary: #FFFFFF;     /* Pure white - headings */
  --text-secondary: #A3A3A3;   /* Muted gray - body */
  --text-tertiary: #525252;    /* Dark gray - subtle */
  --text-disabled: #3F3F3F;    /* Disabled text */
  
  /* Semantic Colors */
  --success: #22C55E;          /* Green - positive */
  --warning: #F59E0B;          /* Amber - warning */
  --error: #EF4444;            /* Red - negative/error */
  --info: #3B82F6;             /* Blue - information */
  
  /* Gradients */
  --gradient-gold: linear-gradient(135deg, #C9A962 0%, #8B7355 100%);
  --gradient-card: linear-gradient(180deg, #141414 0%, #0A0A0A 100%);
}
```

#### Color Usage Guidelines
- Use accent color sparingly (< 10% of UI)
- White text on dark backgrounds
- Green for income/positive values
- Red for expenses/negative values
- Accent for CTAs and highlights

### 9.3 Typography

#### Font Family
```css
:root {
  --font-display: 'Playfair Display', serif;    /* Headlines, large numbers */
  --font-primary: 'DM Sans', sans-serif;         /* Body text, UI elements */
  --font-mono: 'JetBrains Mono', monospace;      /* Numbers, amounts */
}
```

#### Type Scale
```css
:root {
  /* Display */
  --text-display: 4rem;      /* 64px - Hero numbers */
  --text-h1: 2.5rem;         /* 40px - Page titles */
  --text-h2: 1.75rem;        /* 28px - Section headers */
  --text-h3: 1.25rem;        /* 20px - Card titles */
  
  /* Body */
  --text-body: 1rem;         /* 16px - Regular text */
  --text-small: 0.875rem;    /* 14px - Secondary text */
  --text-caption: 0.75rem;   /* 12px - Labels, captions */
  
  /* Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

#### Typography Examples
```
DASHBOARD (Caption, 12px, tracking wide, muted)

₹4,52,340 (Display, 64px, bold, white)
Total Balance

+₹24,500 this month (Body, 16px, green)
```

### 9.4 Spacing System

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-7: 3rem;      /* 48px */
  --space-8: 4rem;      /* 64px */
  --space-9: 6rem;      /* 96px */
}
```

### 9.5 Component Library

#### Cards
```css
.card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: var(--space-5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card-elevated {
  background: var(--gradient-card);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
```

#### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  padding: var(--space-3) var(--space-5);
  border-radius: 8px;
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--accent-secondary);
  transform: scale(1.02);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--space-3) var(--space-5);
  border-radius: 8px;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--accent-primary);
  padding: var(--space-3) var(--space-5);
}
```

#### Input Fields
```css
.input {
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: var(--space-3) var(--space-4);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

### 9.6 Animation Guidelines

#### Timing Functions
```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

#### Standard Animations
```css
/* Fade In Up - for page content */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In - for modals, popups */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Stagger children */
.stagger-children > * {
  animation: fadeInUp 0.5s var(--ease-out) forwards;
  opacity: 0;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
/* ... */
```

#### Micro-interactions
- **Buttons:** Scale 1.02 on hover, 0.98 on press
- **Cards:** Lift 2-4px on hover with shadow
- **Numbers:** Count up animation when revealed
- **Navigation:** Smooth slide transitions between screens
- **Loading:** Skeleton shimmer, not spinners
- **Success:** Subtle confetti or checkmark animation

### 9.7 Iconography

**Icon Style:**
- Line icons (not filled)
- 1.5-2px stroke weight
- Rounded caps and joins
- 24x24 default size

**Recommended Icon Libraries:**
- Lucide Icons (primary)
- Phosphor Icons (alternative)

### 9.8 Key Screen Layouts

#### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │             Top Bar (Profile, Notifications)     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │              Net Worth Card (Hero)               │   │
│  │           ₹4,52,340                             │   │
│  │           +2.4% this month                       │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────┐   │
│  │    Income     │  │   Expenses    │  │  Savings  │   │
│  │   ₹85,000     │  │   ₹52,340     │  │  ₹32,660  │   │
│  └───────────────┘  └───────────────┘  └───────────┘   │
│                                                         │
│  Quick Actions                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │ + $ │ │ + ↑ │ │ ⟲   │ │ 📊  │                      │
│  │Exp. │ │Inc. │ │Trans│ │Rep. │                      │
│  └─────┘ └─────┘ └─────┘ └─────┘                      │
│                                                         │
│  Recent Transactions                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🍕 Swiggy              Today      -₹450        │   │
│  │ 🚕 Uber                Yesterday  -₹250        │   │
│  │ 💰 Salary              Jan 1      +₹85,000     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Bottom Navigation                   │   │
│  │  🏠   💳   ➕   📈   ⚙️                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Add Transaction Flow
```
Screen 1: Amount Input
┌─────────────────────────┐
│         ← Add Expense   │
│                         │
│                         │
│         ₹ 0             │  (Large, editable)
│                         │
│   ┌───┬───┬───┐        │
│   │ 1 │ 2 │ 3 │        │
│   ├───┼───┼───┤        │
│   │ 4 │ 5 │ 6 │        │  (Custom numpad)
│   ├───┼───┼───┤        │
│   │ 7 │ 8 │ 9 │        │
│   ├───┼───┼───┤        │
│   │ . │ 0 │ ⌫ │        │
│   └───┴───┴───┘        │
│                         │
│      [Continue →]       │
└─────────────────────────┘

Screen 2: Details
┌─────────────────────────┐
│         ← Details       │
│                         │
│  Amount: ₹450           │
│                         │
│  Category               │
│  ┌─────────────────┐   │
│  │ 🍕 Food         ▾ │   │
│  └─────────────────┘   │
│                         │
│  Description            │
│  ┌─────────────────┐   │
│  │ Swiggy dinner    │   │
│  └─────────────────┘   │
│                         │
│  Date                   │
│  ┌─────────────────┐   │
│  │ Today, 8:30 PM   │   │
│  └─────────────────┘   │
│                         │
│  Account                │
│  ┌─────────────────┐   │
│  │ 💳 HDFC Credit  ▾│   │
│  └─────────────────┘   │
│                         │
│  📎 Add Receipt         │
│                         │
│      [Save Expense]     │
└─────────────────────────┘
```

---

## 10. PWA Requirements

### 10.1 PWA Checklist

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Web App Manifest | Complete manifest.json with icons | P0 |
| Service Worker | Offline caching, background sync | P0 |
| HTTPS | Secure connection required | P0 |
| Responsive Design | Works on all screen sizes | P0 |
| Install Prompt | Custom install banner | P0 |
| Splash Screen | Branded loading screen | P1 |
| Offline Indicator | Show when offline | P0 |
| Push Notifications | For reminders (optional cloud) | P1 |

### 10.2 Manifest Configuration

```json
{
  "name": "FinVault - Personal Finance Manager",
  "short_name": "FinVault",
  "description": "Your privacy-first personal finance manager",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#C9A962",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["finance", "productivity"],
  "shortcuts": [
    {
      "name": "Add Expense",
      "url": "/add-expense",
      "icons": [{"src": "/icons/add-expense.png", "sizes": "96x96"}]
    }
  ]
}
```

### 10.3 Offline Strategy

**Cache-First Resources:**
- App shell (HTML, CSS, JS)
- Static assets (fonts, icons)
- UI images

**Network-First Resources:**
- API calls (with fallback to cache)
- Cloud AI responses

**IndexedDB:**
- All user data
- Transaction queue (for sync)

### 10.4 Background Sync

When offline, queue these actions:
- Add/edit transactions
- Update budgets
- Add documents (local first)

When back online:
- Process queue in order
- Sync with cloud backup (if enabled)
- Update any AI-dependent features

---

## 11. Localization & Multi-Currency

### 11.1 Supported Languages (Phase 1)

| Language | Code | Priority |
|----------|------|----------|
| English | en | P0 |
| Hindi | hi | P1 |
| Tamil | ta | P2 |
| Telugu | te | P2 |
| Kannada | kn | P2 |
| Marathi | mr | P2 |

### 11.2 Internationalization (i18n) Setup

```typescript
// Example i18n structure
const translations = {
  en: {
    dashboard: {
      title: 'Dashboard',
      netWorth: 'Net Worth',
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      // ...
    },
    // ...
  },
  hi: {
    dashboard: {
      title: 'डैशबोर्ड',
      netWorth: 'कुल संपत्ति',
      totalIncome: 'कुल आय',
      totalExpenses: 'कुल खर्च',
      // ...
    },
    // ...
  },
};
```

### 11.3 Multi-Currency Support

#### Supported Currencies (Phase 1)

| Currency | Code | Symbol | Priority |
|----------|------|--------|----------|
| Indian Rupee | INR | ₹ | P0 |
| US Dollar | USD | $ | P1 |
| Euro | EUR | € | P1 |
| British Pound | GBP | £ | P2 |
| UAE Dirham | AED | د.إ | P2 |
| Singapore Dollar | SGD | S$ | P2 |

#### Currency Handling

1. **Base Currency:** User sets primary currency in settings
2. **Transaction Currency:** Each transaction can have different currency
3. **Conversion:** Exchange rates stored locally, updated weekly (optional)
4. **Display:** All reports show in base currency with conversion note

```typescript
interface CurrencyConfig {
  code: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: '.' | ',';
  thousandSeparator: ',' | '.' | ' ';
  decimalPlaces: number;
}

// Example: INR formatting
// 1,23,456.78 (Indian numbering system)
// ₹1,23,456.78

// Example: USD formatting  
// $123,456.78
```

---

## 12. Release Phases

### Phase 1: MVP (Weeks 1-10)

**Goal:** Core expense tracking with premium UI

| Week | Deliverables |
|------|--------------|
| 1-2 | Project setup, design system, authentication UI |
| 3-4 | Database setup, basic CRUD operations |
| 5-6 | Dashboard, expense/income tracking |
| 7-8 | Budgeting, accounts management |
| 9-10 | PWA setup, polish, testing |

**Features:**
- ✅ Multi-user profiles with PIN/biometric auth
- ✅ Dashboard with net worth, income, expenses
- ✅ Manual expense/income entry
- ✅ AI auto-categorization (on-device)
- ✅ Basic budgeting
- ✅ Bank account tracking
- ✅ PWA installable

### Phase 2: Investments & Credit (Weeks 11-18)

**Goal:** Complete financial picture

| Week | Deliverables |
|------|--------------|
| 11-12 | Credit card management |
| 13-14 | Loan tracking with EMI calculator |
| 15-16 | Investment portfolio (MF, Stocks, FD/RD) |
| 17-18 | Polish, integration, testing |

**Features:**
- ✅ Credit card tracking with utilization
- ✅ Loan management with amortization
- ✅ Investment portfolio tracking
- ✅ FD/RD management with maturity alerts

### Phase 3: Documents & AI (Weeks 19-26)

**Goal:** AI-powered insights and document management

| Week | Deliverables |
|------|--------------|
| 19-20 | Insurance tracking |
| 21-22 | Document vault with encryption |
| 23-24 | AI insights (cloud integration) |
| 25-26 | Receipt scanning, OCR |

**Features:**
- ✅ Insurance and policy tracking
- ✅ Secure document storage
- ✅ AI-powered insights
- ✅ Receipt scanning with auto-fill
- ✅ Bank statement parsing

### Phase 4: Advanced Features (Weeks 27-36)

**Goal:** Complete platform with all features

| Week | Deliverables |
|------|--------------|
| 27-28 | Lend/borrow tracking |
| 29-30 | Advanced budgeting, goals |
| 31-32 | Reports and analytics |
| 33-34 | Multi-currency, localization |
| 35-36 | Cloud backup, final polish |

**Features:**
- ✅ Lend/borrow management
- ✅ Goal-based savings
- ✅ Comprehensive reports
- ✅ Multi-currency support
- ✅ Regional languages
- ✅ Optional cloud backup

---

## 13. Success Metrics

### 13.1 User Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| DAU/MAU | > 40% | Daily active / Monthly active users |
| Transactions per user/month | > 30 | Average logged transactions |
| Session duration | > 3 min | Average time in app |
| Feature adoption | > 60% | Users using 3+ features |
| Retention D30 | > 50% | Users returning after 30 days |

### 13.2 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI categorization accuracy | > 85% | Correct auto-categories |
| App crash rate | < 0.1% | Crashes per session |
| Page load time | < 2s | Time to interactive |
| Offline reliability | 100% | Core features work offline |

### 13.3 User Satisfaction

| Metric | Target | Measurement |
|--------|--------|-------------|
| App store rating | > 4.5 | Average rating |
| NPS score | > 50 | Net Promoter Score |
| Support tickets | < 1% | Tickets per MAU |

---

## 14. Future Roadmap

### 14.1 Post-Launch Features (6+ months)

| Feature | Description | Priority |
|---------|-------------|----------|
| Bank aggregator | Connect to banks via AA framework | High |
| UPI autopay setup | Direct debit for bills | High |
| Tax filing helper | Generate ITR-ready reports | Medium |
| Family sharing | Share data across devices | Medium |
| Smart watch app | Quick expense logging | Low |
| Voice input | "Add ₹500 Swiggy expense" | Medium |
| Bill scanning | Utility bill auto-import | Medium |

### 14.2 Platform Expansion

| Platform | Timeline | Priority |
|----------|----------|----------|
| Android (native) | Month 8-12 | High |
| iOS (native) | Month 8-12 | High |
| Desktop (Electron) | Month 12+ | Low |
| Browser extension | Month 10+ | Medium |

### 14.3 Enterprise/Premium Features

| Feature | Description |
|---------|-------------|
| Premium insights | Advanced AI financial analysis |
| Priority support | Dedicated support channel |
| Custom categories | Unlimited custom categories |
| Export formats | More export options |
| White-label | For financial advisors |

---

## 15. Appendix

### 15.1 Glossary

| Term | Definition |
|------|------------|
| PWA | Progressive Web App - installable web application |
| IndexedDB | Browser database for large structured data |
| EMI | Equated Monthly Installment |
| NAV | Net Asset Value (mutual funds) |
| SIP | Systematic Investment Plan |
| OCR | Optical Character Recognition |
| AA | Account Aggregator (RBI framework) |

### 15.2 Technical References

- Next.js Documentation: https://nextjs.org/docs
- Dexie.js (IndexedDB): https://dexie.org/docs/
- TensorFlow.js: https://www.tensorflow.org/js
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- PWA Guidelines: https://web.dev/progressive-web-apps/

### 15.3 Design References

- CRED App: Premium fintech UI inspiration
- Robinhood: Investment tracking UI
- Apple Card: Clean card management UI
- Notion: Document organization UX

### 15.4 Competitive Analysis

| App | Strengths | Weaknesses |
|-----|-----------|------------|
| CRED | Premium UI, rewards | Credit cards only |
| Money Manager | Feature-rich | Dated UI, no AI |
| Wallet by BudgetBakers | Multi-currency | Cloud-dependent |
| Splitwise | Debt tracking | Single feature |
| INDmoney | Investment focus | Privacy concerns |

**FinVault Differentiators:**
1. Privacy-first, local storage
2. All-in-one solution
3. Premium CRED-like UI
4. AI without compromising privacy
5. No mandatory account required

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | - | Initial PRD |

---

*This PRD is a living document and will be updated as requirements evolve.*