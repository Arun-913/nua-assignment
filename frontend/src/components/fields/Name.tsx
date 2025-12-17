import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { User } from 'lucide-react';

export default function NameField({ fieldError }: any) {
  const { register } = useFormContext();
  return (
    <div className="space-y-2">
      <Label htmlFor="name">Name</Label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
        <Input
          id="name"
          type="text"
          placeholder="Enter your name"
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' },
          })}
        />
      </div>
      {fieldError("name") && <p className="text-red-400 text-sm mt-1">{fieldError("name")?.message}</p>}
    </div>
  );
}
