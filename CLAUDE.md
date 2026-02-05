# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinVault is a privacy-first personal finance manager PWA. All data is stored locally in IndexedDB with AES-256-GCM encryption. No mandatory cloud accounts - everything runs client-side.

## Development Commands

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build (outputs to dist/)
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run format       # Prettier formatting
npm test             # Run Jest tests
npm run test:watch   # Tests in watch mode
npm run test:e2e     # Playwright E2E tests
npm run test:ci      # Tests with coverage (70% threshold)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19, static export
- **State**: Zustand stores in `src/stores/`
- **Database**: Dexie.js (IndexedDB wrapper) in `src/lib/db.ts`
- **Encryption**: AES-256-GCM via Web Crypto API in `src/lib/crypto.ts`
- **AI/ML**: TensorFlow.js for categorization, Tesseract.js for OCR
- **Styling**: Tailwind CSS with CRED-inspired dark theme (black/gold)

### Directory Structure
- `src/app/` - Next.js App Router pages (dashboard, transactions, investments, loans, etc.)
- `src/components/features/` - Feature-specific components (auth, transactions)
- `src/stores/` - Zustand state stores (one per domain: auth, transactions, accounts, etc.)
- `src/lib/` - Core utilities (crypto, db, ai)
- `src/types/index.ts` - All TypeScript type definitions

### Key Patterns
- **Path aliases**: Use `@/` prefix (e.g., `@/components`, `@/lib`, `@/stores`)
- **Authentication**: PIN-based with PBKDF2 key derivation, multi-user profiles
- **Data flow**: Components → Zustand stores → Dexie (IndexedDB)
- **Encryption**: All sensitive data encrypted before storage with per-profile keys

### Crypto Implementation (`src/lib/crypto.ts`)
- PBKDF2: 100,000 iterations, SHA-256
- AES-256-GCM with 96-bit IV, 128-bit auth tag
- Salt: 256 bits per encryption operation

## Code Style

- TypeScript strict mode enabled
- Prettier: No semicolons, single quotes, 2-space indent, 100 char width
- ESLint: next/core-web-vitals base config

## Testing

- Jest with jsdom environment
- Test files: `**/__tests__/**` or `*.{spec,test}.ts(x)`
- Setup file at `src/tests/setup.ts` mocks Web Crypto, IndexedDB, matchMedia
