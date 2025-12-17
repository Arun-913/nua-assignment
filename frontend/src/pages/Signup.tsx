import { useForm, FormProvider } from 'react-hook-form';
import EmailField  from '@/components/fields/Email';
import PasswordField from '@/components/fields/Password';
import axios, { AxiosError } from 'axios';
import NameField from '@/components/fields/Name';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface ValidationError {
  field: string;
  message: string;
}

export default function Signup() {
  const methods = useForm();
  const navigate = useNavigate();
  const { handleSubmit, setError, formState: { errors, isSubmitting } } = methods;

  const onSubmit = async (data: any) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, data);
      toast.success('Signup in successful!, Please signin.', {
        duration: 1000,
        onAutoClose: () => navigate('/signin'),
      });
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
      
      toast.error("Error while signup in");
    }
  };

  const fieldError = (path: string) => path.split(".").reduce((acc: any, key: string) => acc?.[key], errors);

  useEffect(() => {
    async function init() {
      try {
        (await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check-login`, { withCredentials: true })).data;
        navigate('/');
      } catch (error) {
        console.log(error);
      }
    }

    init();
  });
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-purple-200">Sign up to your account</p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <NameField fieldError={fieldError} />
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
              Already have an account?{' '}
              <Link to="/signin" className="text-purple-400 hover:text-purple-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}