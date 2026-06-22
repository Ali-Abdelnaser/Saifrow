import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Search, Trash2, Eye, Calendar, User, MessageSquare, Loader2, ArrowLeft, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminContacts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ['admin_contact_messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_contact_messages'] });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف الرسالة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin_contact_messages'] });
    },
    onError: (err: any) => {
      console.error('Error deleting message:', err);
      toast.error('حدث خطأ أثناء حذف الرسالة');
    }
  });

  const handleOpenMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setIsViewOpen(true);
    if (!msg.is_read) {
      markAsReadMutation.mutate(msg.id);
    }
  };

  const handleDeleteMessage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.subject && msg.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'unread') return matchesSearch && !msg.is_read;
    if (statusFilter === 'read') return matchesSearch && msg.is_read;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">رسائل تواصل معنا</h1>
          <p className="text-muted-foreground text-sm">
            عرض وإدارة الرسائل والاستفسارات الواردة من عملاء المتجر.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto shrink-0 bg-muted p-1 rounded-lg">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="flex-1 md:flex-initial"
          >
            الكل ({messages.length})
          </Button>
          <Button
            variant={statusFilter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('unread')}
            className="flex-1 md:flex-initial text-amber-600 hover:text-amber-700"
          >
            غير مقروءة ({messages.filter(m => !m.is_read).length})
          </Button>
          <Button
            variant={statusFilter === 'read' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('read')}
            className="flex-1 md:flex-initial text-emerald-600 hover:text-emerald-700"
          >
            مقروءة ({messages.filter(m => m.is_read).length})
          </Button>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، البريد أو الموضوع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span>جاري تحميل الرسائل...</span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
              <Mail className="w-12 h-12 text-muted-foreground/55" />
              <h3 className="font-bold text-lg">لا توجد رسائل تواصل</h3>
              <p className="text-sm">لم يتم العثور على أي رسائل مطابقة للبحث أو الفلترة المحددة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px] text-right">المرسل</TableHead>
                    <TableHead className="w-[200px] text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الموضوع</TableHead>
                    <TableHead className="w-[150px] text-right">التاريخ</TableHead>
                    <TableHead className="w-[100px] text-center">الحالة</TableHead>
                    <TableHead className="w-[120px] text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((msg) => (
                    <TableRow 
                      key={msg.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${!msg.is_read ? 'font-semibold bg-blue-50/10' : ''}`}
                      onClick={() => handleOpenMessage(msg)}
                    >
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${msg.is_read ? 'bg-transparent' : 'bg-accent animate-pulse'}`} />
                          <span>{msg.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs select-all">{msg.email}</TableCell>
                      <TableCell className="text-right max-w-xs truncate">{msg.subject || 'بدون موضوع'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ar })}
                      </TableCell>
                      <TableCell className="text-center">
                        {msg.is_read ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">مقروءة</Badge>
                        ) : (
                          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">جديد</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary"
                            onClick={() => handleOpenMessage(msg)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-red-50 hover:text-destructive"
                            onClick={(e) => handleDeleteMessage(msg.id, e)}
                            title="حذف الرسالة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl text-right" dir="rtl">
          <DialogHeader className="text-right border-b pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              تفاصيل رسالة التواصل
            </DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6 py-4">
              {/* Sender Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">الاسم:</span>
                  <span className="font-semibold text-sm">{selectedMessage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">البريد:</span>
                  <span className="font-semibold text-sm font-mono select-all">{selectedMessage.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">التاريخ:</span>
                  <span className="text-sm">
                    {new Date(selectedMessage.created_at).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">الموضوع:</span>
                  <span className="font-semibold text-sm">{selectedMessage.subject || 'بدون موضوع'}</span>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground">محتوى الرسالة:</h4>
                <div className="bg-white border rounded-xl p-4 min-h-[120px] max-h-[250px] overflow-y-auto leading-relaxed text-sm whitespace-pre-wrap select-text">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Reply CTA */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsViewOpen(false)}
                >
                  <ArrowLeft className="w-4 h-4 ml-1.5" />
                  إغلاق
                </Button>

                <Button 
                  size="sm" 
                  asChild
                  className="gap-2"
                >
                  <a href={`mailto:${selectedMessage.email}?subject=رد على: ${selectedMessage.subject || 'استفسار Saifrow Store'}`}>
                    <Send className="w-4 h-4 rtl:rotate-180" />
                    الرد عبر البريد الإلكتروني
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
