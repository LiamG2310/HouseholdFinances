import { useLocalStorage } from './useLocalStorage.js'

const DEFAULTS = {
  person1Name: 'Person 1',
  person2Name: 'Person 2',
  currency: 'GBP',
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage('hf_settings', DEFAULTS)

  const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }))

  return { settings, updateSettings }
}
