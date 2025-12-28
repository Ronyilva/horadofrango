
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from './types';
import { formatCurrency, formatPercent } from './utils';
import StatCard from './components/StatCard';

interface ForecastProps {
  transactions: Transaction[];
}

const Forecast: React.FC<ForecastProps> = ({ transactions }) => {
  const [caixaCost, setCaixaCost] = useState(180);
  const [unitsPerCaixa, setUnitsPerCaixa] = useState(8);
  const [targetRevenue, setTargetRevenue] = useState(10000);
  const [sellingPrice, setSellingPrice] = useState(35);

  // Calcula custos fixos médios dos últimos 30 dias (ou total despesas do mês atual)
  const overhead = useMemo(() => {
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    // Ignorar custo de fornecedor de frango para não duplicar se o usuário já lançar lá
    // Aqui assumimos que despesas operacionais (aluguel, luz, salário) são o overhead
    return currentMonthTransactions
      .filter(t => t.type === TransactionType.DESPESA)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const unitCost = caixaCost / unitsPerCaixa;
  const unitProfit = sellingPrice - unitCost;
  const marginPerUnit = sellingPrice > 0 ? (unitProfit / sellingPrice) : 0;
  
  // Quantos frangos para pagar as contas (Break-even)
  const breakEvenQty = overhead > 0 && unitProfit > 0 ? Math.ceil(overhead / unitProfit) : 0;
  
  // Quantos frangos para bater a meta Y de FATURAMENTO
  const qtyToHitTargetRevenue = sellingPrice > 0 ? Math.ceil(targetRevenue / sellingPrice) : 0;
  
  // Quantos frangos para bater a meta Y de LUCRO LÍQUIDO
  const qtyToHitTargetProfit = unitProfit > 0 ? Math.ceil((targetRevenue + overhead) / unitProfit) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-orange-500 p-3 rounded-full text-2xl">📈</div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Simulador de Previsibilidade</h2>
            <p className="text-slate-400 text-sm">Calcule quanto você precisa vender para bater suas metas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest">Configuração da Caixa</h3>
            <div>
              <label className="block text-xs font-medium mb-1">Custo da Caixa (R$)</label>
              <input type="number" className="w-full bg-slate-700 border-none rounded p-2 text-white" value={caixaCost} onChange={e => setCaixaCost(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Frangos por Caixa</label>
              <input type="number" className="w-full bg-slate-700 border-none rounded p-2 text-white" value={unitsPerCaixa} onChange={e => setUnitsPerCaixa(Number(e.target.value))} />
            </div>
            <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
              <p className="text-[10px] uppercase font-bold text-slate-400">Custo Unitário Bruto</p>
              <p className="text-lg font-black text-orange-400">{formatCurrency(unitCost)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Sua Operação</h3>
            <div>
              <label className="block text-xs font-medium mb-1">Preço de Venda (R$)</label>
              <input type="number" className="w-full bg-slate-700 border-none rounded p-2 text-white" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Custo Fixo Mensal (Atual)</label>
              <div className="p-2 bg-slate-700/50 rounded text-slate-300 text-sm font-bold border border-slate-600">
                {formatCurrency(overhead)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">*Baseado nos seus lançamentos do mês atual.</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Sua Meta</h3>
            <div>
              <label className="block text-xs font-medium mb-1">Valor da Meta Mensal (R$)</label>
              <input type="number" className="w-full bg-slate-700 border-none rounded p-3 text-xl font-black text-white" value={targetRevenue} onChange={e => setTargetRevenue(Number(e.target.value))} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Margem de Contribuição</p>
                <p className="text-2xl font-black text-emerald-500">{formatPercent(marginPerUnit)}</p>
                <p className="text-xs text-emerald-600 font-bold">{formatCurrency(unitProfit)} p/ frango</p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-[10px] font-bold text-blue-400 uppercase">Ponto de Equilíbrio</p>
                <p className="text-2xl font-black text-blue-500">{breakEvenQty}</p>
                <p className="text-xs text-blue-600 font-bold">Unidades p/ pagar custos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Meta de Faturamento</h3>
           <p className="text-slate-500 text-sm mb-6">Para faturar <span className="font-bold">{formatCurrency(targetRevenue)}</span> vendendo a <span className="font-bold">{formatCurrency(sellingPrice)}</span>:</p>
           <div className="flex items-center justify-center p-8 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
              <div className="text-center">
                <span className="text-6xl font-black text-blue-600 leading-none">{qtyToHitTargetRevenue}</span>
                <p className="text-blue-400 font-bold uppercase tracking-widest mt-2">Frangos vendidos</p>
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Meta de Lucro Líquido</h3>
           <p className="text-slate-500 text-sm mb-6">Para ter <span className="font-bold">{formatCurrency(targetRevenue)}</span> de lucro real (após pagar frango e custos fixos):</p>
           <div className="flex items-center justify-center p-8 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
              <div className="text-center">
                <span className="text-6xl font-black text-emerald-600 leading-none">{qtyToHitTargetProfit}</span>
                <p className="text-emerald-400 font-bold uppercase tracking-widest mt-2">Frangos vendidos</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
