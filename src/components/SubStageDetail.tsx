import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useRBAC } from '../contexts/RBACContext';
import { logActivity } from '../lib/logger';
import { CheckCircle, MessageSquare, Upload, FileText, Trash2, Send, Download } from 'lucide-react';

interface SubStageDetailProps {
  projectId: string;
  stageId: string;
  subStageId: string;
  stageName: string;
  subStageName: string;
  onUpdate: () => void;
}

interface SubStageDetailData {
  id: string;
  is_completed: boolean;
  notes: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  is_own: boolean;
}

interface FileData {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  user_id: string;
  user_name: string;
  is_own: boolean;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const STORAGE_BUCKET = 'project-files';

export function SubStageDetail({
  projectId,
  stageId,
  subStageId,
  stageName,
  subStageName,
  onUpdate,
}: SubStageDetailProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { confirm } = useConfirmation();
  const { hasPermission } = useRBAC();
  
  const [detail, setDetail] = useState<SubStageDetailData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data: detailData, error: detailError } = await supabase
        .from('sub_stage_details')
        .upsert(
          {
            project_id: projectId,
            stage_id: stageId,
            sub_stage_id: subStageId,
          },
          { 
            onConflict: 'project_id,stage_id,sub_stage_id',
            ignoreDuplicates: false 
          }
        )
        .select()
        .single();

      if (detailError) throw detailError;
      if (!detailData) throw new Error("Detay verisi alınamadı.");

      setDetail(detailData as SubStageDetailData);

