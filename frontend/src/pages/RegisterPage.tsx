import React from 'react';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center relative overflow-hidden selection:bg-indigo-500/30">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
      </div>

      <div className="z-10 w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] mb-4">
            <Terminal className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-zinc-400 mt-2 text-sm">Start managing your distributed jobs</p>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" className="bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email address</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input id="password" type="password" className="bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2">
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:text-indigo-400 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
