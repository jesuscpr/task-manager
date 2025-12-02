import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  // Inicializar sesión al cargar la app
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user || null, loading: false })

      // Escuchar cambios en la autenticación
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user || null })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    }
  },

  // Cerrar sesión
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))