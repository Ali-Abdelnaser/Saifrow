import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PaymentProofPreview } from '@/components/shared/PaymentProofPreview';
import { toast } from 'sonner';
import { Search, Eye, Check, X, Loader2 } from 'lucide-react';
import type { DeliveryType, OrderStatus } from '@/types/database';

export default function AdminOrders() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Modals / Dialogs
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Reject States
  const [rejectionReason, setRejectionReason] = useState('');

  // Approve / Delivery States
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('email_password');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [instructions, setInstructions] = useState('');

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin_orders', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          service_plans(name),
          services(name),
          payment_proofs(*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Approve Payment & Complete Order Mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const latestProof = selectedOrder.payment_proofs?.find((p: any) => p.status === 'pending') || selectedOrder.payment_proofs?.[0];
      
      const { data, error } = await supabase.rpc('approve_payment_and_complete_order', {
        p_order_id: selectedOrder.id,
        p_payment_proof_id: latestProof?.id || '',
        p_delivery_type: deliveryType,
        p_login_email: loginEmail || undefined,
        p_login_password: loginPassword || undefined,
        p_activation_code: activationCode || undefined,
        p_invite_link: inviteLink || undefined,
        p_instructions: instructions || undefined,
        p_custom_fields: {},
        p_visible_in_profile: true
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
      toast.success('تم قبول الدفع وتوصيل الطلب بنجاح');
      setIsApproveOpen(false);
      setIsDetailsOpen(false);
      // Reset delivery details
      setLoginEmail('');
      setLoginPassword('');
      setActivationCode('');
      setInviteLink('');
      setInstructions('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء قبول الدفع');
    }
  });

  // Reject Proof Mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!rejectionReason) throw new Error('يرجى كتابة سبب الرفض');
      const latestProof = selectedOrder.payment_proofs?.find((p: any) => p.status === 'pending') || selectedOrder.payment_proofs?.[0];
      
      const { data, error } = await supabase.rpc('reject_payment_proof', {
        p_order_id: selectedOrder.id,
        p_payment_proof_id: latestProof?.id || '',
        p_reject_reason: rejectionReason
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
      toast.success('تم رفض إثبات الدفع');
      setIsRejectOpen(false);
      setIsDetailsOpen(false);
      setRejectionReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء رفض الدفع');
    }
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">غير مدفوع</Badge>;
      case 'proof_uploaded':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">تم رفع الإثبات</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-700">مقبول</Badge>;
      case 'rejected':
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if current admin can moderate payments
  const canModeratePayments = ['super_admin', 'finance_member', 'orders_manager'].includes(profile?.role || '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
          <p className="text-muted-foreground">مراجعة وتفعيل اشتراكات العملاء وإيصالات الدفع.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white border p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث برقم الطلب، اسم العميل، أو إيميله..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="pending_payment">بانتظار الدفع</SelectItem>
              <SelectItem value="payment_submitted">تم تقديم الدفع</SelectItem>
              <SelectItem value="payment_rejected">مرفوض</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الخدمة / الباقة</TableHead>
                  <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                  <TableHead className="text-right">حالة الطلب</TableHead>
                  <TableHead className="text-right">حالة الدفع</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const plan = order.service_plans;
                  const service = order.services;
                  const proofs = order.payment_proofs || [];

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-bold">#{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{service?.name || order.service_name_snapshot} - {plan?.name || order.plan_name_snapshot}</TableCell>
                      <TableCell>{order.total} ج.م</TableCell>
                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell className="text-left">
                        <Dialog open={isDetailsOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                          setIsDetailsOpen(open);
                          if (open) setSelectedOrder({ ...order, plan, service, payment_proofs: proofs });
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 ml-1.5" />
                              تفاصيل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-right">تفاصيل الطلب #{selectedOrder?.order_number}</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6 py-4">
                                
                                {/* Order & Customer Details */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-b pb-4">
                                  <div>
                                    <span className="text-muted-foreground block mb-1">العميل:</span>
                                    <span className="font-semibold">{selectedOrder.customer_name}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block mb-1">البريد الإلكتروني:</span>
                                    <span className="font-semibold">{selectedOrder.customer_email}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block mb-1">الهاتف/الواتس:</span>
                                    <span>{selectedOrder.customer_phone || 'غير مدخل'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block mb-1">الخدمة:</span>
                                    <span className="font-bold">{selectedOrder.service?.name || selectedOrder.service_name_snapshot}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block mb-1">الباقة:</span>
                                    <span className="font-bold">{selectedOrder.plan?.name || selectedOrder.plan_name_snapshot}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block mb-1">المبلغ الإجمالي:</span>
                                    <span className="font-bold">{selectedOrder.total} ج.م</span>
                                  </div>
                                </div>

                                {selectedOrder.customer_note && (
                                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                                    <span className="text-muted-foreground text-xs block mb-1">ملاحظة العميل:</span>
                                    <p>{selectedOrder.customer_note}</p>
                                  </div>
                                )}

                                {/* Latest Payment Proof */}
                                {selectedOrder.payment_proofs && selectedOrder.payment_proofs.length > 0 ? (
                                  <div className="border rounded-xl p-4 space-y-4">
                                    <h4 className="font-bold text-sm">إثبات الدفع المرفق:</h4>
                                    
                                    {selectedOrder.payment_proofs.map((proof: any) => (
                                      <div key={proof.id} className="flex flex-col sm:flex-row gap-4 border-b last:border-0 pb-4 last:pb-0">
                                        <PaymentProofPreview
                                          source={proof.screenshot_url}
                                          className="block w-full sm:w-48 h-32 bg-muted rounded-lg overflow-hidden border shrink-0"
                                          imageClassName="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                        />
                                        <div className="space-y-1.5 text-sm flex-1">
                                          <p>حالة الإثبات: {proof.status === 'pending' ? <Badge variant="outline" className="bg-blue-50 text-blue-700">معلق</Badge> : proof.status === 'approved' ? <Badge variant="outline" className="bg-green-50 text-green-700">مقبول</Badge> : <Badge variant="destructive">مرفوض</Badge>}</p>
                                          <p className="text-xs text-muted-foreground">تاريخ الرفع: {new Date(proof.created_at).toLocaleString('ar-EG')}</p>
                                          {proof.reject_reason && (
                                            <p className="text-destructive font-semibold">سبب الرفض: {proof.reject_reason}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 border p-4 rounded-xl text-center text-muted-foreground text-sm">
                                    لا يتوفر إثبات دفع مرفق لهذا الطلب بعد.
                                  </div>
                                )}

                                {/* Action buttons for Pending reviews */}
                                {selectedOrder.status === 'payment_submitted' && canModeratePayments && (
                                  <div className="flex gap-3 border-t pt-6">
                                    
                                    {/* Approve / Deliver Dialog */}
                                    <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                                      <DialogTrigger asChild>
                                        <Button className="flex-1 bg-success hover:bg-success/90">
                                          <Check className="w-4 h-4 ml-1.5" />
                                          قبول الدفع وتوصيل الطلب
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle className="text-right">تفاصيل تسليم الطلب</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4 text-right">
                                          
                                          <div className="space-y-2">
                                            <Label>نوع التسليم</Label>
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

                                          {deliveryType === 'email_password' && (
                                            <>
                                              <div className="space-y-2">
                                                <Label htmlFor="loginEmail">إيميل الحساب</Label>
                                                <Input id="loginEmail" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} dir="ltr" className="text-left rtl:text-right" />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="loginPassword">باسورد الحساب</Label>
                                                <Input id="loginPassword" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} dir="ltr" className="text-left rtl:text-right" />
                                              </div>
                                            </>
                                          )}

                                          {deliveryType === 'activation_code' && (
                                            <div className="space-y-2">
                                              <Label htmlFor="activationCode">كود التفعيل / التنشيط</Label>
                                              <Input id="activationCode" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} dir="ltr" className="text-left rtl:text-right" />
                                            </div>
                                          )}

                                          {deliveryType === 'invite_link' && (
                                            <div className="space-y-2">
                                              <Label htmlFor="inviteLink">رابط الدعوة والانضمام</Label>
                                              <Input id="inviteLink" value={inviteLink} onChange={(e) => setInviteLink(e.target.value)} dir="ltr" className="text-left rtl:text-right" />
                                            </div>
                                          )}

                                          <div className="space-y-2">
                                            <Label htmlFor="instructions">تعليمات الاستخدام للعميل</Label>
                                            <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="اكتب أي تعليمات إضافية تظهر للعميل في حسابه..." />
                                          </div>

                                          <Button 
                                            onClick={() => approveMutation.mutate()} 
                                            className="w-full mt-4"
                                            disabled={approveMutation.isPending}
                                          >
                                            {approveMutation.isPending ? 'جاري تفعيل واكتمال الطلب...' : 'تأكيد التسليم وإكمال الطلب'}
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                    {/* Reject Dialog */}
                                    <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                                      <DialogTrigger asChild>
                                        <Button variant="destructive" className="flex-1">
                                          <X className="w-4 h-4 ml-1.5" />
                                          رفض الإثبات
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle className="text-right">رفض إثبات الدفع</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4 text-right">
                                          <div className="space-y-2">
                                            <Label htmlFor="rejectionReason">سبب الرفض</Label>
                                            <Textarea 
                                              id="rejectionReason" 
                                              value={rejectionReason} 
                                              onChange={(e) => setRejectionReason(e.target.value)}
                                              placeholder="اكتب سبب الرفض بالتفصيل ليظهر للعميل..." 
                                              rows={4}
                                            />
                                          </div>
                                          <Button 
                                            variant="destructive" 
                                            onClick={() => rejectMutation.mutate()}
                                            className="w-full mt-2"
                                            disabled={rejectMutation.isPending || !rejectionReason}
                                          >
                                            {rejectMutation.isPending ? 'جاري الرفض...' : 'تأكيد الرفض'}
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                  </div>
                                )}

                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لم يتم العثور على أي طلبات.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
