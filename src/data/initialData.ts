import { Doctor, ClinicLocation, PrePostCase, GalleryItem, BlogPost, Testimonial, ClinicalServiceItem } from '../types';

export const DOCTORS: Doctor[] = [
  {
    id: 'dr-yogesh-dravid',
    name: 'Dr. Yogesh Dravid',
    designation: 'Senior Homoeopathic Consultant & Professor',
    qualification: 'B.H.M.S, M.D. (Hom), Senior Clinical Practitioner',
    role: 'HOD Department of Physiology',
    experienceYears: 24,
    image: '/images/dr_yogesh_dravid.jpg',
    department: 'Department of Human Physiology & Clinical Homoeopathy',
    academicAffiliation: 'Bharatesh Homeopathic Medical College & Hospital, Belgaum',
    bio: 'Dr. Yogesh Dravid is a distinguished Homoeopathic Physician, Professor, and Head of the Department of Physiology at Bharatesh Homeopathic Medical College, Belgaum. With over two decades of clinical mastery, Dr. Dravid merges profound physiological insight with classical Hahnemannian homeopathy to address chronic, deep-seated, and recurring pathological conditions.',
    specializations: [
      'Constitutional Classical Homoeopathy',
      'Chronic Intractable Diseases',
      'Physiology-Aligned Holistic Therapeutics',
      'Allergy, Asthma & Respiratory Disorders',
      'Autoimmune & Dermatological Conditions',
      'Neurological & Psychosomatic Disorders',
    ],
  },
];

export const CLINICS: ClinicLocation[] = [
  {
    id: 'belgaum',
    name: "Dr. Dravid's Homoeopathic Clinic",
    tagline: 'Main Clinical Centre & Dispensary',
    address: 'Yallur Road, Vadagaon, Opp. Kalpvruksh Hotel',
    landmark: 'Opposite Kalpvruksh Hotel, Vadagaon',
    city: 'Belgaum (Belagavi)',
    state: 'Karnataka - 590005',
    phone: '8762465349',
    alternatePhone: '+91 8762465349',
    email: 'drdravidclinic@gmail.com',
    timings: [
      'Monday – Friday (Morning): 12:00 PM – 2:00 PM (Exclusively for New Cases)',
      'Monday – Friday (Evening): 6:00 PM – 8:00 PM (Only Follow-Up Cases)',
      'Saturday & Sunday: Closed',
    ],
    scheduleNote: 'Morning session is exclusively for new cases. Evening session is only for follow-up cases (new cases only in acute emergencies). Saturday & Sunday closed.',
    isSpecialSchedule: false,
    mapQuery: "Dr Dravid's Homoeopathic Clinic, Vadagaon, Yallur road, Belgaum",
    googleMapEmbedUrl: 'https://www.google.com/maps?q=Yallur+road+vadagaon+opp+Kalpvruksh+hotel+Belgaum&output=embed',
  },
  {
    id: 'goa',
    name: 'Goa Consultation Branch (Quepem)',
    tagline: 'Visiting Specialist Clinic at Vidhishree Clinic',
    address: 'Dr. Trupti Naik’s Vidhishree Ayurvedic Clinic, Dasha Arcade, Beside HDFC Bank',
    landmark: 'Beside HDFC Bank, Dasha Arcade',
    city: 'Quepem, South Goa',
    state: 'Goa - 403705',
    phone: '8762465349',
    email: 'drdravidclinic@gmail.com',
    timings: [
      'Every Second Sunday of the Month: 10:00 AM to 2:00 PM (Sharp)',
    ],
    scheduleNote: 'Special monthly clinical visit by Dr. Yogesh Dravid. Prior phone booking is mandatory.',
    isSpecialSchedule: true,
    specialRule: 'Every Second Sunday (10:00 AM – 2:00 PM)',
    mapQuery: 'Dasha arcade Beside HDFC Bank Quepem South Goa',
    googleMapEmbedUrl: 'https://www.google.com/maps?q=Dasha+arcade+Beside+HDFC+Bank+Quepem+South+Goa&output=embed',
  },
];

