import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useAuth() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session?.user || null;
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['auth', 'profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
  });

  return {
    user,
    profile,
    isLoading: isLoadingUser || isLoadingProfile,
    isAuthenticated: !!user,
  };
}
