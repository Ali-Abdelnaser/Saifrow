import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ServiceCard } from '@/components/public/ServiceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function ServicesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', search, categoryFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          category:categories(*),
          service_plans(price, old_price, stock_quantity)
        `)
        .eq('is_active', true);

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('is_popular', { ascending: false }).order('sort_order', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process plans to get starting price and stock
      return data.map((service: any) => {
        const plans = service.service_plans || [];
        const activePlans = plans.filter((p: any) => p.is_active !== false); // fallback to true
        
        let starting_price = undefined;
        let has_offer = false;
        let total_stock = 0;

        if (activePlans.length > 0) {
          starting_price = Math.min(...activePlans.map((p: any) => p.price));
          has_offer = activePlans.some((p: any) => p.old_price && p.old_price > p.price);
          total_stock = activePlans.reduce((acc: number, p: any) => acc + (p.stock_quantity || 0), 0);
        }

        return {
          ...service,
          starting_price,
          has_offer,
          in_stock: total_stock > 0,
        };
      });
    },
  });

  // Client-side sorting for price since it's computed
  const sortedServices = services ? [...services].sort((a, b) => {
    if (sortBy === 'price_low') {
      return (a.starting_price || 999999) - (b.starting_price || 999999);
    }
    if (sortBy === 'price_high') {
      return (b.starting_price || 0) - (a.starting_price || 0);
    }
    return 0; // Already sorted by query for latest/popular
  }) : [];

  return (
    <div className="container py-12 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-4">الخدمات والاشتراكات</h1>
        <p className="text-muted-foreground">تصفح أحدث وأفضل الاشتراكات الرقمية لدينا.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-6">
            <div className="flex items-center gap-2 font-semibold mb-4">
              <SlidersHorizontal className="w-5 h-5" />
              <h2>تصفية النتائج</h2>
            </div>

            <div className="space-y-3">
              <Label htmlFor="search">بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ابحث عن خدمة..."
                  className="pr-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>التصنيف</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="كل التصنيفات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>ترتيب حسب</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="ترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">الأحدث</SelectItem>
                  <SelectItem value="popular">الأكثر طلباً</SelectItem>
                  <SelectItem value="price_low">السعر: الأقل إلى الأعلى</SelectItem>
                  <SelectItem value="price_high">السعر: الأعلى إلى الأقل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setSortBy('latest');
              }}
            >
              إعادة ضبط
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[380px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : sortedServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card border rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground mb-6">لم نتمكن من العثور على خدمات مطابقة لبحثك.</p>
              <Button onClick={() => {
                setSearch('');
                setCategoryFilter('all');
              }}>
                عرض كل الخدمات
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
