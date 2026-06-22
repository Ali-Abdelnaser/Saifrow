import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/types/database';

type Service = Database['public']['Tables']['services']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ServiceWithCategory extends Service {
  category: Category;
  starting_price?: number;
  has_offer?: boolean;
  in_stock?: boolean;
}

export function ServiceCard({ service }: { service: ServiceWithCategory }) {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md group">
      <div className="h-48 bg-muted relative overflow-hidden">
        {service.cover_image_url ? (
          <img 
            src={service.cover_image_url} 
            alt={service.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">بدون صورة</div>
        )}
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {service.is_featured && <Badge className="bg-amber-500 hover:bg-amber-600">مميز</Badge>}
          {service.is_popular && <Badge variant="secondary">الأكثر طلباً</Badge>}
          {service.has_offer && <Badge variant="destructive">عرض</Badge>}
        </div>

        {service.logo_url && (
          <div className="absolute bottom-3 right-3 w-12 h-12 rounded-lg bg-white p-1 shadow-md border">
            <img src={service.logo_url} alt={`${service.name} logo`} className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-medium text-accent mb-1 inline-block">
              {service.category?.name || 'تصنيف عام'}
            </span>
            <h3 className="font-bold text-lg leading-tight line-clamp-1">{service.name}</h3>
          </div>
          {service.starting_price !== undefined && (
            <div className="text-left rtl:text-right shrink-0">
              <span className="text-sm text-muted-foreground block">تبدأ من</span>
              <span className="font-bold text-lg text-primary">{service.starting_price} ج.م</span>
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-sm flex-1 mb-5 line-clamp-2">
          {service.short_description}
        </p>

        <div className="flex items-center justify-between mt-auto gap-3">
          <Button variant="outline" asChild className="flex-1">
            <Link to={`/services/${service.slug}`}>التفاصيل</Link>
          </Button>
          <Button asChild className="flex-1" disabled={!service.in_stock}>
            <Link to={`/services/${service.slug}`}>
              {service.in_stock === false ? 'نفذت الكمية' : 'اشتري الآن'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
