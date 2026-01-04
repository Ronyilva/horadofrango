
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bank, Category, Transaction, TransactionType, Fiado, MonthHistory } from './types';
import StatCard from './components/StatCard';
import Table from './components/Table';
import { formatCurrency, formatPercent, getMonthName } from './utils';

interface DashboardProps {
  transactions: Transaction[];
  banks: Bank[];
  categories: Category[];
  fiados: Fiado[];
  history: MonthHistory[];
  today: string;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, banks, categories, fiados, history, today }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [globalPeriod, setGlobalPeriod] = useState<'dia' | 'semana' | 'mes'>('dia');
  
  const isOverdue = (dateStr: string) => {
    const d = new Date(dateStr);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    return d < fifteenDaysAgo;
  };

  const getPeriodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const tDate = t.date.split('T')[0];
      
      if (globalPeriod === 'dia') return tDate === today;
      
      if (globalPeriod === 'semana') {
        const selectedDate = new Date(today);
        const startOfWeek = new Date(selectedDate);
        const day = selectedDate.getDay();
        const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0,0,0,0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        
        return d >= startOfWeek && d <= endOfWeek;
      }
      
      const selectedDate = new Date(today);
      return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth();
    });
  }, [transactions, globalPeriod, today]);

  const kpis = useMemo(() => {
    const periodTransactions = getPeriodTransactions;
    const dailyTransactions = transactions.filter(t => t.date.split('T')[0] === today);
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      const selectedDate = new Date(today);
      return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth();
    });

    const caixaPeriodo = periodTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0);
    const lucroPeriodo = periodTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0);
    const custoPeriodo = periodTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0);
    
    const revenueMonth = monthTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0);
    const selectedDate = new Date(today);
    const dayOfMonth = selectedDate.getDate();
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const projection = (revenueMonth / dayOfMonth) * daysInMonth;

    const totalFiadosPending = fiados.filter(f => !f.isPaid).reduce((acc, f) => acc + f.amount, 0);
    const totalFiadosOverdue = fiados.filter(f => !f.isPaid && isOverdue(f.date)).reduce((acc, f) => acc + f.amount, 0);

    const chickenSales = periodTransactions
      .filter(t => categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes('frango'))
      .reduce((acc, t) => acc + (t.quantity || 0), 0);

    const chickenRevenue = periodTransactions
      .filter(t => categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes('frango') && t.type === TransactionType.RECEITA)
      .reduce((acc, t) => acc + t.amount, 0);

    const chickenCosts = periodTransactions
      .filter(t => categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes('frango') && t.type === TransactionType.DESPESA)
      .reduce((acc, t) => acc + t.amount, 0);

    const averageTicket = chickenSales > 0 ? chickenRevenue / chickenSales : 0;
    const unitProfit = chickenSales > 0 ? (chickenRevenue - chickenCosts) / chickenSales : 0;

    const dailyRevenue = dailyTransactions.filter(t => t.type === TransactionType.RECEITA).reduce((acc, t) => acc + t.amount, 0);
    const dailyExpenses = dailyTransactions.filter(t => t.type === TransactionType.DESPESA).reduce((acc, t) => acc + t.amount, 0);

    return { 
      caixaPeriodo,
      lucroPeriodo,
      custoPeriodo,
      totalFiadosPending, 
      totalFiadosOverdue,
      projection,
      chickenSales,
      averageTicket,
      unitProfit,
      totalSoldToday: dailyRevenue,
      totalExpensesToday: dailyExpenses,
      dailyProfit: dailyRevenue - dailyExpenses
    };
  }, [transactions, fiados, today, getPeriodTransactions, categories]);

  const chartData = useMemo(() => {
    if (globalPeriod === 'dia') {
      const hours = Array.from({ length: 24 }, (_, i) => ({
        label: `${i}h`,
        entradas: 0,
        saidas: 0
      }));
      transactions.filter(t => t.date.split('T')[0] === today).forEach(t => {
        const h = new Date(t.date).getHours();
        if (t.type === TransactionType.RECEITA) hours[h].entradas += t.amount;
        else hours[h].saidas += t.amount;
      });
      return hours;
    }

    if (globalPeriod === 'semana') {
      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
      return days.map((d, i) => {
        const dayTransactions = getPeriodTransactions.filter(t => {
          const dt = new Date(t.date);
          const day = dt.getDay();
          const targetDay = i === 6 ? 0 : i + 1;
          return day === targetDay;
        });
        return {
          label: d,
          entradas: dayTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0),
          saidas: dayTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0)
        };
      });
    }

    const selectedDate = new Date(today);
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayTransactions = getPeriodTransactions.filter(t => new Date(t.date).getDate() === day);
      return {
        label: `${day}`,
        entradas: dayTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0),
        saidas: dayTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0)
      };
    });
  }, [transactions, globalPeriod, today, getPeriodTransactions]);

  const getLabel = (base: string) => {
    if (globalPeriod === 'dia') return `${base} do Dia`;
    if (globalPeriod === 'semana') return `${base} da Semana`;
    return base === 'Lucro' ? 'Lucro Líquido do Mês' : `${base} do Mês`;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        </div>
        <div className="inline-flex p-1 bg-slate-200 rounded-xl shadow-inner">
          {(['dia', 'semana', 'mes'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setGlobalPeriod(p)}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all duration-200 ${
                globalPeriod === p 
                ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label={getLabel('Caixa')} value={kpis.caixaPeriodo} bgColor="bg-green-600" />
        <StatCard label={getLabel('Lucro')} value={kpis.lucroPeriodo} bgColor="bg-blue-600" />
        <StatCard label={getLabel('Custo')} value={kpis.custoPeriodo} bgColor="bg-red-500" />
        <StatCard label="Fiados em Aberto" value={kpis.totalFiadosPending} bgColor="bg-orange-500" />
        <StatCard label="Fiados Atrasados" value={kpis.totalFiadosOverdue} bgColor="bg-red-700" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Total Vendido no Período</p>
          <p className="text-2xl font-black text-slate-800">{formatCurrency(kpis.totalSoldToday)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Total Gasto no Período</p>
          <p className="text-2xl font-black text-red-500">{formatCurrency(kpis.totalExpensesToday)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Lucro no Período</p>
          <p className="text-2xl font-black text-green-500">{formatCurrency(kpis.dailyProfit)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Frangos Vendidos</p>
          <p className="text-2xl font-black text-orange-500">{kpis.chickenSales} un</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">
            Ticket: {formatCurrency(kpis.averageTicket)} | Lucro/Un: {formatCurrency(kpis.unitProfit)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="font-black uppercase text-slate-800 tracking-tight">Entradas x Saídas ({globalPeriod.toUpperCase()})</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="entradas" name="ENTRADAS" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="saidas" name="SAÍDAS" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {globalPeriod === 'mes' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm font-bold text-blue-800">
              🚀 Projeção Mensal: <span className="text-blue-600">Se continuar nesse ritmo, o mês fecha em: {formatCurrency(kpis.projection)}</span>
            </p>
          </div>
        )}
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
  );
};

export default Dashboard;
