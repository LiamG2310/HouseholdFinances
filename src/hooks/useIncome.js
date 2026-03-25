import { useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { useLocalStorage } from './useLocalStorage.js'
import { toMonthly } from '../utils/billUtils.js'

export function useIncome() {
  const [incomes, setIncomes] = useLocalStorage('hf_income', [])

  const addIncome = useCallback((income) => {
    setIncomes(prev => [...prev, { ...income, id: uuid(), active: true }])
  }, [setIncomes])

  const updateIncome = useCallback((id, patch) => {
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }, [setIncomes])

  const deleteIncome = useCallback((id) => {
    const income = incomes.find(i => i.id === id)
    setIncomes(prev => prev.filter(i => i.id !== id))
    return income
  }, [incomes, setIncomes])

  const restoreIncome = useCallback((income) => {
    setIncomes(prev => [...prev, income])
  }, [setIncomes])

  const monthlyTotal = incomes
    .filter(i => i.active)
    .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)

  const monthlyByPerson = (personId) =>
    incomes
      .filter(i => i.active && i.personId === personId)
      .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)

  return { incomes, addIncome, updateIncome, deleteIncome, restoreIncome, monthlyTotal, monthlyByPerson }
}
