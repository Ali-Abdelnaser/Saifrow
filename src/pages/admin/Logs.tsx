import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Loader2 } from 'lucide-react';

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
                    <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
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
