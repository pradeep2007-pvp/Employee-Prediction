import type { LucideIcon } from 'lucide-react';

interface RiskBadgeProps {
  level: 'Low' | 'Medium' | 'High';
  icon?: LucideIcon;
}

const styles = {
  Low: 'bg-green-50 text-green-700 border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-red-50 text-red-700 border-red-200',
};

export function RiskBadge({ level, icon: Icon }: RiskBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[level]}`}>
      {Icon && <Icon size={14} />}
      {level} Risk
    </span>
  );
}
