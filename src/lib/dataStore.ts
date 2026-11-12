import { supabase, SUPER_ADMIN_EMAIL } from './supabase';
import { 
  Club, 
  EventItem, 
  AnnouncementItem, 
  ClubAdminAssignment, 
  ActivityLogItem 
} from '../types';

// Default initial seeded Technical Clubs
export const INITIAL_CLUBS: Club[] = [
  // --- TECHNICAL CLUBS ---
  {
    id: 'c1111111-1111-4111-a111-111111111111',
    name: 'Electronics Club',
    domain: 'Technical',
    description: 'Fostering embedded systems, IoT prototyping, VLSI circuit design, PCB fabrication, and high-speed hardware innovation across IIT Dharwad.',
    email: 'electronicsclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c2222222-2222-4222-a222-222222222222',
    name: 'InGene Motorsport',
    domain: 'Technical',
    description: 'IIT Dharwad’s premier student Formula racing engineering team designing, fabricating, and racing high-performance electric vehicles in Formula Student competitions.',
    email: 'ingene@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c3333333-3333-4333-a333-333333333333',
    name: 'Robotics Club',
    domain: 'Technical',
    description: 'Pioneering autonomous mobile robotics, ROS2 automation architectures, computer vision navigation, robotic arms, and collegiate drone systems.',
    email: 'robotics@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c4444444-4444-4444-a444-444444444444',
    name: 'Abhikalpa Design Club',
    domain: 'Technical',
    description: 'Uniting industrial product design, human-computer interaction, UI/UX aesthetics, 3D parametric modeling, and creative technology prototyping.',
    email: 'abhikalpa.dc@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c5555555-5555-4555-a555-555555555555',
    name: 'Coding Club',
    domain: 'Technical',
    description: 'Empowering developers, competitive programmers, open-source contributors, and software architects through hackathons, algorithms, and buildathons.',
    email: 'codingclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c6666666-6666-4666-a666-666666666666',
    name: 'AI Club',
    domain: 'Technical',
    description: 'Advancing research in deep learning, LLMs, computer vision, reinforcement learning, and production machine learning architectures at IIT Dharwad.',
    email: 'aiclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c7777777-7777-4777-a777-777777777777',
    name: 'Finance Club',
    domain: 'Technical',
    description: 'Bridging algorithmic quantitative trading, macroeconomic analysis, mathematical financial engineering, equity research, and fintech.',
    email: 'finance.club@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c8888888-8888-4888-a888-888888888888',
    name: 'Space Data Science Club',
    domain: 'Technical',
    description: 'Processing astronomical observations, satellite telemetry, deep space imagery, orbital trajectory algorithms, and computational astrophysics.',
    email: 'space.ds.club@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },

  // --- CULTURAL CLUBS ---
  {
    id: 'cul-1111-4111-a111-111111111111',
    name: 'Prabodhini Club',
    domain: 'Cultural',
    description: 'Fostering cultural heritage, traditional arts, awareness, Indian languages, and spiritual philosophy at IIT Dharwad.',
    email: 'prabodhini.club@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cul-2222-4222-a222-222222222222',
    name: 'UDGHOSH IITDh',
    domain: 'Cultural',
    description: 'The official dramatics and theatre society of IIT Dharwad, organizing stage plays, street plays (Nukkad Natak), and theatrical productions.',
    email: 'dramatics@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cul-3333-4333-a333-333333333333',
    name: 'Fine Arts Club',
    domain: 'Cultural',
    description: 'Cultivating sketching, painting, digital illustration, origami, calligraphy, sculpture, and visual fine arts exhibitions across the institute.',
    email: 'finearts@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cul-4444-4444-a444-444444444444',
    name: 'The Sapphire Dance Club',
    domain: 'Cultural',
    description: 'IIT Dharwad premier dance collective exploring classical, contemporary, hip-hop, western, and fusion choreography for inter-college competitions.',
    email: 'sapphire.danceclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cul-5555-4555-a555-555555555555',
    name: 'Music Club',
    domain: 'Cultural',
    description: 'Uniting instrumentalists, vocalists, acoustic ensembles, and bands across classical, rock, jazz, and indie musical genres.',
    email: 'musicclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cul-6666-4666-a666-666666666666',
    name: 'Quiz Club',
    domain: 'Cultural',
    description: 'Promoting trivia, general knowledge, pop culture, sci-tech quizzing, and representing IIT Dharwad in national inter-collegiate quiz circuits.',
    email: 'quizclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cul-7777-4777-a777-777777777777',
    name: '| EUNOIA |',
    domain: 'Cultural',
    description: 'The official literary and debating society of IIT Dharwad, organizing parliamentary debates, creative writing, poetry slams, and Model United Nations.',
    email: 'literaryclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cul-8888-4888-a888-888888888888',
    name: 'Photography and Films Club',
    domain: 'Cultural',
    description: 'Capturing campus life, cinematic filmmaking, documentary storytelling, cinematography, editing, visual post-production, and photo exhibitions.',
    email: 'paf@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },

  // --- SPORTS CLUBS ---
  {
    id: 'spt-1111-4111-a111-111111111111',
    name: 'Football Club',
    domain: 'Sports',
    description: 'Competitive collegiate football team training, tactic sessions, inter-departmental tournaments, and Inter-IIT Sports Meet training.',
    email: 'footballclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-2222-4222-a222-222222222222',
    name: 'Badminton Club',
    domain: 'Sports',
    description: 'High-intensity indoor badminton coaching, singles and doubles tournaments, and varsity trials at the campus sports complex.',
    email: 'badmintonclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-3333-4333-a333-333333333333',
    name: 'Table-Tennis Club',
    domain: 'Sports',
    description: 'Fast-paced table tennis coaching, spin techniques, intra-hostel leagues, and competitive Inter-IIT team preparation.',
    email: 'tabletennisclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-4444-4444-a444-444444444444',
    name: 'Tennis Club',
    domain: 'Sports',
    description: 'Synthetic hard-court tennis training, baseline strategy, serve mechanics, and collegiate tournaments.',
    email: 'tennisclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-5555-4555-a555-555555555555',
    name: 'Cricket Club',
    domain: 'Sports',
    description: 'IIT Dharwad cricket team organizing the institute premier league, net practice sessions, and representing the institute in regional tournaments.',
    email: 'cricketclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-6666-4666-a666-666666666666',
    name: 'Volleyball Club',
    domain: 'Sports',
    description: 'Spiking, setting, and defensive coordination on outdoor courts, organizing institute volleyball championships and Inter-IIT training.',
    email: 'volleyballclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-7777-4777-a777-777777777777',
    name: 'Chess Club',
    domain: 'Sports',
    description: 'Classical, rapid, and blitz chess tournaments, grandmaster game analysis, tactical puzzle solving, and FIDE rated event prep.',
    email: 'chessclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-8888-4888-a888-888888888888',
    name: 'Hockey Club',
    domain: 'Sports',
    description: 'Field hockey training, stick handling drills, penalty corner tactics, and Inter-IIT hockey contingent development.',
    email: 'hockeyclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-9999-4999-a999-999999999999',
    name: 'Athletics Club',
    domain: 'Sports',
    description: 'Track and field disciplines including sprints, middle-distance running, relays, long jump, shot put, and annual athletic meets.',
    email: 'athleticsclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    name: 'Basketball Club',
    domain: 'Sports',
    description: 'Fast-break drills, zone defense, shooting clinics, and 3v3 and 5v5 tournaments on the campus basketball courts.',
    email: 'basketballclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'spt-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    name: 'Squash Club',
    domain: 'Sports',
    description: 'Indoor squash racquet skills, endurance training, wall drills, and competitive squash matches at the sports pavilion.',
    email: 'squashclub@iitdh.ac.in',
    logo_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&h=200&fit=crop',
    created_at: '2026-10-01T00:00:00Z',
  },
];

// Seeded Events with Featured VIBE-A-THON
export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'e1111111-1111-4111-b111-111111111111',
    club_id: 'c5555555-5555-4555-a555-555555555555', // Coding Club
    title: 'VIBE-A-THON',
    category: 'Technical / Buildathon',
    short_description: 'An AI-powered, beginner-friendly buildathon. Bring an idea, use AI tools, and turn it into a working project. No prior coding experience is required.',
    description: `VIBE-A-THON is IIT Dharwad’s flagship AI-powered, beginner-friendly buildathon organized by Coding Club!

Whether you are a seasoned coder or haven't written a single line of code in your life, this event is designed for YOU. Bring an idea, leverage modern AI developer tools (Gemini, Claude, Cursor, v0, Bolt, Lovable), and turn creative concepts into functioning digital products, hardware demos, or automation tools.

KEY DETAILS & TIMELINE:
• Registration Closed: 9 November 2026.
• Project Submission Deadline: 14 November 2026 (Submit code repositories, deployment URLs, and demo videos).
• Presentation & Pitch Showcase: To be announced by the organizing committee.
• Venue: To be announced.

ELIGIBILITY & PARTICIPATION RULES:
1. Open exclusively to all registered students of IIT Dharwad.
2. Teams may consist of 1 to 4 members from any department or academic year.
3. Use of AI code-assistants, LLMs, and no-code/low-code platforms is explicitly encouraged!
4. Originality: Solutions must address a real campus, scientific, or social problem.
5. All teams will receive official participation certificates, and top teams will win cash prizes and direct mentorship opportunities from tech mentors.`,
    event_date: '2026-11-14',
    start_time: '09:00:00',
    end_time: '23:59:00',
    venue: 'To be announced',
    registration_url: 'https://docs.google.com/forms/d/e/1FAIpQLSdyds4FyQ88ppd4qp5T6JEuNcB0TY5pgL7tzz7fA9vfTyFgEg/viewform?usp=dialog',
    registration_deadline: '2026-11-09T23:59:59Z', // Past deadline
    poster_url: '/src/assets/images/vibeathon_banner_1794484938286.jpg',
    status: 'Published',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'e2222222-2222-4222-b222-222222222222',
    club_id: 'c3333333-3333-4333-a333-333333333333', // Robotics Club
    title: 'Autonomous Mobile Robotics Bootcamp',
    category: 'Technical / Workshop',
    short_description: 'Hands-on practical intensive on ROS2 navigation stack, 2D LiDAR SLAM, and embedded motor controller firmware.',
    description: `Join the Robotics Club for an immersive 2-day practical bootcamp on building ROS2 navigation stacks and micro-ROS sensor integration. Bring your laptops with Ubuntu 22.04 or WSL2 installed. Hardware kits with TurtleBot-compatible chassis, LiDAR sensors, and ESP32 microcontrollers will be provided.`,
    event_date: '2026-11-20',
    start_time: '14:00:00',
    end_time: '18:00:00',
    venue: 'Central Research Facility, Robotics Innovation Lab',
    registration_url: 'https://docs.google.com/forms/d/e/example-robotics-iitdh/viewform',
    registration_deadline: '2026-11-19T18:00:00Z',
    poster_url: '/src/assets/images/robotics_club_showcase_1794484939484.jpg',
    status: 'Published',
    created_at: '2026-11-05T12:00:00Z',
  },
  {
    id: 'e3333333-3333-4333-b333-333333333333',
    club_id: 'c2222222-2222-4222-a222-222222222222', // InGene Motorsport
    title: 'Formula Student Aerodynamics & Telemetry Symposium',
    category: 'Technical / Seminar',
    short_description: 'Deep-dive into CFD aerodynamic simulation, downforce packaging, and high-speed CAN bus vehicle telemetry.',
    description: `InGene Motorsport presents an exhaustive technical breakdown of EV aerodynamics and live telemetry data pipelines from Formula Bharat. Learn how the team simulates wing profiles in OpenFOAM and captures 100Hz IMU data on track.`,
    event_date: '2026-11-26',
    start_time: '16:30:00',
    end_time: '19:00:00',
    venue: 'Auditorium 2, Main Academic Block',
    registration_url: 'https://docs.google.com/forms/d/e/example-motorsport-iitdh/viewform',
    registration_deadline: '2026-11-25T23:59:00Z',
    poster_url: '/src/assets/images/motorsport_showcase_1794484938913.jpg',
    status: 'Published',
    created_at: '2026-11-06T15:00:00Z',
  },
];

