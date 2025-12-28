
import React, { useState, useEffect, useMemo } from 'react';
import Dashboard from './Dashboard';
import Settings from './Settings';
import Transactions from './Transactions';
import Fiados from './Fiados';
import Forecast from './Forecast';
import { useFinanceStore } from './store';

enum Tab {
  DASHBOARD = 'DASHBOARD',
  EXTRATO = 'EXTRATO',
  FIADOS = 'FIADOS',
  PREVISAO = 'PREVISAO',
  CONFIG = 'CONFIG'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { 
    banks, categories, transactions, fiados,
    addTransaction, removeTransaction, 
    addBank, removeBank, addCategory, removeCategory,
    addFiado, payFiado, toggleFiadoPaid, removeFiado, resetAllData
  } = useFinanceStore();

  const overdueFiados = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return fiados.filter(f => !f.isPaid && new Date(f.date) < thirtyDaysAgo);
  }, [fiados]);

  // Handle Browser Notifications with safety check
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (overdueFiados.length > 0 && Notification.permission === 'granted') {
        try {
          new Notification('Hora do Frango: Fiados Atrasados', {
            body: `Você tem ${overdueFiados.length} cliente(s) com pagamento pendente há mais de 30 dias.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'
          });
        } catch (e) {
          console.error("Erro ao enviar notificação:", e);
        }
      }
    }
  }, [overdueFiados.length]);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notificações ativadas com sucesso!');
      }
    } else {
      alert('Seu navegador não suporta notificações nativas.');
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-[#1e293b] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg rotate-12">
               <span className="text-2xl font-black">🐔</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">HORA DO FRANGO</h1>
              <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mt-1">Gestão Financeira Profissional</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex gap-1 flex-wrap justify-center">
              {[
                { id: Tab.DASHBOARD, label: 'DASHBOARD' },
                { id: Tab.EXTRATO, label: 'EXTRATO' },
                { id: Tab.FIADOS, label: 'FIADOS' },
                { id: Tab.PREVISAO, label: 'PREVISÃO' },
                { id: Tab.CONFIG, label: 'CONFIG' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-slate-700 transition-colors relative"
              >
                <span className="text-xl">🔔</span>
                {overdueFiados.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                    {overdueFiados.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden z-50">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-500">Notificações</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {overdueFiados.length > 0 ? (
                      overdueFiados.map(f => (
                        <div key={f.id} className="p-3 border-b border-slate-50 hover:bg-red-50 transition-colors flex items-start gap-3">
                          <span className="text-lg">⚠️</span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{f.customerName}</p>
                            <p className="text-[10px] text-red-500 font-semibold uppercase">Atrasado há +30 dias</p>
                            <p className="text-[10px] text-slate-400">Valor pendente: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.amount)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <span className="text-3xl block mb-2">🎉</span>
                        <p className="text-xs font-medium">Nenhum fiado em atraso!</p>
                      </div>
                    )}
                  </div>
                  {overdueFiados.length > 0 && (
                    <button 
                      onClick={() => { setActiveTab(Tab.FIADOS); setShowNotifications(false); }}
                      className="w-full py-3 bg-blue-50 text-blue-600 text-[10px] font-black uppercase hover:bg-blue-100 transition-colors"
                    >
                      Ir para Controle de Fiados
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {activeTab === Tab.DASHBOARD && (
          <Dashboard transactions={transactions} banks={banks} categories={categories} fiados={fiados} />
        )}
        {activeTab === Tab.EXTRATO && (
          <Transactions 
            transactions={transactions} 
            banks={banks} 
            categories={categories} 
            addTransaction={addTransaction}
            removeTransaction={removeTransaction}
          />
        )}
        {activeTab === Tab.FIADOS && (
          <Fiados 
            fiados={fiados} 
            banks={banks}
            addFiado={addFiado} 
            payFiado={payFiado}
            removeFiado={removeFiado} 
          />
        )}
        {activeTab === Tab.PREVISAO && (
          <Forecast transactions={transactions} />
        )}
        {activeTab === Tab.CONFIG && (
          <Settings 
            banks={banks} 
            categories={categories} 
            addBank={addBank} 
            removeBank={removeBank}
            addCategory={addCategory}
            removeCategory={removeCategory}
            requestNotificationPermission={requestNotificationPermission}
            resetAllData={resetAllData}
          />
        )}
      </main>

      {/* Footer info */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-200">
        <div className="flex justify-between items-center text-slate-400 text-[10px] font-medium uppercase tracking-widest">
          <p>&copy; 2025 Hora do Frango - Gestão Inteligente</p>
          <div className="flex gap-4">
            <span>Status: Online</span>
            <span>v3.0.0-FIX</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;