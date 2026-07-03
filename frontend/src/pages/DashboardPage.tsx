import React from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Activity, CheckCircle2, Clock, XCircle, Server } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatusBadge } from '@/components/ui/StatusBadge';

const areaData = [
  { time: '00:00', jobs: 120 }, { time: '04:00', jobs: 300 },
  { time: '08:00', jobs: 800 }, { time: '12:00', jobs: 1200 },
  { time: '16:00', jobs: 950 }, { time: '20:00', jobs: 400 },
  { time: '24:00', jobs: 150 },
];

const pieData = [
  { name: 'Completed', value: 8500, color: '#10b981' },
  { name: 'Failed', value: 430, color: '#f43f5e' },
  { name: 'Running', value: 120, color: '#6366f1' },
];

export function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your distributed job scheduling system.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Jobs (24h)"
          value="12,450"
          change="+14%"
          trend="up"
          icon={<Activity className="h-5 w-5" />}
          color="indigo"
        />
        <MetricCard
          title="Success Rate"
          value="98.2%"
          change="+0.5%"
          trend="up"
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="emerald"
        />
        <MetricCard
          title="Failed Jobs"
          value="43"
          change="-12%"
          trend="down"
          icon={<XCircle className="h-5 w-5" />}
          color="rose"
        />
        <MetricCard
          title="Avg Processing Time"
          value="1.2s"
          change="-0.1s"
          trend="down"
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-medium text-white mb-6">Job Throughput</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="jobs" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorJobs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-medium text-white mb-6">Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-medium text-white mb-4">Live Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-white">job_processing_{1024 + i}</p>
                    <p className="text-xs text-muted-foreground">Queue: default-queue</p>
                  </div>
                </div>
                <StatusBadge status="COMPLETED" size="sm" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-medium text-white mb-4">Worker Status</h3>
          <div className="space-y-4">
            {['worker-node-01', 'worker-node-02', 'worker-node-03'].map((worker, i) => (
              <div key={worker} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{worker}</p>
                    <p className="text-xs text-muted-foreground">CPU: 45% • Mem: 2.1GB</p>
                  </div>
                </div>
                <StatusBadge status={i === 1 ? "IDLE" : "BUSY"} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
