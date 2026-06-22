import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">سياسة الخصوصية</h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">تاريخ التحديث: 22 يونيو 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">1. جمع المعلومات</h2>
            <p>
              نحن في {siteName} نجمع البيانات التي تزودنا بها مباشرة عند إنشاء حساب أو إتمام طلب شراء، مثل: الاسم، البريد الإلكتروني، رقم الهاتف، ومعلومات الطلب. كما نطلب رفع صورة إيصال التحويل المالي للتحقق وتوثيق الدفع اليدوي.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">2. استخدام المعلومات</h2>
            <p>
              نستخدم المعلومات التي نجمعها للأغراض التالية:
            </p>
            <ul className="list-disc list-inside mr-4 space-y-1">
              <li>معالجة طلبات الشراء الخاصة بك وتفعيل اشتراكاتك الرقمية.</li>
              <li>التحقق من إثباتات الدفع وإيصالات التحويل اليدوي.</li>
              <li>التواصل معك بخصوص حالة طلبك، التفعيل، أو تقديم الدعم الفني.</li>
              <li>تحسين جودة خدماتنا وتقديم عروض مخصصة واشتراكات تهمك.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">3. حماية وأمن المعلومات</h2>
            <p>
              نحن نلتزم باتخاذ كافة الإجراءات الأمنية والتقنية اللازمة لحماية بياناتك الشخصية وتفاصيل اشتراكاتك والتحويلات المالية من الوصول غير المصرح به، التعديل، أو الكشف عنها. نقوم بتخزين صور إيصالات الدفع بشكل آمن على منصة Supabase Storage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">4. مشاركة المعلومات مع أطراف ثالثة</h2>
            <p>
              لا نقوم ببيع، تأجير، أو مشاركة بياناتك الشخصية مع أي جهات خارجية أو أطراف ثالثة، باستثناء ما يقتضيه القانون أو لحماية حقوقنا القانونية، أو مع خدمات تكنولوجيا المعلومات الأساسية التي نعتمد عليها لتشغيل وتأمين المنصة (مثل مزود قواعد البيانات والتحليلات).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground">5. حقوق المستخدم</h2>
            <p>
              يحق لك في أي وقت الوصول إلى بياناتك الشخصية المسجلة لدينا، تعديلها، أو تحديثها مباشرة من حسابك الشخصي. كما يمكنك التواصل معنا لطلب حذف حسابك وبياناتك بالكامل من قواعد بياناتنا.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
