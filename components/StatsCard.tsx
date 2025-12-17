import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, colorClass }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between transition-transform hover:scale-[1.02]">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>}
      </div>
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};