import { useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { useLocalStorage } from './useLocalStorage.js'
import { toMonthly } from '../utils/billUtils.js'

export function useIncome() {
  const [incomes, setIncomes] = useLocalStorage('hf_income', [])
  const [incomeReceipts, setIncomeReceipts] = useLocalStorage('hf_income_receipts', [])

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

  const isIncomeReceived = useCallback((incomeId, monthKey) =>
    incomeReceipts.some(r => r.incomeId === incomeId && r.month === monthKey)
  , [incomeReceipts])

  const markIncomeReceived = useCallback((incomeId, monthKey) => {
    if (incomeReceipts.some(r => r.incomeId === incomeId && r.month === monthKey)) return
    setIncomeReceipts(prev => [...prev, { id: uuid(), incomeId, month: monthKey, date: new Date().toISOString().slice(0, 10) }])
  }, [incomeReceipts, setIncomeReceipts])

  const markIncomeNotReceived = useCallback((incomeId, monthKey) => {
    setIncomeReceipts(prev => prev.filter(r => !(r.incomeId === incomeId && r.month === monthKey)))
  }, [setIncomeReceipts])

  const monthlyTotal = incomes
    .filter(i => i.active)
    .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)

  const monthlyByPerson = (personId) =>
    incomes
      .filter(i => i.active && i.personId === personId)
      .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)

  return { incomes, addIncome, updateIncome, deleteIncome, restoreIncome, monthlyTotal, monthlyByPerson, incomeReceipts, isIncomeReceived, markIncomeReceived, markIncomeNotReceived }
}
