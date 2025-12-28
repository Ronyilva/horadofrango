
import { Bank, Category, Transaction, TransactionType } from './types';

export const DEFAULT_BANKS: Bank[] = [
  { id: '1', name: 'Banco do Brasil', color: '#F7A823', initialBalance: 0 },
  { id: '2', name: 'Nubank', color: '#8A05BE', initialBalance: 0 },
  { id: '3', name: 'Dinheiro', color: '#4CAF50', initialBalance: 0 },
  { id: '4', name: 'Caixa', color: '#1A75CF', initialBalance: 0 },
  { id: '5', name: 'Santander', color: '#EC0000', initialBalance: 0 },
  { id: '6', name: 'Bradesco', color: '#FF4B4B', initialBalance: 0 },
  { id: '7', name: 'Itaú', color: '#FF7000', initialBalance: 0 }
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Venda' },
  { id: 'c2', name: 'Salário' },
  { id: 'c3', name: 'Aluguel' },
  { id: 'c4', name: 'Fornecedor' },
  { id: 'c5', name: 'Empresa' },
  { id: 'c6', name: 'Colaborador' },
  { id: 'c7', name: 'Casa' },
  { id: 'c8', name: 'Carro' }
];

export const MOCK_TRANSACTIONS: Transaction[] = []; // Removendo mock transactions para iniciar limpo
