import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<string>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch coupons
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin_coupons_crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setSelectedCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(0);
    setUsageLimit('');
    setMinOrderAmount('');
    setStartsAt('');
    setEndsAt('');
    setIsActive(true);
  };

  const handleEdit = (coupon: any) => {
    setSelectedCoupon(coupon);
    setCode(coupon.code || '');
    setDiscountType(coupon.discount_type || 'percentage');
    setDiscountValue(coupon.discount_value || 0);
    setUsageLimit(coupon.usage_limit || '');
    setMinOrderAmount(coupon.minimum_order_amount || '');
    setStartsAt(coupon.starts_at ? coupon.starts_at.substring(0, 16) : '');
    setEndsAt(coupon.ends_at ? coupon.ends_at.substring(0, 16) : '');
    setIsActive(coupon.is_active);
    setIsOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: code.toUpperCase().trim(),
        discount_type: discountType as any,
        discount_value: discountValue,
        usage_limit: usageLimit === '' ? null : Number(usageLimit),
        minimum_order_amount: minOrderAmount === '' ? null : Number(minOrderAmount),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (selectedCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', selectedCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([{ ...payload, used_count: 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_coupons_crud'] });
      toast.success('تم حفظ الكوبون بنجاح');
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
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_coupons_crud'] });
      toast.success('تم حذف الكوبون بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل حذف الكوبون.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">كوبونات الخصم</h1>
          <p className="text-muted-foreground">إنشاء وإدارة كوبونات خصم المبيعات.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة كوبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
              
              <div className="space-y-2">
                <Label htmlFor="code">كود الكوبون *</Label>
                <Input id="code" placeholder="مثال: SAVE20" value={code} onChange={(e) => setCode(e.target.value)} required dir="ltr" className="text-left rtl:text-right" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الخصم *</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="fixed">خصم مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="val">قيمة الخصم *</Label>
                  <Input id="val" type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limit">حد الاستخدام الأقصى</Label>
                  <Input id="limit" type="number" placeholder="لا يوجد حد" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value !== '' ? Number(e.target.value) : '')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min">الحد الأدنى لقيمة الطلب</Label>
                  <Input id="min" type="number" placeholder="لا يوجد" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value !== '' ? Number(e.target.value) : '')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">تاريخ البدء</Label>
                  <Input id="start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">تاريخ الانتهاء</Label>
                  <Input id="end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">الكوبون نشط</Label>
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full mt-4"
                disabled={saveMutation.isPending || !code || discountValue <= 0}
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الكوبون'}
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
          ) : coupons && coupons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">الخصم</TableHead>
                  <TableHead className="text-right">عدد مرات الاستخدام</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-bold">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : `${coupon.discount_value} ج.م`}
                    </TableCell>
                    <TableCell>
                      {coupon.used_count} / {coupon.usage_limit || '∞'}
                    </TableCell>
                    <TableCell>
                      {coupon.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">نشط</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
                          deleteMutation.mutate(coupon.id);
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
              لا توجد كوبونات خصم حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
