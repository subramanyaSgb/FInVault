/**
 * Price Service - Fetch live prices for stocks, mutual funds, and crypto
 * Uses free APIs that don't require API keys
 * Note: Yahoo Finance requires CORS proxy for browser access
 */

export interface PriceData {
  symbol: string
  price: number
  change: number
  changePercent: number
  lastUpdated: Date
  currency: string
  error?: string
}

export interface PriceResult {
  success: boolean
  data?: PriceData
  error?: string
}

// CORS proxy for APIs that don't support browser requests
// AllOrigins is free and reliable
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

// Yahoo Finance API for stocks (via CORS proxy)
// Supports Indian stocks with .NS (NSE) or .BO (BSE) suffix
export async function fetchStockPrice(symbol: string): Promise<PriceResult> {
  try {
    // Add .NS suffix for Indian stocks if not already present
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formattedSymbol)}?interval=1d&range=1d`

    const response = await fetch(CORS_PROXY + encodeURIComponent(yahooUrl), {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()

    if (data.chart?.error) {
      return { success: false, error: data.chart.error.description || 'Symbol not found' }
    }

    const result = data.chart?.result?.[0]
    if (!result) {
      return { success: false, error: 'No data returned' }
    }

    const meta = result.meta
    const price = meta.regularMarketPrice || 0
    const previousClose = meta.chartPreviousClose || meta.previousClose || price
    const change = price - previousClose
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

    return {
      success: true,
      data: {
        symbol: formattedSymbol,
        price,
        change,
        changePercent,
        lastUpdated: new Date(),
        currency: meta.currency || 'INR',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// MFAPI.in for Indian Mutual Funds (free, no API key required)
// Accepts scheme code or ISIN
export async function fetchMutualFundNAV(schemeCodeOrISIN: string): Promise<PriceResult> {
  try {
    // MFAPI uses scheme codes, but we can search by ISIN if needed
    const isSchemeCode = /^\d+$/.test(schemeCodeOrISIN)

    if (!isSchemeCode) {
      // Try to search for scheme by ISIN
      const searchResult = await searchMutualFund(schemeCodeOrISIN)
      if (!searchResult.success || !searchResult.schemeCode) {
        return { success: false, error: 'Mutual fund not found' }
      }
      schemeCodeOrISIN = searchResult.schemeCode
    }

    const response = await fetch(`https://api.mfapi.in/mf/${schemeCodeOrISIN}`)

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()

    if (data.status === 'FAILED' || !data.data || data.data.length === 0) {
      return { success: false, error: 'Mutual fund not found' }
    }

    const latestNAV = data.data[0]
    const previousNAV = data.data.length > 1 ? data.data[1] : latestNAV

    const price = parseFloat(latestNAV.nav)
    const prevPrice = parseFloat(previousNAV.nav)
    const change = price - prevPrice
    const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0

    return {
      success: true,
      data: {
        symbol: data.meta?.scheme_code?.toString() || schemeCodeOrISIN,
        price,
        change,
        changePercent,
        lastUpdated: new Date(latestNAV.date.split('-').reverse().join('-')),
        currency: 'INR',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// Search for mutual fund by name or ISIN
async function searchMutualFund(
  query: string
): Promise<{ success: boolean; schemeCode?: string; error?: string }> {
  try {
    const response = await fetch('https://api.mfapi.in/mf/search?q=' + encodeURIComponent(query))
    const data = await response.json()

    if (data && data.length > 0) {
      return { success: true, schemeCode: data[0].schemeCode?.toString() }
    }
    return { success: false, error: 'Not found' }
  } catch {
    return { success: false, error: 'Search failed' }
  }
}

// CoinGecko API for Cryptocurrency (free, rate limited)
// Common coin IDs: bitcoin, ethereum, solana, cardano, dogecoin, etc.
export async function fetchCryptoPrice(coinId: string): Promise<PriceResult> {
  try {
    // Normalize common symbols to CoinGecko IDs
    const idMap: Record<string, string> = {
      btc: 'bitcoin',
      eth: 'ethereum',
      sol: 'solana',
      ada: 'cardano',
      doge: 'dogecoin',
      xrp: 'ripple',
      bnb: 'binancecoin',
      matic: 'matic-network',
      dot: 'polkadot',
      link: 'chainlink',
    }

    const normalizedId = idMap[coinId.toLowerCase()] || coinId.toLowerCase()

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(normalizedId)}&vs_currencies=inr&include_24hr_change=true`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Rate limited - try again later' }
      }
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()
    const coinData = data[normalizedId]

    if (!coinData) {
      return { success: false, error: 'Cryptocurrency not found' }
    }

    const price = coinData.inr || 0
    const changePercent = coinData.inr_24h_change || 0
    const change = (price * changePercent) / 100

    return {
      success: true,
      data: {
        symbol: normalizedId,
        price,
        change,
        changePercent,
        lastUpdated: new Date(),
        currency: 'INR',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// Unified function to fetch price based on investment type
export async function fetchInvestmentPrice(
  type: string,
  symbol?: string | undefined,
  isin?: string | undefined
): Promise<PriceResult> {
  const identifier = symbol || isin

  if (!identifier) {
    return { success: false, error: 'No symbol or ISIN provided' }
  }

  switch (type.toLowerCase()) {
    case 'stock':
    case 'stocks':
    case 'equity':
      return fetchStockPrice(identifier)

    case 'mutual_fund':
    case 'mutual fund':
    case 'mf':
      return fetchMutualFundNAV(identifier)

    case 'crypto':
    case 'cryptocurrency':
      return fetchCryptoPrice(identifier)

    case 'etf':
      // ETFs can be fetched like stocks
      return fetchStockPrice(identifier)

    default:
      return { success: false, error: `Price fetching not supported for type: ${type}` }
  }
}

// Batch fetch prices for multiple investments
export async function fetchMultiplePrices(
  investments: Array<{ id: string; type: string; symbol?: string | undefined; isin?: string | undefined }>
): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>()

  // Process in parallel with concurrency limit to avoid rate limiting
  const CONCURRENCY = 3
  const chunks: typeof investments[] = []

  for (let i = 0; i < investments.length; i += CONCURRENCY) {
    chunks.push(investments.slice(i, i + CONCURRENCY))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (inv) => {
      const result = await fetchInvestmentPrice(inv.type, inv.symbol, inv.isin)
      results.set(inv.id, result)
    })

    await Promise.all(promises)

    // Small delay between chunks to respect rate limits
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  return results
}
