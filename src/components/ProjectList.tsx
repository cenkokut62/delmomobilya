import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Briefcase } from 'lucide-react';
import { ProjectForm } from './ProjectForm';
import { ProjectDetail } from './ProjectDetail';

interface Project {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  total_amount: number;
  current_stage_id: string | null;
  created_at: string;
}

interface Stage {
  id: string;
  name: string;
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
    loadStages();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const loadStages = async () => {
    const { data } = await supabase.from('stages').select('id, name');
    if (data) {
      setStages(data);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.phone.includes(searchTerm)
  );

  const getStageName = (stageId: string | null) => {
    if (!stageId) return 'Belirsiz';
    return stages.find((s) => s.id === stageId)?.name || 'Belirsiz';
  };

  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
        onUpdate={loadProjects}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-xl">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Projeler</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Yeni Proje
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Müşteri adı veya telefon ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'Proje bulunamadı' : 'Henüz proje yok'}
          </p>
          <p className="text-gray-500 mt-2">
            {!searchTerm && 'Yeni proje eklemek için yukarıdaki butona tıklayın'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {project.customer_name}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="mb-1">
                        <span className="font-medium">Telefon:</span> {project.phone}
                      </p>
                      {project.email && (
                        <p>
                          <span className="font-medium">E-posta:</span> {project.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="mb-1">
                        <span className="font-medium">Tutar:</span>{' '}
                        ₺{project.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                      <p>
                        <span className="font-medium">Tarih:</span>{' '}
                        {new Date(project.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                    {getStageName(project.current_stage_id)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}
