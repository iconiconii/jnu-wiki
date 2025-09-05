'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'JNU_WIKI_AUTH_VERIFIED_AT'
// TTL in hours from env (client-safe NEXT_PUBLIC_ var), default 24h
const TTL_HOURS_ENV = Number(process.env.NEXT_PUBLIC_AUTH_TTL_HOURS)
const TTL_HOURS =
  Number.isFinite(TTL_HOURS_ENV) && TTL_HOURS_ENV > 0 && TTL_HOURS_ENV <= 24 * 365
    ? TTL_HOURS_ENV
    : 24
const TTL_MS = TTL_HOURS * 60 * 60 * 1000

function now() {
  return Date.now()
}

function readTimestamp(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const ts = Number(raw)
    return Number.isFinite(ts) ? ts : null
  } catch {
    return null
  }
}

function writeTimestamp(ts: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, String(ts))
  } catch {
    // ignore
  }
}

function clearTimestamp() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function useAuthGate() {
  // initialize from storage synchronously to avoid flicker
  const [verifiedAt, setVerifiedAt] = useState<number | null>(() => readTimestamp())

  const isVerified = useMemo(() => {
    if (!verifiedAt) return false
    return now() - verifiedAt < TTL_MS
  }, [verifiedAt])

  const markVerified = useCallback(() => {
    const ts = now()
    writeTimestamp(ts)
    setVerifiedAt(ts)
  }, [])

  const clearVerified = useCallback(() => {
    clearTimestamp()
    setVerifiedAt(null)
  }, [])

  return {
    isVerified,
    verifiedAt,
    markVerified,
    clearVerified,
    ttlMs: TTL_MS,
  }
}