// Seeded Announcements
export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'a1111111-1111-4111-c111-111111111111',
    club_id: 'c5555555-5555-4555-a555-555555555555', // Coding Club
    title: 'VIBE-A-THON Registration Status & Final Submission Guidelines',
    content: 'Registrations for VIBE-A-THON closed on 9 November 2026. All confirmed registered teams must submit their final project GitHub repositories, live deployment links, and 3-minute video pitch demonstrations before 14 November 2026 at 23:59 IST via the official submission portal. Presentation date and judging venue will be announced shortly.',
    type: 'Club Announcement',
    external_url: 'https://docs.google.com/forms/d/e/1FAIpQLSdyds4FyQ88ppd4qp5T6JEuNcB0TY5pgL7tzz7fA9vfTyFgEg/viewform?usp=dialog',
    attachment_url: '',
    status: 'Published',
    published_at: '2026-11-10T10:00:00Z',
    created_at: '2026-11-10T10:00:00Z',
  },
  {
    id: 'a2222222-2222-4222-c222-222222222222',
    club_id: null, // Campus-wide
    title: 'Official Launch of IIT Dharwad Campus Events Portal',
    content: 'Welcome to the unified IIT Dharwad Campus Events & Technical Clubs Portal. Students can now browse all institute technical clubs, track upcoming competitions and workshops, access official registrations, and receive verified administrative announcements from faculty advisors and student coordinators.',
    type: 'Campus-wide Announcement',
    external_url: 'https://iitdh.ac.in',
    status: 'Published',
    published_at: '2026-11-08T08:00:00Z',
    created_at: '2026-11-08T08:00:00Z',
  },
  {
    id: 'a3333333-3333-4333-c333-333333333333',
    club_id: 'c6666666-6666-4666-a666-666666666666', // AI Club
    title: 'AI Club Research Circle: Reasoning Foundation Models',
    content: 'The AI Club is convening a research discussion on test-time compute scaling laws and reasoning mechanisms in modern LLMs. Open to all students interested in deep learning and NLP architectures.',
    type: 'Club Announcement',
    external_url: 'https://iitdh.ac.in/aiclub',
    status: 'Published',
    published_at: '2026-11-11T14:00:00Z',
    created_at: '2026-11-11T14:00:00Z',
  },
];

