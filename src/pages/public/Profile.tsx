import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { toast } from 'sonner';
import { 
  CheckCircle2, Clock, ExternalLink, Key, Mail, ShieldAlert
} from 'lucide-react';

interface OrderWithRelations {
  id: string;
  order_number: string;
  user_id: string;
  plan_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  service_name_snapshot: string | null;
  plan_name_snapshot: string | null;
  price_snapshot: number | null;
  duration_label_snapshot: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  total: number;
  coupon_id: string | null;
  customer_note: string | null;
  admin_note: string | null;
  reject_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  service_plans: any | null;
  services: any | null;
  delivery_details: any[] | null;
  payment_proofs: any[] | null;
  delivery: any[] | null;
  proofs: any[] | null;
  plan: any | null;
  service: any | null;
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async (): Promise<OrderWithRelations[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          service_plans(*),
          services(*),
          delivery_details(*),
          payment_proofs(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as OrderWithRelations[];
    },
    enabled: !!user?.id,
  });

  // Re-submit Payment Proof Mutation
  const submitProofMutation = useMutation({
    mutationFn: async ({ orderId, fileUrl, paymentMethodId, amount }: { orderId: string; fileUrl: string; paymentMethodId: string; amount: number }) => {
      const { data, error } = await supabase.rpc('submit_payment_proof', {
        p_order_id: orderId,
        p_payment_method_id: paymentMethodId,
        p_amount: amount,
        p_screenshot_url: fileUrl
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      toast.success('تم إعادة إرسال إثبات الدفع بنجاح');
      setIsUploadOpen(false);
      setProofUrl('');
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء إرسال إثبات الدفع');
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

  return (
    <div className="container py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">حسابي الشخصي</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* User Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto border-2 border-primary/20">
                <span className="text-2xl font-bold">{profile?.full_name?.charAt(0) || user?.email?.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">الرتبة: {profile?.role === 'customer' ? 'عميل' : 'إداري'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Area */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">طلباتي الأخيرة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingOrders ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const plan = order.service_plans;
                    const service = order.services;
                    const proofs = order.payment_proofs || [];
                    const delivery = (order.delivery_details || []).filter((detail: any) => detail.visible_in_profile === true);

                    return (
                      <div 
                        key={order.id} 
                        className="border rounded-xl p-5 hover:bg-muted/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm">طلب #{order.order_number}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <h4 className="font-bold text-base">{service?.name || order.service_name_snapshot} - {plan?.name || order.plan_name_snapshot}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">{order.total} ج.م</span>
                            <span>•</span>
                            {getOrderStatusBadge(order.status)}
                            {getPaymentStatusBadge(order.payment_status)}
                          </div>
                        </div>

                        <div className="shrink-0 flex gap-2 w-full sm:w-auto">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                onClick={() => setSelectedOrder({ ...order, plan, service, proofs, delivery })}
                                className="flex-1 sm:flex-initial"
                              >
                                عرض التفاصيل
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-right">تفاصيل الطلب #{selectedOrder?.order_number}</DialogTitle>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-6 py-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                                    <div>
                                      <span className="text-muted-foreground block mb-1">الخدمة:</span>
                                      <span className="font-bold">{selectedOrder.service?.name || selectedOrder.service_name_snapshot}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block mb-1">الباقة:</span>
                                      <span className="font-bold">{selectedOrder.plan?.name || selectedOrder.plan_name_snapshot}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block mb-1">المبلغ المدفوع:</span>
                                      <span className="font-bold">{selectedOrder.total} ج.م</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block mb-1">تاريخ الطلب:</span>
                                      <span>{new Date(selectedOrder.created_at).toLocaleString('ar-EG')}</span>
                                    </div>
                                  </div>

                                  {/* Rejection Info & Upload */}
                                  {selectedOrder.status === 'payment_rejected' && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
                                      <div className="flex gap-2 text-red-800">
                                        <ShieldAlert className="w-5 h-5 shrink-0" />
                                        <div>
                                          <p className="font-bold">تم رفض إثبات الدفع</p>
                                          <p className="text-sm mt-1">
                                            سبب الرفض:{' '}
                                            <strong className="underline">
                                              {selectedOrder.reject_reason || selectedOrder.proofs?.find((p: any) => p.status === 'rejected')?.reject_reason || 'غير محدد'}
                                            </strong>
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {!isUploadOpen ? (
                                        <Button 
                                          variant="destructive" 
                                          onClick={() => setIsUploadOpen(true)}
                                        >
                                          إعادة رفع إثبات الدفع
                                        </Button>
                                      ) : (
                                        <div className="space-y-4">
                                          <ImageUpload
                                            bucketName="payment-proofs"
                                            folderPath={`${user?.id}/${selectedOrder.id}`}
                                            onUploadSuccess={setProofUrl}
                                            label="صورة جديدة لإيصال التحويل"
                                          />
                                          <div className="flex gap-2">
                                            <Button 
                                              onClick={() => submitProofMutation.mutate({ 
                                                orderId: selectedOrder.id, 
                                                fileUrl: proofUrl, 
                                                paymentMethodId: selectedOrder.proofs?.[0]?.payment_method_id || '', 
                                                amount: selectedOrder.total 
                                              })}
                                              disabled={submitProofMutation.isPending || !proofUrl}
                                            >
                                              إرسال الإثبات الجديد
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              onClick={() => { setIsUploadOpen(false); setProofUrl(''); }}
                                            >
                                              إلغاء
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Delivery Details (only shown if order completed) */}
                                  {selectedOrder.status === 'completed' && selectedOrder.delivery?.[0] ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
                                      <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        تفاصيل التسليم والاشتراك
                                      </h4>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-emerald-950">
                                        {selectedOrder.delivery[0].login_email && (
                                          <div className="bg-white border p-3 rounded-lg flex items-center justify-between">
                                            <div>
                                              <span className="text-muted-foreground text-xs block">البريد الإلكتروني للخدمة:</span>
                                              <span className="font-semibold select-all">{selectedOrder.delivery[0].login_email}</span>
                                            </div>
                                            <Mail className="w-4 h-4 text-emerald-600" />
                                          </div>
                                        )}
                                        
                                        {selectedOrder.delivery[0].login_password && (
                                          <div className="bg-white border p-3 rounded-lg flex items-center justify-between">
                                            <div>
                                              <span className="text-muted-foreground text-xs block">كلمة مرور الخدمة:</span>
                                              <span className="font-semibold select-all">{selectedOrder.delivery[0].login_password}</span>
                                            </div>
                                            <Key className="w-4 h-4 text-emerald-600" />
                                          </div>
                                        )}

                                        {selectedOrder.delivery[0].activation_code && (
                                          <div className="bg-white border p-3 rounded-lg sm:col-span-2 flex items-center justify-between">
                                            <div>
                                              <span className="text-muted-foreground text-xs block">كود التفعيل:</span>
                                              <span className="font-mono font-semibold select-all">{selectedOrder.delivery[0].activation_code}</span>
                                            </div>
                                          </div>
                                        )}

                                        {selectedOrder.delivery[0].invite_link && (
                                          <div className="bg-white border p-3 rounded-lg sm:col-span-2 flex items-center justify-between">
                                            <div>
                                              <span className="text-muted-foreground text-xs block">رابط الدعوة:</span>
                                              <a 
                                                href={selectedOrder.delivery[0].invite_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="font-semibold text-accent hover:underline flex items-center gap-1"
                                              >
                                                اضغط لفتح رابط الاشتراك
                                                <ExternalLink className="w-3.5 h-3.5" />
                                              </a>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {selectedOrder.delivery[0].instructions && (
                                        <div className="bg-white border p-4 rounded-lg text-emerald-950 text-sm">
                                          <span className="text-muted-foreground text-xs block mb-1">تعليمات الاستخدام:</span>
                                          <p className="whitespace-pre-line leading-relaxed">{selectedOrder.delivery[0].instructions}</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : selectedOrder.status === 'completed' ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
                                      الطلب مكتمل ولكن لم يتم إرفاق تفاصيل تسليم. يرجى التواصل مع الدعم.
                                    </div>
                                  ) : (
                                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm flex gap-2">
                                      <Clock className="w-5 h-5 shrink-0 text-blue-600" />
                                      <span>سيتم إرفاق تفاصيل تسليم الحساب فور تفعيل واكتمال الطلب من قبل الإدارة.</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  لم تقم بأي طلبات بعد.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
