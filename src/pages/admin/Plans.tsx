import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import type { DeliveryType } from '@/types/database';

export default function AdminPlans() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [serviceId, setServiceId] = useState('');
  const [name, setName] = useState('');
  const [durationLabel, setDurationLabel] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(0);
  const [oldPrice, setOldPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [lowStockAlert, setLowStockAlert] = useState(2);
  const [features, setFeatures] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('email_password');
  const [isActive, setIsActive] = useState(true);
  const [isPopular, setIsPopular] = useState(false);

  // Fetch plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_plans')
        .select('*, service:services(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch active services
  const { data: services } = useQuery({
    queryKey: ['admin_services_list_for_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setSelectedPlan(null);
    setServiceId('');
    setName('');
    setDurationLabel('');
    setDurationDays(30);
    setPrice(0);
    setOldPrice(0);
    setDiscountPercent(0);
    setStockQuantity(10);
    setLowStockAlert(2);
    setFeatures('');
    setNotes('');
    setDeliveryType('email_password');
    setIsActive(true);
    setIsPopular(false);
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setServiceId(plan.service_id || '');
    setName(plan.name || '');
    setDurationLabel(plan.duration_label || '');
    setDurationDays(plan.duration_days || 30);
    setPrice(plan.price || 0);
    setOldPrice(plan.old_price || 0);
    setDiscountPercent(plan.discount_percentage || 0);
    setStockQuantity(plan.stock_quantity || 0);
    setLowStockAlert(plan.low_stock_alert_quantity || 2);
    setFeatures(plan.features?.join('\n') || '');
    setNotes(plan.notes || '');
    setDeliveryType(plan.delivery_type || 'email_password');
    setIsActive(plan.is_active);
    setIsPopular(plan.is_popular);
    setIsOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedFeatures = features.split('\n').filter(l => l.trim() !== '');
      
      const payload = {
        service_id: serviceId,
        name,
        duration_label: durationLabel || null,
        duration_days: durationDays,
        price,
        old_price: oldPrice || null,
        discount_percentage: discountPercent || null,
        stock_quantity: stockQuantity,
        low_stock_alert_quantity: lowStockAlert,
        features: parsedFeatures,
        notes: notes || null,
        delivery_type: deliveryType,
        is_active: isActive,
        is_popular: isPopular,
        updated_at: new Date().toISOString()
      };

      if (selectedPlan) {
        const { error } = await supabase
          .from('service_plans')
          .update(payload)
          .eq('id', selectedPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_plans')
          .insert([{ ...payload, sort_order: 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      toast.success('تم حفظ الباقة بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء الحفظ');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      toast.success('تم حذف الباقة بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل حذف الباقة. ربما توجد طلبات معتمدة عليها.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة باقات الخدمات</h1>
          <p className="text-muted-foreground">إضافة وتعديل باقات وأسعار الخدمات ومستويات المخزون.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة باقة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedPlan ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الخدمة المرتبطة *</Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((srv) => (
                        <SelectItem key={srv.id} value={srv.id}>{srv.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الباقة *</Label>
                  <Input id="name" placeholder="مثال: اشتراك شهر، بريميوم سنوي" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationLabel">تسمية المدة للعميل</Label>
                  <Input id="durationLabel" placeholder="مثال: شهر كامل، 12 شهر" value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationDays">المدة بالأيام</Label>
                  <Input id="durationDays" type="number" value={durationDays} onChange={(e) => setDurationDays(parseInt(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر الحالي *</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oldPrice">السعر السابق شطب</Label>
                  <Input id="oldPrice" type="number" value={oldPrice} onChange={(e) => setOldPrice(parseFloat(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">نسبة الخصم %</Label>
                  <Input id="discount" type="number" value={discountPercent} onChange={(e) => setDiscountPercent(parseInt(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">كمية المخزون *</Label>
                  <Input id="stock" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(parseInt(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStock">كمية تنبيه انخفاض المخزون</Label>
                  <Input id="lowStock" type="number" value={lowStockAlert} onChange={(e) => setLowStockAlert(parseInt(e.target.value))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>طريقة التسليم الافتراضية</Label>
                <Select value={deliveryType} onValueChange={(value) => setDeliveryType(value as DeliveryType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_password">إيميل وباسورد</SelectItem>
                    <SelectItem value="activation_code">كود تفعيل</SelectItem>
                    <SelectItem value="invite_link">رابط دعوة</SelectItem>
                    <SelectItem value="custom_instructions">تعليمات يدوية مخصصة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">مميزات الباقة (كل ميزة في سطر)</Label>
                <Textarea id="features" value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات الباقة للعميل</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="isActive">نشط ومعروض</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isPopular" checked={isPopular} onCheckedChange={setIsPopular} />
                  <Label htmlFor="isPopular">الباقة الأكثر طلباً</Label>
                </div>
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full mt-6"
                disabled={saveMutation.isPending || !name || !serviceId}
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الباقة'}
              </Button>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : plans && plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الخدمة</TableHead>
                  <TableHead className="text-right">الباقة</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-semibold">{plan.service?.name}</TableCell>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.price} ج.م</TableCell>
                    <TableCell>
                      <Badge variant={plan.stock_quantity === 0 ? 'destructive' : plan.stock_quantity <= plan.low_stock_alert_quantity ? 'outline' : 'outline'} className={plan.stock_quantity > plan.low_stock_alert_quantity ? 'bg-green-50 text-green-700' : ''}>
                        {plan.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">نشط</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
                          deleteMutation.mutate(plan.id);
                        }
                      }}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد باقات خدمات متاحة حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
