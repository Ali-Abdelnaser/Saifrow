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

export default function AdminLogs() {
  const { profile } = useAuth();

  // Fetch admin logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin_activity_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_logs')
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
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-bold">{log.admin_email || 'نظام تلقائي'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action_type}</Badge>
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>{log.entity_id || '-'}</span>
                        {(log.old_data || log.new_data) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="ml-1 h-3.5 w-3.5" />
                                عرض
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-right">تفاصيل سجل النشاط</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <h3 className="mb-2 text-sm font-bold">قبل التعديل</h3>
                                  <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-left text-xs" dir="ltr">
                                    {formatLogJson(log.old_data || {})}
                                  </pre>
                                </div>
                                <div>
                                  <h3 className="mb-2 text-sm font-bold">بعد التعديل</h3>
                                  <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-left text-xs" dir="ltr">
                                    {formatLogJson(log.new_data || {})}
                                  </pre>
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
                ))}
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
