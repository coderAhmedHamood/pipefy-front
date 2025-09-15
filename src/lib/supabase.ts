import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// دوال مساعدة للمصادقة
export const auth = {
  signUp: async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// دوال مساعدة للبيانات
export const database = {
  // العمليات
  processes: {
    getAll: () => supabase
      .from('processes')
      .select(`
        *,
        stages (
          *,
          stage_transitions!from_stage_id (
            to_stage_id,
            transition_type,
            is_default
          )
        ),
        process_fields (*)
      `)
      .eq('is_active', true)
      .order('created_at'),

    create: (processData: any) => supabase
      .from('processes')
      .insert(processData)
      .select()
      .single(),

    update: (id: string, updates: any) => supabase
      .from('processes')
      .update(updates)
      .eq('id', id)
      .select()
      .single(),

    delete: (id: string) => supabase
      .from('processes')
      .delete()
      .eq('id', id)
  },

  // المراحل
  stages: {
    getByProcess: (processId: string) => supabase
      .from('stages')
      .select(`
        *,
        stage_transitions!from_stage_id (
          to_stage_id,
          transition_type,
          is_default
        )
      `)
      .eq('process_id', processId)
      .order('priority'),

    create: (stageData: any) => supabase
      .from('stages')
      .insert(stageData)
      .select()
      .single(),

    update: (id: string, updates: any) => supabase
      .from('stages')
      .update(updates)
      .eq('id', id)
      .select()
      .single(),

    delete: (id: string) => supabase
      .from('stages')
      .delete()
      .eq('id', id)
  },

  // قواعد الانتقال
  transitions: {
    create: (transitionData: any) => supabase
      .from('stage_transitions')
      .insert(transitionData)
      .select()
      .single(),

    getByStage: (stageId: string) => supabase
      .from('stage_transitions')
      .select('*')
      .eq('from_stage_id', stageId),

    delete: (fromStageId: string, toStageId: string) => supabase
      .from('stage_transitions')
      .delete()
      .eq('from_stage_id', fromStageId)
      .eq('to_stage_id', toStageId)
  },

  // التذاكر
  tickets: {
    getAll: (filters: any = {}) => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          process:processes(*),
          current_stage:stages(*),
          assigned_user:profiles!assigned_to(*),
          created_user:profiles!created_by(*),
          ticket_activities(*),
          ticket_comments(*),
          ticket_attachments(*),
          ticket_tags(tags(*))
        `)
        .order('created_at', { ascending: false });

      if (filters.process_id) {
        query = query.eq('process_id', filters.process_id);
      }
      if (filters.stage_id) {
        query = query.eq('current_stage_id', filters.stage_id);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      return query;
    },

    create: (ticketData: any) => supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single(),

    update: (id: string, updates: any) => supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single(),

    move: async (ticketId: string, toStageId: string, userId: string, comment?: string) => {
      // تحديث التذكرة
      const { data: ticket, error: updateError } = await supabase
        .from('tickets')
        .update({ current_stage_id: toStageId })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) throw updateError;

      // إضافة نشاط
      const { error: activityError } = await supabase
        .from('ticket_activities')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          activity_type: 'stage_changed',
          description: comment || 'تم نقل التذكرة إلى مرحلة جديدة',
          new_value: { stage_id: toStageId }
        });

      if (activityError) throw activityError;

      return ticket;
    },

    delete: (id: string) => supabase
      .from('tickets')
      .delete()
      .eq('id', id)
  },

  // الأنشطة
  activities: {
    create: (activityData: any) => supabase
      .from('ticket_activities')
      .insert(activityData)
      .select()
      .single(),

    getByTicket: (ticketId: string) => supabase
      .from('ticket_activities')
      .select(`
        *,
        user:profiles(name, avatar_url)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
  },

  // التعليقات
  comments: {
    create: (commentData: any) => supabase
      .from('ticket_comments')
      .insert(commentData)
      .select()
      .single(),

    getByTicket: (ticketId: string) => supabase
      .from('ticket_comments')
      .select(`
        *,
        user:profiles(name, avatar_url)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
  },

  // الإشعارات
  notifications: {
    getByUser: (userId: string) => supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    markAsRead: (id: string) => supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id),

    markAllAsRead: (userId: string) => supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
  }
};

// دوال مساعدة للصلاحيات
export const permissions = {
  getUserPermissions: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        role_permissions!inner(
          permissions(*)
        ),
        user_permissions(
          permissions(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    const rolePermissions = data.role_permissions?.map(rp => rp.permissions) || [];
    const userPermissions = data.user_permissions?.map(up => up.permissions) || [];
    
    return [...rolePermissions, ...userPermissions];
  },

  hasPermission: async (userId: string, resource: string, action: string) => {
    const userPermissions = await permissions.getUserPermissions(userId);
    return userPermissions.some(p => p.resource === resource && p.action === action);
  }
};

// دوال مساعدة للتحقق من الانتقالات
export const stageTransitions = {
  getAllowedTransitions: async (fromStageId: string) => {
    const { data, error } = await supabase
      .from('stage_transitions')
      .select(`
        *,
        to_stage:stages!to_stage_id(*)
      `)
      .eq('from_stage_id', fromStageId);

    if (error) throw error;
    return data;
  },

  isTransitionAllowed: async (fromStageId: string, toStageId: string) => {
    const { data, error } = await supabase
      .from('stage_transitions')
      .select('id')
      .eq('from_stage_id', fromStageId)
      .eq('to_stage_id', toStageId)
      .single();

    return !error && data;
  },

  createTransition: (fromStageId: string, toStageId: string, options: any = {}) => supabase
    .from('stage_transitions')
    .insert({
      from_stage_id: fromStageId,
      to_stage_id: toStageId,
      ...options
    })
    .select()
    .single()
};

export default supabase;