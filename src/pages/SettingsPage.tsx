import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Shield, Bell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const profileSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

const roleColors: Record<string, any> = { admin: 'danger', manager: 'warning', sales_rep: 'info' };

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, deals: true, tasks: true, weekly: false });

  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: profileErrors, isSubmitting: profileSaving } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
  });

  const { register: regPass, handleSubmit: submitPass, reset: resetPass, formState: { errors: passErrors, isSubmitting: passSaving } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileData) => {
    updateProfile(data);
    toast.success('Profile updated successfully');
  };

  const onPasswordSubmit = async (_data: PasswordData) => {
    // Demo: just show success
    toast.success('Password changed (demo — not actually changed)');
    resetPass();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <Badge variant={roleColors[user?.role ?? 'sales_rep']} className="mt-1" size="sm">
              {user?.role?.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User size={16} />Profile Information</h4>
          <Input label="Full Name" {...regProfile('name')} error={profileErrors.name?.message} required />
          <Input label="Email" type="email" {...regProfile('email')} error={profileErrors.email?.message} required />
          <Input label="Phone" type="tel" {...regProfile('phone')} />
          <Button type="submit" loading={profileSaving}>Save Profile</Button>
        </form>
      </Card>

      {/* Password */}
      <Card>
        <form onSubmit={submitPass(onPasswordSubmit)} className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Shield size={16} />Change Password</h4>
          <div className="relative">
            <Input label="Current Password" type={showCurrent ? 'text' : 'password'} {...regPass('currentPassword')} error={passErrors.currentPassword?.message} required />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <Input label="New Password" type={showNew ? 'text' : 'password'} {...regPass('newPassword')} error={passErrors.newPassword?.message} required />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Input label="Confirm New Password" type="password" {...regPass('confirmPassword')} error={passErrors.confirmPassword?.message} required />
          <Button type="submit" loading={passSaving}>Change Password</Button>
        </form>
      </Card>

      {/* Notifications */}
      <Card>
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4"><Bell size={16} />Notification Preferences</h4>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive email updates for important events' },
            { key: 'deals', label: 'Deal Updates', desc: 'Notify when deals change stage' },
            { key: 'tasks', label: 'Task Reminders', desc: 'Notify about upcoming and overdue tasks' },
            { key: 'weekly', label: 'Weekly Summary', desc: 'Receive a weekly performance summary email' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button
                onClick={() => { setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] })); toast.success('Preference saved'); }}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key as keyof typeof notifications] ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* CRM Info */}
      <Card>
        <h4 className="text-sm font-semibold text-gray-700 mb-4">System Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Version</span>
            <span className="font-medium">SkiptoCRM v1.0.0</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Storage</span>
            <span className="font-medium">localStorage (Demo Mode)</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">User Role</span>
            <Badge variant={roleColors[user?.role ?? 'sales_rep']} size="sm">{user?.role?.replace('_', ' ')}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

