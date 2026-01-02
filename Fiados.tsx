
import React, { useState } from 'react';
import { Fiado, Bank } from './types';
import Table from './components/Table';
import { formatCurrency } from './utils';

interface FiadosProps {
  fiados: Fiado[];
  banks: Bank[];
  addFiado: (f: Omit<Fiado, 'id'>) => void;
  payFiado: (fiadoId: string, bankId: string) => void;
  removeFiado: (id: string) => void;
}

const Fiados: React.FC<FiadosProps> = ({ fiados, banks, addFiado, payFiado, removeFiado }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for the payment modal/popover
  const [selectedFiadoToPay, setSelectedFiadoToPay] = useState<string | null>(null);
  const [targetBankId, setTargetBankId] = useState(banks[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    addFiado({
      customerName: name,
      amount: parseFloat(amount),
      date,
      isPaid: false
    });
    setName('');
    setAmount('');
  };

  const isOverdue = (dateStr: string) => {
    const d = new Date(dateStr);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return d < thirtyDaysAgo;
  };

  const handlePayConfirm = () => {
    if (selectedFiadoToPay && targetBankId) {
      payFiado(selectedFiadoToPay, targetBankId);
      setSelectedFiadoToPay(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Selection Overlay */}
      {selectedFiadoToPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Confirmar Recebimento</h3>
            <p className="text-sm text-slate-500 mb-6">Selecione onde o dinheiro está entrando para atualizar seu saldo e dashboard.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Conta / Método de Recebimento</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {banks.map(bank => (
                    <button
                      key={bank.id}
                      onClick={() => setTargetBankId(bank.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        targetBankId === bank.id 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: bank.color }} />
                      <span className="font-bold text-slate-700">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setSelectedFiadoToPay(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 uppercase"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePayConfirm}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Confirmar Baixa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold mb-4 uppercase flex items-center gap-2">
          <span className="text-xl">📒</span> Registrar Novo Fiado
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome do Cliente</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João da Silva" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Valor (R$)</label>
            <input type="number" step="0.01" className="w-full border rounded px-3 py-2" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button type="submit" className="md:col-span-4 bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors uppercase tracking-wider">
            Lançar Fiado
          </button>
        </form>
      </div>

      <Table title="Controle de Fiados / Pendências" headers={['Data', 'Cliente', 'Valor', 'Status', 'Ações']}>
        {[...fiados].reverse().map((f) => {
          const overdue = !f.isPaid && isOverdue(f.date);
          return (
            <tr key={f.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${overdue ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
              <td className="px-4 py-3 text-slate-500">
                {new Date(f.date).toLocaleDateString('pt-BR')}
                {overdue && (
                  <div className="text-[10px] font-black text-red-600 uppercase flex items-center gap-1 mt-1">
                    <span className="animate-ping w-2 h-2 rounded-full bg-red-500" />
                    {Math.floor((Date.now() - new Date(f.date).getTime()) / 86400000)} DIAS EM ATRASO
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="font-bold text-slate-800">{f.customerName}</div>
              </td>
              <td className="px-4 py-3 font-black text-slate-900">{formatCurrency(f.amount)}</td>
              <td className="px-4 py-3">
                {!f.isPaid && (
                  <button 
                    onClick={() => { setSelectedFiadoToPay(f.id); setTargetBankId(banks[0]?.id || ''); }}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all"
                  >
                    Recebeu
                  </button>
                )}
                {f.isPaid && <span className="text-green-600 font-bold uppercase text-xs">Recebido</span>}
              </td>
              <td className="px-4 py-3 flex gap-3">
                <button onClick={() => removeFiado(f.id)} className="text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase underline underline-offset-4">Remover</button>
              </td>
            </tr>
          );
        })}
        {fiados.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Nenhum fiado registrado.</td>
          </tr>
        )}
      </Table>
    </div>
  );
};

export default Fiados;