// Initial Seeded Club Admin Assignments
export const INITIAL_CLUB_ADMINS: ClubAdminAssignment[] = [
  {
    id: 'cadm-1',
    user_id: 'user-coding-admin',
    user_email: 'coding_admin@iitdh.ac.in',
    club_id: 'c5555555-5555-4555-a555-555555555555', // Coding Club
    club_name: 'Coding Club',
    assigned_by: 'ec26bt032@iitdh.ac.in',
    created_at: '2026-11-02T10:00:00Z',
  },
  {
    id: 'cadm-2',
    user_id: 'user-robotics-admin',
    user_email: 'robotics_lead@iitdh.ac.in',
    club_id: 'c3333333-3333-4333-a333-333333333333', // Robotics Club
    club_name: 'Robotics Club',
    assigned_by: 'ec26bt032@iitdh.ac.in',
    created_at: '2026-11-03T11:00:00Z',
  },
];

// Initial Seeded Activity Logs
export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    actor_id: 'ec26bt032@iitdh.ac.in',
    actor_email: 'ec26bt032@iitdh.ac.in',
    action: 'Initialized 8 Technical Clubs Directory',
    target_type: 'club',
    created_at: '2026-11-01T09:00:00Z',
  },
  {
    id: 'log-2',
    actor_id: 'ec26bt032@iitdh.ac.in',
    actor_email: 'ec26bt032@iitdh.ac.in',
    action: 'Assigned coding_admin@iitdh.ac.in to Coding Club',
    target_type: 'admin',
    created_at: '2026-11-02T10:00:00Z',
  },
  {
    id: 'log-3',
    actor_id: 'coding_admin@iitdh.ac.in',
    actor_email: 'coding_admin@iitdh.ac.in',
    action: 'Published VIBE-A-THON Event Announcement',
    target_type: 'event',
    target_id: 'e1111111-1111-4111-b111-111111111111',
    created_at: '2026-11-02T10:30:00Z',
  },
  {
    id: 'log-4',
    actor_id: 'ec26bt032@iitdh.ac.in',
    actor_email: 'ec26bt032@iitdh.ac.in',
    action: 'Published Campus-wide Portal Launch Announcement',
    target_type: 'announcement',
    target_id: 'a2222222-2222-4222-c222-222222222222',
    created_at: '2026-11-08T08:00:00Z',
  },
];

