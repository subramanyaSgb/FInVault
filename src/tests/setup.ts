import '@testing-library/jest-dom'

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = '0px'
  readonly thresholds: ReadonlyArray<number> = [0]

  observe = () => {}
  disconnect = () => {}
  unobserve = () => {}
  takeRecords = () => []
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock crypto for tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    },
    subtle: {
      digest: () => Promise.resolve(new ArrayBuffer(32)),
      importKey: () => Promise.resolve({} as CryptoKey),
      exportKey: () => Promise.resolve(new ArrayBuffer(32)),
      encrypt: () => Promise.resolve(new ArrayBuffer(32)),
      decrypt: () => Promise.resolve(new ArrayBuffer(32)),
      deriveKey: () => Promise.resolve({} as CryptoKey),
      generateKey: () => Promise.resolve({} as CryptoKeyPair),
    },
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})
