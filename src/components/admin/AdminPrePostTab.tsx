import React, { useState } from 'react';
import { PrePostCase } from '../../types';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Upload, 
  Edit3, 
  Check, 
  X, 
  CheckCircle, 
  Filter,
  Loader2,
  Cloud
} from 'lucide-react';
import { uploadFileToStorage } from '../../services/supabaseService';

interface AdminPrePostTabProps {
  prePostCases: PrePostCase[];
  onAddPrePostCase: (c: PrePostCase) => void;
  onUpdatePrePostCase: (c: PrePostCase) => void;
  onDeletePrePostCase: (id: string) => void;
}

export const AdminPrePostTab: React.FC<AdminPrePostTabProps> = ({
  prePostCases,
  onAddPrePostCase,
  onUpdatePrePostCase,
  onDeletePrePostCase,
}) => {
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<PrePostCase['category']>('Skin');
  const [formCondition, setFormCondition] = useState('');
  const [formPatient, setFormPatient] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formRemedy, setFormRemedy] = useState('');
  const [formBeforeImg, setFormBeforeImg] = useState('');
  const [formAfterImg, setFormAfterImg] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOutcome, setFormOutcome] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (s: string) => void,
    setLoadingState: (loading: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image exceeds 5MB. Please choose a smaller image.');
        return;
      }
      setLoadingState(true);
      try {
        const url = await uploadFileToStorage(file, 'prepost');
        if (url) {
          setter(url);
          showSuccess('Case photo uploaded to Supabase Storage!');
        }
      } catch (err) {
        console.error('Case upload failed:', err);
        alert('Image upload failed. Please try again.');
      } finally {
        setLoadingState(false);
      }
    }
  };

  const handleStartEdit = (c: PrePostCase) => {
    setEditingCaseId(c.id);
    setIsAddingNew(false);
    setFormTitle(c.title);
    setFormCategory(c.category);
    setFormCondition(c.condition);
    setFormPatient(c.patientAgeGender);
    setFormDuration(c.durationOfTreatment);
    setFormRemedy(c.remedyPrescribed);
    setFormBeforeImg(c.beforeImage);
    setFormAfterImg(c.afterImage);
    setFormDesc(c.description);
    setFormOutcome(c.outcomeNotes);
  };

  const handleStartAdd = () => {
    setEditingCaseId(null);
    setIsAddingNew(true);
    setFormTitle('');
    setFormCategory('Skin');
    setFormCondition('');
    setFormPatient('35 Yrs, Male');
    setFormDuration('3 Months');
    setFormRemedy('');
    setFormBeforeImg('https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=700');
    setFormAfterImg('https://images.unsplash.com/photo-1512290900672-1f48615b81a4?auto=format&fit=crop&q=80&w=700');
    setFormDesc('');
    setFormOutcome('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCondition.trim()) {
      alert('Please fill in title and condition name.');
      return;
    }

    if (editingCaseId) {
      const updated: PrePostCase = {
        id: editingCaseId,
        title: formTitle.trim(),
        condition: formCondition.trim(),
        category: formCategory,
        patientAgeGender: formPatient.trim() || 'Adult Patient',
        durationOfTreatment: formDuration.trim() || '3 Months',
        remedyPrescribed: formRemedy.trim() || 'Constitutional Homoeopathy',
        beforeImage: formBeforeImg,
        afterImage: formAfterImg,
        description: formDesc.trim(),
        outcomeNotes: formOutcome.trim(),
        dateAdded: new Date().toISOString().split('T')[0],
      };
      const ok = await onUpdatePrePostCase(updated);
      if (!ok) {
        alert('Failed to save case. Please try again.');
        return;
      }
      showSuccess(`Case study "${formTitle}" updated!`);
    } else {
      const newCase: PrePostCase = {
        id: `case-${Date.now().toString().slice(-4)}`,
        title: formTitle.trim(),
        condition: formCondition.trim(),
        category: formCategory,
        patientAgeGender: formPatient.trim() || 'Adult Patient',
        durationOfTreatment: formDuration.trim() || '3 Months',
        remedyPrescribed: formRemedy.trim() || 'Constitutional Homoeopathy',
        beforeImage: formBeforeImg,
        afterImage: formAfterImg,
        description: formDesc.trim(),
        outcomeNotes: formOutcome.trim(),
        dateAdded: new Date().toISOString().split('T')[0],
      };
      const ok = await onAddPrePostCase(newCase);
      if (!ok) {
        alert('Failed to add case. Please try again.');
        return;
      }
      showSuccess(`New case study "${formTitle}" published!`);
    }

    setEditingCaseId(null);
    setIsAddingNew(false);
  };

  const filteredCases = prePostCases.filter((c) => 
    categoryFilter === 'all' || c.category === categoryFilter
  );

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2D5A50]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
              Pre & Post Clinical Treatment Cases
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Showcase authentic clinical recovery cases with before/after comparison photos and prescribed remedies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStartAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clinical Case</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAddingNew || editingCaseId) && (
        <div className="p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                {isAddingNew ? 'Publish New Clinical Case Study' : 'Edit Pre & Post Case'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => { setEditingCaseId(null); setIsAddingNew(false); }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Case Title / Presentation *</label>
                <input
                  type="text"
                  placeholder="e.g. Severe Chronic Plaque Psoriasis with Scaling"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Skin">Skin</option>
                  <option value="Hair">Hair</option>
                  <option value="Pediatric">Pediatric</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Joint & Musculoskeletal">Joint & Musculoskeletal</option>
                  <option value="Gastrointestinal">Gastrointestinal</option>
                  <option value="Chronic">Chronic</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Condition / Diagnosis *</label>
                <input
                  type="text"
                  placeholder="e.g. Psoriasis Vulgaris or Alopecia Areata"
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Demographics</label>
                <input
                  type="text"
                  placeholder="e.g. 38 Yrs, Male"
                  value={formPatient}
                  onChange={(e) => setFormPatient(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Treatment Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 4 Months"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Constitutional Remedy Prescribed</label>
              <input
                type="text"
                placeholder="e.g. Arsenicum Album 200CH followed by Sulphur 1M"
                value={formRemedy}
                onChange={(e) => setFormRemedy(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* Before and After Image Uploads & Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200">
              {/* Before Image */}
              <div className="space-y-2">
                <label className="font-bold text-rose-800 text-xs uppercase tracking-wider block">
                  1. Before Treatment Photo
                </label>
                <div className="h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                  <img src={formBeforeImg} alt="Before Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">BEFORE</div>
                </div>
                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border ${
                    isUploadingBefore ? 'bg-rose-50 text-rose-700 border-rose-200 opacity-80 cursor-wait' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {isUploadingBefore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-rose-600" />
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Before Photo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={isUploadingBefore} 
                      onChange={(e) => handleFileUpload(e, setFormBeforeImg, setIsUploadingBefore)} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Or Before Image URL"
                  value={formBeforeImg}
                  onChange={(e) => setFormBeforeImg(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* After Image */}
              <div className="space-y-2">
                <label className="font-bold text-emerald-800 text-xs uppercase tracking-wider block">
                  2. After Recovery Photo
                </label>
                <div className="h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                  <img src={formAfterImg} alt="After Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">AFTER</div>
                </div>
                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border ${
                    isUploadingAfter ? 'bg-emerald-50 text-emerald-700 border-emerald-200 opacity-80 cursor-wait' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {isUploadingAfter ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload After Photo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={isUploadingAfter} 
                      onChange={(e) => handleFileUpload(e, setFormAfterImg, setIsUploadingAfter)} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Or After Image URL"
                  value={formAfterImg}
                  onChange={(e) => setFormAfterImg(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Description & Outcome */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Presentation / History</label>
                <textarea
                  rows={3}
                  placeholder="Initial complaints, severity, failed conventional treatments..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Outcome & Follow-up Notes</label>
                <textarea
                  rows={3}
                  placeholder="Resolution timeline, reduction of flare-ups, long-term remission..."
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingCaseId ? 'Update Case Study' : 'Publish Case Study'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setEditingCaseId(null); setIsAddingNew(false); }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Case Studies Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
            Published Cases ({filteredCases.length})
          </h4>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Skin">Skin</option>
              <option value="Hair">Hair</option>
              <option value="Pediatric">Pediatric</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Joint & Musculoskeletal">Joint & Musculoskeletal</option>
              <option value="Chronic">Chronic</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCases.length === 0 && (
            <div className="md:col-span-2 p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No cases available yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add a pre/post case to display before &amp; after results.</p>
            </div>
          )}
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                    {c.category}
                  </span>
                  <h5 className="font-bold text-sm text-slate-900 mt-1">{c.title}</h5>
                  <p className="text-xs text-slate-500">{c.patientAgeGender} &bull; {c.durationOfTreatment}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#2D5A50] hover:bg-slate-100 cursor-pointer"
                    title="Edit Case"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Delete case "${c.title}"?`)) {
                        const ok = await onDeletePrePostCase(c.id);
                        if (!ok) alert('Failed to delete case. Please try again.');
                        else showSuccess('Case deleted.');
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete Case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photos Comparison */}
              <div className="grid grid-cols-2 gap-2 h-24 rounded-xl overflow-hidden bg-slate-100">
                <div className="relative h-full">
                  <img src={c.beforeImage} alt="Before" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">BEFORE</span>
                </div>
                <div className="relative h-full">
                  <img src={c.afterImage} alt="After" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">AFTER</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                <strong className="text-slate-800">Prescription:</strong> {c.remedyPrescribed}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
