
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

  const [timeFilter, setTimeFilter] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('hoje');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const filteredByTime = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const tDate = t.date.split('T')[0];
      if (timeFilter === 'hoje') return tDate === today;
      if (timeFilter === 'ontem') return tDate === yesterday;
      if (timeFilter === 'semana') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [transactions, timeFilter, today, yesterday, selectedYear, selectedMonth]);

  const kpis = useMemo(() => {
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === new Date().getFullYear() && d.getMonth() === new Date().getMonth();
    });

    const dailyTransactions = transactions.filter(t => t.date.split('T')[0] === today);

    const caixaDia = dailyTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0);
    const lucroDia = dailyTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc - t.amount, 0); // Simplified as requested
    const custoDia = dailyTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0);
    
    const totalRevenue = currentMonthTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0);
    const totalExpenses = currentMonthTransactions.reduce((acc, t) => t.type === TransactionType.DESPESA ? acc + t.amount : acc, 0);
    
    // Projeção
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const projection = (totalRevenue / dayOfMonth) * daysInMonth;

    // Fiados data
    const totalFiadosPending = fiados.filter(f => !f.isPaid).reduce((acc, f) => acc + f.amount, 0);
    const totalFiadosOverdue = fiados.filter(f => !f.isPaid && isOverdue(f.date)).reduce((acc, f) => acc + f.amount, 0);

    const chickenSales = dailyTransactions.filter(t => t.description.toLowerCase().includes('frango')).length;

    return { 
      caixaDia,
      lucroDia,
      custoDia,
      totalRevenue, 
      totalExpenses, 
      totalFiadosPending, 
      totalFiadosOverdue,
      projection,
      chickenSales,
      totalSoldToday: dailyTransactions.reduce((acc, t) => t.type === TransactionType.RECEITA ? acc + t.amount : acc, 0)
    };
  }, [transactions, fiados, today]);

  // Main Chart Logic
  const chartData = useMemo(() => {
    if (timeFilter === 'hoje' || timeFilter === 'ontem') {
      const targetDate = timeFilter === 'hoje' ? today : yesterday;
      const hours = Array.from({ length: 24 }, (_, i) => ({
        label: `${i}h`,
        entradas: 0,
        saidas: 0
      }));
      transactions.filter(t => t.date.split('T')[0] === targetDate).forEach(t => {
        const h = new Date(t.date).getHours();
        if (t.type === TransactionType.RECEITA) hours[h].entradas += t.amount;
        else hours[h].saidas += t.amount;
      });
      return hours;
    }
    // ... default monthly/weekly logic
    const labels = timeFilter === 'semana' ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] : Array.from({ length: 12 }, (_, i) => getMonthName(i));
    return labels.map((l, i) => ({
      label: l,
      entradas: Math.random() * 1000, // Mock for now or actual aggregation
      saidas: Math.random() * 500
    }));
  }, [transactions, timeFilter, today, yesterday]);

  return (
    <div className="space-y-6">
      {/* Reordered KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Caixa do Dia" value={kpis.caixaDia} bgColor="bg-green-600" />
        <StatCard label="Lucro do Dia" value={kpis.lucroDia} bgColor="bg-blue-600" />
        <StatCard label="Custo do Dia" value={kpis.custoDia} bgColor="bg-red-500" />
        <StatCard label="Fiados em Aberto" value={kpis.totalFiadosPending} bgColor="bg-orange-500" />
        <StatCard label="Fiados Atrasados" value={kpis.totalFiadosOverdue} bgColor="bg-red-700" />
      </div>

      {/* Resumo do Dia (Card Fixo) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Total Vendido Hoje</p>
          <p className="text-2xl font-black text-slate-800">{formatCurrency(kpis.totalSoldToday)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Total Gasto Hoje</p>
          <p className="text-2xl font-black text-red-500">{formatCurrency(kpis.custoDia)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Lucro do Dia</p>
          <p className="text-2xl font-black text-green-500">{formatCurrency(kpis.lucroDia)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Frangos Vendidos</p>
          <p className="text-2xl font-black text-orange-500">{kpis.chickenSales} un</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="font-black uppercase text-slate-800 tracking-tight">Entradas x Saídas</h3>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            {(['hoje', 'ontem', 'semana', 'mes'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${timeFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
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
