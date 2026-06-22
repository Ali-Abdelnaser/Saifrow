import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShieldCheck, UserCheck, Loader2 } from 'lucide-react';

export default function AdminTeam() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [role, setRole] = useState<string>('customer');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch all user profiles with administrative roles or regular roles
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['admin_team_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'super_admin',
  });

  const handleEditRole = (member: any) => {
    setSelectedUser(member);
    setRole(member.role || 'customer');
    setIsOpen(true);
  };

  // Change Role Mutation
  const changeRoleMutation = useMutation({
    mutationFn: async () => {
      if (profile?.role !== 'super_admin') {
        throw new Error('غير مصرح لك بتغيير الرتب');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: role as any, updated_at: new Date().toISOString() })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_team_list'] });
      toast.success('تم تحديث رتبة العضو بنجاح');
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء تغيير الرتبة');
    }
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
        <h1 className="text-3xl font-bold tracking-tight">إدارة الفريق والصلاحيات</h1>
        <p className="text-muted-foreground">تغيير رتب وصلاحيات المشرفين والموظفين في متجرك.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الرتبة الحالية</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-bold">{member.full_name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        member.role === 'super_admin' ? 'bg-red-50 text-red-700' :
                        member.role === 'orders_manager' ? 'bg-blue-50 text-blue-700' :
                        member.role === 'finance_member' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                      }>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Dialog open={isOpen && selectedUser?.id === member.id} onOpenChange={(open) => {
                        setIsOpen(open);
                        if (open) setSelectedUser(member);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEditRole(member)}>
                            <UserCheck className="w-4 h-4 ml-1.5" />
                            تغيير الصلاحيات
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-right">تغيير رتبة {selectedUser?.full_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4 text-right">
                            <div className="space-y-2">
                              <Label>الرتبة الجديدة</Label>
                              <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="customer">عميل (Customer)</SelectItem>
                                  <SelectItem value="super_admin">مدير كامل (Super Admin)</SelectItem>
                                  <SelectItem value="orders_manager">مدير الطلبات (Orders Manager)</SelectItem>
                                  <SelectItem value="finance_member">مدير الشؤون المالية (Finance Member)</SelectItem>
                                  <SelectItem value="content_manager">مدير المحتوى (Content Manager)</SelectItem>
                                  <SelectItem value="support_member">عضو الدعم (Support Member)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button onClick={() => changeRoleMutation.mutate()} className="w-full mt-4" disabled={changeRoleMutation.isPending}>
                              {changeRoleMutation.isPending ? 'جاري التعديل...' : 'تأكيد تغيير الصلاحية'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لا يوجد أعضاء في النظام.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
