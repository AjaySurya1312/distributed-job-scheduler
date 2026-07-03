import React from 'react';
import { Search, Terminal } from 'lucide-react';
import { Input } from '@/components/ui/input';

const logs = [
  { id: 1, time: '2023-10-25 14:32:01.123', level: 'INFO', service: 'scheduler', message: 'Job job_8f7d9a1b enqueued to emails' },
  { id: 2, time: '2023-10-25 14:32:02.045', level: 'INFO', service: 'worker-01', message: 'Picked up job job_8f7d9a1b' },
  { id: 3, time: '2023-10-25 14:32:03.500', level: 'DEBUG', service: 'worker-01', message: 'Connecting to SMTP server...' },
  { id: 4, time: '2023-10-25 14:32:05.102', level: 'WARN', service: 'worker-01', message: 'SMTP response slow (1500ms)' },
  { id: 5, time: '2023-10-25 14:32:06.882', level: 'ERROR', service: 'worker-02', message: 'Failed to process job_1a2b3c4d: Timeout exceeded' },
  { id: 6, time: '2023-10-25 14:32:07.111', level: 'INFO', service: 'worker-01', message: 'Job job_8f7d9a1b completed successfully' },
];

const getLevelColor = (level: string) => {
  switch(level) {
    case 'INFO': return 'text-sky-400';
    case 'WARN': return 'text-amber-400';
    case 'ERROR': return 'text-rose-400';
    case 'DEBUG': return 'text-zinc-500';
    default: return 'text-white';
  }
};

export function LogsPage() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">System Logs</h1>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0c0c0e] flex-1 flex flex-col overflow-hidden font-mono text-sm shadow-2xl">
        <div className="border-b border-white/5 bg-black/40 p-3 flex items-center gap-4">
          <Terminal className="h-5 w-5 text-zinc-500" />
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Filter logs by keyword, service, or job id..." 
              className="pl-9 h-9 bg-white/5 border-white/5 text-zinc-300 w-full focus-visible:ring-1 focus-visible:ring-zinc-700" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors group">
              <span className="text-zinc-600 shrink-0 select-none">{log.time}</span>
              <span className={`w-14 shrink-0 font-bold ${getLevelColor(log.level)}`}>{log.level}</span>
              <span className="text-zinc-400 w-24 shrink-0 truncate" title={log.service}>[{log.service}]</span>
              <span className="text-zinc-300 break-all">{log.message}</span>
            </div>
          ))}
          <div className="text-zinc-600 italic py-4 text-center">End of logs</div>
        </div>
      </div>
    </div>
  );
}
