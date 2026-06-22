import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PaymentProofPreview } from '@/components/shared/PaymentProofPreview';
import { toast } from 'sonner';
import { Eye, Check, X, Loader2 } from 'lucide-react';
import type { DeliveryType } from '@/types/database';

export default function AdminPayments() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Reject State
  const [rejectionReason, setRejectionReason] = useState('');

  // Delivery States
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('email_password');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [instructions, setInstructions] = useState('');

  // Fetch only orders that submitted payment proofs
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin_pending_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          service_plans(name),
          services(name),
          payment_proofs(*)
        `)
        .eq('status', 'payment_submitted')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Approve payment
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
      queryClient.invalidateQueries({ queryKey: ['admin_pending_payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      toast.success('تم قبول الدفع وتوصيل الطلب');
      setIsApproveOpen(false);
      setIsDetailsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء قبول الدفع');
    }
  });

  // Reject payment
  const rejectMutation = useMutation({
    mutationFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ['admin_pending_payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      toast.success('تم رفض الدفع');
      setIsRejectOpen(false);
      setIsDetailsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء رفض الدفع');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">مراجعة المدفوعات المعلقة</h1>
        <p className="text-muted-foreground">مراجعة لقطات الشاشة المرفوعة من العملاء لتأكيد التحويلات.</p>
      </div>

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
                  <TableHead className="text-right">الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الخدمة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
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
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{service?.name || order.service_name_snapshot}</TableCell>
                      <TableCell>{order.total} ج.م</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell className="text-left">
                        <Dialog open={isDetailsOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                          setIsDetailsOpen(open);
                          if (open) setSelectedOrder({ ...order, plan, service, payment_proofs: proofs });
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 ml-1.5" />
                              مراجعة الإيصال
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-right">مراجعة دفع الطلب #{selectedOrder?.order_number}</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6 py-4">
                                <div className="border rounded-xl p-4 bg-muted/30">
                                  <span className="text-muted-foreground block text-xs mb-2">إيصال الدفع المرفق:</span>
                                  {selectedOrder.payment_proofs?.[0] ? (
                                    <PaymentProofPreview
                                      source={selectedOrder.payment_proofs[0].screenshot_url}
                                      className="block max-h-96 overflow-hidden border rounded-lg"
                                      imageClassName="w-full object-contain hover:opacity-95"
                                    />
                                  ) : (
                                    <p className="text-sm text-destructive">لم يتم رفع إيصال!</p>
                                  )}
                                </div>

                                <div className="flex gap-3">
                                  {/* Approve Dialog */}
                                  <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                                    <DialogTrigger asChild>
                                      <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
                                        <Check className="w-4 h-4 ml-1.5" />
                                        قبول وتوصيل الحساب
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle className="text-right">تفاصيل تسليم الحساب</DialogTitle>
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
                                              <Label htmlFor="email">إيميل الحساب</Label>
                                              <Input id="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} dir="ltr" />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="pass">كلمة المرور</Label>
                                              <Input id="pass" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} dir="ltr" />
                                            </div>
                                          </>
                                        )}

                                        {deliveryType === 'activation_code' && (
                                          <div className="space-y-2">
                                            <Label htmlFor="activation-code">كود التفعيل</Label>
                                            <Input id="activation-code" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} dir="ltr" />
                                          </div>
                                        )}

                                        {deliveryType === 'invite_link' && (
                                          <div className="space-y-2">
                                            <Label htmlFor="invite-link">رابط الدعوة</Label>
                                            <Input id="invite-link" value={inviteLink} onChange={(e) => setInviteLink(e.target.value)} dir="ltr" />
                                          </div>
                                        )}

                                        <div className="space-y-2">
                                          <Label htmlFor="instr">تعليمات الاستخدام للعميل</Label>
                                          <Textarea id="instr" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
                                        </div>

                                        <Button onClick={() => approveMutation.mutate()} className="w-full mt-4" disabled={approveMutation.isPending}>
                                          تأكيد وتوصيل الطلب
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
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle className="text-right">سبب الرفض</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4 text-right">
                                        <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="اكتب سبب رفض الإيصال ليتمكن العميل من الرفع مجدداً..." />
                                        <Button variant="destructive" onClick={() => rejectMutation.mutate()} className="w-full mt-2" disabled={rejectMutation.isPending || !rejectionReason}>
                                          تأكيد الرفض
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
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
              لا توجد دفعات معلقة للمراجعة حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
