import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    label?: string;
    isInverse?: boolean; // e.g. for errors, positive delta is bad
  };
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  sparklineData?: number[];
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  delta,
  icon,
  subtitle,
  badge,
  className = '',
}) => {
  let isPositive = delta ? delta.value > 0 : false;
  let isNeutral = delta ? delta.value === 0 : true;

  // For error counts, higher is worse, so flip the color indicator
  const isGood = delta?.isInverse ? !isPositive : isPositive;

  return (
    <div
      className={`relative p-4 rounded-xl bg-dark-card border border-dark-border hover:border-dark-borderHighlight transition-all duration-200 group ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
        <span className="font-medium tracking-wide uppercase text-[11px] text-slate-400 flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-bold tracking-tight text-white tabular-nums font-mono">
          {value}
        </div>

        {delta && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
              isNeutral
                ? 'text-slate-400 bg-slate-800/50'
                : isGood
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-rose-400 bg-rose-500/10'
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {delta.value}%
            </span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-slate-500 font-normal">
          {subtitle}
        </div>
      )}
    </div>
  );
};
