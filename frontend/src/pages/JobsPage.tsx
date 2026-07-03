import React from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const jobs = [
  { id: 'job_8f7d9a1b', name: 'send_welcome_email', queue: 'emails', status: 'COMPLETED', time: '2m ago', duration: '1.2s' },
  { id: 'job_4c3e2f1a', name: 'generate_monthly_report', queue: 'reports', status: 'RUNNING', time: 'Just now', duration: '-' },
  { id: 'job_1a2b3c4d', name: 'process_image_upload', queue: 'media', status: 'FAILED', time: '15m ago', duration: '4.5s' },
  { id: 'job_9e8d7c6b', name: 'sync_user_data', queue: 'sync', status: 'QUEUED', time: '1h ago', duration: '-' },
  { id: 'job_5f4e3d2c', name: 'send_webhook', queue: 'webhooks', status: 'RETRYING', time: '5m ago', duration: '0.8s' },
];

export function JobsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor job executions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-black/20 border-white/10 hover:bg-white/10 text-white">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Create Job</Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by Job ID or Name..." className="pl-9 bg-white/5 border-white/10 text-white w-full" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-medium">Job ID</TableHead>
                <TableHead className="text-zinc-400 font-medium">Name</TableHead>
                <TableHead className="text-zinc-400 font-medium">Queue</TableHead>
                <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                <TableHead className="text-zinc-400 font-medium">Created</TableHead>
                <TableHead className="text-zinc-400 font-medium">Duration</TableHead>
                <TableHead className="text-right text-zinc-400 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-xs text-zinc-300">{job.id}</TableCell>
                  <TableCell className="font-medium text-white">{job.name}</TableCell>
                  <TableCell className="text-zinc-400">{job.queue}</TableCell>
                  <TableCell><StatusBadge status={job.status} /></TableCell>
                  <TableCell className="text-zinc-400">{job.time}</TableCell>
                  <TableCell className="text-zinc-400">{job.duration}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <DropdownMenuItem className="hover:bg-zinc-800 hover:text-white cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-zinc-800 hover:text-white cursor-pointer">View Logs</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-zinc-800 hover:text-white cursor-pointer">Retry Job</DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer">Cancel Job</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-white/10 text-sm text-zinc-400 flex items-center justify-between">
          <span>Showing 1 to 5 of 12,450 results</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-transparent border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-50">Previous</Button>
            <Button variant="outline" size="sm" className="bg-transparent border-white/10 hover:bg-white/10 hover:text-white">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
