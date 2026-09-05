import React, { useState } from 'react';
import { Testimonial } from '../../types';
import { 
  Star, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  CheckCircle, 
  Quote 
} from 'lucide-react';

interface AdminTestimonialsTabProps {
  testimonials: Testimonial[];
  onUpdateTestimonials: (testimonials: Testimonial[]) => void;
}

export const AdminTestimonialsTab: React.FC<AdminTestimonialsTabProps> = ({
  testimonials,
  onUpdateTestimonials,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCondition, setFormCondition] = useState('');
  const [formDoctor, setFormDoctor] = useState('Dr. Yogesh Dravid');
  const [formDuration, setFormDuration] = useState('4 Months');
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleStartEdit = (item: Testimonial) => {
    setEditingId(item.id);
    setIsAddingNew(false);
    setFormName(item.patientName);
    setFormLocation(item.location);
    setFormCondition(item.condition);
    setFormDoctor(item.treatedBy || item.doctorConsulted || 'Dr. Yogesh Dravid');
    setFormDuration(item.treatmentDuration);
    setFormRating(item.rating);
    setFormComment(item.comment);
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setIsAddingNew(true);
    setFormName('');
    setFormLocation('Belgaum, Karnataka');
    setFormCondition('');
    setFormDoctor('Dr. Yogesh Dravid');
    setFormDuration('3 Months');
    setFormRating(5);
    setFormComment('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCondition.trim() || !formComment.trim()) {
      alert('Please provide patient name, condition treated, and feedback comment.');
      return;
    }

    if (editingId) {
      const updated = testimonials.map((t) => {
        if (t.id === editingId) {
          return {
            ...t,
            patientName: formName.trim(),
            location: formLocation.trim(),
            condition: formCondition.trim(),
            treatedBy: formDoctor.trim(),
            doctorConsulted: formDoctor.trim(),
            treatmentDuration: formDuration.trim(),
            rating: formRating,
            comment: formComment.trim(),
          };
        }
        return t;
      });
      onUpdateTestimonials(updated);
      showSuccess(`Review from "${formName}" updated!`);
    } else {
      const newReview: Testimonial = {
        id: `rev-${Date.now().toString().slice(-4)}`,
        patientName: formName.trim(),
        location: formLocation.trim() || 'Karnataka',
        condition: formCondition.trim(),
        treatedBy: formDoctor.trim(),
        doctorConsulted: formDoctor.trim(),
        treatmentDuration: formDuration.trim() || '3 Months',
        rating: formRating,
        comment: formComment.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };
      onUpdateTestimonials([newReview, ...testimonials]);
      showSuccess(`New review from "${formName}" added!`);
    }

    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete review from "${name}"?`)) {
      onUpdateTestimonials(testimonials.filter((t) => t.id !== id));
      showSuccess('Review deleted.');
    }
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-[#2D5A50]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
              Patient Testimonials & Cured Cases
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Manage authentic patient experiences, verified recovery stories, star ratings, and treatment durations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStartAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                {isAddingNew ? 'Add New Patient Review' : 'Edit Review'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => { setEditingId(null); setIsAddingNew(false); }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Deshpande"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Belgaum, Karnataka or Quepem, Goa"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Star Rating</label>
                <select
                  value={formRating}
                  onChange={(e) => setFormRating(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Condition Cured / Managed *</label>
                <input
                  type="text"
                  placeholder="e.g. Chronic Eczema & Allergies"
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Doctor Consulted</label>
                <input
                  type="text"
                  placeholder="Dr. Yogesh Dravid or Dr. Prachi Dravid"
                  value={formDoctor}
                  onChange={(e) => setFormDoctor(e.target.value)}
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
              <label className="font-bold text-slate-700 block mb-1">Patient Testimonial Comment *</label>
              <textarea
                rows={3}
                placeholder="Write genuine feedback, relief timeline, experience with Dr. Dravid..."
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Save Review Changes' : 'Publish Review'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setEditingId(null); setIsAddingNew(false); }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{t.patientName}</h4>
                  <p className="text-[11px] text-slate-500">{t.location} &bull; {t.condition}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(t)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#2D5A50] hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id, t.patientName)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic leading-relaxed">"{t.comment}"</p>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Doctor: {t.treatedBy || t.doctorConsulted || 'Dr. Dravid'}</span>
              <span>Duration: {t.treatmentDuration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
