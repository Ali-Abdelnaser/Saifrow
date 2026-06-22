import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = forgotPasswordSchema.safeParse({ email });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'يرجى مراجعة البريد الإلكتروني');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;
      setSent(true);
      toast.success('تم إرسال رابط استعادة كلمة المرور');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر إرسال رابط استعادة كلمة المرور';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">استعادة كلمة المرور</h1>
          <p className="text-sm text-muted-foreground">
            أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور.
          </p>
        </div>

        {sent ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              إذا كان البريد مسجلًا لدينا، ستصلك رسالة استعادة كلمة المرور خلال دقائق.
            </div>
            <Button asChild className="w-full">
              <Link to="/login">العودة لتسجيل الدخول</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="text-left rtl:text-right"
                dir="ltr"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              تذكرت كلمة المرور؟{' '}
              <Link to="/login" className="font-medium text-accent hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
