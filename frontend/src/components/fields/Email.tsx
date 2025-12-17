import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Mail } from 'lucide-react';

export default function EmailField({ fieldError }: any) {
  const { register } = useFormContext();
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
          })}
        />
      </div>
      {fieldError("email") && <p className="text-red-400 text-sm mt-1">{fieldError("email")?.message}</p>}
    </div>
  );
}
