import { BusinessSkill } from "./types.js";

export const HOSPITALITY_SKILLS: BusinessSkill[] = [
  {
    id: "hotel-marketing",
    name: "Hotel Marketing Strategy",
    domain: "hospitality",
    description: "Build a hotel revenue & marketing strategy",
    prompt: `Create a marketing strategy for {{hotel_name}}.

Property type: {{property_type}}
Location: {{location}}
Room count: {{rooms}}
Current ADR: {{adr}} | Current occupancy: {{occupancy}}%
Target segments: {{segments}}
Competition: {{competition}}

Hotel Marketing Strategy:
1. Revenue Management
   - Rate strategy by season and segment
   - Channel mix optimization (OTA, direct, GDS, corporate)
   - Direct booking incentives to reduce OTA dependence
   - Dynamic pricing recommendations

2. Digital Marketing
   - Website optimization (booking engine, imagery, SEO)
   - Google Hotel Ads strategy
   - OTA listing optimization (Booking.com, Expedia, Airbnb)
   - Email marketing to past guests

3. Social Media
   - Platform priority (Instagram, TikTok, Facebook)
   - Content themes and posting frequency
   - Influencer/travel blogger strategy

4. Guest Experience → Reviews
   - NPS improvement plan
   - Review response strategy
   - TripAdvisor ranking optimization

5. Corporate/MICE Strategy
   - Meeting and events positioning
   - Corporate accounts development
   - Rate negotiation approach

6. Loyalty & Repeat Business
   - Past guest reactivation campaign
   - Direct booking loyalty benefits

7. Seasonal Packages and Promotions
8. KPIs (RevPAR, ADR, Occupancy, Direct booking %)
9. Monthly budget allocation`,
    inputs: [
      {
        name: "hotel_name",
        label: "Hotel/property name",
        type: "text",
        required: true,
      },
      {
        name: "property_type",
        label: "Property type",
        type: "select",
        required: true,
        options: ["Boutique hotel", "Resort", "Business hotel", "Budget/hostel", "Guesthouse", "Serviced apartments", "Lodge/Eco-camp"],
      },
      {
        name: "location",
        label: "Location",
        type: "text",
        required: true,
        placeholder: "Lomé, Togo / Accra, Ghana / Cape Town, South Africa",
      },
      {
        name: "rooms",
        label: "Number of rooms",
        type: "number",
        required: false,
      },
      {
        name: "adr",
        label: "Average Daily Rate (ADR)",
        type: "text",
        required: true,
        placeholder: "$150",
      },
      {
        name: "occupancy",
        label: "Current occupancy %",
        type: "number",
        required: false,
      },
      {
        name: "segments",
        label: "Target guest segments",
        type: "text",
        required: true,
        placeholder: "Business travelers, leisure families, diaspora tourists",
      },
      {
        name: "competition",
        label: "Key competitors",
        type: "text",
        required: false,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova", "bolt"],
    tags: ["hotel", "hospitality", "marketing", "revenue management"],
    estimatedTokens: 800,
  },
  {
    id: "event-planning",
    name: "Event Planning Framework",
    domain: "hospitality",
    description: "Plan any corporate or social event",
    prompt: `Create an event planning framework for {{event_name}}.

Event type: {{event_type}}
Date: {{date}}
Venue: {{venue}}
Expected attendance: {{attendance}}
Budget: {{budget}}
Client/organizer: {{client}}
Theme/goal: {{theme}}

Event Plan:
1. Event Brief Summary
2. Timeline & Critical Path (12 weeks to event day)
   Week-by-week milestones
3. Venue Management
   - Layout and floor plan
   - A/V and tech requirements
   - Catering menu design
   - Accessibility considerations
4. Guest Experience Design
   - Registration process
   - Welcome and arrival experience
   - Program/agenda flow
   - Networking facilitation
   - Departure experience
5. Vendor Management
   - Vendor selection criteria
   - Priority vendors to brief
   - Backup vendors
6. Budget Breakdown (line items)
7. Marketing & Communications
   - Invitation design brief
   - Save-the-date timeline
   - Social media plan
8. Day-Of Operations
   - Run of show (minute by minute)
   - Staff assignments
   - Emergency protocols
9. Post-Event
   - Thank-you communications
   - Survey design
   - Success metrics
10. Risk Register (weather, low attendance, speaker cancellation)`,
    inputs: [
      {
        name: "event_name",
        label: "Event name",
        type: "text",
        required: true,
      },
      {
        name: "event_type",
        label: "Event type",
        type: "select",
        required: true,
        options: ["Corporate conference", "Gala/awards", "Product launch", "Team offsite", "Wedding", "Community event", "Trade show", "Networking mixer"],
      },
      {
        name: "date",
        label: "Event date or window",
        type: "text",
        required: true,
      },
      {
        name: "venue",
        label: "Venue name or type",
        type: "text",
        required: true,
      },
      {
        name: "attendance",
        label: "Expected attendance",
        type: "number",
        required: true,
      },
      {
        name: "budget",
        label: "Total event budget",
        type: "text",
        required: true,
        placeholder: "$25,000",
      },
      {
        name: "client",
        label: "Client/organizing team",
        type: "text",
        required: false,
      },
      {
        name: "theme",
        label: "Event theme or goal",
        type: "text",
        required: true,
        placeholder: "Celebrating 10 years, launching new product, annual leadership summit",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops", "nova"],
    tags: ["event planning", "hospitality", "conference", "corporate events"],
    estimatedTokens: 800,
  },
];
