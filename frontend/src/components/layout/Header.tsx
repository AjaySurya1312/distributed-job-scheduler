import React from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-6 backdrop-blur-xl">
      <div className="flex w-full max-w-sm items-center gap-2 relative">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search jobs, queues, workers..." 
          className="w-full pl-9 bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500"></span>
        </Button>
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Moon className="h-5 w-5" />
        </Button>
        <div className="h-8 w-px bg-white/10 mx-2" />
        <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent transition-all hover:ring-indigo-500">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