const STORAGE_KEYS = {
  CLUBS: 'iitdh_portal_clubs',
  EVENTS: 'iitdh_portal_events',
  ANNOUNCEMENTS: 'iitdh_portal_announcements',
  CLUB_ADMINS: 'iitdh_portal_club_admins',
  ACTIVITY_LOGS: 'iitdh_portal_activity_logs',
};

// Storage helper with fallback initialization
class DataStore {
  private clubs: Club[] = [];
  private events: EventItem[] = [];
  private announcements: AnnouncementItem[] = [];
  private clubAdmins: ClubAdminAssignment[] = [];
  private activityLogs: ActivityLogItem[] = [];
  private isSupabaseLive: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedClubs = localStorage.getItem(STORAGE_KEYS.CLUBS);
      let parsedClubs: Club[] = storedClubs ? JSON.parse(storedClubs) : [...INITIAL_CLUBS];
      // Ensure all seed clubs (Technical, Cultural, Sports) exist in the local dataset
      INITIAL_CLUBS.forEach((initClub) => {
        if (!parsedClubs.some((c) => c.name.toLowerCase() === initClub.name.toLowerCase() || c.id === initClub.id)) {
          parsedClubs.push(initClub);
        }
      });
      this.clubs = parsedClubs;

      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      this.events = storedEvents ? JSON.parse(storedEvents) : INITIAL_EVENTS;

