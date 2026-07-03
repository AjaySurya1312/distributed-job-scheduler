import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  color = 'indigo',
  className,
}: MetricCardProps) {
  const colorStyles = {
    indigo: 'text-indigo-500 bg-indigo-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    slate: 'text-slate-500 bg-slate-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("p-2 rounded-lg", colorStyles[color])}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
        {change && trend && (
          <span className={cn(
            "flex items-center text-sm font-medium",
            trend === 'up' ? "text-emerald-500" : trend === 'down' ? "text-rose-500" : "text-slate-500"
          )}>
            {trend === 'up' && <ArrowUpIcon className="mr-1 h-3 w-3" />}
            {trend === 'down' && <ArrowDownIcon className="mr-1 h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}
