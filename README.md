# FinVault

A privacy-first, offline-capable personal finance manager PWA.

## Features

✅ **Privacy-First** - All data stored locally with AES-256 encryption  
✅ **Multi-User** - Multiple profiles with PIN/biometric authentication  
✅ **Transaction Tracking** - Expense/income with AI categorization  
✅ **Dashboard** - Net worth, monthly summaries, quick actions  
✅ **PWA** - Installable, works offline  
✅ **Dark Theme** - Premium CRED-inspired UI

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Dexie.js (IndexedDB)
- **Encryption**: Web Crypto API (AES-256-GCM)
- **State**: Zustand
- **Animations**: Framer Motion

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
/src
  /app              # Next.js pages
    /dashboard      # Main dashboard
    /transactions   # Transaction management
  /components       # React components
    /features       # Feature components
    /ui            # UI components
  /lib             # Utilities
    /db.ts         # Database layer
    /crypto.ts     # Encryption
    /ai            # AI categorization
  /stores          # Zustand stores
  /types           # TypeScript types
  /styles          # Global CSS
```

## Security

- PIN/password authentication with PBKDF2 (100K iterations)
- AES-256-GCM encryption for sensitive data
- Client-side encryption only
- No data leaves your device without explicit consent

## License

MIT License - Free for personal and commercial use.
