
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

const APP_ICON_URL = "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=512&h=512&auto=format&fit=crop";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const { 
    banks, categories, transactions, fiados,
    addTransaction, removeTransaction, 
    addBank, removeBank, addCategory, removeCategory,
    addFiado, payFiado, toggleFiadoPaid, removeFiado, resetAllData
  } = useFinanceStore();

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const overdueFiados = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return fiados.filter(f => !f.isPaid && new Date(f.date) < thirtyDaysAgo);
  }, [fiados]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (overdueFiados.length > 0 && Notification.permission === 'granted') {
        try {
          new Notification('Hora do Frango: Fiados Atrasados', {
            body: `Você tem ${overdueFiados.length} cliente(s) pendentes há mais de 30 dias.`,
            icon: APP_ICON_URL
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
    <div className="min-h-screen pb-20 md:pb-12 bg-slate-50">
      {/* Header */}
      <header className="bg-[#1e293b] text-white shadow-lg sticky top-0 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white p-0.5 rounded-lg rotate-3 overflow-hidden shadow-md">
               <img src={APP_ICON_URL} className="w-8 h-8 object-cover rounded" alt="Logo" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter leading-none">HORA DO FRANGO</h1>
              <p className="text-[8px] text-blue-300 font-bold uppercase tracking-widest">Gestão Pro</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Install Button for PWA */}
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-1.5 px-3 rounded-full animate-bounce shadow-lg shadow-emerald-500/30"
              >
                INSTALAR APP
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-slate-700 transition-colors relative"
              >
                <span className="text-xl">🔔</span>
                {overdueFiados.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {overdueFiados.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden z-50">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-500">Alertas</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 font-bold">×</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {overdueFiados.length > 0 ? (
                      overdueFiados.map(f => (
                        <div key={f.id} className="p-3 border-b border-slate-50 hover:bg-red-50 flex items-start gap-3">
                          <img src={APP_ICON_URL} className="w-8 h-8 rounded object-cover mt-1" alt="Chicken" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{f.customerName}</p>
                            <p className="text-[10px] text-red-500 font-semibold uppercase">Atraso +30 dias</p>
                            <p className="text-[10px] text-slate-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.amount)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <p className="text-xs font-medium">Tudo em dia! 🎉</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
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

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-slate-700 px-2 py-3 flex justify-around items-center z-50 safe-bottom md:hidden">
        {[
          { id: Tab.DASHBOARD, label: 'Início', icon: '📊' },
          { id: Tab.EXTRATO, label: 'Extrato', icon: '📝' },
          { id: Tab.FIADOS, label: 'Fiados', icon: '📒' },
          { id: Tab.PREVISAO, label: 'Metas', icon: '📈' },
          { id: Tab.CONFIG, label: 'Config', icon: '⚙️' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id ? 'text-blue-400 scale-110' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Navigation for Reference */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-200">
        <div className="flex justify-between items-center text-slate-400 text-[10px] font-medium uppercase tracking-widest">
          <p>&copy; 2025 Hora do Frango - Identidade Visual Atualizada</p>
          <div className="flex gap-4">
            <span>v5.0.0-PRO</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;