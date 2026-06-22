import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PaymentProofPreviewProps {
  source: string;
  className?: string;
  imageClassName?: string;
}

export function PaymentProofPreview({
  source,
  className,
  imageClassName,
}: PaymentProofPreviewProps) {
  const isPublicUrl = /^https?:\/\//i.test(source);

  const { data: signedUrl } = useQuery({
    queryKey: ['payment-proof-signed-url', source],
    enabled: !!source && !isPublicUrl,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(source, 60 * 10);

      if (error) throw error;
      return data.signedUrl;
    },
  });

  const url = isPublicUrl ? source : signedUrl;

  if (!url) {
    return (
      <div className={className}>
        <div className="flex h-full min-h-24 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
          جاري تحميل الإيصال...
        </div>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      <img src={url} alt="إثبات الدفع" className={imageClassName} />
    </a>
  );
}
