import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import { applyTheme } from '../utils/themeUtils.js'

const DEFAULTS = {
  person1Name: 'Person 1',
  person2Name: 'Person 2',
  currency: 'GBP',
  theme: 'sky',
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage('hf_settings', DEFAULTS)

  // Re-apply theme whenever settings change (covers local changes and cross-device sync loads)
  useEffect(() => {
    applyTheme(settings.theme ?? 'sky')
  }, [settings.theme])

  const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }))

  return { settings, updateSettings }
}
