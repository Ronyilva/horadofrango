
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bank, Category, Transaction, TransactionType, Fiado, MonthHistory } from './types';
import StatCard from './components/StatCard';
import Table from './components/Table';
import { formatCurrency, formatPercent, getMonthName, parseLocalDate } from './utils';

interface DashboardProps {
  transactions: Transaction[];
  banks: Bank[];
  categories: Category[];
  fiados: Fiado[];
  history: MonthHistory[];
  startDate: string;
  endDate: string;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, banks, categories, fiados, history, startDate, endDate }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const isOverdue = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setHours(0,0,0,0);
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    return d < fifteenDaysAgo;
  };

  const getPeriodTransactions = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const d = parseLocalDate(t.date);
      return d >= start && d <= end;
    });
  }, [transactions, startDate, endDate]);

  const kpis = useMemo(() => {
    const periodTransactions = getPeriodTransactions;
    
    const caixaPeriodo = periodTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0);
    const lucroPeriodo = periodTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0);
    const custoPeriodo = periodTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0);
    
    const revenueRange = periodTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0);
    
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const projection = (revenueRange / diffDays) * daysInMonth;

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

    const rangeRevenue = periodTransactions.filter(t => t.type === TransactionType.RECEITA).reduce((acc, t) => acc + t.amount, 0);
    const rangeExpenses = periodTransactions.filter(t => t.type === TransactionType.DESPESA).reduce((acc, t) => acc + t.amount, 0);

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
      totalSoldToday: rangeRevenue,
      totalExpensesToday: rangeExpenses,
      dailyProfit: rangeRevenue - rangeExpenses
    };
  }, [transactions, fiados, startDate, endDate, getPeriodTransactions, categories]);

  const chartData = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays === 1) {
      const hours = Array.from({ length: 24 }, (_, i) => ({
        label: `${i}h`,
        entradas: 0,
        saidas: 0
      }));
      transactions.filter(t => t.date === startDate).forEach(t => {
        hours[0].entradas += t.type === TransactionType.RECEITA ? t.amount : 0;
        hours[0].saidas += t.type === TransactionType.DESPESA ? t.amount : 0;
      });
      return hours;
    }

    return Array.from({ length: Math.min(diffDays, 31) }, (_, i) => {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + i);
      const dateStr = currentDay.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      
      return {
        label: `${currentDay.getDate()}/${currentDay.getMonth() + 1}`,
        entradas: dayTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0),
        saidas: dayTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0)
      };
    });
  }, [transactions, startDate, endDate]);

  const getLabel = (base: string) => {
    return `${base} do Período`;
  };

  const filteredTransactions = useMemo(() => {
    return getPeriodTransactions;
  }, [getPeriodTransactions]);

  const categorySummary = useMemo(() => {
    const map: Record<string, { amount: number, type: TransactionType }> = {};
    
    filteredTransactions.forEach(t => {
      if (!t.isPaid) return;
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
      const key = `${cat}_${t.type}`;
      if (!map[key]) {
        map[key] = { amount: 0, type: t.type };
      }
      map[key].amount += t.amount;
    });

    const total = Object.values(map).reduce((a, b) => a + b.amount, 0);
    
    return Object.entries(map).map(([key, data]) => {
      const name = key.split('_')[0];
      return {
        name,
        type: data.type,
        value: data.amount,
        percent: total > 0 ? (data.amount / total) * 100 : 0
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const bankBalances = useMemo(() => {
    return banks.map(b => {
      const trans = transactions.filter(t => t.bankId === b.id && t.isPaid);
      const balance = b.initialBalance + trans.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0);
      return { name: b.name, color: b.color, balance };
    });
  }, [transactions, banks]);

  return (
    <div className="space-y-6">
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
          <h3 className="font-black uppercase text-slate-800 tracking-tight">Entradas x Saídas</h3>
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
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-bold text-blue-800">
            🚀 Projeção Mensal: <span className="text-blue-600">Se continuar nesse ritmo, o mês fecha em: {formatCurrency(kpis.projection)}</span>
          </p>
        </div>
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
              <h3 className="text-center font-bold uppercase text-sm mb-4">Movimentação por Categoria</h3>
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
                        <Cell key={`cell-${index}`} fill={entry.type === TransactionType.RECEITA ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        formatCurrency(value as number), 
                        `${props.payload.name} (${props.payload.type === TransactionType.RECEITA ? 'Receita' : 'Custo'})`
                      ]} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <Table title="Resumo Geral do Período" headers={['Categoria', 'Tipo', 'Valor', '%']}>
            {categorySummary.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-none">
                <td className="px-4 py-2 font-medium">{row.name}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    row.type === TransactionType.RECEITA ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {row.type === TransactionType.RECEITA ? 'Receita' : 'Custo'}
                  </span>
                </td>
                <td className={`px-4 py-2 font-bold ${
                  row.type === TransactionType.RECEITA ? 'text-blue-600' : 'text-red-500'
                }`}>
                  {formatCurrency(row.value)}
                </td>
                <td className="px-4 py-2 text-slate-500 font-bold">{formatPercent(row.percent)}</td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