      const storedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      this.announcements = storedAnnouncements ? JSON.parse(storedAnnouncements) : INITIAL_ANNOUNCEMENTS;

      const storedClubAdmins = localStorage.getItem(STORAGE_KEYS.CLUB_ADMINS);
      this.clubAdmins = storedClubAdmins ? JSON.parse(storedClubAdmins) : INITIAL_CLUB_ADMINS;

      const storedLogs = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      this.activityLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_ACTIVITY_LOGS;
    } catch {
      this.clubs = [...INITIAL_CLUBS];
      this.events = [...INITIAL_EVENTS];
      this.announcements = [...INITIAL_ANNOUNCEMENTS];
      this.clubAdmins = [...INITIAL_CLUB_ADMINS];
      this.activityLogs = [...INITIAL_ACTIVITY_LOGS];
    }

    // Try fetching from Supabase in background
    this.syncFromSupabase();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(this.clubs));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcements));
      localStorage.setItem(STORAGE_KEYS.CLUB_ADMINS, JSON.stringify(this.clubAdmins));
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(this.activityLogs));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public async syncFromSupabase() {
    try {
      const { data: remoteClubs, error: clubsErr } = await supabase.from('clubs').select('*');
      if (!clubsErr && remoteClubs && remoteClubs.length > 0) {
        this.clubs = remoteClubs;
        this.isSupabaseLive = true;
      }

      const { data: remoteEvents, error: eventsErr } = await supabase.from('events').select('*');
      if (!eventsErr && remoteEvents && remoteEvents.length > 0) {
        this.events = remoteEvents;
        this.isSupabaseLive = true;
      }

      const { data: remoteAnnouncements, error: annErr } = await supabase.from('announcements').select('*');
      if (!annErr && remoteAnnouncements && remoteAnnouncements.length > 0) {
        this.announcements = remoteAnnouncements;
        this.isSupabaseLive = true;
      }

      const { data: remoteAdmins, error: adminErr } = await supabase.from('club_admins').select('*');
      if (!adminErr && remoteAdmins && remoteAdmins.length > 0) {
        this.clubAdmins = remoteAdmins;
        this.isSupabaseLive = true;
      }

      this.save();
    } catch (err) {
      // PostgREST or network fallback silently handled
      console.log('Operating in resilient mode with local/cached data state');
    }
  }

  public getIsSupabaseLive(): boolean {
    return this.isSupabaseLive;
  }

  // --- CLUBS ---
  public getClubs(): Club[] {
    return [...this.clubs];
  }

  public getClubById(id: string): Club | undefined {
    return this.clubs.find((c) => c.id === id);
  }

  public async createClub(club: Omit<Club, 'id' | 'created_at'>, actorEmail: string): Promise<Club> {
    const newClub: Club = {
      ...club,
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };

    // Attempt Supabase insert
    try {
      const { data, error } = await supabase.from('clubs').insert([newClub]).select().single();
      if (!error && data) {
        this.clubs.unshift(data);
        this.isSupabaseLive = true;
        this.logActivity(actorEmail, `Created club "${newClub.name}"`, 'club', data.id);
        this.save();
        return data;
      }
    } catch {}

    this.clubs.unshift(newClub);
    this.logActivity(actorEmail, `Created club "${newClub.name}"`, 'club', newClub.id);
    this.save();
    return newClub;
  }

  public async updateClub(id: string, updates: Partial<Club>, actorEmail: string): Promise<Club> {
    const index = this.clubs.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Club not found');

    const updated = { ...this.clubs[index], ...updates };

    try {
      const { error } = await supabase.from('clubs').update(updates).eq('id', id);
      if (!error) this.isSupabaseLive = true;
    } catch {}

    this.clubs[index] = updated;
    this.logActivity(actorEmail, `Updated club details for "${updated.name}"`, 'club', id);
    this.save();
    return updated;
  }

  public async deleteClub(id: string, actorEmail: string): Promise<boolean> {
    const club = this.getClubById(id);
    const clubName = club?.name || 'Club';

    try {
      await supabase.from('clubs').delete().eq('id', id);
    } catch {}

    this.clubs = this.clubs.filter((c) => c.id !== id);
    this.events = this.events.filter((e) => e.club_id !== id);
    this.announcements = this.announcements.filter((a) => a.club_id !== id);
    this.clubAdmins = this.clubAdmins.filter((ca) => ca.club_id !== id);

    this.logActivity(actorEmail, `Deleted club "${clubName}" and related records`, 'club', id);
    this.save();
    return true;
  }

  // --- EVENTS ---
  public getEvents(includeDrafts: boolean = false, allowedClubIds?: string[]): EventItem[] {
    return this.events
      .filter((e) => {
        if (!includeDrafts && e.status === 'Draft') return false;
        if (allowedClubIds && allowedClubIds.length > 0 && !allowedClubIds.includes(e.club_id)) {
          // If strictly filtering by allowed clubs
          return false;
        }
        return true;
      })
      .map((e) => ({
        ...e,
        club: this.getClubById(e.club_id),
      }))
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }

  public getEventById(id: string): EventItem | undefined {
    const event = this.events.find((e) => e.id === id);
    if (!event) return undefined;
    return {
      ...event,
      club: this.getClubById(event.club_id),
    };
  }

  public async createEvent(
    event: Omit<EventItem, 'id' | 'created_at' | 'club'>,
    actorEmail: string
  ): Promise<EventItem> {
    const newEvent: EventItem = {
      ...event,
      id: 'e_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('events').insert([newEvent]).select().single();
      if (!error && data) {
        this.events.unshift(data);
        this.isSupabaseLive = true;
        this.logActivity(actorEmail, `Created event "${newEvent.title}"`, 'event', data.id);
        this.save();
        return { ...data, club: this.getClubById(data.club_id) };
      }
    } catch {}

    this.events.unshift(newEvent);
    this.logActivity(actorEmail, `Created event "${newEvent.title}"`, 'event', newEvent.id);
    this.save();
    return { ...newEvent, club: this.getClubById(newEvent.club_id) };
  }

  public async updateEvent(id: string, updates: Partial<EventItem>, actorEmail: string): Promise<EventItem> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');

    const updated: EventItem = {
      ...this.events[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (!error) this.isSupabaseLive = true;
    } catch {}

    this.events[index] = updated;
    this.logActivity(actorEmail, `Updated event "${updated.title}"`, 'event', id);
    this.save();
    return { ...updated, club: this.getClubById(updated.club_id) };
  }

  public async deleteEvent(id: string, actorEmail: string): Promise<boolean> {
    const event = this.getEventById(id);
    const eventTitle = event?.title || 'Event';

    try {
      await supabase.from('events').delete().eq('id', id);
    } catch {}

    this.events = this.events.filter((e) => e.id !== id);
    this.logActivity(actorEmail, `Deleted event "${eventTitle}"`, 'event', id);
    this.save();
    return true;
  }

  // --- ANNOUNCEMENTS ---
  public getAnnouncements(includeDrafts: boolean = false, allowedClubIds?: string[]): AnnouncementItem[] {
    return this.announcements
      .filter((a) => {
        if (!includeDrafts && a.status === 'Draft') return false;
        if (allowedClubIds && allowedClubIds.length > 0) {
          // If allowedClubIds specified for club admin
          if (a.club_id && !allowedClubIds.includes(a.club_id)) return false;
        }
        return true;
      })
      .map((a) => ({
        ...a,
        club: a.club_id ? this.getClubById(a.club_id) : undefined,
      }))
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());
  }

  public async createAnnouncement(
    announcement: Omit<AnnouncementItem, 'id' | 'created_at' | 'club'>,
    actorEmail: string
  ): Promise<AnnouncementItem> {
    const newAnnouncement: AnnouncementItem = {
      ...announcement,
      id: 'a_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: announcement.published_at || new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('announcements').insert([newAnnouncement]).select().single();
      if (!error && data) {
        this.announcements.unshift(data);
        this.isSupabaseLive = true;
        this.logActivity(actorEmail, `Published announcement "${newAnnouncement.title}"`, 'announcement', data.id);
        this.save();
        return { ...data, club: data.club_id ? this.getClubById(data.club_id) : undefined };
      }
    } catch {}

    this.announcements.unshift(newAnnouncement);
    this.logActivity(actorEmail, `Published announcement "${newAnnouncement.title}"`, 'announcement', newAnnouncement.id);
    this.save();
    return { ...newAnnouncement, club: newAnnouncement.club_id ? this.getClubById(newAnnouncement.club_id) : undefined };
  }

  public async updateAnnouncement(
    id: string,
    updates: Partial<AnnouncementItem>,
    actorEmail: string
  ): Promise<AnnouncementItem> {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Announcement not found');

    const updated: AnnouncementItem = {
      ...this.announcements[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('announcements').update(updates).eq('id', id);
      if (!error) this.isSupabaseLive = true;
    } catch {}

    this.announcements[index] = updated;
    this.logActivity(actorEmail, `Updated announcement "${updated.title}"`, 'announcement', id);
    this.save();
    return { ...updated, club: updated.club_id ? this.getClubById(updated.club_id) : undefined };
  }

  public async deleteAnnouncement(id: string, actorEmail: string): Promise<boolean> {
    const ann = this.announcements.find((a) => a.id === id);
    const title = ann?.title || 'Announcement';

    try {
      await supabase.from('announcements').delete().eq('id', id);
    } catch {}

    this.announcements = this.announcements.filter((a) => a.id !== id);
    this.logActivity(actorEmail, `Deleted announcement "${title}"`, 'announcement', id);
    this.save();
    return true;
  }

  // --- CLUB ADMINS ---
  public getClubAdmins(): ClubAdminAssignment[] {
    return this.clubAdmins.map((ca) => ({
      ...ca,
      club_name: this.getClubById(ca.club_id)?.name || 'Unknown Club',
    }));
  }

  public getClubIdsForUser(email: string): string[] {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return this.clubs.map((c) => c.id);
    }
    return this.clubAdmins
      .filter((ca) => ca.user_email?.toLowerCase() === email.toLowerCase())
      .map((ca) => ca.club_id);
  }

  public async assignClubAdmin(
    userEmail: string,
    clubId: string,
    actorEmail: string
  ): Promise<ClubAdminAssignment> {
    const club = this.getClubById(clubId);
    if (!club) throw new Error('Invalid club ID');

    // Check existing
    const existing = this.clubAdmins.find(
      (ca) => ca.user_email?.toLowerCase() === userEmail.toLowerCase() && ca.club_id === clubId
    );
    if (existing) {
      return existing;
    }

    const newAssignment: ClubAdminAssignment = {
      id: 'cadm_' + Math.random().toString(36).substring(2, 9),
      user_id: 'uid_' + userEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      user_email: userEmail.toLowerCase().trim(),
      club_id: clubId,
      club_name: club.name,
      assigned_by: actorEmail,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('club_admins').insert([newAssignment]);
    } catch {}

    this.clubAdmins.unshift(newAssignment);
    this.logActivity(actorEmail, `Assigned ${userEmail} as admin for ${club.name}`, 'admin', newAssignment.id);
    this.save();
    return newAssignment;
  }

  public async removeClubAdmin(id: string, actorEmail: string): Promise<boolean> {
    const assignment = this.clubAdmins.find((ca) => ca.id === id);
    const targetEmail = assignment?.user_email || 'User';
    const clubName = assignment?.club_name || 'Club';

    try {
      await supabase.from('club_admins').delete().eq('id', id);
    } catch {}

    this.clubAdmins = this.clubAdmins.filter((ca) => ca.id !== id);
    this.logActivity(actorEmail, `Removed ${targetEmail} from ${clubName} admin privileges`, 'admin', id);
    this.save();
    return true;
  }

  // --- ACTIVITY LOGS ---
  public getActivityLogs(): ActivityLogItem[] {
    return [...this.activityLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public logActivity(
    actorEmail: string,
    action: string,
    targetType: 'event' | 'announcement' | 'club' | 'admin',
    targetId?: string
  ) {
    const newLog: ActivityLogItem = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      actor_id: actorEmail,
      actor_email: actorEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      created_at: new Date().toISOString(),
    };

    try {
      supabase.from('activity_logs').insert([newLog]);
    } catch {}

    this.activityLogs.unshift(newLog);
    if (this.activityLogs.length > 100) {
      this.activityLogs = this.activityLogs.slice(0, 100);
    }
    this.save();
  }
}

export const dataStore = new DataStore();
