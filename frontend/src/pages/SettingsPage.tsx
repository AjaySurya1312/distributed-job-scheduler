import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-zinc-400">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription className="text-zinc-400">Update your personal details here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue={user?.firstName} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue={user?.lastName} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" defaultValue={user?.email} className="bg-zinc-800 border-zinc-700 text-white" readOnly />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription className="text-zinc-400">Manage your password and security preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
