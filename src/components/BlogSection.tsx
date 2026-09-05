import React, { useState } from 'react';
import { BlogPost } from '../types';
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowRight, 
  X, 
  Tag, 
  Share2, 
  Sparkles,
  Calendar
} from 'lucide-react';

interface BlogSectionProps {
  posts: BlogPost[];
  onOpenBooking: () => void;
  loading: boolean;
  error?: string | null;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ posts, onOpenBooking, loading, error }) => {
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  return (
    <section id="articles" className="py-10 sm:py-14 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <BookOpen className="w-3.5 h-3.5 text-[#1C3F3A]" />
            <span className="text-[#1C3F3A]">Physiology & Homeopathy Insights</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif-display">
            Doctor's Clinical Articles &amp; Guides
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
            Educational medical literature on classical homeopathic science, autonomic vital force, and physiological homeostasis by Prof. Dr. Yogesh Dravid.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {error && (
            <div className="col-span-full p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">Unable to load articles from the server. Please try again.</p>
            </div>
          )}
          {!error && loading && posts.length === 0 && (
            <div className="col-span-full p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading articles...</p>
            </div>
          )}
          {!error && !loading && posts.length === 0 && (
            <div className="col-span-full p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No articles available.</p>
            </div>
          )}
          {posts.map((post) => (
            <article
              key={post.id}
              id={`article-card-${post.id}`}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Cover Image */}
                <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#1C3F3A]/90 text-emerald-200 backdrop-blur-xs border border-emerald-500/30">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Article Info */}
                <div className="p-6 sm:p-7 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-900" />
                      {post.publishedDate}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-900" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-950 font-serif-display line-clamp-2 group-hover:text-[#2D5A50] transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="pt-2 text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1C3F3A]" />
                    <span>{post.author}</span>
                  </div>
                </div>
              </div>

              {/* Read Action */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActivePost(post)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C3F3A] hover:text-[#2D5A50] transition-colors cursor-pointer"
                >
                  <span>Read Full Medical Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Full Article Reader Modal */}
        {activePost && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-10 space-y-6 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950">
                    {activePost.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-800 font-medium pt-2">
                    <span>{activePost.publishedDate}</span>
                    <span>&bull;</span>
                    <span>{activePost.readTime}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActivePost(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-700 hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-serif-display leading-tight">
                {activePost.title}
              </h2>

              <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-950">{activePost.author}</div>
                  <div className="text-slate-800 text-[11px] font-medium">{activePost.authorRole}</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Article link copied to clipboard!');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-950 font-bold cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Cover Image */}
              <div className="rounded-2xl overflow-hidden max-h-72 w-full bg-slate-100">
                <img
                  src={activePost.coverImage}
                  alt={activePost.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Body text */}
              <div className="prose prose-slate max-w-none text-slate-900 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
                {activePost.content}
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-slate-700" />
                {activePost.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setActivePost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActivePost(null);
                    onOpenBooking();
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2D5A50] text-white hover:bg-[#20423a] cursor-pointer shadow-xs"
                >
                  Book Consultation with Doctor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
