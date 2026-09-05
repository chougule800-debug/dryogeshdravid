import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  User,
  Calendar,
  RotateCcw,
  Bot,
  ChevronRight,
  MessageCircle,
  Stethoscope,
  Info
} from 'lucide-react';
import { ClinicLocation } from '../types';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  isConfirmationSlip?: boolean;
  appointmentDetails?: {
    patientName: string;
    type: 'New Case' | 'Follow-up Case';
    day: string;
    time: string;
    phone: string;
    condition?: string;
  };
  options?: { label: string; action: () => void }[];
}

type BookingStep = 'idle' | 'select_type' | 'select_day' | 'select_time' | 'enter_name' | 'enter_phone' | 'enter_condition' | 'completed';

interface WhatsAppChatBotProps {
  clinics?: ClinicLocation[];
}

export const WhatsAppChatBot: React.FC<WhatsAppChatBotProps> = ({ clinics }) => {
  // Primary clinic = the Belgaum/Vadagaon branch, falls back to any clinic.
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
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Conversational AI State Machine
  const [bookingStep, setBookingStep] = useState<BookingStep>('idle');
  const [apptType, setApptType] = useState<'New Case' | 'Follow-up Case'>('New Case');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientCondition, setPatientCondition] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate upcoming Monday to Friday dates dynamically
  const upcomingWeekdays = React.useMemo(() => {
    const days: { label: string; dateStr: string; dayName: string }[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayNum = d.getDay();
      if (dayNum !== 0 && dayNum !== 6) { // Mon-Fri only
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        days.push({
          label: `${dayName}, ${dateStr}`,
          dateStr,
          dayName
        });
        if (days.length >= 5) break;
      }
    }
    return days;
  }, []);

  const generateSlipText = (name: string, dateText: string, timeText: string) => {
    return `Dear ${name || 'Patient'}, 

your appointment at Dr DRAVID'S HOMOEOPATHIC CLINIC on ${dateText || 'Monday, 24 Aug'}, ${timeText || '12:30 PM'} has been confirmed. 

Please call ${clinicPhone} for any changes.

Website: no website appointments

Location: ${clinicMap}

Note: Your appointment at Dr. DRAVID’S HOMOEOPATHIC CLINIC has been confirmed. 🩺

For any changes or appointment-related queries, please call ${clinicPhone}.

📍 Location:
${clinicMap}

Important Instructions: 

Please book your tentative consultation or follow‑up slot one day in advance at Belagavi Clinic.

Please arrive on time for your scheduled appointment. If you are unable to attend, kindly inform us in advance.

Please bring all previous medical records, investigation reports, and prescriptions.`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return [
      {
        id: 'init-1',
        sender: 'ai',
        text: `Namaste! 🙏 I am the AI Medical Assistant for Dr. Dravid's Homoeopathic Clinic.\n\nHow can I help you today? Please choose an option or type your request below:`,
        time: timeNow,
      }
    ];
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const addAiMessage = (text: string, options?: { label: string; action: () => void }[], isSlip?: boolean, apptData?: any) => {
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
          options,
          isConfirmationSlip: isSlip,
          appointmentDetails: apptData
        }
      ]);
    }, 450);
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

  // Conversational Flow Handlers
  const startAppointmentFlow = (type?: 'New Case' | 'Follow-up Case') => {
    if (type) {
      setApptType(type);
      setBookingStep('select_day');
      addUserMessage(`Book ${type} Appointment`);
      
      const sessionNote = type === 'New Case' 
        ? `☀️ *Morning Session (12:00 PM – 2:00 PM)* is exclusively reserved for New Cases with in-depth constitutional case taking.`
        : `🌙 *Evening Session (6:00 PM – 8:00 PM)* is reserved for Follow-up Consultations.`;

      addAiMessage(
        `Understood! You are scheduling a *${type}*.\n\n${sessionNote}\n\n📅 *Step 1/4: Please select your preferred day* (Monday to Friday; Saturday & Sunday are Closed):`,
        upcomingWeekdays.map(d => ({
          label: d.label,
          action: () => handleSelectDay(d.label, type)
        }))
      );
    } else {
      setBookingStep('select_type');
      addUserMessage(`I'd like to book an appointment`);
      addAiMessage(
        `Are you consulting Dr. Yogesh Dravid for the *first time (New Case)* or is this a *routine Follow-up*?`,
        [
          {
            label: '🩺 New Case (Morning: 12 PM - 2 PM)',
            action: () => startAppointmentFlow('New Case')
          },
          {
            label: '🔄 Follow-up Case (Evening: 6 PM - 8 PM)',
            action: () => startAppointmentFlow('Follow-up Case')
          }
        ]
      );
    }
  };

  const handleSelectDay = (dayStr: string, currentType: 'New Case' | 'Follow-up Case') => {
    setSelectedDay(dayStr);
    setBookingStep('select_time');
    addUserMessage(dayStr);

    const slots = currentType === 'New Case'
      ? ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM']
      : ['06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'];

    addAiMessage(
      `Great! For *${dayStr}*, please select a preferred consultation time slot:`,
      slots.map(slot => ({
        label: `${slot} (${currentType === 'New Case' ? 'Morning OPD' : 'Evening OPD'})`,
        action: () => handleSelectTime(slot, dayStr, currentType)
      }))
    );
  };

  const handleSelectTime = (timeStr: string, dayStr: string, currentType: 'New Case' | 'Follow-up Case') => {
    setSelectedTime(timeStr);
    setBookingStep('enter_name');
    addUserMessage(timeStr);

    addAiMessage(
      `Selected slot: *${dayStr} at ${timeStr}*.\n\n👤 *Step 3/4: Please enter the Patient's Full Name* (type in the box below):`
    );
  };

  const handleCompleteBooking = (name: string, phone: string, condition: string) => {
    setBookingStep('completed');
    const fullSlip = generateSlipText(name, selectedDay || 'Monday, 24 Aug', selectedTime || '12:30 PM');
    
    addAiMessage(
      `🎉 *Appointment Slip Generated for ${name}!* 🩺\n\nHere is your official appointment confirmation and patient guidelines. You can copy this slip or call ${clinicPhone} to finalize:`,
      undefined,
      true,
      {
        patientName: name,
        type: apptType,
        day: selectedDay || 'Monday, 24 Aug',
        time: selectedTime || '12:30 PM',
        phone: phone || clinicPhone,
        condition: condition || 'Constitutional evaluation'
      }
    );
  };

  // Reset conversation
  const handleResetConversation = () => {
    setBookingStep('idle');
    setApptType('New Case');
    setSelectedDay('');
    setSelectedTime('');
    setPatientName('');
    setPatientPhone('');
    setPatientCondition('');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'reset-' + Date.now(),
        sender: 'ai',
        text: `Conversation restarted. How can I assist you today?`,
        time: timeNow
      }
    ]);
  };

  // Natural Language Input / Step Input Handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const text = inputMessage.trim();
    setInputMessage('');
    addUserMessage(text);

    // If currently in conversational step collection:
    if (bookingStep === 'enter_name') {
      setPatientName(text);
      setBookingStep('enter_phone');
      addAiMessage(
        `Thank you, *${text}*.\n\n📞 *Step 4/4: Please provide your Contact Phone Number* (e.g. ${clinicPhone}):`
      );
      return;
    }

    if (bookingStep === 'enter_phone') {
      setPatientPhone(text);
      setBookingStep('enter_condition');
      addAiMessage(
        `Got it (*${text}*).\n\n🩺 *Briefly mention the health concern or symptoms* (e.g., chronic migraine, eczema, acidity, pediatric cough, or type 'General'):`
      );
      return;
    }

    if (bookingStep === 'enter_condition') {
      setPatientCondition(text);
      handleCompleteBooking(patientName, patientPhone, text);
      return;
    }

    // Natural Language AI Understanding Engine
    const lower = text.toLowerCase();

    if (lower.includes('new') && (lower.includes('appoint') || lower.includes('case') || lower.includes('book'))) {
      startAppointmentFlow('New Case');
      return;
    }

    if ((lower.includes('follow') || lower.includes('old') || lower.includes('routine')) && (lower.includes('appoint') || lower.includes('book'))) {
      startAppointmentFlow('Follow-up Case');
      return;
    }

    if (lower.includes('appoint') || lower.includes('book') || lower.includes('slot') || lower.includes('schedule')) {
      startAppointmentFlow();
      return;
    }

    if (lower.includes('hour') || lower.includes('timing') || lower.includes('time') || lower.includes('open') || lower.includes('schedule') || lower.includes('when')) {
      addAiMessage(
        `🕒 *DR. DRAVID'S CLINICAL CONSULTING HOURS*:\n\n• *Monday to Friday*:\n  ☀️ *Morning Session*: 12:00 PM – 2:00 PM (Exclusively for New Cases)\n  🌙 *Evening Session*: 6:00 PM – 8:00 PM (Only Follow-Up Cases)\n\n• *Saturday & Sunday*: CLOSED\n\n📌 *Important*: Calls & messages outside consulting hours are answered later. WhatsApp is for information only; prior phone booking on ${clinicPhone} is mandatory.`,
        [
          { label: '📅 Book New Case (12 PM - 2 PM)', action: () => startAppointmentFlow('New Case') },
          { label: '🔄 Book Follow-up (6 PM - 8 PM)', action: () => startAppointmentFlow('Follow-up Case') }
        ]
      );
      return;
    }

    if (lower.includes('map') || lower.includes('location') || lower.includes('where') || lower.includes('address') || lower.includes('vadagaon') || lower.includes('hotel') || lower.includes('belgaum')) {
      addAiMessage(
        `📍 *CLINIC ADDRESS & LOCATION*:\n\n*Dr. Dravid's Homoeopathic Clinic*\n${clinicAddress}\n\n🗺️ *Google Maps Link*:\n${clinicMap}\n\n📞 Clinic Phone: ${clinicPhone}`,
        [
          { label: '🗺️ Open Google Maps Link', action: () => window.open(clinicMap, '_blank') },
          { label: `📞 Call ${clinicPhone}`, action: () => window.open(`tel:${clinicPhone}`) }
        ]
      );
      return;
    }

    if (lower.includes('doctor') || lower.includes('dr') || lower.includes('yogesh') || lower.includes('dravid') || lower.includes('qualification') || lower.includes('professor') || lower.includes('experience')) {
      addAiMessage(
        `👨‍⚕️ *DR. YOGESH DRAVID*:\n\n• *Designation*: Senior Homoeopathic Consultant & Professor\n• *Academic Role*: Head of the Department (HOD) of Human Physiology at Bharatesh Homeopathic Medical College & Hospital, Belgaum.\n• *Qualifications*: B.H.M.S, M.D. (Hom)\n• *Experience*: 24+ Years of clinical mastery in classical constitutional homeopathy.\n• *Specialty*: Chronic intractable diseases, gastrointestinal, autoimmune, respiratory, dermatology, and neurological disorders.`,
        [
          { label: '📅 Schedule Consultation', action: () => startAppointmentFlow() },
          { label: `📞 Call ${clinicPhone}`, action: () => window.open(`tel:${clinicPhone}`) }
        ]
      );
      return;
    }

    if (lower.includes('whatsapp') || lower.includes('policy') || lower.includes('message') || lower.includes('phone') || lower.includes('call')) {
      addAiMessage(
        `⚠️ *IMPORTANT NOTICE ON WHATSAPP & BOOKINGS*:\n\n• *WhatsApp is only for patient's information.*\n• Please *do NOT text or WhatsApp* for seeking appointments.\n• Please *call ${clinicPhone}* to book your tentative slot one day in advance at Belagavi Clinic.\n• Avoid repeated calls/messages for the same concern.\n• Patients are requested to maintain their scheduled time slot strictly.`,
        [
          { label: `📞 Call ${clinicPhone} Now`, action: () => window.open(`tel:${clinicPhone}`) }
        ]
      );
      return;
    }

    if (lower.includes('instruction') || lower.includes('bring') || lower.includes('report') || lower.includes('prepare')) {
      addAiMessage(
        `📋 *INSTRUCTIONS FOR PATIENT CONSULTATION*:\n\n1. *Advance Booking*: Book tentative consultation or follow-up slot one day in advance at Belagavi Clinic (Call ${clinicPhone}).\n2. *Punctuality*: Arrive on time for your scheduled slot. If unable to attend, kindly inform in advance.\n3. *Medical Records*: Please bring all previous medical records, diagnostic lab investigation reports, and current prescriptions.`,
        [
          { label: '📅 Book Now', action: () => startAppointmentFlow() }
        ]
      );
      return;
    }

    // Default friendly AI response with quick suggestion chips
    addAiMessage(
      `Thank you for your message. I am Dr. Dravid's Clinic AI Assistant.\n\nWould you like to book an appointment, check the morning/evening schedule, or find clinic location?`,
      [
        { label: '🩺 New Case Appointment', action: () => startAppointmentFlow('New Case') },
        { label: '🔄 Follow-up Appointment', action: () => startAppointmentFlow('Follow-up Case') },
        { label: '🕒 Consulting Hours', action: () => handleSendMessageDirect('What are consulting hours?') },
        { label: '📍 Clinic Location', action: () => handleSendMessageDirect('Where is the clinic?') }
      ]
    );
  };

  const handleSendMessageDirect = (query: string) => {
    addUserMessage(query);
    setTimeout(() => {
      const lower = query.toLowerCase();
      if (lower.includes('hour') || lower.includes('timing')) {
        addAiMessage(
          `🕒 *CONSULTING HOURS*:\n\n• *Mon–Fri Morning (12–2 PM)*: New Cases Only\n• *Mon–Fri Evening (6–8 PM)*: Follow-Up Cases Only\n• *Saturday & Sunday*: CLOSED`,
          [
            { label: '🩺 Book New Case', action: () => startAppointmentFlow('New Case') },
            { label: '🔄 Book Follow-up', action: () => startAppointmentFlow('Follow-up Case') }
          ]
        );
      } else if (lower.includes('where') || lower.includes('location')) {
        addAiMessage(
          `📍 *LOCATION*: ${clinicAddress}\n🗺️ ${clinicMap}\n📞 Call: ${clinicPhone}`
        );
      }
    }, 400);
  };

  const handleCopySlip = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
            <span className="text-[#075E54] font-bold">AI Assistant &amp; Booking Bot</span>
          </div>
        )}

        <button
          id="whatsapp-chatbot-toggle"
          onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Open WhatsApp AI Assistant"
        >
          {isOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <>
              {/* WhatsApp custom SVG icon */}
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

      {/* WhatsApp AI Agent Window */}
      {isOpen && (
        <div 
          id="whatsapp-chat-window"
          className="fixed bottom-22 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[425px] h-[610px] max-h-[85vh] bg-[#ECE5DD] rounded-3xl shadow-2xl border border-slate-300 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between shadow-md">
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
                  <span className="font-bold text-sm leading-tight text-white">Dr. Dravid AI Agent</span>
                  <span className="bg-emerald-500 text-white rounded-full p-0.5" title="Verified Clinic Channel">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>Interactive Clinical Assistant</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetConversation}
                className="p-1.5 hover:bg-white/10 rounded-full text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <a
                href={`tel:${clinicPhone}`}
                className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors"
                title={`Call Clinic Helpline at ${clinicPhone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
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
          <div className="bg-[#128C7E] text-white text-[11px] py-1.5 px-3 flex items-center justify-between text-center">
            <span className="mx-auto font-medium truncate">
              ⚠️ WhatsApp is for patient info only. Call <strong>{clinicPhone}</strong> for booking.
            </span>
          </div>

          {/* Active Flow Step Tracker Banner */}
          {bookingStep !== 'idle' && bookingStep !== 'completed' && (
            <div className="bg-emerald-100/90 border-b border-emerald-300/80 px-3.5 py-1.5 text-[11px] text-emerald-950 font-bold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                <span>Scheduling {apptType}</span>
              </div>
              <button
                onClick={handleResetConversation}
                className="text-[10px] text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

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
                    {/* Confirmation Slip Card */}
                    {msg.isConfirmationSlip ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px] font-bold text-emerald-800">
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>OFFICIAL APPOINTMENT SLIP</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Ready to Send
                          </span>
                        </div>

                        <div className="whitespace-pre-line font-sans text-xs leading-relaxed text-slate-800 select-all bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                          {generateSlipText(
                            msg.appointmentDetails?.patientName || '',
                            msg.appointmentDetails?.day || '',
                            msg.appointmentDetails?.time || ''
                          )}
                        </div>

                        {/* Slip Actions */}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleCopySlip(generateSlipText(
                              msg.appointmentDetails?.patientName || '',
                              msg.appointmentDetails?.day || '',
                              msg.appointmentDetails?.time || ''
                            ))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1fb355] text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copied to Clipboard!' : 'Copy WhatsApp Slip'}</span>
                          </button>

                          <a
                            href={`tel:${clinicPhone}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#075E54] hover:bg-[#064e46] text-white text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            <Phone className="w-3 h-3 text-emerald-300" />
                            <span>Call {clinicPhone}</span>
                          </a>

                          <a
                            href={clinicMap}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                          >
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span>Open Map</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line leading-relaxed">
                        {msg.text}
                      </div>
                    )}

                    {/* Interactive Choice Option Chips */}
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

            {/* AI Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-white text-slate-700 text-xs w-20 shadow-xs border border-slate-200 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Category Chips */}
          <div className="bg-[#f0f2f5] px-3 py-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => startAppointmentFlow('New Case')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-[11px] font-bold border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
            >
              🩺 New Appointment
            </button>
            <button
              onClick={() => startAppointmentFlow('Follow-up Case')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-950 text-[11px] font-bold border border-teal-300 shadow-2xs transition-colors cursor-pointer"
            >
              🔄 Follow-up Appointment
            </button>
            <button
              onClick={() => handleSendMessageDirect('What are consulting hours?')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-[11px] font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              🕒 Hours &amp; Days
            </button>
            <button
              onClick={() => handleSendMessageDirect('Where is the clinic located?')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-[11px] font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              📍 Location
            </button>
          </div>

          {/* Chat Input Bar */}
          <form 
            onSubmit={handleSendMessage}
            className="bg-[#f0f2f5] p-2.5 flex items-center gap-2 border-t border-slate-200"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                bookingStep === 'enter_name' 
                  ? "Enter patient's full name..." 
                  : bookingStep === 'enter_phone' 
                  ? "Enter phone number..." 
                  : bookingStep === 'enter_condition'
                  ? "Enter condition (e.g. Migraine, Allergy)..."
                  : "Type query or select an option above..."
              }
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
