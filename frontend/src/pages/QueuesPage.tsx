import React from 'react';
import { Layers, Pause, Play, Settings2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const queues = [
  { name: 'default', active: 145, queued: 3200, failed: 12, status: 'running' },
  { name: 'emails', active: 45, queued: 120, failed: 0, status: 'running' },
  { name: 'media-processing', active: 0, queued: 850, failed: 4, status: 'paused' },
  { name: 'webhooks', active: 89, queued: 12, failed: 23, status: 'running' },
];

export function QueuesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Queues</h1>
          <p className="text-muted-foreground mt-1">Manage job queues and processing priority.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Add Queue</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map((queue) => (
          <div key={queue.name} className="rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{queue.name}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="relative flex h-2 w-2">
                      {queue.status === 'running' ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      )}
                    </span>
                    <span className="text-zinc-400 capitalize">{queue.status}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{queue.active}</p>
                <p className="text-xs text-zinc-500 font-medium">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{queue.queued}</p>
                <p className="text-xs text-zinc-500 font-medium">Queued</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-rose-500">{queue.failed}</p>
                <p className="text-xs text-zinc-500 font-medium">Failed</p>
              </div>
            </div>

            <div className="flex gap-3">
              {queue.status === 'running' ? (
                <Button variant="outline" className="flex-1 bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400">
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400">
                  <Play className="w-4 h-4 mr-2" /> Resume
                </Button>
              )}
              <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Activity className="w-4 h-4 mr-2" /> Metrics
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
