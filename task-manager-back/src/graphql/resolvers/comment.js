export const commentResolvers = {
  Query: {
    comments: async (_, { taskId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      
      if (error) throw new Error(error.message);
      return data;
    },

    comment: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
  },

  Mutation: {
    createComment: async (_, { taskId, content }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          content,
        }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },

    updateComment: async (_, { id, content }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },

    deleteComment: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return true;
    },
  },

  types: {
    Comment: {
      task: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', parent.task_id)
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      },

      user: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', parent.user_id)
          .single();
        
        if (error) return null;
        return data;
      },
    },
  },
};