import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, ShoppingCart, Clock, CheckCircle2, AlertTriangle, 
} from 'lucide-react';

export default function AdminOverview() {
  // Fetch overall statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      // Direct count queries since the view might not exist or be empty
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { count: pendingPayments } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'payment_submitted');

      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: rejectedPayments } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'payment_rejected');

      // Sum revenue of completed orders
      const { data: completedSums } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed');

      const totalRevenue = completedSums?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;

      return {
        total_orders: totalOrders || 0,
        pending_payment_reviews: pendingPayments || 0,
        completed_orders: completedOrders || 0,
        rejected_payments: rejectedPayments || 0,
        total_revenue: totalRevenue,
      };
    },
  });

  // Fetch low stock plans
  const { data: lowStockPlans } = useQuery({
    queryKey: ['low_stock_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_plans')
        .select('*, service:services(name)')
        .eq('is_active', true)
        .lte('stock_quantity', 5) // or low_stock_alert_quantity
        .order('stock_quantity', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ['recent_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, service_plans(name), services(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">بانتظار الدفع</Badge>;
      case 'payment_submitted':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">تم تقديم الدفع</Badge>;
      case 'payment_rejected':
        return <Badge variant="destructive">مرفوض</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-700">مقبول</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800">مكتمل</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-700">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">نظرة عامة</h1>
        <p className="text-muted-foreground">أداء ومبيعات Saifrow Store الحالي.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingStats ? '...' : `${stats?.total_revenue} ج.م`}</div>
            <p className="text-xs text-muted-foreground">من الطلبات المكتملة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingStats ? '...' : stats?.total_orders}</div>
            <p className="text-xs text-muted-foreground">كل الحالات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مراجعات الدفع المعلقة</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{isLoadingStats ? '...' : stats?.pending_payment_reviews}</div>
            <p className="text-xs text-muted-foreground">بانتظار التحقق من الإيصال</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات المكتملة</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{isLoadingStats ? '...' : stats?.completed_orders}</div>
            <p className="text-xs text-muted-foreground">تم التسليم بنجاح</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Orders */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>الطلبات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const plan = order.service_plans;
                  const service = order.services;
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          #{order.order_number} - {order.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service?.name || order.service_name_snapshot} ({plan?.name || order.plan_name_snapshot})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{order.total} ج.م</span>
                        {getOrderStatusBadge(order.status)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">لا توجد طلبات حديثة.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>تنبيه المخزون المنخفض</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockPlans && lowStockPlans.length > 0 ? (
                lowStockPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{plan.service?.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.name}</p>
                    </div>
                    <Badge variant={plan.stock_quantity === 0 ? 'destructive' : 'outline'} className="font-bold">
                      {plan.stock_quantity === 0 ? 'نفذت الكمية' : `${plan.stock_quantity} متبقي`}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">جميع الباقات لديها مخزون كافي.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
