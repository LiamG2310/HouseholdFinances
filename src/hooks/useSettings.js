import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import { applyTheme, applyMode } from '../utils/themeUtils.js'

const DEFAULTS = {
  person1Name: 'Person 1',
  person2Name: 'Person 2',
  currency: 'GBP',
  theme: 'sky',
  mode: 'dark',
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage('hf_settings', DEFAULTS)

  useEffect(() => {
    applyTheme(settings.theme ?? 'sky')
  }, [settings.theme])

  useEffect(() => {
    applyMode(settings.mode ?? 'dark')
  }, [settings.mode])

  const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }))

  return { settings, updateSettings }
}
