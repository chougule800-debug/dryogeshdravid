import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Phone, MapPin, Clock, CheckCheck, Check, RotateCcw, Bot, ChevronRight
} from 'lucide-react';
import { ClinicLocation } from '../types';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  options?: { label: string; action: () => void }[];
}

interface WhatsAppChatBotProps {
  clinics?: ClinicLocation[];
}

export const WhatsAppChatBot: React.FC<WhatsAppChatBotProps> = ({ clinics }) => {
  const primaryClinic = clinics?.find((c) => c.id === 'belgaum') ?? clinics?.[0];
  const clinicPhone = primaryClinic?.phone || '8762465349';
  const clinicMap = primaryClinic
    ? primaryClinic.googleMapEmbedUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${primaryClinic.address}, ${primaryClinic.city}`)}`
    : 'https://goo.gl/maps/VbZETwutJjYMSpqU9';
  const clinicAddress = primaryClinic
    ? `${primaryClinic.address}${primaryClinic.landmark ? `, ${primaryClinic.landmark}` : ''}, ${primaryClinic.city} (${primaryClinic.state}) — ${primaryClinic.phone}`
    : "Yallur Road, Vadagaon, Opp. Kalpvruksh Hotel, Belgaum (Belagavi), Karnataka – 590005.";

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return [
      {
        id: 'init-1',
        sender: 'ai',
        text: `Namaste! 🙏 I am the AI Medical Assistant for Dr. Dravid's Homoeopathic Clinic.\n\nI can help you with information about:\n• Clinic locations & timings\n• Doctors & their qualifications\n• Services & treatments offered\n• Clinic rules & contact details\n\nWhat would you like to know?`,
        time: timeNow,
        options: [
          { label: '🕒 Clinic Hours & Days', action: () => handleQuickQuery('hours') },
          { label: '📍 Clinic Location', action: () => handleQuickQuery('location') },
          { label: '👨‍⚕️ Doctor Info', action: () => handleQuickQuery('doctor') },
          { label: '📞 Contact Clinic', action: () => handleQuickQuery('contact') },
        ]
      }
    ];
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const addAiMessage = (text: string, options?: { label: string; action: () => void }[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text,
          time: timeNow,
          options
        }
      ]);
    }, 400);
  };

  const addUserMessage = (text: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        sender: 'user',
        text,
        time: timeNow
      }
    ]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const handleQuickQuery = (type: string) => {
    switch(type) {
      case 'hours': {
        const hoursText = primaryClinic ? 
          `🕒 **Clinic Hours (Belgaum):**\n${primaryClinic.timings.map(t => `• ${t}`).join('\n')}\n\nSaturday & Sunday: CLOSED` :
          'Please select a clinic from the website.';
        addAiMessage(hoursText);
        break;
      }
      case 'location': {
        addAiMessage(
          `📍 **Clinic Address:**\n${clinicAddress}\n\n🗺️ Google Maps: ${clinicMap}`,
          [{ label: '🗺️ Open Map', action: () => window.open(clinicMap, '_blank') }]
        );
        break;
      }
      case 'doctor': {
        addAiMessage(
          `👨‍⚕️ **Dr. Yogesh Dravid**\n\n• Designation: Senior Homoeopathic Consultant & Professor\n• HOD, Dept. of Physiology, Bharatesh Homeopathic Medical College\n• 19+ years clinical, 17+ years teaching\n• Specializes in chronic, autoimmune, skin, respiratory, and neurological disorders.`
        );
        break;
      }
      case 'contact': {
        addAiMessage(
          `📞 **Contact the Clinic:**\n\nBelgaum Clinic: ${clinicPhone}\n\n⚠️ **Important:** Appointments are NOT booked through this website. Please call the clinic directly to book your appointment.`,
          [
            { label: `📞 Call ${clinicPhone}`, action: () => window.open(`tel:${clinicPhone}`) },
          ]
        );
        break;
      }
      default: {
        addAiMessage(
          `I can help with clinic hours, location, doctor details, services, and contact information. Please ask your question.`
        );
      }
    }
  };

  const resetConversation = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'reset-' + Date.now(),
        sender: 'ai',
        text: `Conversation restarted. How can I assist you today?`,
        time: timeNow,
        options: [
          { label: '🕒 Clinic Hours', action: () => handleQuickQuery('hours') },
          { label: '📍 Location', action: () => handleQuickQuery('location') },
          { label: '👨‍⚕️ Doctor', action: () => handleQuickQuery('doctor') },
          { label: '📞 Contact', action: () => handleQuickQuery('contact') },
        ]
      }
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const text = inputMessage.trim();
    setInputMessage('');
    addUserMessage(text);

    const lower = text.toLowerCase();

    // Match keywords to provide info
    if (lower.includes('hour') || lower.includes('timing') || lower.includes('open') || lower.includes('when')) {
      handleQuickQuery('hours');
    } else if (lower.includes('where') || lower.includes('location') || lower.includes('address') || lower.includes('map')) {
      handleQuickQuery('location');
    } else if (lower.includes('doctor') || lower.includes('dr') || lower.includes('qualification') || lower.includes('experience')) {
      handleQuickQuery('doctor');
    } else if (lower.includes('contact') || lower.includes('phone') || lower.includes('call')) {
      handleQuickQuery('contact');
    } else if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('consult') || lower.includes('request') || lower.includes('slot')) {
      // Booking inquiry - direct to call
      addAiMessage(
        `⚠️ **Appointments are not booked through this website.**\n\nPlease call the clinic directly to book your appointment. The clinic team will assist you with availability and scheduling.\n\n📞 ${clinicPhone}`,
        [
          { label: `📞 Call ${clinicPhone}`, action: () => window.open(`tel:${clinicPhone}`) },
        ]
      );
    } else if (lower.includes('service') || lower.includes('treat') || lower.includes('condition') || lower.includes('specialty')) {
      addAiMessage(
        `🏥 **Clinical Services Offered:**\n\n• Constitutional Homoeopathy\n• Chronic & Autoimmune Ailments\n• Dermatology & Hair Care\n• Allergies & Respiratory Health\n• Pediatric Care\n• Women's Health & Hormones\n\nFor a full list, visit the website's "Conditions We Treat" section.`
      );
    } else if (lower.includes('rule') || lower.includes('instruction') || lower.includes('prepare') || lower.includes('bring')) {
      addAiMessage(
        `📋 **Clinic Rules & Instructions:**\n\n• Appointments are booked directly through the clinic by phone.\n• Please arrive on time once your appointment is confirmed.\n• Bring previous medical records and prescriptions.\n• Maintain cleanliness and silence in the clinic.\n• Cooperate with staff.\n• Avoid repeated non-emergency calls during consultation hours.\n• Respect patient privacy and follow the appointment sequence.`
      );
    } else {
      // General fallback
      addAiMessage(
        `Thank you for your message. I can provide information about clinic hours, location, doctors, services, and contact details. Please ask a specific question or select one of the options below.`,
        [
          { label: '🕒 Hours', action: () => handleQuickQuery('hours') },
          { label: '📍 Location', action: () => handleQuickQuery('location') },
          { label: '👨‍⚕️ Doctor', action: () => handleQuickQuery('doctor') },
          { label: '📞 Contact', action: () => handleQuickQuery('contact') },
        ]
      );
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
        {!isOpen && (
          <div 
            onClick={handleOpen}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all animate-bounce"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[#075E54] font-bold">AI Assistant</span>
          </div>
        )}

        <button
          id="whatsapp-chatbot-toggle"
          onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Open AI Assistant"
        >
          {isOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                  1
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Chat Window - mobile friendly */}
      {isOpen && (
        <div 
          id="whatsapp-chat-window"
          className="fixed bottom-16 sm:bottom-22 right-2 sm:right-6 left-2 sm:left-auto w-[calc(100vw-16px)] sm:w-[425px] h-[65vh] sm:h-[610px] max-h-[calc(100dvh-6rem)] bg-[#ECE5DD] rounded-3xl shadow-2xl border border-slate-300 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/images/dr_yogesh_dravid.jpg" 
                  alt="Dr. Yogesh Dravid" 
                  className="w-10 h-10 rounded-full object-cover border border-emerald-300/40 bg-white"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#075E54] rounded-full"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm leading-tight text-white">Clinic Assistant</span>
                  <span className="bg-emerald-500 text-white rounded-full p-0.5" title="Verified Clinic Channel">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>Information & Guidance</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetConversation}
                className="p-1.5 hover:bg-white/10 rounded-full text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Info Ribbon */}
          <div className="bg-[#128C7E] text-white text-[11px] py-1.5 px-3 flex items-center justify-between text-center shrink-0">
            <span className="mx-auto font-medium truncate">
              ⚠️ Appointments are NOT booked via website. Call the clinic.
            </span>
          </div>

          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs bg-[radial-gradient(#d1d7db_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <div 
                    className={`max-w-[90%] rounded-2xl p-3 shadow-xs relative ${
                      isAi 
                        ? 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/70' 
                        : 'bg-[#DCF8C6] text-slate-900 rounded-tr-xs border border-emerald-200/50'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">
                      {msg.text}
                    </div>

                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                        {msg.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={opt.action}
                            className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/90 text-emerald-950 text-[11px] font-semibold transition-colors cursor-pointer group"
                          >
                            <span>{opt.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-600 font-medium">
                      <span>{msg.time}</span>
                      {isAi ? null : <CheckCheck className="w-3 h-3 text-blue-600 font-bold" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-white text-slate-700 text-xs w-20 shadow-xs border border-slate-200 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="bg-[#f0f2f5] px-3 py-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => handleQuickQuery('hours')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-[11px] font-bold border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
            >
              🕒 Hours
            </button>
            <button
              onClick={() => handleQuickQuery('location')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-950 text-[11px] font-bold border border-teal-300 shadow-2xs transition-colors cursor-pointer"
            >
              📍 Location
            </button>
            <button
              onClick={() => handleQuickQuery('doctor')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-[11px] font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              👨‍⚕️ Doctor
            </button>
            <button
              onClick={() => handleQuickQuery('contact')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-[11px] font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              📞 Contact
            </button>
          </div>

          {/* Chat Input Bar */}
          <form 
            onSubmit={handleSendMessage}
            className="bg-[#f0f2f5] p-2.5 flex items-center gap-2 border-t border-slate-200 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about clinic info..."
              className="flex-1 px-3.5 py-2 rounded-full bg-white text-xs border border-slate-300 focus:outline-none focus:border-[#075E54] shadow-inner text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="w-9 h-9 rounded-full bg-[#075E54] hover:bg-[#064e46] disabled:opacity-50 text-white flex items-center justify-center shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};