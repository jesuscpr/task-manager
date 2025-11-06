const mapScope = (scope) => {
  const scopeMap = {
    'global': 'GLOBAL',
    'project': 'PROJECT',
    'user': 'USER',
  };
  return scopeMap[scope] || scope;
};

const mapScopeToDb = (scope) => {
  const scopeMap = {
    'GLOBAL': 'global',
    'PROJECT': 'project',
    'USER': 'user',
  };
  return scopeMap[scope] || scope?.toLowerCase();
};

export const labelResolvers = {
  Query: {
    labels: async (_, { projectId, scope }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      let query = supabase
        .from('labels')
        .select('*')
        .order('name', { ascending: true });

      if (scope) {
        query = query.eq('scope', mapScopeToDb(scope));
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return data.map(l => ({ ...l, scope: mapScope(l.scope) }));
    },

    label: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return { ...data, scope: mapScope(data.scope) };
    },

    myFavoriteLabels: async (_, __, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data: favorites } = await supabase
        .from('user_favorite_labels')
        .select('label_id')
        .eq('user_id', user.id);
      
      if (!favorites || favorites.length === 0) return [];

      const labelIds = favorites.map(f => f.label_id);

      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .in('id', labelIds);
      
      if (error) throw new Error(error.message);
      return data.map(l => ({ ...l, scope: mapScope(l.scope) }));
    },
  },

  Mutation: {
    createLabel: async (_, { name, color, scope, projectId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const insertData = {
        name,
        color,
        scope: mapScopeToDb(scope),
      };

      if (scope === 'USER') {
        insertData.creator_id = user.id;
      } else if (scope === 'PROJECT') {
        if (!projectId) throw new Error('projectId es requerido para etiquetas de proyecto');
        insertData.project_id = projectId;
      }

      const { data, error } = await supabase
        .from('labels')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { ...data, scope: mapScope(data.scope) };
    },

    updateLabel: async (_, { id, name, color }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (color !== undefined) updateData.color = color;

      const { data, error } = await supabase
        .from('labels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { ...data, scope: mapScope(data.scope) };
    },

    deleteLabel: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return true;
    },

    addLabelToTask: async (_, { taskId, labelId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('task_labels')
        .insert([{
          task_id: taskId,
          label_id: labelId,
        }]);
      
      if (error) throw new Error(error.message);

      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      return task;
    },

    removeLabelFromTask: async (_, { taskId, labelId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('task_labels')
        .delete()
        .eq('task_id', taskId)
        .eq('label_id', labelId);
      
      if (error) throw new Error(error.message);

      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      return task;
    },

    addFavoriteLabel: async (_, { labelId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('user_favorite_labels')
        .insert([{
          user_id: user.id,
          label_id: labelId,
        }]);
      
      if (error) throw new Error(error.message);
      return true;
    },

    removeFavoriteLabel: async (_, { labelId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('user_favorite_labels')
        .delete()
        .eq('user_id', user.id)
        .eq('label_id', labelId);
      
      if (error) throw new Error(error.message);
      return true;
    },
  },

  types: {
    Label: {
      creator: async (parent, _, { supabase }) => {
        if (!parent.creator_id) return null;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', parent.creator_id)
          .single();
        
        if (error) return null;
        return data;
      },

      project: async (parent, _, { supabase }) => {
        if (!parent.project_id) return null;
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', parent.project_id)
          .single();
        
        if (error) return null;
        return data;
      },
    },
  },
};