
import React, { useState } from 'react';
import { Bank, Category } from './types';
import Table from './components/Table';

interface SettingsProps {
  banks: Bank[];
  categories: Category[];
  addBank: (name: string, color: string) => void;
  removeBank: (id: string) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  requestNotificationPermission: () => void;
  resetAllData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  banks, categories, addBank, removeBank, addCategory, removeCategory, requestNotificationPermission, resetAllData 
}) => {
  const [newBankName, setNewBankName] = useState('');
  const [newBankColor, setNewBankColor] = useState('#3b82f6');
  const [newCatName, setNewCatName] = useState('');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Danger Zone / Reset */}
      <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full text-2xl">🧹</div>
          <div>
            <h2 className="text-lg font-black text-red-800 uppercase tracking-tight">Limpar Todos os Dados</h2>
            <p className="text-xs text-red-600/70">Isso apagará todos os lançamentos, fiados e zerará os saldos dos bancos.</p>
          </div>
        </div>
        <button 
          onClick={() => { if(confirm("Tem certeza? Esta ação não pode ser desfeita.")) resetAllData(); }}
          className="bg-red-600 text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md active:scale-95"
        >
          LIMPAR TUDO
        </button>
      </div>

      {/* App Notifications Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full text-2xl">🔔</div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Notificações no Navegador</h2>
            <p className="text-xs text-slate-500">Receba avisos de fiados atrasados diretamente no seu desktop/celular.</p>
          </div>
        </div>
        <button 
          onClick={requestNotificationPermission}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          ATIVAR NOTIFICAÇÕES
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Management */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <img src="https://picsum.photos/id/160/40/40" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Icon" />
            <h2 className="text-xl font-bold text-slate-800">Suas Categorias</h2>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex gap-2">
            <input 
              type="text" 
              placeholder="Nova categoria..." 
              className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <button 
              onClick={() => { if(newCatName) { addCategory(newCatName); setNewCatName(''); } }}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
            >
              ADICIONAR
            </button>
          </div>

          <Table title="Tipos de categorias" headers={['Nome', 'Ações']}>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-slate-100 last:border-none">
                <td className="px-4 py-3">{cat.name}</td>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => removeCategory(cat.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    EXCLUIR
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </div>

        {/* Bank Management */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <img src="https://picsum.photos/id/101/40/40" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Icon" />
            <h2 className="text-xl font-bold text-slate-800">Seus Bancos</h2>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nome do banco..." 
                className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
              />
              <input 
                type="color" 
                className="w-10 h-10 p-1 rounded border cursor-pointer"
                value={newBankColor}
                onChange={(e) => setNewBankColor(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { if(newBankName) { addBank(newBankName, newBankColor); setNewBankName(''); } }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
            >
              ADICIONAR BANCO
            </button>
          </div>

          <Table title="Tipos de pagamentos" headers={['Banco', 'Cor', 'Ações']}>
            {banks.map((bank) => (
              <tr key={bank.id} className="border-b border-slate-100 last:border-none">
                <td className="px-4 py-3 font-medium">{bank.name}</td>
                <td className="px-4 py-3">
                  <div className="w-8 h-4 rounded" style={{ backgroundColor: bank.color }} />
                </td>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => removeBank(bank.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    EXCLUIR
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Settings;
