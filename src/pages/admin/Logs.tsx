import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShieldCheck, Loader2, Eye } from 'lucide-react';

const sensitiveLogKeys = new Set([
  'login_email',
  'login_password',
  'activation_code',
  'invite_link',
  'instructions',
  'custom_fields',
  'delivery_details',
]);

function redactSensitiveLogData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveLogData);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveLogKeys.has(key) ? '[مخفي]' : redactSensitiveLogData(nestedValue),
      ]),
    );
  }

  return value;
}

function formatLogJson(value: unknown) {
  return JSON.stringify(redactSensitiveLogData(value), null, 2);
}

import type { Database } from '@/types/database';

type LogRow = Database['public']['Views']['enriched_admin_activity_logs']['Row'];

interface LogDataPayload {
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
  total?: number;
  name?: string;
  code?: string;
  question?: string;
}

function getActionTypeName(action: string): string {
  switch (action) {
    case 'approve_payment_and_complete_order':
      return 'قبول دفع وتوصيل';
    case 'reject_payment_proof':
      return 'رفض إثبات دفع';
    case 'delete_order':
      return 'حذف نهائي لـ';
    case 'INSERT':
      return 'إضافة';
    case 'UPDATE':
      return 'تعديل';
    case 'DELETE':
      return 'حذف';
    default:
      return action;
  }
}

function getFriendlyEntityName(entity: string): string {
  switch (entity) {
    case 'orders':
      return 'الطلبات';
    case 'services':
      return 'الخدمات';
    case 'categories':
      return 'التصنيفات';
    case 'coupons':
      return 'الكوبونات';
    case 'faqs':
      return 'الأسئلة الشائعة';
    case 'site_settings':
      return 'إعدادات الموقع';
    case 'payment_methods':
      return 'طرق الدفع';
    case 'profiles':
      return 'الملفات الشخصية';
    default:
      return entity;
  }
}

function getFriendlyActionDescription(log: LogRow): string {
  let details = '';
  const oldData = log.old_data as LogDataPayload | null;
  const newData = log.new_data as LogDataPayload | null;
  
  if (log.entity_type === 'orders') {
    const orderNum = log.order_number || oldData?.order_number || newData?.order_number;
    const customerName = log.customer_name || oldData?.customer_name || newData?.customer_name;
    details = orderNum 
      ? `الطلب #${orderNum} ${customerName ? `(للعميل: ${customerName})` : ''}` 
      : `طلب (معرف: ${log.entity_id})`;
  } else if (log.entity_type === 'services') {
    const serviceName = newData?.name || oldData?.name;
    details = serviceName ? `الخدمة "${serviceName}"` : `خدمة (معرف: ${log.entity_id})`;
  } else if (log.entity_type === 'categories') {
    const catName = newData?.name || oldData?.name;
    details = catName ? `التصنيف "${catName}"` : `التصنيف (معرف: ${log.entity_id})`;
  } else if (log.entity_type === 'coupons') {
    const couponCode = newData?.code || oldData?.code;
    details = couponCode ? `الكوبون "${couponCode}"` : `كوبون (معرف: ${log.entity_id})`;
  } else if (log.entity_type === 'faqs') {
    const faqQ = newData?.question || oldData?.question;
    details = faqQ ? `السؤال الشائع "${faqQ.substring(0, 30)}..."` : `سؤال شائع (معرف: ${log.entity_id})`;
  } else {
    details = `${log.entity_type} (معرف: ${log.entity_id})`;
  }

  const actionName = getActionTypeName(log.action_type);
  return `${actionName} ${details}`;
}

