"use client"

import { useCallback, useSyncExternalStore } from "react"
import { DEFAULT_MODULE_ITEMS, type NavModule } from "./navigation"

const STORAGE_KEY = "prism:module-config"

type ModuleMap = Record<string, NavModule>

function getSnapshot(): ModuleMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return Object.fromEntries(
    DEFAULT_MODULE_ITEMS.map((i) => [i.href, i.module])
  )
}

let cached = getSnapshot()

function subscribe(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cached = getSnapshot()
      cb()
    }
  }
  window.addEventListener("storage", handler)
  return () => window.removeEventListener("storage", handler)
}

function getServerSnapshot(): ModuleMap {
  return Object.fromEntries(
    DEFAULT_MODULE_ITEMS.map((i) => [i.href, i.module])
  )
}

export function useModuleConfig() {
  const map = useSyncExternalStore(subscribe, () => cached, getServerSnapshot)

  const setModule = useCallback((href: string, module: NavModule) => {
    const next = { ...cached, [href]: module }
    cached = next
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY })
    )
  }, [])

  const reset = useCallback(() => {
    cached = getServerSnapshot()
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY })
    )
  }, [])

  return { moduleMap: map, setModule, reset }
}
