
import React from 'react';

interface TableProps {
  title: string;
  headers: string[];
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ title, headers, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
      <div className="bg-[#1e293b] text-white py-2 px-4 text-center font-bold uppercase text-sm">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 font-semibold text-slate-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
