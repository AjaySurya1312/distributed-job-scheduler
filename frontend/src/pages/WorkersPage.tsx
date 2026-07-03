import React from 'react';
import { Server, Cpu, MemoryStick, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

const workers = [
  { id: 'wrk_01', host: 'worker-node-01', pid: 4892, status: 'BUSY', cpu: '45%', mem: '2.1GB', jobs: 4, uptime: '14d 2h' },
  { id: 'wrk_02', host: 'worker-node-02', pid: 3211, status: 'IDLE', cpu: '5%', mem: '800MB', jobs: 0, uptime: '14d 2h' },
  { id: 'wrk_03', host: 'worker-node-03', pid: 9921, status: 'BUSY', cpu: '89%', mem: '4.5GB', jobs: 12, uptime: '5d 12h' },
  { id: 'wrk_04', host: 'worker-node-04', pid: 1102, status: 'DEAD', cpu: '0%', mem: '0B', jobs: 0, uptime: 'offline' },
];

export function WorkersPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Workers</h1>
        <p className="text-muted-foreground mt-1">Monitor worker nodes and resource utilization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {workers.map((worker) => (
          <div key={worker.id} className="rounded-xl border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Server className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white truncate max-w-[120px]" title={worker.host}>{worker.host}</h3>
                  <p className="text-xs text-zinc-500 font-mono">PID: {worker.pid}</p>
                </div>
              </div>
              <StatusBadge status={worker.status} size="sm" />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Cpu className="h-3 w-3" />
                    <span className="text-xs">CPU</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{worker.cpu}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <MemoryStick className="h-3 w-3" />
                    <span className="text-xs">Memory</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{worker.mem}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock className="h-4 w-4" />
                  <span>{worker.uptime}</span>
                </div>
                <div className="text-white font-medium">
                  {worker.jobs} active jobs
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
