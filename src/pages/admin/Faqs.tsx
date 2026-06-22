import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';

export default function AdminFaqs() {
  const queryClient = useQueryClient();
  const [selectedFaq, setSelectedFaq] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [serviceId, setServiceId] = useState<string>('all');
  const [isActive, setIsActive] = useState(true);

  // Fetch FAQs
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['admin_faqs_crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*, service:services(name)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch Services for FAQ binding
  const { data: services } = useQuery({
    queryKey: ['admin_services_faq_crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setSelectedFaq(null);
    setQuestion('');
    setAnswer('');
    setServiceId('all');
    setIsActive(true);
  };

  const handleEdit = (faq: any) => {
    setSelectedFaq(faq);
    setQuestion(faq.question || '');
    setAnswer(faq.answer || '');
    setServiceId(faq.service_id || 'all');
    setIsActive(faq.is_active);
    setIsOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        question,
        answer,
        service_id: serviceId === 'all' ? null : serviceId,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (selectedFaq) {
        const { error } = await supabase
          .from('faqs')
          .update(payload)
          .eq('id', selectedFaq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert([{ ...payload, sort_order: 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_faqs_crud'] });
      toast.success('تم حفظ السؤال بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء الحفظ');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_faqs_crud'] });
      toast.success('تم حذف السؤال بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل حذف السؤال.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الأسئلة الشائعة</h1>
          <p className="text-muted-foreground">إدارة الأسئلة الشائعة المعروضة على المتجر وعبر صفحات الخدمات.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة سؤال جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedFaq ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
              
              <div className="space-y-2">
                <Label htmlFor="question">السؤال *</Label>
                <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">الإجابة *</Label>
                <Textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required rows={4} />
              </div>

              <div className="space-y-2">
                <Label>الخدمة المرتبطة (اختياري)</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر خدمة أو عام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">عام (غير مرتبط بخدمة معينة)</SelectItem>
                    {services?.map((srv) => (
                      <SelectItem key={srv.id} value={srv.id}>{srv.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">نشط ومفعل</Label>
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full mt-4"
                disabled={saveMutation.isPending || !question || !answer}
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ السؤال'}
              </Button>

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
          ) : faqs && faqs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">السؤال</TableHead>
                  <TableHead className="text-right">الخدمة المرتبطة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-bold max-w-sm truncate">{faq.question}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {faq.service?.name || 'عام'}
                    </TableCell>
                    <TableCell>
                      {faq.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">نشط</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(faq)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
                          deleteMutation.mutate(faq.id);
                        }
                      }}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد أسئلة شائعة حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
