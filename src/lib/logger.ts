import { supabase } from './supabase';

export const logActivity = async (
  projectId: string,
  title: string,
  description: string,
  type: 'create' | 'delete' | 'update' | 'payment' | 'file' | 'comment' | 'stage' | 'info',
  metadata: any = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('project_activities').insert({
      project_id: projectId,
      user_id: user.id,
      activity_type: type,
      title,
      description,
      metadata
    });
  } catch (error) {
    console.error('Loglama hatası:', error);
  }
};