
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from './types';
import { formatCurrency, formatPercent } from './utils';

interface ForecastProps {
  transactions: Transaction[];
}

const Forecast: React.FC<ForecastProps> = ({ transactions }) => {
  // Reset automático: todos iniciam com zero e não são persistidos no banco
  const [caixaCost, setCaixaCost] = useState<number>(0);
  const [unitsPerCaixa, setUnitsPerCaixa] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [targetQty, setTargetQty] = useState<number>(0);
  const [considerOverhead, setConsiderOverhead] = useState<boolean>(false);

  // Custo fixo mensal (informativo) baseado no mês atual
  const overhead = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .filter(t => t.type === TransactionType.DESPESA)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  // Média de frangos vendidos no mês atual para diluição
  const monthlyChickensSold = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, t) => acc + (t.quantity || 0), 0);
  }, [transactions]);

  // Cálculos automáticos
  const unitCost = useMemo(() => {
    const baseCost = unitsPerCaixa > 0 ? caixaCost / unitsPerCaixa : 0;
    if (considerOverhead && monthlyChickensSold > 0) {
      return baseCost + (overhead / monthlyChickensSold);
    }
    return baseCost;
  }, [caixaCost, unitsPerCaixa, considerOverhead, overhead, monthlyChickensSold]);

  const boxesToBuy = useMemo(() => {
    return unitsPerCaixa > 0 ? Math.ceil(targetQty / unitsPerCaixa) : 0;
  }, [targetQty, unitsPerCaixa]);

  const totalChickens = useMemo(() => {
    return boxesToBuy * unitsPerCaixa;
  }, [boxesToBuy, unitsPerCaixa]);

  const totalCost = useMemo(() => {
    return boxesToBuy * caixaCost;
  }, [boxesToBuy, caixaCost]);

  const unitProfit = useMemo(() => {
    return sellingPrice - unitCost;
  }, [sellingPrice, unitCost]);

  const margin = useMemo(() => {
    return sellingPrice > 0 ? (unitProfit / sellingPrice) : 0;
  }, [unitProfit, sellingPrice]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-orange-500 p-3 rounded-xl text-2xl shadow-lg shadow-orange-500/20">📦</div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Simulador de Compra</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Planejamento de Estoque e Margem</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuração da Caixa</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Custo da Caixa (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-orange-500 rounded-xl p-3 text-white font-bold transition-all outline-none" 
                  value={caixaCost || ''} 
                  onChange={e => setCaixaCost(Number(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Frangos por Caixa</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-orange-500 rounded-xl p-3 text-white font-bold transition-all outline-none" 
                  value={unitsPerCaixa || ''} 
                  onChange={e => setUnitsPerCaixa(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Venda e Custos</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Preço de Venda (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-500 rounded-xl p-3 text-white font-bold transition-all outline-none" 
                  value={sellingPrice || ''} 
                  onChange={e => setSellingPrice(Number(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-300">Custo Fixo Mensal</label>
                  <button 
                    onClick={() => setConsiderOverhead(!considerOverhead)}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded transition-all ${considerOverhead ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {considerOverhead ? 'Ativado' : 'Desativado'}
                  </button>
                </div>
                <div className={`p-3 rounded-xl text-sm font-black border-2 transition-all ${considerOverhead ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-500'}`}>
                  {formatCurrency(overhead)}
                </div>
                {considerOverhead && monthlyChickensSold > 0 && (
                  <p className="text-[9px] text-blue-500/70 mt-1 font-bold italic">
                    + {formatCurrency(overhead / monthlyChickensSold)}/un diluído
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Simulação de Vendas</label>
            <div className="p-6 bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl">
              <label className="block text-sm font-black text-orange-400 mb-3 uppercase">Quantos frangos você pretende vender?</label>
              <input 
                type="number" 
                className="w-full bg-slate-800 border-2 border-orange-500/50 focus:border-orange-500 rounded-xl p-4 text-3xl font-black text-white transition-all outline-none placeholder:text-slate-700" 
                value={targetQty || ''} 
                onChange={e => setTargetQty(Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-[10px] text-orange-500/70 mt-2 font-bold uppercase tracking-tighter">* O sistema calculará o arredondamento por caixas fechadas.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-6 tracking-tight">Resumo da Compra Estimada</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Caixas a comprar</p>
                <p className="text-2xl font-black text-slate-800">{boxesToBuy} cx</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Frangos</p>
                <p className="text-lg font-bold text-slate-600">{totalChickens} un</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase">Custo Total</p>
                <p className="text-2xl font-black text-blue-600">{formatCurrency(totalCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-blue-400 uppercase">Custo p/ Frango</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(unitCost)}</p>
              </div>
            </div>

            <div className="md:col-span-2 p-6 rounded-2xl border-2 flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-500"
              style={{ 
                backgroundColor: margin > 0 ? (margin < 0.3 ? '#fff7ed' : '#f0fdf4') : '#f8fafc',
                borderColor: margin > 0 ? (margin < 0.3 ? '#fed7aa' : '#bbf7d0') : '#f1f5f9'
              }}>
              <div>
                <p className={`text-[10px] font-black uppercase ${margin < 0.3 ? 'text-orange-500' : 'text-emerald-500'}`}>Lucro Estimado por Frango</p>
                <p className={`text-4xl font-black ${margin < 0.3 ? 'text-orange-600' : 'text-emerald-600'}`}>{formatCurrency(unitProfit)}</p>
                <p className={`text-sm font-bold ${margin < 0.3 ? 'text-orange-400' : 'text-emerald-400'}`}>Margem de {formatPercent(margin)}</p>
              </div>

              <div className="flex-shrink-0">
                {margin > 0 && (
                  margin < 0.3 ? (
                    <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full font-black text-xs uppercase animate-pulse">
                      ⚠️ Margem Baixa
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full font-black text-xs uppercase">
                      ✅ Margem Saudável
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-6 tracking-tight">Resultado Final</h3>
          <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">💰</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Faturamento Bruto Estimado</p>
              <p className="text-4xl font-black text-slate-900">{formatCurrency(targetQty * sellingPrice)}</p>
            </div>
            <div className="w-full pt-6 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lucro Operacional Estimado</p>
              <p className="text-2xl font-black text-emerald-500">{formatCurrency((targetQty * sellingPrice) - totalCost)}</p>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Sem considerar o custo fixo mensal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