      const [commentsRes, filesRes] = await Promise.all([
        supabase
          .from('sub_stage_comments')
          .select('*')
          .eq('detail_id', detailData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('sub_stage_files')
          .select('*')
          .eq('detail_id', detailData.id)
          .order('created_at', { ascending: false })
      ]);

      if (commentsRes.error) throw commentsRes.error;
      if (filesRes.error) throw filesRes.error;

      const userIds = new Set<string>();
      commentsRes.data.forEach(c => c.user_id && userIds.add(c.user_id));
      filesRes.data.forEach(f => f.user_id && userIds.add(f.user_id));

      let profilesMap: Record<string, UserProfile> = {};

      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', Array.from(userIds));

        if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      const formattedComments = commentsRes.data.map(c => {
        const profile = profilesMap[c.user_id];
        const name = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email 
          : 'Bilinmeyen Kullanıcı';
        
        return {
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user_id: c.user_id,
          user_name: name,
          is_own: c.user_id === user?.id
        };
      }) as Comment[];

      const formattedFiles = filesRes.data.map(f => {
        const profile = profilesMap[f.user_id];
        const name = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email 
          : 'Bilinmeyen Kullanıcı';

        return {
          id: f.id,
          file_name: f.file_name,
          file_url: f.file_url,
          created_at: f.created_at,
          user_id: f.user_id,
          user_name: name,
          is_own: f.user_id === user?.id
        };
      }) as FileData[];

      setComments(formattedComments);
      setFiles(formattedFiles);

    } catch (err: any) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, stageId, subStageId, user?.id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !detail?.id) return;

    const { error } = await supabase.from('sub_stage_comments').insert({
      detail_id: detail.id,
      user_id: user?.id,
      content: commentText.trim(),
    });

    if (error) {
      addToast('error', 'Yorum eklenemedi.');
      console.error(error);
    } else {
      await logActivity(projectId, 'Yorum Yapıldı', `"${commentText}" (${subStageName})`, 'comment');
      setCommentText('');
      addToast('success', 'Yorum eklendi.');
      await loadDetail();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const isConfirmed = await confirm({
      title: 'Yorumu Sil',
      message: 'Bu yorumu silmek istediğinizden emin misiniz?',
      confirmText: 'Sil',
      type: 'danger'
    });

    if (!isConfirmed) return;

    const { error } = await supabase
      .from('sub_stage_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      addToast('error', 'Yorum silinemedi.');
    } else {
      await logActivity(projectId, 'Yorum Silindi', 'Bir yorum silindi.', 'delete');
      addToast('success', 'Yorum silindi.');
      await loadDetail();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detail?.id) return;

    setUploading(true);
    const filePath = `${projectId}/${subStageId}/${Date.now()}_${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('sub_stage_files').insert({
        detail_id: detail.id,
        user_id: user?.id,
        file_url: filePath,
        file_name: file.name,
      });

      if (dbError) throw dbError;

      await logActivity(projectId, 'Dosya Yüklendi', `${file.name} (${subStageName})`, 'file');
      addToast('success', 'Dosya başarıyla yüklendi.');
      await loadDetail();
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Dosya yükleme hatası. Storage ayarlarınızı kontrol edin.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFileDownload = (filePath: string, fileName: string) => {
    const publicUrl = `${supabase.storage.url}/object/public/${STORAGE_BUCKET}/${filePath}`;
    const link = document.createElement('a');
    link.href = publicUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    const isConfirmed = await confirm({
      title: 'Dosyayı Sil',
      message: 'Bu dosyayı kalıcı olarak silmek istediğinizden emin misiniz?',
      confirmText: 'Dosyayı Sil',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      const { error: dbError } = await supabase
        .from('sub_stage_files')
        .delete()
        .eq('id', fileId);
        
      if (dbError) throw dbError;

      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

      await logActivity(projectId, 'Dosya Silindi', 'Bir dosya silindi.', 'delete');
      addToast('success', 'Dosya silindi.');
      await loadDetail();
    } catch (err: any) {
      addToast('error', 'Dosya silinirken hata oluştu.');
    }
  };

  const handleCompleteToggle = async () => {
    if (!detail?.id) return;

    const newCompletedState = !detail.is_completed;

    const { error } = await supabase
      .from('sub_stage_details')
      .update({
        is_completed: newCompletedState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', detail.id);

    if (error) {
      addToast('error', 'Durum güncellenemedi.');
    } else {
      setDetail(prev => prev ? { ...prev, is_completed: newCompletedState } : null);
      
      await logActivity(
        projectId, 
        newCompletedState ? 'Görev Tamamlandı' : 'Görev Geri Alındı', 
        `${subStageName} (${stageName})`, 
        'update'
      );
      
      addToast('success', newCompletedState ? 'Aşama tamamlandı!' : 'Aşama geri alındı.');
      onUpdate();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  const isCompleted = detail?.is_completed || false;

  return (
    <div className="space-y-6 pb-20">
      
      <div className={`p-4 rounded-xl flex items-center justify-between transition-colors duration-300 ${isCompleted ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800' : 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800'}`}>
        <div className="flex items-center gap-3">
          <CheckCircle className={`w-6 h-6 ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'}`} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ana Aşama: {stageName}</p>
            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">{subStageName}</h4>
          </div>
        </div>
        <button
          onClick={handleCompleteToggle}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 ${
            isCompleted
              ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50 dark:bg-transparent dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'
          }`}
        >
          {isCompleted ? 'Geri Al' : 'Tamamla'}
        </button>
      </div>

      <div className="border border-surface-200 dark:border-surface-100 rounded-xl bg-surface-0 dark:bg-surface-50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-100 bg-surface-50 dark:bg-surface-100/50 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h5 className="font-semibold text-gray-900 dark:text-gray-100">Yorumlar</h5>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Henüz yorum yapılmamış.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0 text-primary-700 dark:text-primary-300 font-bold text-xs uppercase border border-primary-200 dark:border-primary-800">
                    {comment.user_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-surface-50 dark:bg-surface-100 rounded-2xl rounded-tl-none p-3 border border-surface-200 dark:border-surface-100 relative">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300">{comment.user_name}</span>
                        <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* YETKİ KONTROLÜ */}
                      {(comment.is_own || hasPermission('can_delete_comment')) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Yorumu Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2 items-end pt-2 border-t border-surface-200 dark:border-surface-100">
            <textarea
              rows={1}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Bir şeyler yazın..."
              className="flex-1 px-4 py-3 border border-surface-200 dark:border-surface-100 dark:bg-surface-0 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm min-h-[46px]"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="border border-surface-200 dark:border-surface-100 rounded-xl bg-surface-0 dark:bg-surface-50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-100 bg-surface-50 dark:bg-surface-100/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h5 className="font-semibold text-gray-900 dark:text-gray-100">Dosyalar</h5>
          </div>
          <label className={`cursor-pointer px-3 py-1.5 bg-white dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-lg text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-200 transition-colors shadow-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Upload className="w-3 h-3" />
              {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
            </span>
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>

        <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
          {files.length === 0 ? (
            <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-500 italic">Bu aşamaya henüz dosya yüklenmedi.</p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-100 rounded-lg group transition-colors border border-transparent hover:border-surface-200 dark:hover:border-surface-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      onClick={() => handleFileDownload(file.file_url, file.file_name)}
                      className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title={file.file_name}
                    >
                      {file.file_name}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex gap-1">
                      <span className="font-medium">{file.user_name}</span>
                      <span>•</span>
                      <span>{new Date(file.created_at).toLocaleDateString('tr-TR')}</span>
                    </span>
                  </div>
                </div>
                
                {/* YETKİ KONTROLÜ */}
                {(file.is_own || hasPermission('can_delete_file')) && (
                  <button
                    onClick={() => handleDeleteFile(file.id, file.file_url)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Dosyayı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}