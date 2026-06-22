import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { HelpCircle, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function FaqPage() {
  const [search, setSearch] = useState('');

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*, services(name)')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const filteredFaqs = faqs?.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) || 
    faq.answer.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="container py-12 max-w-4xl min-h-screen">
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">الأسئلة الشائعة</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          اعثر على إجابات سريعة للأسئلة الشائعة حول خدماتنا، طرق الدفع والتفعيل.
        </p>
        
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن سؤال أو كلمة مفتاحية..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredFaqs.length > 0 ? (
        <div className="space-y-6">
          {/* General FAQs */}
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-2">
                <h3 className="font-bold text-base md:text-lg flex items-start gap-2 text-foreground">
                  <HelpCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mr-7 whitespace-pre-line">
                  {faq.answer}
                </p>
                {faq.services?.name && (
                  <div className="pt-2 mr-7">
                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                      الخدمة: {faq.services.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-card border rounded-2xl shadow-sm max-w-lg mx-auto">
          <HelpCircle className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-1">لا توجد أسئلة شائعة مطابقة</h3>
          <p className="text-sm text-muted-foreground mb-4">لم نجد أي إجابة مطابقة لبحثك. يرجى تجربة كلمات أخرى أو الاتصال بنا.</p>
        </div>
      )}
    </div>
  );
}
