// ============================================
// FinVault Biometric Authentication Module
// ============================================
// Implements WebAuthn API for biometric authentication
// Supports fingerprint, Face ID, and other platform authenticators
// ============================================

import { arrayBufferToBase64, base64ToUint8Array } from './crypto'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface BiometricCredential {
  credentialId: string // Base64 encoded
  publicKey: string // Base64 encoded
  counter: number
  createdAt: number
  authenticatorType: string
}

export interface BiometricEnrollmentResult {
  success: boolean
  credential?: BiometricCredential
  error?: string
}

export interface BiometricVerificationResult {
  success: boolean
  error?: string
}

export type BiometricAvailability =
  | 'available'
  | 'not-supported'
  | 'no-authenticator'
  | 'not-secure-context'

// ============================================
// CONSTANTS
// ============================================

const RP_NAME = 'FinVault'
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

// ============================================
// AVAILABILITY CHECK
// ============================================

/**
 * Check if biometric authentication is available on this device
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  // Check for secure context (required for WebAuthn)
  if (typeof window === 'undefined') {
    return 'not-supported'
  }

  if (!window.isSecureContext) {
    return 'not-secure-context'
  }

  // Check for WebAuthn support
  if (!window.PublicKeyCredential) {
    return 'not-supported'
  }

  // Check for platform authenticator (fingerprint/Face ID)
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available ? 'available' : 'no-authenticator'
  } catch {
    return 'not-supported'
  }
}

/**
 * Check if biometrics are available (simple boolean check)
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const availability = await checkBiometricAvailability()
  return availability === 'available'
}

// ============================================
// ENROLLMENT
// ============================================

/**
 * Enroll biometric authentication for a user profile
 * @param profileId - User's profile ID
 * @param profileName - User's display name
 * @returns BiometricEnrollmentResult
 */
export async function enrollBiometric(
  profileId: string,
  profileName: string
): Promise<BiometricEnrollmentResult> {
  try {
    // Check availability first
    const availability = await checkBiometricAvailability()
    if (availability !== 'available') {
      return {
        success: false,
        error: getBiometricErrorMessage(availability),
      }
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Create user ID from profile ID
    const userId = new TextEncoder().encode(profileId)

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: RP_NAME,
        id: RP_ID,
      },
      user: {
        id: userId,
        name: profileName,
        displayName: profileName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use built-in authenticator (fingerprint/Face ID)
        userVerification: 'required', // Require biometric verification
        residentKey: 'preferred',
      },
      timeout: 60000, // 60 seconds
      attestation: 'none', // We don't need attestation for local auth
    }

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential | null

    if (!credential) {
      return {
        success: false,
        error: 'Failed to create biometric credential',
      }
    }

    // Extract credential data
    const response = credential.response as AuthenticatorAttestationResponse
    const credentialId = arrayBufferToBase64(credential.rawId)
    const publicKey = arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0))

    // Get authenticator type from response
    let authenticatorType = 'platform'
    try {
      const authenticatorData = response.getAuthenticatorData()
      if (authenticatorData) {
        authenticatorType = 'platform-verified'
      }
    } catch {
      // Fallback to default
    }

    const biometricCredential: BiometricCredential = {
      credentialId,
      publicKey,
      counter: 0,
      createdAt: Date.now(),
      authenticatorType,
    }

    return {
      success: true,
      credential: biometricCredential,
    }
  } catch (error) {
    console.error('Biometric enrollment failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Biometric enrollment failed',
    }
  }
}

// ============================================
// VERIFICATION
// ============================================

/**
 * Verify biometric authentication
 * @param storedCredential - Previously enrolled credential
 * @returns BiometricVerificationResult
 */
export async function verifyBiometric(
  storedCredential: BiometricCredential
): Promise<BiometricVerificationResult> {
  try {
    // Check availability
    const availability = await checkBiometricAvailability()
    if (availability !== 'available') {
      return {
        success: false,
        error: getBiometricErrorMessage(availability),
      }
    }

    // Generate challenge
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Decode stored credential ID
    const credentialIdArray = base64ToUint8Array(storedCredential.credentialId)

    // Create assertion options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: RP_ID,
      allowCredentials: [
        {
          id: credentialIdArray.buffer as ArrayBuffer,
          type: 'public-key',
          transports: ['internal'], // Platform authenticator
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    }

    // Get assertion
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential | null

    if (!assertion) {
      return {
        success: false,
        error: 'Biometric verification cancelled',
      }
    }

    // Verify the credential ID matches
    const returnedCredentialId = arrayBufferToBase64(assertion.rawId)
    if (returnedCredentialId !== storedCredential.credentialId) {
      return {
        success: false,
        error: 'Credential mismatch',
      }
    }

    // Verification successful
    return { success: true }
  } catch (error) {
    console.error('Biometric verification failed:', error)

    // Handle specific WebAuthn errors
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Biometric verification was cancelled or denied',
        }
      }
      if (error.name === 'SecurityError') {
        return {
          success: false,
          error: 'Biometric verification requires a secure context',
        }
      }
      if (error.name === 'InvalidStateError') {
        return {
          success: false,
          error: 'Biometric credential not found on this device',
        }
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Biometric verification failed',
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user-friendly error message for biometric availability status
 */
export function getBiometricErrorMessage(availability: BiometricAvailability): string {
  switch (availability) {
    case 'not-supported':
      return 'Biometric authentication is not supported on this browser'
    case 'no-authenticator':
      return 'No biometric authenticator found on this device'
    case 'not-secure-context':
      return 'Biometric authentication requires HTTPS'
    default:
      return 'Biometric authentication is unavailable'
  }
}

/**
 * Serialize biometric credential for storage
 */
export function serializeBiometricCredential(credential: BiometricCredential): string {
  return JSON.stringify(credential)
}

/**
 * Deserialize biometric credential from storage
 */
export function deserializeBiometricCredential(serialized: string): BiometricCredential | null {
  try {
    const parsed = JSON.parse(serialized)
    if (
      typeof parsed.credentialId === 'string' &&
      typeof parsed.publicKey === 'string' &&
      typeof parsed.counter === 'number' &&
      typeof parsed.createdAt === 'number'
    ) {
      return parsed as BiometricCredential
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get a human-readable name for the authenticator type
 */
export function getAuthenticatorTypeName(type: string): string {
  switch (type) {
    case 'platform':
    case 'platform-verified':
      return 'Device Biometrics'
    case 'cross-platform':
      return 'External Authenticator'
    default:
      return 'Authenticator'
  }
}

// ============================================
// DEFAULT EXPORT
// ============================================

const biometricUtils = {
  checkBiometricAvailability,
  isBiometricAvailable,
  enrollBiometric,
  verifyBiometric,
  getBiometricErrorMessage,
  serializeBiometricCredential,
  deserializeBiometricCredential,
  getAuthenticatorTypeName,
}

export default biometricUtils
