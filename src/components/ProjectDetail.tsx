import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Phone, Mail, MapPin, DollarSign } from 'lucide-react';
import { ProjectTimeline } from './ProjectTimeline';
import { PaymentManager } from './PaymentManager';

interface Project {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  total_amount: number;
  current_stage_id: string | null;
  current_sub_stage_id: string | null;
  created_at: string;
}

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function ProjectDetail({ projectId, onBack, onUpdate }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (data) {
      setProject(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Proje bulunamadı</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Geri Dön</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.customer_name}
            </h1>
            <p className="text-gray-500">
              Oluşturulma: {new Date(project.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="bg-blue-100 px-6 py-3 rounded-xl">
            <p className="text-sm text-blue-600 font-medium mb-1">Toplam Tutar</p>
            <p className="text-2xl font-bold text-blue-900">
              ₺{project.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Müşteri Adı</p>
                <p className="text-gray-900 font-semibold">{project.customer_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Telefon</p>
                <p className="text-gray-900 font-semibold">{project.phone}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {project.email && (
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">E-posta</p>
                  <p className="text-gray-900 font-semibold">{project.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Adres</p>
                <p className="text-gray-900">{project.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ProjectTimeline
          projectId={projectId}
          currentStageId={project.current_stage_id}
          currentSubStageId={project.current_sub_stage_id}
          onStageChange={() => {
            loadProject();
            onUpdate();
          }}
        />
      </div>

      <PaymentManager
        projectId={projectId}
        totalAmount={project.total_amount}
      />
    </div>
  );
}
