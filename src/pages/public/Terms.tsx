import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  const { data: settings } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      const flatSettings = {
        site_name: 'Saifrow Store',
      };

      data?.forEach((row: any) => {
        if (row.key === 'general') {
          flatSettings.site_name = row.value?.site_name || flatSettings.site_name;
        }
      });

      return flatSettings;
    }
  });

  const siteName = settings?.site_name || 'Saifrow Store';

  return (
    <div className="container py-12 max-w-4xl min-h-screen">
      <div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b pb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-accent flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">شروط الاستخدام</h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">تاريخ التحديث: 22 يونيو 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">1. قبول الشروط</h2>
            <p>
              باستخدامك لموقع {siteName} وشراء أي من اشتراكاتنا الرقمية، فإنك توافق على الالتزام بشروط الاستخدام المذكورة هنا بشكل كامل. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام خدماتنا.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">2. الحساب والبيانات الشخصية</h2>
            <p>
              عند إنشاء حساب، يجب عليك تزويدنا بمعلومات صحيحة ودقيقة (الاسم، البريد الإلكتروني، رقم الهاتف). أنت مسؤول بالكامل عن الحفاظ على سرية بيانات حسابك وأي أنشطة تتم من خلاله.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">3. طلب الاشتراكات وعمليات الدفع</h2>
            <p>
              يتم بيع الاشتراكات الرقمية بنظام الدفع اليدوي المسبق. يقوم العميل باختيار الباقة، ثم إرسال المبلغ الإجمالي عبر أحد وسائل الدفع المتاحة (فودافون كاش، InstaPay، أو تحويل بنكي)، ثم رفع لقطة شاشة واضحة لإيصال التحويل كإثبات للدفع. لا يتم تفعيل أي اشتراك إلا بعد التحقق اليدوي من التحويل ومطابقته.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">4. تسليم الاشتراكات والضمان</h2>
            <p>
              يتم تسليم تفاصيل الاشتراك (مثل البريد الإلكتروني وكلمة المرور، كود التفعيل، أو رابط الدعوة) عبر الحساب الشخصي للعميل في المنصة، والبريد الإلكتروني المرفق بالطلب. قد يستغرق التفعيل بضع دقائق إلى عدة ساعات عمل للتحقق وتفعيل الخدمة. نضمن عمل الحساب أو كود التفعيل طوال فترة الاشتراك المتفق عليها عند الشراء.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">5. سياسة الاسترجاع والتعويض</h2>
            <p>
              نظراً لطبيعة الخدمات الرقمية، لا يمكن إلغاء الطلبات أو استرداد الأموال بمجرد تسليم بيانات الاشتراك وتفعيلها، إلا في حال وجود مشكلة تقنية في الخدمة المسلمة تعذر على الدعم الفني حلها خلال فترة الضمان، وعندها يحق للعميل استرداد جزء من المبلغ بما يتناسب مع الفترة المتبقية من الاشتراك.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">6. التعديلات على الخدمات والشروط</h2>
            <p>
              نحتفظ بالحق في تعديل الأسعار، شروط التفعيل، أو إيقاف أي خدمة رقمية دون إشعار مسبق. كما يحق لنا تعديل شروط الاستخدام هذه في أي وقت، وتصبح التعديلات سارية بمجرد نشرها على هذه الصفحة.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
