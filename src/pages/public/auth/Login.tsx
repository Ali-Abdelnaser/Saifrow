import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const loginSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور'),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      const flatSettings = {
        site_name: 'Saifrow Store',
        logo_url: '',
      };

      data?.forEach((row: any) => {
        if (row.key === 'general') {
          flatSettings.site_name = row.value?.site_name || flatSettings.site_name;
        } else if (row.key === 'branding') {
          flatSettings.logo_url = row.value?.logo_url || '';
        }
      });

      return flatSettings;
    }
  });

  const siteName = settings?.site_name || 'Saifrow Store';
  const from = location.state?.from?.pathname || '/';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'يرجى مراجعة بيانات الدخول');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });
      if (error) throw error;
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل تسجيل الدخول';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${from}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل تسجيل الدخول بحساب جوجل';
      toast.error(message);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-sm border">
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="mb-4 flex flex-col items-center gap-2">
            <img 
              src={settings?.logo_url || '/favicon.png'} 
              alt={siteName} 
              className="h-16 w-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-accent to-blue-600 bg-clip-text text-transparent">
              {siteName}
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
          <p className="text-muted-foreground text-sm">مرحباً بك مجدداً في {siteName}</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-left rtl:text-right"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">كلمة المرور</Label>
              <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-left rtl:text-right"
              dir="ltr"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-6 flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.78 0 3.37.61 4.62 1.8l3.43-3.43C17.96 1.48 15.17.5 12 .5 7.24.5 3.23 3.23 1.25 7.18l4.03 3.12C6.23 7.37 8.91 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.83-.07-1.63-.2-2.4H12v4.56h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.55z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.1c-.25-.76-.39-1.58-.39-2.43s.14-1.67.39-2.43L1.25 7.12C.45 8.73 0 10.52 0 12.4s.45 3.67 1.25 5.28l4.03-3.28z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.24 0 5.95-1.07 7.94-2.91l-3.66-2.84c-1.01.68-2.3 1.09-3.95 1.09-3.09 0-5.77-2.33-6.72-5.46l-4.03 3.12C3.23 20.77 7.24 23.5 12 23.5z"
              />
            </svg>
            <span>المتابعة باستخدام حساب جوجل</span>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-accent font-medium hover:underline">
            حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}
