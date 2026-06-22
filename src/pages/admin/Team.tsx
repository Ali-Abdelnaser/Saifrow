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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ShieldCheck, UserCheck, Loader2, Plus, Search, UserMinus, ShieldAlert } from 'lucide-react';
import type { AppRole } from '@/types/database';

export default function AdminTeam() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Edit Role Modal States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [role, setRole] = useState<AppRole>('customer');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Add Member Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [addRole, setAddRole] = useState<AppRole>('orders_manager');

  // Fetch all administrative team members (non-customers)
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['admin_team_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'customer')
        .order('role', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'super_admin',
  });

  // Search User by Email Mutation
  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني للبحث');
      return;
    }
    setIsSearching(true);
    setFoundUser(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', searchEmail.trim())
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('لم يتم العثور على أي حساب مسجل بهذا البريد الإلكتروني');
        } else {
          throw error;
        }
      } else {
        setFoundUser(data);
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء البحث');
    } finally {
      setIsSearching(false);
    }
  };

  // Change Role Mutation (Used for both editing and adding)
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      if (profile?.role !== 'super_admin') {
        throw new Error('غير مصرح لك بتغيير صلاحيات الفريق');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_team_list'] });
      toast.success('تم تحديث صلاحيات العضو بنجاح');
      setIsEditOpen(false);
      setIsAddOpen(false);
      setFoundUser(null);
      setSearchEmail('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء تغيير الصلاحيات');
    }
  });

  const handleEditRole = (member: any) => {
    setSelectedUser(member);
    setRole(member.role || 'customer');
    setIsEditOpen(true);
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">مدير عام (Super Admin)</Badge>;
      case 'orders_manager':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">مدير الطلبات (Orders)</Badge>;
      case 'finance_member':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">المسؤول المالي (Finance)</Badge>;
      case 'content_manager':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">مدير المحتوى (Content)</Badge>;
      case 'support_member':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">الدعم الفني (Support)</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">عميل (Customer)</Badge>;
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الفريق والصلاحيات</h1>
          <p className="text-muted-foreground">إضافة موظفين جدد وتحديد صلاحيات الوصول إلى لوحة التحكم.</p>
        </div>

        {/* Add Team Member Dialog */}
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setFoundUser(null);
            setSearchEmail('');
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة عضو جديد للفريق
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة عضو للفريق</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4 text-right">
              {/* Search User Input */}
              <div className="space-y-2">
                <Label htmlFor="search-email">ابحث عن حساب العضو بالبريد الإلكتروني</Label>
                <div className="flex gap-2">
                  <Input 
                    id="search-email"
                    type="email"
                    placeholder="name@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    dir="ltr"
                    className="text-left rtl:text-right"
                  />
                  <Button onClick={searchUser} disabled={isSearching}>
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Show Search Result */}
              {foundUser ? (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">العضو الذي تم العثور عليه:</span>
                    <h4 className="font-bold text-base">{foundUser.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                    <div className="pt-1">
                      <span className="text-xs">الرتبة الحالية: </span>
                      {getRoleBadge(foundUser.role)}
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="add-role">تعيين الصلاحية الجديدة في الفريق</Label>
                    <Select value={addRole} onValueChange={(value) => setAddRole(value as AppRole)}>
                      <SelectTrigger id="add-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orders_manager">مدير الطلبات (Orders Manager)</SelectItem>
                        <SelectItem value="finance_member">مدير الشؤون المالية (Finance Member)</SelectItem>
                        <SelectItem value="content_manager">مدير المحتوى (Content Manager)</SelectItem>
                        <SelectItem value="support_member">عضو الدعم (Support Member)</SelectItem>
                        <SelectItem value="super_admin">مدير عام كامل (Super Admin)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={() => changeRoleMutation.mutate({ userId: foundUser.id, newRole: addRole })} 
                    className="w-full"
                    disabled={changeRoleMutation.isPending}
                  >
                    {changeRoleMutation.isPending ? 'جاري تعيين الصلاحية...' : 'إضافة للفريق وتفعيل الصلاحية'}
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground text-sm space-y-2">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                  <p className="font-semibold text-foreground">الموظف يجب أن يمتلك حساباً في الموقع أولاً</p>
                  <p className="text-xs">
                    اطلب من الموظف إنشاء حساب كعميل عادي في الموقع أولاً باستخدام بريده الإلكتروني، ثم ابحث عنه هنا لترقية صلاحياته للفريق.
                  </p>
                </div>
              )}
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
          ) : teamMembers && teamMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-bold">{member.full_name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEditRole(member)}>
                        <UserCheck className="w-4 h-4 ml-1.5" />
                        تعديل الصلاحية
                      </Button>
                      {member.id !== profile.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من إزالة ${member.full_name} من فريق العمل وإعادته لعميل عادي؟`)) {
                              changeRoleMutation.mutate({ userId: member.id, newRole: 'customer' });
                            }
                          }}
                        >
                          <UserMinus className="w-4 h-4 ml-1" />
                          إزالة من الفريق
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد حسابات إدارية للفريق حالياً.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل رتبة {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div className="space-y-2">
              <Label htmlFor="edit-role">الرتبة الجديدة</Label>
              <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">إرجاع لعميل عادي (Customer)</SelectItem>
                  <SelectItem value="super_admin">مدير عام كامل (Super Admin)</SelectItem>
                  <SelectItem value="orders_manager">مدير الطلبات (Orders Manager)</SelectItem>
                  <SelectItem value="finance_member">مدير الشؤون المالية (Finance Member)</SelectItem>
                  <SelectItem value="content_manager">مدير المحتوى (Content Manager)</SelectItem>
                  <SelectItem value="support_member">عضو الدعم (Support Member)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => changeRoleMutation.mutate({ userId: selectedUser.id, newRole: role })} 
              className="w-full mt-4" 
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? 'جاري التعديل...' : 'تأكيد تغيير الصلاحية'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
