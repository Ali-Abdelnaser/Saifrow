import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ImageUploadProps {
  bucketName: string;
  folderPath?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: any) => void;
  label?: string;
}

export function ImageUpload({
  bucketName,
  folderPath = '',
  onUploadSuccess,
  onUploadError,
  label = 'قم بتحميل صورة أو إيصال الدفع'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى هو 5 ميجابايت.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('الملف يجب أن يكون صورة فقط.');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onUploadSuccess(publicUrl);
      toast.success('تم رفع الصورة بنجاح');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('حدث خطأ أثناء رفع الصورة');
      if (onUploadError) onUploadError(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>
      
      {!previewUrl ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-accent/40 rounded-xl p-8 text-center cursor-pointer transition-all bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center min-h-[180px]"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
              <p className="text-sm font-medium">جاري رفع الصورة...</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-semibold mb-1">اضغط لرفع الملف</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (الحد الأقصى 5 ميجابايت)</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border bg-muted flex items-center justify-center min-h-[180px] p-2">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-[250px] rounded-lg object-contain" 
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-3 right-3 rounded-full shadow-md"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