export const INITIAL_PRE_POST_CASES: PrePostCase[] = [
  {
    id: 'case-1',
    title: 'Severe Chronic Plaque Psoriasis with Scaling',
    condition: 'Chronic Psoriasis Vulgaris',
    category: 'Skin',
    patientAgeGender: '38 Yrs, Male',
    durationOfTreatment: '4 Months',
    beforeImage: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=700',
    afterImage: 'https://images.unsplash.com/photo-1512290900672-1f48615b81a4?auto=format&fit=crop&q=80&w=700',
    remedyPrescribed: 'Arsenicum Album 200CH followed by Sulphur 1M (Constitutional)',
    description: 'Patient presented with extensive silvery scaly erythema across bilateral forearms and legs with intense itching and burning aggravated in cold weather. Allopathic steroid topicals had only provided temporary suppression.',
    outcomeNotes: 'Complete clearance of psoriatic plaques, restoration of normal epidermal texture with no recurrence over 18 months of follow-up.',
    dateAdded: '2026-06-15',
  },
  {
    id: 'case-2',
    title: 'Alopecia Areata (Patchy Hair Loss) in Young Adult',
    condition: 'Alopecia Areata Totalis',
    category: 'Hair',
    patientAgeGender: '26 Yrs, Female',
    durationOfTreatment: '3.5 Months',
    beforeImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=700',
    afterImage: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=700',
    remedyPrescribed: 'Phosphorus 200CH & Fluoricum Acidum 30C',
    description: 'Sudden onset of smooth circular bald patches on scalp following severe exam stress and emotional grief. Hair shafts exhibited characteristic exclamation mark hairs.',
    outcomeNotes: 'Complete follicular regeneration with thick, natural pigmented hair growth filling all bald spots.',
    dateAdded: '2026-07-02',
  },
  {
    id: 'case-3',
    title: 'Recurrent Childhood Allergic Bronchitis & Wheezing',
    condition: 'Pediatric Allergic Asthma',
    category: 'Pediatric',
    patientAgeGender: '7 Yrs, Male',
    durationOfTreatment: '5 Months',
    beforeImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=700',
    afterImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=700',
    remedyPrescribed: 'Tuberculinum Bovinum 200C followed by Natrum Sulphuricum 30C',
    description: 'Child had weekly attacks of nocturnal dyspnea, dry spasmodic cough, and severe dust allergy requiring regular nebulization and bronchodilators.',
    outcomeNotes: 'Nebulizers tapered off completely within 6 weeks. Child is now active in outdoor sports with zero respiratory distress.',
    dateAdded: '2026-07-20',
  },
  {
    id: 'case-4',
    title: 'Multiple Recurrent Facial & Palmar Verrucae (Warts)',
    condition: 'Verruca Vulgaris',
    category: 'Skin',
    patientAgeGender: '19 Yrs, Male',
    durationOfTreatment: '6 Weeks',
    beforeImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=700',
    afterImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=700',
    remedyPrescribed: 'Thuja Occidentalis 1M & Causticum 200C',
    description: 'Painful, bleeding verrucous growths on right cheek and palmar surface that had recurred twice after surgical electrocautery.',
    outcomeNotes: 'Painless withering and natural detachment of all warts within 45 days, leaving flawless scar-free skin.',
    dateAdded: '2026-08-01',
  },
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: "Dr. Yogesh Dravid's Consultation Chamber",
    category: 'Consultation',
    imageUrl: '/images/dr_yogesh_dravid.jpg',
    caption: 'Dr. Yogesh Dravid at the consultation desk with portrait of Dr. Samuel Hahnemann at the Belgaum Clinic.',
    date: 'Belgaum Clinic',
  },
  {
    id: 'gal-3',
    title: 'Homeopathic Pharmacy & Potentized Dilutions',
    category: 'Pharmacy',
    imageUrl: '/images/homeopathy_hero_banner_1787248330468.jpg',
    caption: 'Pure lactose globules, mother tinctures, and German dilution potencies prepared under strict hygienic standards.',
    date: 'Dispensary',
  },
  {
    id: 'gal-4',
    title: 'Bharatesh Homeopathic Medical College Faculty & Research',
    category: 'Academic',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=900',
    caption: 'Academic seminars, pharmacy laboratory research, and physiological lectures led by faculty professors.',
    date: 'Belgaum Academic Wing',
  },
  {
    id: 'gal-5',
    title: 'Goa Quepem Consultation Centre (Vidhishree Clinic)',
    category: 'Clinic',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=900',
    caption: 'Comfortable waiting lounge and consultation room for Goa second-Sunday patient appointments.',
    date: 'Quepem, South Goa',
  },
  {
    id: 'gal-6',
    title: 'Herbal Potentization & Botanical Extraction',
    category: 'Pharmacy',
    imageUrl: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&q=80&w=900',
    caption: 'Preserving medicinal plants and dynamic phytochemical principles in accordance with Organon of Medicine.',
    date: 'Clinical Laboratory',
  },
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Why Human Physiology is the Foundation of True Constitutional Prescribing',
    slug: 'physiology-foundation-constitutional-homeopathy',
    author: 'Prof. Dr. Yogesh Dravid',
    authorRole: 'HOD Physiology, Bharatesh Homoeopathic Medical College',
    category: 'Clinical Physiology & Homeopathy',
    publishedDate: 'August 14, 2026',
    readTime: '6 min read',
    excerpt: 'Understanding physiological homeostasis, autonomic tone, and cellular adaptation enables a homoeopath to identify the true constitutional remedy with pinpoint accuracy.',
    coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=900',
    tags: ['Physiology', 'Constitutional Care', 'Medical Education', 'Hahnemann'],
    content: `Human physiology is the science of life — the study of how organ systems maintain dynamic equilibrium (homeostasis) in the face of environmental stressors. In classical Homoeopathy, disease is never an isolated local event; it is a disturbance in the internal vital force, which manifests through altered physiological feedback mechanisms.

### The Autonomic Bridge
Every individual responds to thermal changes, emotional grief, dietary intake, and physical exhaustion according to their autonomic nervous predisposition. When we assess symptoms like perspiration patterns, sleep architecture, thermoregulation (chilly vs. hot constitution), and digestive enzyme secretions, we are directly measuring the patient's individual physiological baseline.

### Moving Beyond Symptom Suppression
Modern pharmacological suppressions frequently block receptor sites without restoring the intrinsic autoregulatory pathways. Constitutional homoeopathic remedies, administered in micro-potencies, act as biophysical stimulus signals that prompt the neuro-endocrine-immune axis to reset its own regulatory balance.

At Dr. Dravid's Clinic, our clinical diagnostic method bridges deep physiological analysis with Hahnemannian repertorization, ensuring every prescription matches the core blueprint of the individual.`,
  },
  {
    id: 'post-2',
    title: 'Holistic Homeopathic Solutions for Chronic Skin Disorders: Eczema & Psoriasis',
    slug: 'homeopathy-for-chronic-skin-eczema-psoriasis',
    author: 'Dr. Prachi Dravid',
    authorRole: 'Consultant Homoeopath',
    category: 'Dermatology & Immunity',
    publishedDate: 'July 28, 2026',
    readTime: '5 min read',
    excerpt: 'The skin is a mirror of internal gut health, immune reactivity, and emotional strain. Why topical creams fail, and how homeopathy addresses the root cause.',
    coverImage: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=900',
    tags: ['Skin Health', 'Eczema', 'Psoriasis', 'Immunity'],
    content: `When a patient comes in with chronic eczema or psoriasis, the instinct of modern allopathy is often to prescribe topical corticosteroid ointments. While this may temporarily clear the surface rash, it forces the inflammatory miasm inwards, frequently triggering secondary allergic bronchitis or metabolic distress.

### The Homoeopathic Approach to Skin:
1. **Identifying the Miasmatic Root:** Distinguishing between psoric itching, sycotic induration, and syphilitic ulceration.
2. **Gut-Skin Axis Harmonization:** Improving intestinal permeability and elimination channels.
3. **Stress & Emotional Triggers:** Tailoring remedies like *Staphysagria, Graphites, Arsenic Album*, or *Natrum Muriaticum* to the patient's emotional temperament.

True healing occurs from within outward, from above downward, and in reverse order of the symptoms' appearance (Hering's Law of Cure).`,
  },
  {
    id: 'post-3',
    title: 'Demystifying Sweet Sugar Globules: How Homoeopathic Potencies Work',
    slug: 'how-homeopathic-potencies-work',
    author: 'Prof. Dr. Yogesh Dravid',
    authorRole: 'HOD Physiology, BHMC Belgaum',
    category: 'Science & Philosophy',
    publishedDate: 'June 19, 2026',
    readTime: '4 min read',
    excerpt: 'Those small white sugar pills are merely inert vehicles carrying dynamized, potentized micro-energetic medicine. Here is the science behind nanomedicine and water memory.',
    coverImage: '/images/homeopathy_hero_banner_1787248330468.jpg',
    tags: ['Science of Homeopathy', 'Potentization', 'FAQ'],
    content: `One of the most frequent questions patients ask is: "Doctor, are all your medicines just the same white sweet pills?"

The answer lies in understanding the vehicle vs. the dynamic active principle.

The white globules are crafted from pure cane sugar or lactose crystals. They serve as an inert, biocompatible carrier. The actual medicinal substance is prepared through systematic serial dilution and succussion (potentization) in 90% pure dispensing alcohol, which is then absorbed by the globules.

Recent biophysical research in nanoparticle physics and solvatochromic dyes confirms that potentization imprints distinct structural nanobubble formations in water-ethanol clusters, acting via biological signaling pathways rather than brute chemical toxicity. That is why homoeopathic medicine is remarkably safe for newborns, pregnant mothers, and elderly patients alike.`,
  },
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    patientName: 'Suresh Patil',
    location: 'Tilakwadi, Belgaum',
    condition: 'Chronic Acid Peptic Disease & Migraine',
    comment: "I had suffered from severe acidity and unbearable unilateral headaches for over 6 years. Dr. Yogesh Dravid's constitutional treatment cured my condition in just 3 months without any recurrence.",
    rating: 5,
    treatedBy: 'Dr. Yogesh Dravid',
    treatmentDuration: '3 Months',
  },
  {
    id: 't-2',
    patientName: 'Ananya Prabhu',
    location: 'Margao, South Goa',
    condition: 'PCOS & Hormonal Acne',
    comment: "I travel to the Quepem clinic on the second Sunday every month. Dr. Dravid gave me a clear dietary guidance and potentized constitutional homeopathic drops. My menstrual cycles are now completely regular and skin is crystal clear.",
    rating: 5,
    treatedBy: 'Dr. Yogesh Dravid',
    treatmentDuration: '5 Months',
  },
  {
    id: 't-3',
    patientName: 'Basavaraj K.',
    location: 'Vadagaon, Belgaum',
    condition: 'Severe Knee Osteoarthritis',
    comment: 'Being right opposite Kalpvruksh Hotel, the clinic is very convenient. Dr. Dravid explained the physiological degeneration and gave gentle remedies. My knee stiffness and swelling reduced tremendously.',
    rating: 5,
    treatedBy: 'Dr. Yogesh Dravid',
    treatmentDuration: '4 Months',
  },
  {
    id: 't-4',
    patientName: 'Priyanka Deshmukh',
    location: 'Shahapur, Belagavi',
    condition: 'Chronic Eczema & Allergic Dermatitis',
    comment: 'After years of applying steroid ointments with frequent relapses, Dr. Yogesh Dravid took my complete constitutional history in the morning session. In 4 months, my skin lesions cleared completely without any side effects!',
    rating: 5,
    treatedBy: 'Dr. Yogesh Dravid',
    treatmentDuration: '4 Months',
  },
  {
    id: 't-5',
    patientName: 'Mahesh Vernekar',
    location: 'Quepem, South Goa',
    condition: 'Pediatric Asthma & Recurrent Bronchitis',
    comment: 'My 7-year-old son used to need frequent nebulization every monsoon. Since starting Dr. Dravid’s monthly consultation in Goa, his natural immunity has strengthened and he has not needed an inhaler for over a year.',
    rating: 5,
    treatedBy: 'Dr. Yogesh Dravid',
    treatmentDuration: '8 Months',
  },
  {
    id: 't-6',
    patientName: 'Sunita Goundadkar',
    location: 'Khasbag, Belgaum',
    condition: 'Hypothyroidism & Chronic Fatigue',
    comment: 'Dr. Dravid’s deep understanding of physiology made a huge difference. He adjusted my constitutional doses and monitored my thyroid profile. My energy levels have returned and thyroid parameters are now stable.',
    rating: 5,
    treatedBy: 'Dr. Yogesh Dravid',
    treatmentDuration: '6 Months',
  },
];

