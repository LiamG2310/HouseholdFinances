import { useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { useLocalStorage } from './useLocalStorage.js'
import { getBillsForMonth } from '../utils/billUtils.js'

export function useBills() {
  const [bills, setBills] = useLocalStorage('hf_bills', [])
  const [payments, setPayments] = useLocalStorage('hf_payments', [])

  const addBill = useCallback((bill) => {
    setBills(prev => [...prev, { ...bill, id: uuid(), active: true }])
  }, [setBills])

  const updateBill = useCallback((id, patch) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }, [setBills])

  const deleteBill = useCallback((id) => {
    const bill = bills.find(b => b.id === id)
    const billPayments = payments.filter(p => p.billId === id)
    setBills(prev => prev.filter(b => b.id !== id))
    setPayments(prev => prev.filter(p => p.billId !== id))
    return { bill, payments: billPayments }
  }, [bills, payments, setBills, setPayments])

  const restoreBill = useCallback(({ bill, payments: saved = [] }) => {
    setBills(prev => [...prev, bill])
    if (saved.length) setPayments(prev => [...prev, ...saved])
  }, [setBills, setPayments])

  const getBillsMonth = useCallback((year, month) => {
    return getBillsForMonth(bills, year, month)
  }, [bills])

  const isPaid = useCallback((billId, monthKey) => {
    return payments.some(p => p.billId === billId && p.month === monthKey)
  }, [payments])

  const markPaid = useCallback((billId, monthKey, paidBy, amount) => {
    if (isPaid(billId, monthKey)) return
    setPayments(prev => [...prev, {
      id: uuid(),
      billId,
      month: monthKey,
      paidDate: new Date().toISOString().slice(0, 10),
      amount,
      paidBy,
    }])
  }, [isPaid, setPayments])

  const markUnpaid = useCallback((billId, monthKey) => {
    setPayments(prev => prev.filter(p => !(p.billId === billId && p.month === monthKey)))
  }, [setPayments])

  return { bills, payments, addBill, updateBill, deleteBill, restoreBill, getBillsMonth, isPaid, markPaid, markUnpaid }
}
