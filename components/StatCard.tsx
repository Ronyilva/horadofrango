
import React from 'react';
import { formatCurrency } from '../utils';

interface StatCardProps {
  label: string;
  value: number;
  bgColor: string;
  textColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, bgColor, textColor = 'text-white' }) => {
  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg shadow-sm flex flex-col justify-center items-center text-center`}>
      <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">{label}</span>
      <span className="text-xl font-bold">{formatCurrency(value)}</span>
    </div>
  );
};

export default StatCard;