export const CLINICAL_SERVICES: ClinicalServiceItem[] = [
  {
    id: 'srv-1',
    icon: 'Leaf',
    title: 'Constitutional Homoeopathy',
    description: 'In-depth holistic case-taking assessing physical, emotional, and hereditary factors to stimulate the body’s innate vital healing power.',
    highlight: 'Personalized to your unique blueprint',
  },
  {
    id: 'srv-2',
    icon: 'Activity',
    title: 'Chronic & Autoimmune Ailments',
    description: 'Long-term healing for arthritis, thyroid dysfunction, chronic fatigue, fibromyalgia, migraine, and recurring metabolic disorders.',
    highlight: 'Non-steroidal & non-addictive',
  },
  {
    id: 'srv-3',
    icon: 'Sparkles',
    title: 'Dermatology & Hair Care',
    description: 'Effective, scar-free treatment for psoriasis, eczema, acne, vitiligo, fungal infections, warts, and alopecia areata hair loss.',
    highlight: 'Permanent, inside-out skin clarity',
  },
  {
    id: 'srv-4',
    icon: 'HeartPulse',
    title: 'Allergies & Respiratory Health',
    description: 'Relief and immunity modulation for chronic sinusitis, allergic rhinitis, asthma, bronchitis, and seasonal weather sensitivity.',
    highlight: 'Reduces inhaler dependence safely',
  },
  {
    id: 'srv-5',
    icon: 'Baby',
    title: 'Pediatric & Child Health',
    description: 'Gentle, sweet-tasting remedies for recurrent tonsillitis, low immunity, poor appetite, teething troubles, and behavioral challenges.',
    highlight: '100% safe with zero harsh chemicals',
  },
  {
    id: 'srv-6',
    icon: 'UserCheck',
    title: "Women's Health & Hormones",
    description: 'Natural therapeutic balance for PCOS/PCOD, irregular menses, fibroids, menopause, thyroid issues, and postpartum wellbeing.',
    highlight: 'Hormone-free holistic balance',
  },
];
