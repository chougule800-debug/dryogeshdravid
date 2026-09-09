import React, { useState } from 'react';
import { ClinicalServiceItem } from '../../types';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  CheckCircle,
  Activity,
} from 'lucide-react';

interface AdminTreatmentsTabProps {
  services: ClinicalServiceItem[];
  onAddService: (s: ClinicalServiceItem) => Promise<boolean>;
  onUpdateService: (s: ClinicalServiceItem) => Promise<boolean>;
  onDeleteService: (id: string) => Promise<boolean>;
}

export const AdminTreatmentsTab: React.FC<AdminTreatmentsTabProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formHighlight, setFormHighlight] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formApproach, setFormApproach] = useState('');
  const [formConditions, setFormConditions] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3500);
  };

  const handleStartEdit = (service: ClinicalServiceItem) => {
    setEditingId(service.id);
    setIsAddingNew(false);
    setFormTitle(service.title);
    setFormHighlight(service.highlight || '');
    setFormDesc(service.description);
    setFormApproach(service.approach || '');
    setFormConditions(service.conditions.join(', '));
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setIsAddingNew(true);
    setFormTitle('');
    setFormHighlight('');
    setFormDesc('');
    setFormApproach('');
    setFormConditions('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      alert('Please fill in title and description.');
      return;
    }

    const conditionsArray = formConditions.split(',').map((c) => c.trim()).filter(Boolean);

    if (editingId) {
      const updated: ClinicalServiceItem = {
        id: editingId,
        title: formTitle.trim(),
        highlight: formHighlight.trim() || 'Clinical Specialty',
        description: formDesc.trim(),
        approach: formApproach.trim() || 'Constitutional Homoeopathy',
        conditions: conditionsArray.length > 0 ? conditionsArray : ['Constitutional Care'],
        iconName: 'Activity',
      };
      const ok = await onUpdateService(updated);
      if (ok) {
        showSuccess(`Treatment specialty "${formTitle}" updated!`);
        setEditingId(null);
      } else {
        showError('Failed to update service. Check console.');
      }
    } else {
      const newService: ClinicalServiceItem = {
        id: `svc-${Date.now().toString().slice(-4)}`,
        title: formTitle.trim(),
        highlight: formHighlight.trim() || 'Clinical Specialty',
        description: formDesc.trim(),
        approach: formApproach.trim() || 'Constitutional Homoeopathy',
        conditions: conditionsArray.length > 0 ? conditionsArray : ['General Health'],
        iconName: 'Activity',
      };
      const ok = await onAddService(newService);
      if (ok) {
        showSuccess(`New treatment specialty "${formTitle}" added!`);
        setIsAddingNew(false);
      } else {
        showError('Failed to add service. Check console.');
      }
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete treatment specialty "${title}"?`)) return;
    const ok = await onDeleteService(id);
    if (ok) {
      showSuccess(`Service "${title}" deleted.`);
    } else {
      showError('Failed to delete service. Check console.');
    }
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2D5A50]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
              Clinical Treatments & Disease Specialties
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Manage disease categories, physiological constitutional approaches, and conditions treated on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStartAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Specialty</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-100 border border-red-300 text-red-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                {isAddingNew ? 'Add Clinical Specialty' : 'Edit Specialty'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setIsAddingNew(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Specialty Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Skin, Allergy & Hair Disorders"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Highlight Badge</label>
                <input
                  type="text"
                  placeholder="e.g. Deep Constitutional Restoration"
                  value={formHighlight}
                  onChange={(e) => setFormHighlight(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description *</label>
              <textarea
                rows={2}
                placeholder="Clinical overview and physiological mechanism..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Clinical Approach</label>
              <input
                type="text"
                placeholder="e.g. Constitutional remedies target immune dysregulation rather than suppressive topical steroids."
                value={formApproach}
                onChange={(e) => setFormApproach(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Conditions Treated (comma-separated)</label>
              <input
                type="text"
                placeholder="Psoriasis, Eczema, Alopecia Areata, Chronic Urticaria, Acne"
                value={formConditions}
                onChange={(e) => setFormConditions(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Save Changes' : 'Add Specialty'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                    {s.highlight}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{s.title}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(s)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#2D5A50] hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
              {s.conditions && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {s.conditions.map((c, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};