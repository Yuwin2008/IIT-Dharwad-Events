-- ==============================================================================
-- IIT DHARWAD CAMPUS EVENTS PORTAL - DATABASE SEED SCRIPT
-- Seeds official Technical Clubs, Featured VIBE-A-THON Event, and Campus Announcements
-- ==============================================================================

-- 1. Insert Initial 8 Technical Clubs (Idempotent: ON CONFLICT DO NOTHING)
INSERT INTO public.clubs (id, name, domain, description, email, logo_url)
VALUES
  (
    'c1111111-1111-4111-a111-111111111111',
    'Electronics Club',
    'Technical',
    'Fostering embedded systems, IoT prototyping, VLSI design, PCB fabrication, and hardware innovation across IIT Dharwad.',
    'electronicsclub@iitdh.ac.in',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop'
  ),
  (
    'c2222222-2222-4222-a222-222222222222',
    'InGene Motorsport',
    'Technical',
    'IIT Dharwad premier student Formula racing engineering team designing, fabricating, and racing high-performance electric race cars.',
    'ingene@iitdh.ac.in',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&h=200&fit=crop'
  ),
  (
    'c3333333-3333-4333-a333-333333333333',
    'Robotics Club',
    'Technical',
    'Exploring autonomous mobile robotics, ROS2 automation, UAV systems, robotic manipulators, and competitive collegiate robotics.',
    'robotics@iitdh.ac.in',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop'
  ),
  (
    'c4444444-4444-4444-a444-444444444444',
    'Abhikalpa Design Club',
    'Technical',
    'Uniting product design, UI/UX aesthetics, 3D modeling, prototyping, and human-computer interaction principles for impactful solutions.',
    'abhikalpa.dc@iitdh.ac.in',
    'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=200&h=200&fit=crop'
  ),
  (
    'c5555555-5555-4555-a555-555555555555',
    'Coding Club',
    'Technical',
    'Empowering developers, competitive programmers, open-source contributors, and software architects through hackathons and workshops.',
    'codingclub@iitdh.ac.in',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop'
  ),
  (
    'c6666666-6666-4666-a666-666666666666',
    'AI Club',
    'Technical',
    'Advancing machine learning, deep learning research, natural language processing, computer vision, and foundation models at IIT Dharwad.',
    'aiclub@iitdh.ac.in',
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=200&h=200&fit=crop'
  ),
  (
    'c7777777-7777-4777-a777-777777777777',
    'Finance Club',
    'Technical',
    'Bridging quantitative finance, algorithmic trading, financial modeling, valuation, and decentralized fintech technologies.',
    'finance.club@iitdh.ac.in',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop'
  ),
  (
    'c8888888-8888-4888-a888-888888888888',
    'Space Data Science Club',
    'Technical',
    'Analyzing astronomical datasets, satellite imagery, orbital mechanics, planetary science, and computational astrophysics.',
    'space.ds.club@iitdh.ac.in',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop'
  ),

  -- Cultural Clubs
  ('cul-1111-4111-a111-111111111111', 'Prabodhini Club', 'Cultural', 'Fostering cultural heritage, traditional arts, awareness, Indian languages, and spiritual philosophy at IIT Dharwad.', 'prabodhini.club@iitdh.ac.in', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=200&h=200&fit=crop'),
  ('cul-2222-4222-a222-222222222222', 'UDGHOSH IITDh', 'Cultural', 'The official dramatics and theatre society of IIT Dharwad, organizing stage plays, street plays (Nukkad Natak), and theatrical productions.', 'dramatics@iitdh.ac.in', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=200&h=200&fit=crop'),
  ('cul-3333-4333-a333-333333333333', 'Fine Arts Club', 'Cultural', 'Cultivating sketching, painting, digital illustration, origami, calligraphy, sculpture, and visual fine arts exhibitions across the institute.', 'finearts@iitdh.ac.in', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&h=200&fit=crop'),
  ('cul-4444-4444-a444-444444444444', 'The Sapphire Dance Club', 'Cultural', 'IIT Dharwad premier dance collective exploring classical, contemporary, hip-hop, western, and fusion choreography for inter-college competitions.', 'sapphire.danceclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop'),
  ('cul-5555-4555-a555-555555555555', 'Music Club', 'Cultural', 'Uniting instrumentalists, vocalists, acoustic ensembles, and bands across classical, rock, jazz, and indie musical genres.', 'musicclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop'),
  ('cul-6666-4666-a666-666666666666', 'Quiz Club', 'Cultural', 'Promoting trivia, general knowledge, pop culture, sci-tech quizzing, and representing IIT Dharwad in national inter-collegiate quiz circuits.', 'quizclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=200&h=200&fit=crop'),
  ('cul-7777-4777-a777-777777777777', '| EUNOIA |', 'Cultural', 'The official literary and debating society of IIT Dharwad, organizing parliamentary debates, creative writing, poetry slams, and Model United Nations.', 'literaryclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&h=200&fit=crop'),
  ('cul-8888-4888-a888-888888888888', 'Photography and Films Club', 'Cultural', 'Capturing campus life, cinematic filmmaking, documentary storytelling, cinematography, editing, visual post-production, and photo exhibitions.', 'paf@iitdh.ac.in', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop'),

  -- Sports Clubs
  ('spt-1111-4111-a111-111111111111', 'Football Club', 'Sports', 'Competitive collegiate football team training, tactic sessions, inter-departmental tournaments, and Inter-IIT Sports Meet training.', 'footballclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&h=200&fit=crop'),
  ('spt-2222-4222-a222-222222222222', 'Badminton Club', 'Sports', 'High-intensity indoor badminton coaching, singles and doubles tournaments, and varsity trials at the campus sports complex.', 'badmintonclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=200&h=200&fit=crop'),
  ('spt-3333-4333-a333-333333333333', 'Table-Tennis Club', 'Sports', 'Fast-paced table tennis coaching, spin techniques, intra-hostel leagues, and competitive Inter-IIT team preparation.', 'tabletennisclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=200&h=200&fit=crop'),
  ('spt-4444-4444-a444-444444444444', 'Tennis Club', 'Sports', 'Synthetic hard-court tennis training, baseline strategy, serve mechanics, and collegiate tournaments.', 'tennisclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=200&h=200&fit=crop'),
  ('spt-5555-4555-a555-555555555555', 'Cricket Club', 'Sports', 'IIT Dharwad cricket team organizing the institute premier league, net practice sessions, and representing the institute in regional tournaments.', 'cricketclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&h=200&fit=crop'),
  ('spt-6666-4666-a666-666666666666', 'Volleyball Club', 'Sports', 'Spiking, setting, and defensive coordination on outdoor courts, organizing institute volleyball championships and Inter-IIT training.', 'volleyballclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=200&h=200&fit=crop'),
  ('spt-7777-4777-a777-777777777777', 'Chess Club', 'Sports', 'Classical, rapid, and blitz chess tournaments, grandmaster game analysis, tactical puzzle solving, and FIDE rated event prep.', 'chessclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=200&h=200&fit=crop'),
  ('spt-8888-4888-a888-888888888888', 'Hockey Club', 'Sports', 'Field hockey training, stick handling drills, penalty corner tactics, and Inter-IIT hockey contingent development.', 'hockeyclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=200&h=200&fit=crop'),
  ('spt-9999-4999-a999-999999999999', 'Athletics Club', 'Sports', 'Track and field disciplines including sprints, middle-distance running, relays, long jump, shot put, and annual athletic meets.', 'athleticsclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&h=200&fit=crop'),
  ('spt-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'Basketball Club', 'Sports', 'Fast-break drills, zone defense, shooting clinics, and 3v3 and 5v5 tournaments on the campus basketball courts.', 'basketballclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop'),
  ('spt-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 'Squash Club', 'Sports', 'Indoor squash racquet skills, endurance training, wall drills, and competitive squash matches at the sports pavilion.', 'squashclub@iitdh.ac.in', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&h=200&fit=crop')
)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    email = EXCLUDED.email,
    domain = EXCLUDED.domain;

-- 2. Insert Featured Event: VIBE-A-THON (Coding Club)
INSERT INTO public.events (
  id,
  club_id,
  title,
  category,
  short_description,
  description,
  event_date,
  start_time,
  end_time,
  venue,
  registration_url,
  registration_deadline,
  poster_url,
  status
)
VALUES (
  'e1111111-1111-4111-b111-111111111111',
  'c5555555-5555-4555-a555-555555555555', -- Coding Club
  'VIBE-A-THON',
  'Technical / Buildathon',
  'An AI-powered, beginner-friendly buildathon. Bring an idea, use AI tools, and turn it into a working project. No prior coding experience is required.',
  'VIBE-A-THON is IIT Dharwad’s flagship AI-powered, beginner-friendly buildathon organized by Coding Club!

Whether you are a seasoned coder or haven’t written a single line of code in your life, this event is designed for YOU. Bring an idea, leverage modern AI developer tools (Gemini, Claude, Cursor, v0, Bolt, Lovable), and turn creative concepts into functioning digital products, hardware demos, or automation tools.

KEY DETAILS & TIMELINE:
• Registration Closed: 9 November 2026.
• Project Submission Deadline: 14 November 2026 (Submit code repositories, deployment URLs, and demo videos).
• Presentation & Pitch Showcase: To be announced by the organizing committee.
• Venue: To be announced.

ELIGIBILITY & PARTICIPATION RULES:
1. Open exclusively to all registered students of IIT Dharwad.
2. Teams may consist of 1 to 4 members from any department or year.
3. Use of AI code-assistants, LLMs, and no-code/low-code platforms is explicitly encouraged!
4. Originality: Solutions must address a real campus, scientific, or social problem.
5. All teams will receive participation certificates, and top teams will win cash prizes and mentorship opportunities from tech mentors.',
  '2026-11-14',
  '09:00:00',
  '23:59:00',
  'To be announced',
  'https://docs.google.com/forms/d/e/1FAIpQLSdyds4FyQ88ppd4qp5T6JEuNcB0TY5pgL7tzz7fA9vfTyFgEg/viewform?usp=dialog',
  '2026-11-09T23:59:59Z',
  '/src/assets/images/vibeathon_banner_1794484938286.jpg',
  'Published'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description;

-- Additional Events
INSERT INTO public.events (
  id,
  club_id,
  title,
  category,
  short_description,
  description,
  event_date,
  start_time,
  end_time,
  venue,
  registration_url,
  registration_deadline,
  poster_url,
  status
)
VALUES
(
  'e2222222-2222-4222-b222-222222222222',
  'c3333333-3333-4333-a333-333333333333', -- Robotics Club
  'Autonomous Rover Hands-On BootCamp',
  'Technical / Workshop',
  'Hands-on workshop on ROS2, LiDAR navigation, and motor driver integration for autonomous rover platforms.',
  'Join the Robotics Club for an immersive 2-day practical bootcamp on building ROS2 navigation stacks and micro-ROS sensor integration. Bring laptops with Ubuntu or WSL.',
  '2026-11-20',
  '14:00:00',
  '18:00:00',
  'Makerspace Lab 1, Central Research Facility',
  'https://iitdh.ac.in/robotics-register',
  '2026-11-18T18:00:00Z',
  '/src/assets/images/robotics_club_showcase_1794484939484.jpg',
  'Published'
),
(
  'e3333333-3333-4333-b333-333333333333',
  'c2222222-2222-4222-a222-222222222222', -- InGene Motorsport
  'Formula Student Aerodynamics & Telemetry Symposium',
  'Technical / Seminar',
  'Deep-dive into CFD simulations, downforce optimization, and live CAN bus telemetry for formula electric cars.',
  'InGene Motorsport presents an exhaustive technical breakdown of EV aerodynamics and telemetry data pipelines from Formula Bharat.',
  '2026-11-25',
  '16:30:00',
  '19:00:00',
  'Auditorium 2, Main Academic Block',
  'https://iitdh.ac.in/ingene-symposium',
  '2026-11-24T23:59:00Z',
  '/src/assets/images/motorsport_showcase_1794484938913.jpg',
  'Published'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Announcements
INSERT INTO public.announcements (
  id,
  club_id,
  title,
  content,
  type,
  external_url,
  attachment_url,
  status,
  published_at
)
VALUES
(
  'a1111111-1111-4111-c111-111111111111',
  'c5555555-5555-4555-a555-555555555555',
  'VIBE-A-THON Registration Status & Final Submission Guidelines',
  'Registrations for VIBE-A-THON closed on 9 November 2026. All confirmed teams must submit their project repositories and 3-minute video pitch links by 14 November 2026 at 23:59 IST. Review rules on the portal.',
  'Club Announcement',
  'https://docs.google.com/forms/d/e/1FAIpQLSdyds4FyQ88ppd4qp5T6JEuNcB0TY5pgL7tzz7fA9vfTyFgEg/viewform?usp=dialog',
  NULL,
  'Published',
  '2026-11-10T10:00:00Z'
),
(
  'a2222222-2222-4222-c222-222222222222',
  NULL, -- Campus-wide
  'Official Launch of IIT Dharwad Campus Events Portal',
  'Welcome to the unified IIT Dharwad Campus Events & Technical Clubs Portal. Students can now browse all institute technical clubs, track upcoming competitions, access official registrations, and read verified administrative announcements.',
  'Campus-wide Announcement',
  'https://iitdh.ac.in',
  NULL,
  'Published',
  '2026-11-08T08:00:00Z'
),
(
  'a3333333-3333-4333-c333-333333333333',
  'c6666666-6666-4666-a666-666666666666',
  'AI Club Paper Reading Group: LLM Reasoning Architectures',
  'AI Club is hosting its bi-weekly research paper reading circle on test-time compute scaling and reasoning models. Pre-reading will be shared on the Discord channel.',
  'Club Announcement',
  'https://iitdh.ac.in/aiclub',
  NULL,
  'Published',
  '2026-11-11T14:00:00Z'
)
ON CONFLICT (id) DO NOTHING;
