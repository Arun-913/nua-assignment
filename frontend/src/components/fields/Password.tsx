import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Lock } from 'lucide-react';

export default function PasswordField({ fieldError }: any) {
  const { register } = useFormContext();
  return (
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
        />
      </div>
      {fieldError("password") && <p className="text-red-400 text-sm mt-1">{fieldError("password")?.message}</p>}
    </div>
  );
}