export default function AdminLogs() {
  const { profile } = useAuth();

  // Fetch admin logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin_activity_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enriched_admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'super_admin',
  });

  if (profile?.role !== 'super_admin') {
    return (
      <div className="container py-20 text-center text-destructive font-bold flex flex-col items-center gap-2">
        <ShieldCheck className="w-16 h-16" />
        <h2>عذراً، هذه الصفحة مخصصة لمالك الموقع (Super Admin) فقط!</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجلات النشاط (Audit Logs)</h1>
        <p className="text-muted-foreground">تتبع نشاطات المشرفين والعمليات الحساسة في لوحة التحكم.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المشرف</TableHead>
                  <TableHead className="text-right">العملية</TableHead>
                  <TableHead className="text-right">العنصر</TableHead>
                  <TableHead className="text-right">التفاصيل / المعرف</TableHead>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const oldData = log.old_data as LogDataPayload | null;
                  const newData = log.new_data as LogDataPayload | null;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-bold text-sm">{log.admin_name || 'نظام تلقائي'}</p>
                          {log.admin_email && <p className="text-xs text-muted-foreground">{log.admin_email}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {getFriendlyActionDescription(log)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-accent border-blue-100">
                          {getFriendlyEntityName(log.entity_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{log.entity_id ? `${log.entity_id.substring(0, 8)}...` : '-'}</span>
                          {(log.old_data || log.new_data) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="ml-1 h-3.5 w-3.5" />
                                  التفاصيل
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-right text-lg font-bold">تفاصيل سجل النشاط</DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-6 py-4 text-right" dir="rtl">
                                  {/* Summary Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-b pb-4">
                                    <div>
                                      <span className="text-muted-foreground block mb-1 text-xs">المشرف المسؤول:</span>
                                      <span className="font-bold text-foreground">{log.admin_name || 'نظام تلقائي'}</span>
                                      {log.admin_email && <span className="text-[10px] text-muted-foreground block font-mono">{log.admin_email}</span>}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block mb-1 text-xs">نوع العملية:</span>
                                      <span className="font-semibold text-accent">{getActionTypeName(log.action_type)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block mb-1 text-xs">تاريخ العملية:</span>
                                      <span className="text-foreground">{new Date(log.created_at).toLocaleString('ar-EG')}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block mb-1 text-xs">نوع العنصر:</span>
                                      <span className="text-foreground">{getFriendlyEntityName(log.entity_type)}</span>
                                    </div>
                                  </div>

                                  {/* Order details card if available */}
                                  {(log.order_number || oldData?.order_number || newData?.order_number) && (
                                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
                                      <h4 className="font-bold text-sm text-blue-900">بيانات الطلب المرتبط:</h4>
                                      <div className="grid grid-cols-2 gap-4 text-xs text-blue-900/80">
                                        <div>
                                          <span className="text-muted-foreground">رقم الطلب: </span>
                                          <span className="font-bold text-foreground">{log.order_number || oldData?.order_number || newData?.order_number}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">العميل: </span>
                                          <span className="font-semibold text-foreground">{log.customer_name || oldData?.customer_name || newData?.customer_name}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">البريد الإلكتروني للعميل: </span>
                                          <span className="font-mono text-foreground">{log.customer_email || oldData?.customer_email || newData?.customer_email}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">إجمالي المبلغ: </span>
                                          <span className="font-bold text-foreground">{log.order_total || oldData?.total || newData?.total || '-'} ج.م</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Raw changes */}
                                  <div className="grid gap-4 md:grid-cols-2 pt-2">
                                    <div>
                                      <h3 className="mb-2 text-sm font-bold text-muted-foreground">البيانات السابقة (قبل التعديل)</h3>
                                      <pre className="max-h-60 overflow-auto rounded-lg bg-muted p-3 text-left text-xs font-mono" dir="ltr">
                                        {formatLogJson(log.old_data || {})}
                                      </pre>
                                    </div>
                                    <div>
                                      <h3 className="mb-2 text-sm font-bold text-muted-foreground">البيانات الجديدة (بعد التعديل)</h3>
                                      <pre className="max-h-60 overflow-auto rounded-lg bg-muted p-3 text-left text-xs font-mono" dir="ltr">
                                        {formatLogJson(log.new_data || {})}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(log.created_at).toLocaleString('ar-EG')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد سجلات نشاط حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
