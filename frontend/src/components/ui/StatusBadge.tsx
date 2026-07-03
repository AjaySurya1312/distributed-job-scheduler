import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type JobStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED' | 'RETRYING' | 'CANCELLED';
export type WorkerStatus = 'IDLE' | 'BUSY' | 'DEAD' | 'PAUSED';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      status: {
        RUNNING: 'border-transparent bg-indigo-500/10 text-indigo-500',
        COMPLETED: 'border-transparent bg-emerald-500/10 text-emerald-500',
        FAILED: 'border-transparent bg-rose-500/10 text-rose-500',
        DEAD: 'border-transparent bg-slate-500/10 text-slate-500',
        QUEUED: 'border-transparent bg-amber-500/10 text-amber-500',
        RETRYING: 'border-transparent bg-orange-500/10 text-orange-500',
        CANCELLED: 'border-transparent bg-slate-500/10 text-slate-500',
        IDLE: 'border-transparent bg-sky-500/10 text-sky-500',
        BUSY: 'border-transparent bg-indigo-500/10 text-indigo-500',
        PAUSED: 'border-transparent bg-amber-500/10 text-amber-500',
      },
      size: {
        sm: 'text-[10px] px-2 py-0',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      status: 'QUEUED',
      size: 'md',
    },
  }
);

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  status: JobStatus | WorkerStatus | any;
}

export function StatusBadge({ className, status, size, ...props }: StatusBadgeProps) {
  const isPulsing = status === 'RUNNING' || status === 'BUSY';
  
  return (
    <div className={cn(badgeVariants({ status, size }), className)} {...props}>
      {isPulsing && (
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
      )}
      {!isPulsing && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {status}
    </div>
  );
}
