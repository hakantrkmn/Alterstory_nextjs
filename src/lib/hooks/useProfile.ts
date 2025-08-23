import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

const supabase = createClient()

// Profile fetch fonksiyonu
const fetchProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Profile not found')
  }

  return data
}

// Profile update fonksiyonu
const updateProfile = async ({ userId, updates }: { userId: string; updates: Partial<Profile> }): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Profile not found')
  }

  return data
}

// Profile hook'u - her mount'ta cache'i yenile
export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId, // Sadece userId varsa çalış
    staleTime: 0, // Her zaman stale kabul et (cache'i yenile)
    gcTime: 5 * 60 * 1000, // 5 dakika cache'de tut
    retry: 1,
    retryDelay: 1000,
    refetchOnMount: true, // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  })
}

// Profile update hook'u - cache'i otomatik güncelle
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async ({ userId, updates }) => {
      // Optimistic update - cache'i hemen güncelle
      const previousProfile = queryClient.getQueryData(['profile', userId])
      
      if (previousProfile) {
        queryClient.setQueryData(['profile', userId], {
          ...previousProfile,
          ...updates,
        })
      }

      return { previousProfile }
    },
    onSuccess: (data, variables) => {
      // Cache'i güncelle
      queryClient.setQueryData(['profile', variables.userId], data)
      
      // İlgili query'leri invalidate et
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.userId],
      })
    },
    onError: (error, variables, context) => {
      // Hata durumunda önceki cache'i geri yükle
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', variables.userId], context.previousProfile)
      }
      console.error('Profile update error:', error)
    },
  })
}

// Profile refresh hook'u - cache'i zorla yenile
export function useRefreshProfile() {
  const queryClient = useQueryClient()

  return {
    refreshProfile: async (userId: string) => {
      // Cache'i temizle ve yeni veri çek
      await queryClient.invalidateQueries({
        queryKey: ['profile', userId],
      })
      
      // Yeni veriyi fetch et
      await queryClient.refetchQueries({
        queryKey: ['profile', userId],
      })
    },
  }
}

// Profile cache invalidation hook'u
export function useInvalidateProfile() {
  const queryClient = useQueryClient()

  return {
    invalidateProfile: (userId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['profile', userId],
      })
    },
  }
}
