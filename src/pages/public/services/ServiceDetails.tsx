import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { PlanCard } from '@/components/public/PlanCard';
import { AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

export default function ServiceDetailsPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:categories(*),
          service_plans(*),
          faqs(*),
          reviews(*)
        `)
        .eq('slug', slug!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useSEO({
    title: service ? `${service.name} | باقات واشتراكات` : 'تحميل الخدمة...',
    description: service?.short_description || service?.full_description || 'تصفح باقات واشتراكات الخدمة الرقمية بأفضل الأسعار على متجر Saifrow Store.',
    keywords: service ? `saifrow store, ${service.name}, اشتراك ${service.name}, باقة ${service.name}` : 'saifrow store, اشتراكات رقمية'
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="h-64 bg-muted rounded-xl animate-pulse mb-8" />
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse mb-4" />
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse mb-8" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">الخدمة غير موجودة</h2>
        <p className="text-muted-foreground">عذراً، لم نتمكن من العثور على الخدمة المطلوبة.</p>
      </div>
    );
  }

  const activePlans = service.service_plans?.filter((p: any) => p.is_active !== false).sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const activeFaqs = service.faqs?.filter((f: any) => f.is_active !== false).sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const activeReviews = service.reviews?.filter((r: any) => r.is_active !== false).sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

  return (
    <div>
      {/* Cover */}
      {service.cover_image_url && (
        <div className="w-full h-[300px] md:h-[400px] bg-muted relative">
          <img 
            src={service.cover_image_url} 
            alt={service.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      )}

      <div className="container relative mt-10 z-10 pb-20">
        <div className="bg-card rounded-2xl shadow-sm border p-6 md:p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            {service.logo_url && (
              <div className="w-24 h-24 rounded-xl bg-white p-2 shadow-sm border shrink-0">
                <img src={service.logo_url} alt={`${service.name} logo`} className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-sm font-medium text-accent bg-blue-50 px-3 py-1 rounded-full">
                  {service.category?.name}
                </span>
                {service.is_featured && <Badge className="bg-amber-500 hover:bg-amber-600">مميز</Badge>}
                {service.is_popular && <Badge variant="secondary">الأكثر طلباً</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{service.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {service.short_description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            {service.full_description && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>عن الخدمة</span>
                </h2>
                <div 
                  className="prose prose-blue rtl:prose-reverse max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: service.full_description }}
                />
              </section>
            )}

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">المميزات</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-card border rounded-lg p-4">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements / Important Notes */}
            {((service.requirements && service.requirements.length > 0) || (service.important_notes && service.important_notes.length > 0)) && (
              <section className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  شروط وملاحظات هامة
                </h2>
                <div className="space-y-4 text-amber-900/80 text-sm">
                  {service.requirements?.map((req: string, idx: number) => (
                    <div key={`req-${idx}`} className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>{req}</span>
                    </div>
                  ))}
                  {service.important_notes?.map((note: string, idx: number) => (
                    <div key={`note-${idx}`} className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {activeFaqs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">الأسئلة الشائعة</h2>
                <div className="space-y-4">
                  {activeFaqs.map((faq: any) => (
                    <div key={faq.id} className="bg-card border rounded-xl p-5">
                      <h3 className="font-bold mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeReviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">آراء العملاء</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeReviews.map((review: any) => (
                    <div key={review.id} className="bg-card border rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold">{review.customer_name}</h3>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-4 h-4 ${
                                idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{review.review_text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold mb-6">الباقات المتوفرة</h2>
              {activePlans.length > 0 ? (
                <div className="space-y-6">
                  {activePlans.map((plan: any) => (
                    <PlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              ) : (
                <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
                  عذراً، لا توجد باقات متاحة حالياً لهذه الخدمة.
                </div>
              )}

              {/* Support Info */}
              {service.support_text && (
                <div className="mt-8 p-6 bg-blue-50 text-accent rounded-xl">
                  <h3 className="font-bold mb-2">الدعم الفني</h3>
                  <p className="text-sm leading-relaxed">{service.support_text}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
