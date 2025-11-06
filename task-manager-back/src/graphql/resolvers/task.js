const mapStatus = (status) => {
  const statusMap = {
    'todo': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'done': 'DONE',
  };
  return statusMap[status] || status;
};

const mapStatusToDb = (status) => {
  const statusMap = {
    'TODO': 'todo',
    'IN_PROGRESS': 'in_progress',
    'DONE': 'done',
  };
  return statusMap[status] || status?.toLowerCase();
};

const mapPriority = (priority) => {
  const priorityMap = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'urgent': 'URGENT',
  };
  return priorityMap[priority] || priority;
};

const mapPriorityToDb = (priority) => {
  const priorityMap = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent',
  };
  return priorityMap[priority] || priority?.toLowerCase();
};

export const taskResolvers = {
  Query: {
    tasks: async (_, { projectId, filter }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (filter) {
        if (filter.status) {
          query = query.eq('status', mapStatusToDb(filter.status));
        }
        if (filter.priority) {
          query = query.eq('priority', mapPriorityToDb(filter.priority));
        }
        if (filter.created_by_me) {
          query = query.eq('creator_id', user.id);
        }
      }

      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      
      let tasks = data.map(t => ({
        ...t,
        status: mapStatus(t.status),
        priority: mapPriority(t.priority),
      }));

      if (filter?.assigned_to_me) {
        const taskIds = tasks.map(t => t.id);
        const { data: assignments } = await supabase
          .from('task_assignments')
          .select('task_id')
          .in('task_id', taskIds)
          .eq('user_id', user.id);
        
        const assignedTaskIds = new Set(assignments?.map(a => a.task_id) || []);
        tasks = tasks.filter(t => assignedTaskIds.has(t.id));
      }

      if (filter?.has_label) {
        const taskIds = tasks.map(t => t.id);
        const { data: taskLabels } = await supabase
          .from('task_labels')
          .select('task_id')
          .in('task_id', taskIds)
          .eq('label_id', filter.has_label);
        
        const labeledTaskIds = new Set(taskLabels?.map(tl => tl.task_id) || []);
        tasks = tasks.filter(t => labeledTaskIds.has(t.id));
      }

      return tasks;
    },

    task: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return {
        ...data,
        status: mapStatus(data.status),
        priority: mapPriority(data.priority),
      };
    },

    myTasks: async (_, { status, priority }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('user_id', user.id);
      
      if (!assignments || assignments.length === 0) return [];

      const taskIds = assignments.map(a => a.task_id);

      let query = supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (status) {
        query = query.eq('status', mapStatusToDb(status));
      }
      if (priority) {
        query = query.eq('priority', mapPriorityToDb(priority));
      }

      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return data.map(t => ({
        ...t,
        status: mapStatus(t.status),
        priority: mapPriority(t.priority),
      }));
    },
  },

  Mutation: {
    createTask: async (_, args, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          project_id: args.projectId,
          title: args.title,
          description: args.description,
          status: mapStatusToDb(args.status) || 'todo',
          priority: mapPriorityToDb(args.priority) || 'medium',
          creator_id: user.id,
          due_date: args.due_date,
          position: args.position || 0,
        }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return {
        ...data,
        status: mapStatus(data.status),
        priority: mapPriority(data.priority),
      };
    },

    updateTask: async (_, args, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const updateData = {};
      if (args.title !== undefined) updateData.title = args.title;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.status !== undefined) updateData.status = mapStatusToDb(args.status);
      if (args.priority !== undefined) updateData.priority = mapPriorityToDb(args.priority);
      if (args.due_date !== undefined) updateData.due_date = args.due_date;
      if (args.position !== undefined) updateData.position = args.position;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', args.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return {
        ...data,
        status: mapStatus(data.status),
        priority: mapPriority(data.priority),
      };
    },

    deleteTask: async (_, { id }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return true;
    },

    assignTask: async (_, { taskId, userId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('task_assignments')
        .insert([{
          task_id: taskId,
          user_id: userId,
        }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },

    unassignTask: async (_, { taskId, userId }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);
      
      if (error) throw new Error(error.message);
      return true;
    },

    reorderTasks: async (_, { projectId, taskIds }, { user, supabase }) => {
      if (!user) throw new Error('No autenticado');

      const updates = taskIds.map((taskId, index) => 
        supabase
          .from('tasks')
          .update({ position: index })
          .eq('id', taskId)
          .eq('project_id', projectId)
      );

      await Promise.all(updates);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw new Error(error.message);
      return data.map(t => ({
        ...t,
        status: mapStatus(t.status),
        priority: mapPriority(t.priority),
      }));
    },
  },

  types: {
    Task: {
      project: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', parent.project_id)
          .single();
        
        if (error) return null;
        return data;
      },

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

      assigned_to: async (parent, _, { supabase }) => {
        const { data: assignments } = await supabase
          .from('task_assignments')
          .select('user_id')
          .eq('task_id', parent.id);
        
        if (!assignments || assignments.length === 0) return [];

        const userIds = assignments.map(a => a.user_id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        if (error) return [];
        return data;
      },

      labels: async (parent, _, { supabase }) => {
        const { data: taskLabels } = await supabase
          .from('task_labels')
          .select('label_id')
          .eq('task_id', parent.id);
        
        if (!taskLabels || taskLabels.length === 0) return [];

        const labelIds = taskLabels.map(tl => tl.label_id);
        
        const { data, error } = await supabase
          .from('labels')
          .select('*')
          .in('id', labelIds);
        
        if (error) return [];
        return data;
      },

      comments: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('task_id', parent.id)
          .order('created_at', { ascending: true });
        
        if (error) return [];
        return data;
      },
    },

    TaskAssignment: {
      task: async (parent, _, { supabase }) => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', parent.task_id)
          .single();
        
        if (error) throw new Error(error.message);
        return {
          ...data,
          status: mapStatus(data.status),
          priority: mapPriority(data.priority),
        };
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