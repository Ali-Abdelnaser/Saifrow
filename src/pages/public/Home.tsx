import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const { data: homeSections, isLoading: isLoadingSections } = useQuery({
    queryKey: ['homepage_sections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('homepage_sections').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: popularServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services', 'popular'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('sort_order', { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const heroTitle = homeSections?.hero_title || 'اشتراكاتك الرقمية في مكان واحد';
  const heroSubtitle = homeSections?.hero_subtitle || 'اختار الخدمة المناسبة، ادفع يدويًا، واستلم تفاصيل اشتراكك على الإيميل وفي حسابك.';
  const primaryCta = homeSections?.primary_cta_text || 'تصفح الاشتراكات';
  const secondaryCta = homeSections?.secondary_cta_text || 'طريقة الشراء';

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white pt-24 pb-32 overflow-hidden border-b">
        <div className="container relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight max-w-3xl mx-auto">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto text-md px-8 h-14">
              <Link to="/services">{primaryCta}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-md px-8 h-14">
              <Link to="/how-it-works">{secondaryCta}</Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">الخدمات الأكثر طلباً</h2>
            <p className="text-muted-foreground">تصفح أفضل الاشتراكات الرقمية المتوفرة لدينا</p>
          </div>

          {isLoadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[300px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : popularServices?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularServices.map((service) => (
                <div key={service.id} className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                  <div className="h-48 bg-muted relative">
                    {service.cover_image_url ? (
                      <img src={service.cover_image_url} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">بدون صورة</div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl mb-2">{service.name}</h3>
                    <p className="text-muted-foreground text-sm flex-1 mb-6 line-clamp-2">
                      {service.short_description}
                    </p>
                    <Button asChild className="w-full">
                      <Link to={`/services/${service.slug}`}>عرض الباقات</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد خدمات متاحة حالياً
            </div>
          )}
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">عرض كل الخدمات</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white border-t">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">كيف تعمل المنصة؟</h2>
            <p className="text-muted-foreground">خطوات بسيطة للحصول على اشتراكك</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-50 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">1</div>
              <h3 className="text-xl font-bold mb-3">اختر الخدمة</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">تصفح الباقات المتوفرة واختر الاشتراك الذي يناسب احتياجاتك.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-50 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">2</div>
              <h3 className="text-xl font-bold mb-3">ادفع وارفع الإيصال</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">قم بالتحويل البنكي أو عبر فودافون كاش وارفع صورة الإيصال للتحقق.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-50 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">3</div>
              <h3 className="text-xl font-bold mb-3">استلم اشتراكك</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">بعد مراجعة الإيصال، سيتم إرسال تفاصيل الاشتراك إلى بريدك الإلكتروني.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
