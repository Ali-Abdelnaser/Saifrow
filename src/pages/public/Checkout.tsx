import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, CreditCard, User, Mail, Phone, FileText, Check } from 'lucide-react';

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [note, setNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  
  // Checkout flow steps: 'details' -> 'payment' -> 'success'
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');

  // Fetch plan and service details
  const { data: plan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_plans')
        .select('*, service:services(*)')
        .eq('id', planId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!planId,
  });

  // Fetch active payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment_methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Apply Coupon Mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();
      
      if (error) throw new Error('الكوبون غير صالح أو انتهت صلاحيته');

      const coupon = data as unknown as Database['public']['Tables']['coupons']['Row'];

      // Check dates
      const now = new Date().toISOString();
      if (coupon.starts_at && coupon.starts_at > now) throw new Error('الكوبون لم يبدأ بعد');
      if (coupon.ends_at && coupon.ends_at < now) throw new Error('الكوبون منتهي الصلاحية');
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new Error('تم استهلاك الكوبون بالكامل');

      return coupon;
    },
    onSuccess: (data) => {
      setActiveCoupon(data);
      toast.success('تم تطبيق الكوبون بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ في تطبيق الكوبون');
    }
  });

  // Calculate prices
  const basePrice = plan?.price || 0;
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discount_type === 'percentage') {
      discountAmount = (basePrice * activeCoupon.discount_value) / 100;
    } else {
      discountAmount = activeCoupon.discount_value;
    }
  }
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Submit Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!fullName || !email || !paymentMethodId) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة واختيار طريقة الدفع');
      }

      // We call the Supabase RPC function create_order
      const { data: orderId, error } = await supabase.rpc('create_order', {
        p_plan_id: planId!,
        p_customer_name: fullName,
        p_customer_email: email,
        p_customer_phone: phone || undefined,
        p_coupon_code: activeCoupon?.code || undefined,
        p_customer_note: note || undefined
      });

      if (error) throw error;
      return orderId;
    },
    onSuccess: async (orderId) => {
      // Fetch the created order number to show user
      const { data: order } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single();
      
      setCreatedOrderId(orderId);
      if (order) setCreatedOrderNumber(order.order_number);
      setStep('payment');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل إنشاء الطلب');
    }
  });

  // Submit Payment Proof Mutation
  const submitProofMutation = useMutation({
    mutationFn: async () => {
      if (!proofUrl) throw new Error('يرجى تحميل صورة إيصال التحويل');
      
      const { data, error } = await supabase.rpc('submit_payment_proof', {
        p_order_id: createdOrderId,
        p_payment_method_id: paymentMethodId,
        p_amount: finalPrice,
        p_screenshot_url: proofUrl,
        p_customer_note: note || undefined
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setStep('success');
      toast.success('تم إرسال إثبات الدفع بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء إرسال إثبات الدفع');
    }
  });

  if (isLoadingPlan) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!plan || plan.stock_quantity <= 0) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 text-destructive">الباقة غير متوفرة</h2>
        <p className="text-muted-foreground">عذراً، هذه الباقة نفذت من المخزون أو غير متوفرة حالياً.</p>
        <Button onClick={() => navigate('/services')} className="mt-6">تصفح الخدمات الأخرى</Button>
      </div>
    );
  }

  const selectedPaymentMethod = paymentMethods?.find(m => m.id === paymentMethodId);

  return (
    <div className="container py-12 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          {step === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">معلومات المشتري والطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Customer Info Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      الاسم بالكامل <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="الاسم الثلاثي أو الثنائي"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      البريد الإلكتروني <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left rtl:text-right"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      رقم الهاتف / الواتساب <span className="text-xs text-muted-foreground">(اختياري)</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      dir="ltr"
                      className="text-left rtl:text-right"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="note" className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      ملاحظات إضافية للطلب <span className="text-xs text-muted-foreground">(اختياري)</span>
                    </Label>
                    <Textarea
                      id="note"
                      placeholder="أي ملاحظات تود إضافتها للطلب..."
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>

                <hr className="my-6" />

                {/* Choose Payment Method */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-accent" />
                    اختر طريقة الدفع
                  </h3>
                  {paymentMethods && paymentMethods.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id}
                          onClick={() => setPaymentMethodId(method.id)}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between ${
                            paymentMethodId === method.id 
                              ? 'border-accent bg-blue-50/20' 
                              : 'border-border hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{method.method_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">دفع يدوي مباشر</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            paymentMethodId === method.id 
                              ? 'border-accent bg-accent text-white' 
                              : 'border-gray-300'
                          }`}>
                            {paymentMethodId === method.id && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">لا تتوفر طرق دفع حالياً.</p>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => createOrderMutation.mutate()} 
                    className="w-full text-md h-12"
                    disabled={createOrderMutation.isPending || !paymentMethodId || !fullName || !email}
                  >
                    {createOrderMutation.isPending ? 'جاري معالجة الطلب...' : 'تأكيد الطلب والمتابعة للدفع'}
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">تعليمات الدفع وإثبات التحويل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Payment Method Details & Instructions */}
                {selectedPaymentMethod && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 space-y-4 text-sm">
                    <h3 className="font-bold text-accent text-base">طريقة تحويل الأموال:</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPaymentMethod.phone_number && (
                        <div>
                          <span className="text-muted-foreground block text-xs">رقم الهاتف:</span>
                          <span className="font-semibold text-lg select-all">{selectedPaymentMethod.phone_number}</span>
                        </div>
                      )}
                      
                      {selectedPaymentMethod.instapay_handle && (
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            {selectedPaymentMethod.type === 'binance' ? 'معرف بايننس (Binance Pay ID):' : 'عنوان InstaPay:'}
                          </span>
                          <span className="font-semibold text-lg select-all">{selectedPaymentMethod.instapay_handle}</span>
                        </div>
                      )}
                      
                      {selectedPaymentMethod.account_name && (
                        <div>
                          <span className="text-muted-foreground block text-xs">اسم الحساب:</span>
                          <span className="font-semibold">{selectedPaymentMethod.account_name}</span>
                        </div>
                      )}

                      {selectedPaymentMethod.bank_account && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground block text-xs">
                            {selectedPaymentMethod.type === 'credit_card' ? 'رقم البطاقة / الحساب البنكي:' : 'الحساب البنكي / رقم الآيبان IBAN:'}
                          </span>
                          <span className="font-mono font-semibold select-all">{selectedPaymentMethod.bank_account}</span>
                        </div>
                      )}
                    </div>

                    {selectedPaymentMethod.instructions && (
                      <div className="border-t pt-4">
                        <span className="text-muted-foreground block text-xs mb-1">تعليمات التحويل:</span>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                          {selectedPaymentMethod.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="border border-amber-200 bg-amber-50/30 text-amber-800 rounded-xl p-4 flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                  <p>
                    يرجى تحويل المبلغ الإجمالي للطلب <strong>({finalPrice} ج.م)</strong> إلى الحساب الموضح أعلاه، ثم التقاط لقطة شاشة للإيصال ورفعها بالأسفل لتأكيد عملية الدفع وتفعيل الخدمة.
                  </p>
                </div>

                {/* Upload Screenshot */}
                <ImageUpload
                  bucketName="payment-proofs"
                  folderPath={`${user?.id}/${createdOrderId}`}
                  onUploadSuccess={setProofUrl}
                  label="صورة أو لقطة شاشة لإيصال التحويل (مطلوب)"
                />

                <div className="flex gap-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('details')}
                    disabled={submitProofMutation.isPending}
                  >
                    تعديل البيانات
                  </Button>
                  <Button 
                    onClick={() => submitProofMutation.mutate()} 
                    className="flex-1 text-md h-12"
                    disabled={submitProofMutation.isPending || !proofUrl}
                  >
                    {submitProofMutation.isPending ? 'جاري التحقق...' : 'إرسال إثبات الدفع'}
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {step === 'success' && (
            <Card className="text-center py-12 px-6">
              <CardContent className="space-y-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold">تم تقديم طلبك بنجاح!</h2>
                
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  شكراً لتسوقك من Saifrow Store. رقم طلبك هو <strong className="text-primary">#{createdOrderNumber}</strong>. لقد تم إرسال إثبات الدفع لمراجعته من قبل الإدارة وسوف نقوم بتفعيل حسابك وإرسال تفاصيل التفعيل في أقرب وقت.
                </p>

                <div className="bg-muted p-4 rounded-xl max-w-sm w-full text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">حالة الطلب:</span>
                    <Badge variant="outline" className="bg-amber-100/50 text-amber-700 hover:bg-amber-100/50">بانتظار مراجعة الدفع</Badge>
                  </div>
                  <div className="flex justify-between py-1 border-t mt-2 pt-2">
                    <span className="text-muted-foreground">الخدمة المشتركة:</span>
                    <span className="font-bold">{plan.service?.name} - {plan.name}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm pt-6">
                  <Button asChild className="flex-1">
                    <Link to="/profile">متابعة حالة الطلب</Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/">العودة للرئيسية</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg font-bold">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Info */}
              <div className="flex gap-4">
                {plan.service?.logo_url && (
                  <div className="w-16 h-16 rounded-lg bg-white p-2 border shrink-0 flex items-center justify-center">
                    <img src={plan.service.logo_url} alt={plan.service.name} className="max-h-full object-contain" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm leading-tight">{plan.service?.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.name}</p>
                  {plan.duration_label && (
                    <Badge variant="secondary" className="mt-2 text-xs">{plan.duration_label}</Badge>
                  )}
                </div>
              </div>

              <hr />

              {/* Coupon Box */}
              {step === 'details' && (
                <div className="space-y-2">
                  <Label htmlFor="coupon">كوبون الخصم</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="أدخل رمز الكوبون"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={applyCouponMutation.isPending || !!activeCoupon}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => applyCouponMutation.mutate(couponCode)}
                      disabled={!couponCode || applyCouponMutation.isPending || !!activeCoupon}
                    >
                      تطبيق
                    </Button>
                  </div>
                  {activeCoupon && (
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <span>✓ تم تطبيق الكوبون بنجاح</span>
                    </p>
                  )}
                </div>
              )}

              <hr />

              {/* Price Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر الباقة:</span>
                  <span>{basePrice} ج.م</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>خصم الكوبون:</span>
                    <span>-{discountAmount} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-3">
                  <span>المبلغ الإجمالي:</span>
                  <span>{finalPrice} ج.م</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
