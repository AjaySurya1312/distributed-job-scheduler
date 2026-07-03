import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const data = [
  { name: 'Mon', completed: 4000, failed: 240 },
  { name: 'Tue', completed: 3000, failed: 139 },
  { name: 'Wed', completed: 2000, failed: 980 },
  { name: 'Thu', completed: 2780, failed: 390 },
  { name: 'Fri', completed: 1890, failed: 480 },
  { name: 'Sat', completed: 2390, failed: 380 },
  { name: 'Sun', completed: 3490, failed: 430 },
];

export function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into system performance metrics.</p>
        </div>
        <Select defaultValue="7d">
          <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl min-h-[400px]">
        <h3 className="text-lg font-medium text-white mb-6">Jobs Processed by Status</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#ffffff50" tickLine={false} axisLine={false} />
            <YAxis stroke="#ffffff50" tickLine={false} axisLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              cursor={{ fill: '#ffffff05' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="completed" name="Completed Jobs" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="failed" name="Failed Jobs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
