
import React, { useState } from 'react';
import { Transaction, TransactionType, Bank, Category } from './types';
import Table from './components/Table';
import { formatCurrency } from './utils';

interface TransactionsProps {
  transactions: Transaction[];
  banks: Bank[];
  categories: Category[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, banks, categories, addTransaction, removeTransaction }) => {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.DESPESA);
  const [bankId, setBankId] = useState(banks[0]?.id || '');
  const [catId, setCatId] = useState(categories[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !val) return;
    addTransaction({
      description: desc,
      amount: parseFloat(val),
      type,
      bankId,
      categoryId: catId,
      date,
      isPaid: true
    });
    setDesc('');
    setVal('');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold mb-4 uppercase">Novo Lançamento</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIÇÃO</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">VALOR (R$)</label>
            <input type="number" step="0.01" className="w-full border rounded px-3 py-2" value={val} onChange={e => setVal(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">TIPO</label>
            <select className="w-full border rounded px-3 py-2" value={type} onChange={e => setType(e.target.value as TransactionType)}>
              <option value={TransactionType.DESPESA}>Despesa</option>
              <option value={TransactionType.RECEITA}>Receita</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">DATA</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">SALVAR</button>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">BANCO</label>
             <select className="w-full border rounded px-3 py-2" value={bankId} onChange={e => setBankId(e.target.value)}>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">CATEGORIA</label>
             <select className="w-full border rounded px-3 py-2" value={catId} onChange={e => setCatId(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </form>
      </div>

      <Table title="Extrato de Lançamentos" headers={['Data', 'Descrição', 'Categoria', 'Banco', 'Valor', 'Ações']}>
        {[...transactions].reverse().map((t) => {
          const bank = banks.find(b => b.id === t.bankId);
          const cat = categories.find(c => c.id === t.categoryId);
          return (
            <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-3 font-medium">{t.description}</td>
              <td className="px-4 py-3 text-slate-600">{cat?.name}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bank?.color }} />
                  {bank?.name}
                </span>
              </td>
              <td className={`px-4 py-3 font-bold ${t.type === TransactionType.RECEITA ? 'text-blue-600' : 'text-red-500'}`}>
                {t.type === TransactionType.RECEITA ? '+ ' : '- '}
                {formatCurrency(t.amount)}
              </td>
              <td className="px-4 py-3">
                <button onClick={() => removeTransaction(t.id)} className="text-red-400 hover:text-red-600 text-xs uppercase font-bold">Remover</button>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
};

export default Transactions;
