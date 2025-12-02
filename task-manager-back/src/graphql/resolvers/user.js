export const userResolvers = {
  Query: {
    me: async (_, __, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        // Si no existe el perfil, crearlo con datos básicos
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            username: null,
            full_name: null,
          }])
          .select()
          .single();

        if (createError) throw new Error(createError.message);
        return newProfile;
      }
      
      return data;
    },

    user: async (_, { id }, { supabase }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      
      // Obtener email si es necesario
      return data;
    },

    searchUsers: async (_, { query }, { supabase }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw new Error(error.message);
      return data;
    },
  },

  Mutation: {
    signUp: async (_, { email, password, username, full_name }, { supabase }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name,
          },
        },
      });

      if (error) throw new Error(error.message);
      
      // Manejar ambos casos: con y sin confirmación de email
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: username || null,
          full_name: full_name || null,
          avatar_url: null,
          bio: null,
          created_at: data.user.created_at,
          updated_at: data.user.created_at,
        },
        access_token: data.session?.access_token || null,
        refresh_token: data.session?.refresh_token || null,
        email_confirmation_required: !data.session,
      };
    },

    signIn: async (_, { email, password }, { supabase }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message);

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile?.username || null,
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          bio: profile?.bio || null,
          created_at: profile?.created_at || data.user.created_at,
          updated_at: profile?.updated_at || data.user.updated_at,
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    },

    signOut: async (_, __, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      
      return true;
    },

    updateProfile: async (_, args, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const updateData = {};
      if (args.username !== undefined) updateData.username = args.username;
      if (args.full_name !== undefined) updateData.full_name = args.full_name;
      if (args.avatar_url !== undefined) updateData.avatar_url = args.avatar_url;
      if (args.bio !== undefined) updateData.bio = args.bio;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { ...data, email: user.email };
    },
  },

  types: {},
};