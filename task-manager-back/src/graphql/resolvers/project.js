const mapRole = (role) => {
  const roleMap = {
    'admin': 'ADMIN',
    'member': 'MEMBER',
    'viewer': 'VIEWER',
  };
  return roleMap[role] || role;
};

const mapRoleToDb = (role) => {
  const roleMap = {
    'ADMIN': 'admin',
    'MEMBER': 'member',
    'VIEWER': 'viewer',
  };
  return roleMap[role] || role.toLowerCase();
};

export const projectResolvers = {
  Query: {
    projects: async (_, { includeArchived = false }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return data;
    },

    project: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },

    projectMembers: async (_, { projectId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw new Error(error.message);
      return data.map(m => ({ ...m, role: mapRole(m.role) }));
    },
  },

  Mutation: {
    createProject: async (_, { name, description }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name,
          description,
          owner_id: user.id,
        }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },

    updateProject: async (_, args, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const updateData = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.is_archived !== undefined) updateData.is_archived = args.is_archived;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', args.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },

    deleteProject: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return true;
    },

    addProjectMember: async (_, { projectId, userId, role = 'MEMBER' }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          user_id: userId,
          role: mapRoleToDb(role),
        }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { ...data, role: mapRole(data.role) };
    },

    updateProjectMemberRole: async (_, { projectId, userId, role }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('project_members')
        .update({ role: mapRoleToDb(role) })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { ...data, role: mapRole(data.role) };
    },

    removeProjectMember: async (_, { projectId, userId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      
      if (error) throw new Error(error.message);
      return true;
    },
  },

  types: {
    Project: {
      owner: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', parent.owner_id)
          .single();
        
        if (error) return null;
        return data;
      },

      members: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', parent.id);
        
        if (error) return [];
        return data.map(m => ({ ...m, role: mapRole(m.role) }));
      },

      tasks: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', parent.id)
          .order('position', { ascending: true });
        
        if (error) return [];
        return data;
      },
    },

    ProjectMember: {
      project: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', parent.project_id)
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
        
        if (error) throw new Error(error.message);
        return data;
      },
    },
  },
};