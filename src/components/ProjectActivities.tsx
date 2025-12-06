import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, 
  Upload, 
  Banknote, 
  GitCommit, 
  PlusCircle, 
  Clock, 
  User as UserIcon, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Info
} from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  user_name?: string;
  metadata?: any;
}

interface ProjectActivitiesProps {
  projectId: string;
}

export function ProjectActivities({ projectId }: ProjectActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();

    const subscription = supabase
      .channel('project_activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_activities', filter: `project_id=eq.${projectId}` }, 
        () => { loadActivities(); }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [projectId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Aktiviteleri çek
      const { data, error } = await supabase
        .from('project_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Kullanıcı isimlerini ayrıca çek (Join hatasını önlemek için)
      const userIds = new Set(data.map(a => a.user_id).filter(Boolean));
      let userMap: Record<string, string> = {};
      
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', Array.from(userIds));
          
        profiles?.forEach(p => {
            userMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email;
        });
      }

      const formattedData = data.map((item: any) => ({
        ...item,
        user_name: item.user_id ? (userMap[item.user_id] || 'Silinmiş Kullanıcı') : 'Sistem'
      }));

      setActivities(formattedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyles = (type: string) => {
    const normalizedType = type?.toLowerCase() || 'info';
    
    switch (normalizedType) {
      case 'create': return { icon: PlusCircle, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
      case 'comment': return { icon: MessageSquare, bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' };
      case 'file': return { icon: Upload, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
      case 'payment': return { icon: Banknote, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
      case 'stage': return { icon: GitCommit, bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' };
      case 'delete': return { icon: Trash2, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
      case 'update': return { icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' };
      default: return { icon: Info, bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
    }
  };

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Yükleniyor...</div>;

  return (
    <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 p-0 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-surface-100 dark:border-surface-100/10 flex items-center gap-3 bg-surface-50/50 dark:bg-surface-100/50">
        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
          <Clock className="w-4 h-4" />
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Proje Akışı</h4>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-4 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        <div className="relative border-l-2 border-surface-100 dark:border-surface-100/10 ml-3 space-y-6 pb-2 pt-2">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4 ml-4">Henüz bir aktivite yok.</p>
          ) : (
            activities.map((activity) => {
              const style = getTypeStyles(activity.activity_type);
              const IconComponent = style.icon;

              return (
                <div key={activity.id} className="relative pl-6"> 
                  <span className={`absolute -left-[11px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-surface-50 ${style.bg} z-10`}>
                    <IconComponent className={`h-6 w-6 ${style.text}`} />
                  </span>
                  
                  <div className="flex flex-col gap-1 p-2.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors -mt-1 border border-transparent hover:border-surface-100 dark:hover:border-surface-100/20">
                    <div className="flex justify-between items-center gap-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none">{activity.title}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(activity.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 break-words leading-snug mt-1">
                      {activity.description}
                      {activity.metadata?.amount && (
                        <span className="font-bold text-green-600 dark:text-green-400 ml-1">
                          {Number(activity.metadata.amount).toLocaleString('tr-TR')} TL
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-4 h-4 rounded-full bg-surface-100 dark:bg-surface-200 flex items-center justify-center">
                        <UserIcon className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{activity.user_name}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}