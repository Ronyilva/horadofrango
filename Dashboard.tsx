
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bank, Category, Transaction, TransactionType, Fiado } from './types';
import StatCard from './components/StatCard';
import Table from './components/Table';
import { formatCurrency, formatPercent, getMonthName } from './utils';

interface DashboardProps {
  transactions: Transaction[];
  banks: Bank[];
  categories: Category[];
  fiados: Fiado[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, banks, categories, fiados }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const isOverdue = (dateStr: string) => {
    const d = new Date(dateStr);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return d < thirtyDaysAgo;
  };

  const kpis = useMemo(() => {
    const totalRevenue = transactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0);
    const totalExpenses = transactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0);
    const totalPaid = transactions.reduce((acc, t) => (t.type === TransactionType.DESPESA && t.isPaid) ? acc + t.amount : acc, 0);
    const totalToPay = transactions.reduce((acc, t) => (t.type === TransactionType.DESPESA && !t.isPaid) ? acc + t.amount : acc, 0);
    const totalReceived = transactions.reduce((acc, t) => (t.type === TransactionType.RECEITA && t.isPaid) ? acc + t.amount : acc, 0);
    const totalToReceive = transactions.reduce((acc, t) => (t.type === TransactionType.RECEITA && !t.isPaid) ? acc + t.amount : acc, 0);
    
    // Fiados data
    const totalFiadosPending = fiados.filter(f => !f.isPaid).reduce((acc, f) => acc + f.amount, 0);
    const totalFiadosOverdue = fiados.filter(f => !f.isPaid && isOverdue(f.date)).reduce((acc, f) => acc + f.amount, 0);

    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { 
      totalRevenue, 
      totalExpenses, 
      totalPaid, 
      totalToPay, 
      totalReceived, 
      totalToReceive, 
      profit, 
      margin, 
      totalFiadosPending, 
      totalFiadosOverdue 
    };
  }, [transactions, fiados]);

  const overdueFiadosList = useMemo(() => {
    return fiados.filter(f => !f.isPaid && isOverdue(f.date));
  }, [fiados]);

  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === TransactionType.DESPESA).forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? (value / total) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const bankBalances = useMemo(() => {
    return banks.map(b => {
      const trans = transactions.filter(t => t.bankId === b.id && t.isPaid);
      const balance = b.initialBalance + trans.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0);
      return { name: b.name, color: b.color, balance };
    });
  }, [transactions, banks]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i),
      despesas: 0,
      receitas: 0
    }));

    transactions.filter(t => new Date(t.date).getFullYear() === selectedYear).forEach(t => {
      const m = new Date(t.date).getMonth();
      if (t.type === TransactionType.RECEITA) months[m].receitas += t.amount;
      else months[m].despesas += t.amount;
    });

    return months;
  }, [transactions, selectedYear]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-6">
      {overdueFiadosList.length > 0 && (
        <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg animate-pulse flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🚫</span>
            <div>
              <p className="font-black uppercase tracking-tight text-sm">Atenção: Fiados em Atraso</p>
              <p className="text-xs opacity-90">Total de {formatCurrency(kpis.totalFiadosOverdue)} pendente há mais de 30 dias.</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded text-[10px] font-black uppercase">Verifique a Campainha 🔔</div>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard label="Lucro Líquido" value={kpis.profit} bgColor="bg-slate-800" />
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-white/10" style={{ clipPath: `inset(${100 - kpis.margin}% 0 0 0)` }}></div>
           <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90 relative z-10">Margem Real</span>
           <span className="text-2xl font-black relative z-10">{formatPercent(kpis.margin)}</span>
        </div>
        <StatCard label="Total Fiados" value={kpis.totalFiadosPending} bgColor="bg-orange-500" />
        <StatCard label="Fiados Atrasados" value={kpis.totalFiadosOverdue} bgColor="bg-red-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Despesa Total" value={kpis.totalExpenses} bgColor="bg-slate-100" textColor="text-slate-600" />
        <StatCard label="A Pagar" value={kpis.totalToPay} bgColor="bg-slate-100" textColor="text-slate-600" />
        <StatCard label="Recebidos" value={kpis.totalReceived} bgColor="bg-slate-100" textColor="text-slate-600" />
        <StatCard label="A Receber (Extrato)" value={kpis.totalToReceive} bgColor="bg-slate-100" textColor="text-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Filtros Mensais</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">ANO</label>
                <div className="grid grid-cols-2 gap-2">
                  {[2024, 2025, 2026, 2027].map(y => (
                    <button 
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`py-1 px-2 rounded border text-sm ${selectedYear === y ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">MÊS</label>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedMonth(i)}
                      className={`py-1 px-2 rounded border text-xs ${selectedMonth === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {getMonthName(i)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
             <div className="text-center mb-4">
               <h3 className="text-sm font-bold uppercase">Saldo em Conta</h3>
             </div>
             <div className="space-y-2">
               {bankBalances.map(b => (
                 <div key={b.name} className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                     <span className="font-medium text-slate-700">{b.name}</span>
                   </div>
                   <span className={`font-bold ${b.balance < 0 ? 'text-red-500' : 'text-slate-900'}`}>{formatCurrency(b.balance)}</span>
                 </div>
               ))}
               <div className="pt-2 border-t mt-2 flex justify-between font-bold text-slate-900">
                 <span>DISPONÍVEL TOTAL</span>
                 <span>{formatCurrency(bankBalances.reduce((a, b) => a + b.balance, 0))}</span>
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-center font-bold uppercase text-sm mb-4">Fluxo de Caixa</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} hide />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="despesas" name="DESPESAS" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="receitas" name="RECEITAS" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-center font-bold uppercase text-sm mb-4">Top Fiados Pendentes</h3>
              <div className="overflow-y-auto h-64">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500">Cliente</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fiados.filter(f => !f.isPaid).sort((a, b) => b.amount - a.amount).slice(0, 8).map(f => (
                      <tr key={f.id} className="border-b border-slate-50 last:border-none">
                        <td className="px-3 py-2 font-medium">{f.customerName}</td>
                        <td className="px-3 py-2 text-right font-bold text-orange-600">{formatCurrency(f.amount)}</td>
                      </tr>
                    ))}
                    {fiados.filter(f => !f.isPaid).length === 0 && (
                      <tr><td colSpan={2} className="px-3 py-10 text-center text-slate-400 italic">Nenhum fiado pendente.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-center font-bold uppercase text-sm mb-4">Gastos por Categoria</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categorySummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <Table title="Resumo Geral do Mês" headers={['Categoria', 'Valor', '%']}>
              {categorySummary.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-none">
                  <td className="px-4 py-2">{row.name}</td>
                  <td className="px-4 py-2 font-medium">{formatCurrency(row.value)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatPercent(row.percent)}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
