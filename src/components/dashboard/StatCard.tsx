import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  iconColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  change,
  iconColor,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-full bg-${iconColor}/10 flex items-center justify-center`}>
          <Icon size={24} className={`text-${iconColor}`} strokeWidth={1.5} />
        </div>
        {change && (
          <span
            className={`font-body text-sm ${
              change.isPositive ? 'text-teal' : 'text-rose'
            }`}
          >
            {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="font-body text-sm text-ash">{label}</p>
        <p className="font-display text-display-md text-secondary mt-1">{value}</p>
      </div>
    </Card>
  );
};
