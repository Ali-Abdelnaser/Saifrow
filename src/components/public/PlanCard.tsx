import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { Database } from '@/types/database';

type Plan = Database['public']['Tables']['service_plans']['Row'];

export function PlanCard({ plan }: { plan: Plan }) {
  const inStock = plan.stock_quantity > 0;
  const isLowStock = inStock && plan.stock_quantity <= (plan.low_stock_alert_quantity || 0);

  return (
    <div className={`bg-card rounded-2xl border p-6 flex flex-col relative transition-all hover:shadow-md ${plan.is_popular ? 'border-accent shadow-sm' : ''}`}>
      {plan.is_popular && (
        <div className="absolute -top-3 inset-x-0 flex justify-center">
          <Badge className="bg-accent px-3 py-1">الأكثر طلباً</Badge>
        </div>
      )}

      <div className="text-center mb-6 pt-2">
        <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
        {plan.duration_label && (
          <p className="text-sm text-muted-foreground mb-4">{plan.duration_label}</p>
        )}
        
        <div className="flex justify-center items-end gap-2 mb-2">
          <span className="text-3xl font-extrabold">{plan.price}</span>
          <span className="text-muted-foreground pb-1">ج.م</span>
        </div>
        
        {plan.old_price && plan.old_price > plan.price && (
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="line-through text-muted-foreground">{plan.old_price} ج.م</span>
            {plan.discount_percentage && (
              <Badge variant="destructive" className="font-bold">وفر {plan.discount_percentage}%</Badge>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 mb-8 flex-1">
        {plan.features && plan.features.length > 0 ? (
          plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-accent flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center">لا توجد ميزات إضافية</p>
        )}
      </div>

      {plan.notes && (
        <div className="bg-muted/50 p-3 rounded-lg mb-6 text-xs text-muted-foreground">
          {plan.notes}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {isLowStock && (
          <p className="text-xs text-amber-600 font-medium text-center">
            تبقى {plan.stock_quantity} فقط في المخزون!
          </p>
        )}
        <Button asChild size="lg" className="w-full" disabled={!inStock}>
          <Link to={`/checkout/${plan.id}`}>
            {inStock ? 'اشترك الآن' : 'نفذت الكمية'}
          </Link>
        </Button>
      </div>
    </div>
  );
}
