import { useForm, FormProvider } from 'react-hook-form';
import EmailField  from '@/components/fields/Email';
import PasswordField from '@/components/fields/Password';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

interface ValidationError {
  field: string;
  message: string;
}

export default function SignIn() {
  const methods = useForm();
  const navigate = useNavigate();
  const { handleSubmit, formState: { errors, isSubmitting }, setError } = methods;

  const onSubmit = async (data: any) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signin`, data, { withCredentials: true });
      toast.success('Signin in successful!', {
        duration: 1000,
        onAutoClose: () => navigate('/'),
      });
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        if (error.response?.data?.errors && Array.isArray(error.response?.data.errors)) {
          error.response?.data.errors.forEach((err: ValidationError) => {
            console.log(err);
            const fieldPath = err.field.split(".") as [string, ...string[]];
            setError(fieldPath.join(".") as any, {
              type: "manual",
              message: err.message,
            });
            toast.error(`${err.field}: ${err.message}`);
          });
          return;
        }
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      
      toast.error("Error while signing in");
    }
  };

  const fieldError = (path: string) => path.split(".").reduce((acc: any, key: string) => acc?.[key], errors);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-purple-200">Sign in to your account</p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <EmailField fieldError={fieldError} />
              <PasswordField fieldError={fieldError} />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </FormProvider>

          <div className="mt-6 text-center">
            <p className="text-purple-200 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}