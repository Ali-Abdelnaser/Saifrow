import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';

export default function AdminPaymentMethods() {
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [methodName, setMethodName] = useState('');
  const [type, setType] = useState<string>('vodafone_cash');
  const [accountName, setAccountName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instapayHandle, setInstapayHandle] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch payment methods
  const { data: methods, isLoading } = useQuery({
    queryKey: ['admin_payment_methods_crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setSelectedMethod(null);
    setMethodName('');
    setType('vodafone_cash');
    setAccountName('');
    setPhoneNumber('');
    setInstapayHandle('');
    setBankAccount('');
    setInstructions('');
    setIsActive(true);
  };

  const handleEdit = (method: any) => {
    setSelectedMethod(method);
    setMethodName(method.method_name || '');
    setType(method.type || 'vodafone_cash');
    setAccountName(method.account_name || '');
    setPhoneNumber(method.phone_number || '');
    setInstapayHandle(method.instapay_handle || '');
    setBankAccount(method.bank_account || '');
    setInstructions(method.instructions || '');
    setIsActive(method.is_active);
    setIsOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        method_name: methodName,
        type: type as any,
        account_name: accountName || null,
        phone_number: phoneNumber || null,
        instapay_handle: instapayHandle || null,
        bank_account: bankAccount || null,
        instructions: instructions || null,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (selectedMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(payload)
          .eq('id', selectedMethod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([{ ...payload, sort_order: 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_payment_methods_crud'] });
      toast.success('تم حفظ طريقة الدفع بنجاح');
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
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_payment_methods_crud'] });
      toast.success('تم حذف طريقة الدفع بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل حذف طريقة الدفع.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">طرق الدفع اليدوية</h1>
          <p className="text-muted-foreground">إدارة الحسابات والمحافظ لاستقبال مدفوعات العملاء.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة طريقة دفع
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
              
              <div className="space-y-2">
                <Label htmlFor="methodName">الاسم التوضيحي للعميل *</Label>
                <Input id="methodName" placeholder="مثال: فودافون كاش، إنستاباي" value={methodName} onChange={(e) => setMethodName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>النوع *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vodafone_cash">محفظة إلكترونية (فودافون كاش)</SelectItem>
                    <SelectItem value="instapay">إنستاباي (InstaPay)</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">اسم صاحب الحساب</Label>
                <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>

              {(type === 'vodafone_cash' || type === 'other') && (
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف / رقم المحفظة</Label>
                  <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr" className="text-left rtl:text-right" />
                </div>
              )}

              {type === 'instapay' && (
                <div className="space-y-2">
                  <Label htmlFor="instapay">عنوان InstaPay IPN</Label>
                  <Input id="instapay" placeholder="username@instapay" value={instapayHandle} onChange={(e) => setInstapayHandle(e.target.value)} dir="ltr" className="text-left rtl:text-right" />
                </div>
              )}

              {type === 'bank_transfer' && (
                <div className="space-y-2">
                  <Label htmlFor="bank">رقم الحساب البنكي / الآيبان IBAN</Label>
                  <Input id="bank" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} dir="ltr" className="text-left rtl:text-right" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="instructions">تعليمات خاصة بالتحويل تظهر للعميل</Label>
                <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="مثال: يرجى كتابة كذا أو التأكد من تحويل كذا..." />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">متاحة ومفعلة للعملاء</Label>
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full mt-4"
                disabled={saveMutation.isPending || !methodName}
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ طريقة الدفع'}
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
          ) : methods && methods.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحساب / الرقم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-bold">{method.method_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{method.type}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {method.phone_number || method.instapay_handle || method.bank_account || '-'}
                    </TableCell>
                    <TableCell>
                      {method.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">مفعلة</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">معطلة</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
                          deleteMutation.mutate(method.id);
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
              لم يتم العثور على أي طرق دفع.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
