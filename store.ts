
import { useState, useEffect } from 'react';
import { Bank, Category, Transaction, Fiado, TransactionType, MonthHistory } from './types';
import { DEFAULT_BANKS, DEFAULT_CATEGORIES, MOCK_TRANSACTIONS } from './constants';

export function useFinanceStore() {
  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem('hdf_banks');
    return saved ? JSON.parse(saved) : DEFAULT_BANKS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('hdf_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('hdf_transactions');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });

  const [fiados, setFiados] = useState<Fiado[]>(() => {
    const saved = localStorage.getItem('hdf_fiados');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<MonthHistory[]>(() => {
    const saved = localStorage.getItem('hdf_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [lastCheckDate, setLastCheckDate] = useState<string>(() => {
    return localStorage.getItem('hdf_last_check') || new Date().toISOString();
  });

  useEffect(() => {
    localStorage.setItem('hdf_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('hdf_last_check', lastCheckDate);
  }, [lastCheckDate]);

  // Month turnover logic
  useEffect(() => {
    const now = new Date();
    const lastCheck = new Date(lastCheckDate);
    
    if (now.getMonth() !== lastCheck.getMonth() || now.getFullYear() !== lastCheck.getFullYear()) {
      // Calculate last month's stats before resetting
      const lastMonth = lastCheck.getMonth();
      const lastYear = lastCheck.getFullYear();
      
      const lastMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
      });

      const totalSold = lastMonthTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0);
      const totalCost = lastMonthTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0);
      const profit = totalSold - totalCost;
      const margin = totalSold > 0 ? (profit / totalSold) * 100 : 0;

      const historyEntry: MonthHistory = {
        monthYear: `${lastMonth + 1}/${lastYear}`,
        totalSold,
        totalCost,
        profit,
        margin
      };

      setHistory(prev => [...prev, historyEntry]);
      setLastCheckDate(now.toISOString());
      
      // We don't clear transactions, but the UI filters by current month
      // The user requested: "Zerar automaticamente: Receita mensal, Custos mensais, Lucro mensal"
      // This is effectively handled by the UI filtering for the current month.
    }
  }, [transactions, lastCheckDate]);

  useEffect(() => {
    localStorage.setItem('hdf_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('hdf_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('hdf_fiados', JSON.stringify(fiados));
  }, [fiados]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newT = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [...prev, newT]);
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addBank = (name: string, color: string) => {
    const newBank: Bank = { id: Date.now().toString(), name, color, initialBalance: 0 };
    setBanks(prev => [...prev, newBank]);
  };

  const removeBank = (id: string) => {
    setBanks(prev => prev.filter(b => b.id !== id));
  };

  const addCategory = (name: string) => {
    const newCat: Category = { id: Date.now().toString(), name };
    setCategories(prev => [...prev, newCat]);
  };

  const removeCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addFiado = (f: Omit<Fiado, 'id'>) => {
    const newF = { ...f, id: Math.random().toString(36).substr(2, 9) };
    setFiados(prev => [...prev, newF]);
  };

  const payFiado = (fiadoId: string, bankId: string) => {
    const fiado = fiados.find(f => f.id === fiadoId);
    if (!fiado) return;

    // Mark as paid
    setFiados(prev => prev.map(f => f.id === fiadoId ? { ...f, isPaid: true } : f));

    // Create a transaction (Income)
    const newTransaction: Omit<Transaction, 'id'> = {
      description: `Recebimento Fiado: ${fiado.customerName}`,
      amount: fiado.amount,
      type: TransactionType.RECEITA,
      bankId: bankId,
      categoryId: 'c1', // Fixed as "Venda" or similar based on DEFAULT_CATEGORIES
      date: new Date().toISOString().split('T')[0],
      isPaid: true
    };
    addTransaction(newTransaction);
  };

  const toggleFiadoPaid = (id: string) => {
    // This is now legacy or can be used to unpay
    setFiados(prev => prev.map(f => f.id === id ? { ...f, isPaid: !f.isPaid } : f));
  };

  const removeFiado = (id: string) => {
    setFiados(prev => prev.filter(f => f.id !== id));
  };

  const resetAllData = () => {
    setTransactions([]);
    setFiados([]);
    setBanks(DEFAULT_BANKS);
    setCategories(DEFAULT_CATEGORIES);
    localStorage.clear();
    window.location.reload();
  };

  return {
    banks,
    categories,
    transactions,
    fiados,
    addTransaction,
    removeTransaction,
    addBank,
    removeBank,
    addCategory,
    removeCategory,
    addFiado,
    payFiado,
    toggleFiadoPaid,
    removeFiado,
    setTransactions,
    resetAllData
  };
}
