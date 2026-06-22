import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Star, HelpCircle, ArrowLeft, Check, Sparkles, Shield, Headset } from 'lucide-react';

export default function HomePage() {
  // Fetch site settings
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

  // Fetch home page sections
  const { data: homeSections } = useQuery({
    queryKey: ['homepage_sections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('homepage_sections').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch active categories
  const { data: categories } = useQuery({
    queryKey: ['categories', 'home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch popular/featured services
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

  // Fetch featured customer reviews
  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  // Fetch general FAQs
  const { data: faqs } = useQuery({
    queryKey: ['faqs', 'home'],
    queryFn: async () => {
      const { data: generalFaqs, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .is('service_id', null)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      let data = generalFaqs;
      
      if (!data || data.length === 0) {
        const { data: allFaqs, error: err } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(5);
        if (err) throw err;
        data = allFaqs;
      }
      return data;
    }
  });

  const siteName = settings?.site_name || 'Saifrow Store';
  const heroTitle = homeSections?.hero_title || 'اشتراكاتك الرقمية في مكان واحد';
  const heroSubtitle = homeSections?.hero_subtitle || 'اختار الخدمة المناسبة، ادفع يدويًا، واستلم تفاصيل اشتراكك على الإيميل وفي حسابك بسرعة وأمان.';
  const primaryCta = homeSections?.primary_cta_text || 'تصفح الاشتراكات';
  const secondaryCta = homeSections?.secondary_cta_text || 'طريقة الشراء';

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white pt-24 pb-32 overflow-hidden border-b">
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-1 bg-blue-50 text-accent px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>متجرك الموثوق للاشتراكات الرقمية في مصر</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight max-w-4xl mx-auto">
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
              <Link to="/faq">{secondaryCta}</Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      </section>

      {/* Categories Grid */}
      {categories && categories.length > 0 && (
        <section className="py-12 bg-gray-50/50 border-b">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-muted-foreground ml-2">التصنيفات:</span>
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link to="/services">الكل</Link>
              </Button>
              {categories.map((category) => (
                <Button key={category.id} variant="secondary" size="sm" asChild className="rounded-full bg-white hover:bg-muted border">
                  <Link to={`/services?category=${category.id}`}>{category.name}</Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Services */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">الخدمات الأكثر طلباً</h2>
            <p className="text-muted-foreground">تصفح أفضل الاشتراكات الرقمية المتوفرة لدينا حالياً</p>
          </div>

          {isLoadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[320px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : popularServices && popularServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularServices.map((service) => (
                <div key={service.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="h-48 bg-muted relative">
                    {service.cover_image_url ? (
                      <img src={service.cover_image_url} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100">
                        <span>{service.name}</span>
                      </div>
                    )}
                    {service.is_featured && (
                      <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">
                        مميز
                      </span>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 mb-6">
                      <h3 className="font-bold text-xl">{service.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                        {service.short_description}
                      </p>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/services/${service.slug}`} className="flex items-center justify-center gap-2">
                        عرض الباقات والأسعار
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed max-w-lg mx-auto">
              <Sparkles className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">لا توجد خدمات مميزة حالياً</h3>
              <p className="text-sm text-muted-foreground mb-4">يرجى التحقق من تصنيفات الخدمات الأخرى في المتجر.</p>
              <Button asChild variant="outline">
                <Link to="/services">عرض جميع الخدمات</Link>
              </Button>
            </div>
          )}
          
          {popularServices && popularServices.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" asChild>
                <Link to="/services">عرض كل الخدمات الرقمية</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features & Why Us */}
      <section className="py-20 bg-gray-50 border-y">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">لماذا تختار {siteName}؟</h2>
            <p className="text-muted-foreground">نوفر لك أفضل خدمة وأسهل طريقة دفع لتسليم اشتراكك الرقمي</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border p-8 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">أمان وضمان كامل</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                جميع اشتراكاتنا رسمية وقانونية 100% مع ضمان كامل طوال فترة الاشتراك واستجابة سريعة لأي مشكلة.
              </p>
            </div>
            <div className="bg-white border p-8 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-accent rounded-xl flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">دفع محلي سهل</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                لا تحتاج لبطاقة ائتمان دولية. ادفع بسهولة عبر فودافون كاش، InstaPay، أو التحويل البنكي المباشر.
              </p>
            </div>
            <div className="bg-white border p-8 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Headset className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">دعم فني متواصل</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                فريق دعم فني متواجد لمساعدتك في تفعيل الحساب وحل أي استفسارات عبر الواتساب والبريد الإلكتروني.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      {reviews && reviews.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">ماذا يقول عملاؤنا؟</h2>
              <p className="text-muted-foreground">آراء وتقييمات حقيقية من عملائنا المشتركين معنا</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed italic">
                    " {review.review_text} "
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-accent flex items-center justify-center font-bold text-sm shrink-0 border">
                      {review.avatar_url ? (
                        <img src={review.avatar_url} alt={review.customer_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        review.customer_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{review.customer_name}</h4>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star 
                            key={idx} 
                            className={`w-3.5 h-3.5 ${
                              idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs && faqs.length > 0 && (
        <section className="py-20 bg-gray-50 border-t">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">الأسئلة الشائعة</h2>
              <p className="text-muted-foreground">إجابات على أكثر الاستفسارات التي تدور في ذهنك</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
                  <h3 className="font-bold text-base flex items-start gap-2">
                    <HelpCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mr-7">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button variant="outline" asChild>
                <Link to="/faq">عرض جميع الأسئلة الشائعة</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
