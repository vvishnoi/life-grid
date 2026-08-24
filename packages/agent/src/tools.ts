import { FunctionTool, LongRunningFunctionTool, type Context } from '@google/adk';
import { google } from 'googleapis';
import { z } from 'zod';
import { ModelArmorGateway } from './gateway/model-armor.js';
import { PolicyEngine } from './gateway/policy-engine.js';
import { ZeroTrustGateway } from './gateway/zero-trust.js';
import { SECURITY_THREAT_STATE_KEY } from './gateway/security-gate.js';
import { memoryBank } from './memory/index.js';

// ─────────────────────────────────────────────────────
// 1. MEMORY BANK TOOLS (Real Firestore backing)
// ─────────────────────────────────────────────────────

export const readMemoryBank = new FunctionTool({
  name: 'read_memory_bank',
  description:
    'Read persistent user preferences, past trip history, dietary rules, schedule rules, and budget rules from the Firestore Memory Bank. Call this BEFORE making any recommendations to ensure personalization.',
  parameters: z.object({
    category: z
      .enum(['preference', 'past_trip', 'schedule_rule', 'family_profile', 'budget_rule', 'all'])
      .optional()
      .describe('Filter memories by category, or "all" to retrieve everything.'),
  }),
  execute: async ({ category }) => {
    const memories = await memoryBank.getMemories();
    if (category && category !== 'all') {
      const filtered = memories.filter((m) => m.category === category);
      return { memories: filtered, count: filtered.length };
    }
    return { memories, count: memories.length };
  },
});

export const writeMemoryBank = new FunctionTool({
  name: 'write_memory_bank',
  description:
    'Persist a newly discovered user preference, rule, or profile to the Firestore Memory Bank so it is remembered across future sessions.',
  parameters: z.object({
    category: z.enum(['preference', 'past_trip', 'schedule_rule', 'family_profile', 'budget_rule']),
    key: z.string().describe('A short identifier for this memory, e.g. "lodging_preference"'),
    value: z.string().describe('The full description of the preference or rule'),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    sourceAgent: z.string().describe('Name of the agent writing this memory'),
  }),
  execute: async ({ category, key, value, sentiment, sourceAgent }) => {
    const newMemory = await memoryBank.addMemory({ category, key, value, sentiment, sourceAgent });
    return { success: true, memoryId: newMemory.id, memory: newMemory, message: `Memory persisted: "${key}"` };
  },
});

// ─────────────────────────────────────────────────────
// 2. SECURITY TOOLS (Real Model Armor)
// ─────────────────────────────────────────────────────

export const scanWithModelArmor = new FunctionTool({
  name: 'scan_with_model_armor',
  description:
    'Scan any external content (URLs, API responses, user-provided text) through the Model Armor security gateway to detect prompt injection, data exfiltration, or malicious payloads.',
  parameters: z.object({
    content: z.string().describe('The content to scan for threats'),
    source: z.string().optional().describe('Where this content came from, e.g. "external_url"'),
  }),
  execute: async ({ content, source }, tool_context?: Context) => {
    const result = ModelArmorGateway.inspectInput(content);
    // Flips the flag every downstream agent's beforeAgentCallback checks
    // (see gateway/security-gate.ts) — this is what actually stops the
    // pipeline, not just what reports on it after the fact.
    if (!result.isSafe) {
      tool_context?.state?.set(SECURITY_THREAT_STATE_KEY, true);
    }
    return {
      isSafe: result.isSafe,
      threatCategory: result.threatCategory,
      confidenceScore: result.confidenceScore,
      sanitizedContent: result.sanitizedInput,
      reasons: result.reasons,
      source: source || 'unknown',
    };
  },
});

// ─────────────────────────────────────────────────────
// 3. POLICY & APPROVAL TOOLS (Real Policy Engine)
// ─────────────────────────────────────────────────────

export const requestApproval = new LongRunningFunctionTool({
  name: 'request_human_approval',
  description:
    'Submit a proposed action for human-in-the-loop approval. The Policy Engine enforces a $100 spending threshold and mandatory travel booking consent. Any action involving expenditure over $100 or booking flights/hotels MUST go through this tool. When approval is required, this call pauses until the human responds — do not re-invoke it while it is pending.',
  parameters: z.object({
    agentName: z.string().describe('Name of the agent requesting approval'),
    actionType: z.enum([
      'flight_booking',
      'hotel_reservation',
      'activity_booking',
      'shopping_purchase',
      'budget_override',
    ]),
    title: z.string().describe('Short title of the action, e.g. "Book Hyatt Regency Denver"'),
    summary: z.string().describe('Detailed description of what is being booked/purchased'),
    amount: z.number().describe('Total cost in USD'),
    vendor: z.string().optional().describe('Vendor or provider name'),
  }),
  execute: async ({ agentName, actionType, title, summary, amount, vendor }, tool_context?: Context) => {
    // Resumed call: the framework re-invokes execute with the human's
    // decision attached once /api/approvals answers the pending confirmation.
    // NOTE: apps/web's /api/approvals route no longer actually drives a
    // resume through the ADK Runner (see packages/agent/src/finalize-plan.ts
    // for why — letting FinanceAgent's own continuation run after a resume
    // hit a real, reproducible ADK 1.6.0 protocol error, confirmed live and
    // not fixable from three different mitigations tried in application
    // code). This branch is kept because it's correct, reusable ADK tool
    // behavior for any other consumer of this package that does drive a
    // real resume — just not exercised by this app's own route anymore.
    if (tool_context?.toolConfirmation) {
      return {
        approved: tool_context.toolConfirmation.confirmed,
        title,
        amount,
        message: tool_context.toolConfirmation.confirmed
          ? `User APPROVED: "${title}" ($${amount.toLocaleString()}).`
          : `User REJECTED: "${title}" ($${amount.toLocaleString()}).`,
      };
    }

    const policyResult = PolicyEngine.evaluateAction({
      agentId: agentName.toLowerCase().replace(/\s+/g, '-'),
      agentName,
      actionType,
      title,
      summary,
      amount,
      vendor,
    });

    if (policyResult.requiresApproval) {
      // Pauses this agent run — the framework emits a synthetic
      // adk_request_confirmation call and stops until resumed.
      tool_context?.requestConfirmation({
        hint: title,
        payload: { agentName, actionType, title, summary, amount, vendor },
      });
      return { pending: true };
    }

    return {
      requiresApproval: false,
      policyName: policyResult.policyName,
      riskLevel: policyResult.riskLevel,
      riskScore: policyResult.riskScore,
      reason: policyResult.reason,
    };
  },
});

export const checkBudget = new FunctionTool({
  name: 'check_budget_status',
  description:
    'Check the current budget allocation status. Returns the total budget cap, amount spent so far, and remaining budget. Use this before proposing new expenditures.',
  parameters: z.object({
    budgetCap: z.number().describe('The total budget cap set by the user'),
    currentSpend: z.number().describe('Total amount already allocated/spent'),
  }),
  execute: async ({ budgetCap, currentSpend }) => {
    const remaining = budgetCap - currentSpend;
    return {
      budgetCap,
      currentSpend,
      remaining,
      utilizationPercent: Math.round((currentSpend / budgetCap) * 100),
      status: remaining > 0 ? 'within_budget' : 'over_budget',
      warning: remaining < budgetCap * 0.15 ? 'Budget is running low (< 15% remaining)' : null,
    };
  },
});

// ─────────────────────────────────────────────────────
// 4. TRAVEL TOOLS (Simulated with realistic data)
// ─────────────────────────────────────────────────────

export const searchFlights = new FunctionTool({
  name: 'search_flights',
  description:
    'Search for roundtrip flights to a destination city. Returns available flight options with prices, airlines, and departure times.',
  parameters: z.object({
    origin: z.string().describe('Origin city or airport code'),
    destination: z.string().describe('Destination city or airport code'),
    departureDate: z.string().describe('Departure date in YYYY-MM-DD format'),
    returnDate: z.string().describe('Return date in YYYY-MM-DD format'),
    passengers: z.number().describe('Number of passengers'),
    maxPricePerPerson: z.number().optional().describe('Maximum price per person in USD'),
  }),
  execute: async ({ origin, destination, departureDate, returnDate, passengers, maxPricePerPerson }) => {
    // Simulated flight search results — architecture supports swapping for real API
    const basePrice = 280 + Math.floor(Math.random() * 120);
    const flights = [
      {
        airline: 'United Airlines',
        flightNumber: 'UA-1247',
        departure: `${departureDate}T09:15:00`,
        arrival: `${departureDate}T12:30:00`,
        returnDeparture: `${returnDate}T14:00:00`,
        returnArrival: `${returnDate}T17:15:00`,
        pricePerPerson: basePrice,
        totalPrice: basePrice * passengers,
        stops: 0,
        class: 'Economy',
      },
      {
        airline: 'Southwest Airlines',
        flightNumber: 'SW-892',
        departure: `${departureDate}T11:30:00`,
        arrival: `${departureDate}T14:45:00`,
        returnDeparture: `${returnDate}T16:20:00`,
        returnArrival: `${returnDate}T19:35:00`,
        pricePerPerson: basePrice - 35,
        totalPrice: (basePrice - 35) * passengers,
        stops: 0,
        class: 'Economy',
      },
      {
        airline: 'American Airlines',
        flightNumber: 'AA-531',
        departure: `${departureDate}T06:45:00`,
        arrival: `${departureDate}T10:00:00`,
        returnDeparture: `${returnDate}T18:10:00`,
        returnArrival: `${returnDate}T21:25:00`,
        pricePerPerson: basePrice - 60,
        totalPrice: (basePrice - 60) * passengers,
        stops: 1,
        class: 'Economy',
      },
    ];

    return {
      searchQuery: { origin, destination, departureDate, returnDate, passengers },
      results: flights,
      cheapest: flights.reduce((min, f) => (f.totalPrice < min.totalPrice ? f : min), flights[0]),
      note: 'Simulated data — architecture supports real flight API integration',
    };
  },
});

export const searchHotels = new FunctionTool({
  name: 'search_hotels',
  description:
    'Search for hotels in a destination city. Returns available hotels with prices, ratings, amenities, and distance from downtown.',
  parameters: z.object({
    city: z.string().describe('Destination city'),
    checkIn: z.string().describe('Check-in date in YYYY-MM-DD format'),
    checkOut: z.string().describe('Check-out date in YYYY-MM-DD format'),
    guests: z.number().describe('Number of guests'),
    maxNightlyRate: z.number().optional().describe('Maximum nightly rate in USD'),
    preferDowntown: z.boolean().optional().describe('Whether the user prefers downtown locations'),
  }),
  execute: async ({ city, checkIn, checkOut, guests, maxNightlyRate, preferDowntown }) => {
    const nights =
      Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      ) || 4;

    const hotels = [
      {
        name: `Hyatt Regency ${city} Downtown`,
        rating: 4.5,
        nightlyRate: 312,
        totalPrice: 312 * nights,
        distanceFromDowntown: '0.8 miles',
        amenities: ['Free WiFi', 'Pool', 'Fitness Center', 'Allergy-Conscious Breakfast', 'Concierge'],
        allergyFriendly: true,
      },
      {
        name: `Marriott City Center ${city}`,
        rating: 4.3,
        nightlyRate: 275,
        totalPrice: 275 * nights,
        distanceFromDowntown: '1.2 miles',
        amenities: ['Free WiFi', 'Restaurant', 'Business Center', 'Room Service'],
        allergyFriendly: true,
      },
      {
        name: `Holiday Inn Express ${city} Airport`,
        rating: 3.8,
        nightlyRate: 145,
        totalPrice: 145 * nights,
        distanceFromDowntown: '12.5 miles',
        amenities: ['Free WiFi', 'Free Breakfast', 'Airport Shuttle'],
        allergyFriendly: false,
      },
    ];

    const filtered = maxNightlyRate
      ? hotels.filter((h) => h.nightlyRate <= maxNightlyRate)
      : hotels;

    return {
      searchQuery: { city, checkIn, checkOut, guests },
      results: filtered,
      recommended: filtered[0],
      note: 'Simulated data — architecture supports real hotel API integration',
    };
  },
});

// ─────────────────────────────────────────────────────
// 5. CALENDAR TOOLS (real when the user has connected Google Calendar,
//    simulated otherwise)
// ─────────────────────────────────────────────────────

async function checkRealGoogleCalendar(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<Record<string, unknown>> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  // timeMax is exclusive, so push it a day past endDate to include events
  // that start on endDate itself.
  const timeMax = new Date(endDate);
  timeMax.setDate(timeMax.getDate() + 1);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date(startDate).toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = res.data.items ?? [];
  const existingEvents = events.map((event) => ({
    title: event.summary || '(untitled event)',
    date: (event.start?.date || event.start?.dateTime || startDate).slice(0, 10),
    time: event.start?.dateTime
      ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'All day',
    recurring: Boolean(event.recurringEventId),
    // Real events carry no "flexible" signal — never claim reschedulability
    // we can't actually know.
    flexible: false,
  }));

  return {
    dateRange: { startDate, endDate },
    isAvailable: existingEvents.length === 0,
    existingEvents,
    conflicts: [],
    recommendation:
      existingEvents.length === 0
        ? `Calendar is clear for ${startDate} to ${endDate}.`
        : `${existingEvents.length} existing event(s) found in this range — review for conflicts.`,
    // Read-only scope (calendar.readonly) — this tool never writes to the
    // user's real calendar, unlike the simulated fallback's narrative below.
    tentativeHoldsPlaced: false,
    note: 'Real Google Calendar data (read-only, connected via Google sign-in).',
  };
}

function simulatedCalendarCheck(startDate: string, endDate: string, reason: string): Record<string, unknown> {
  return {
    dateRange: { startDate, endDate },
    isAvailable: true,
    existingEvents: [
      { title: 'Team Standup', date: startDate, time: '09:00', recurring: true, flexible: true },
    ],
    conflicts: [],
    recommendation: `Calendar is mostly clear for ${startDate} to ${endDate}. One recurring standup can be rescheduled.`,
    tentativeHoldsPlaced: true,
    note: `Simulated data (${reason}) — architecture supports real Google Calendar API integration.`,
  };
}

export const checkCalendarAvailability = new FunctionTool({
  name: 'check_calendar_availability',
  description:
    'Check the household calendar for available time slots in a date range. Identifies conflicts with existing events.',
  parameters: z.object({
    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().describe('End date in YYYY-MM-DD format'),
  }),
  execute: async ({ startDate, endDate }, tool_context?: Context) => {
    const accessToken = tool_context?.state?.get<string>('googleCalendarAccessToken');
    if (!accessToken) {
      return simulatedCalendarCheck(startDate, endDate, 'no Google Calendar connected');
    }
    try {
      return await checkRealGoogleCalendar(accessToken, startDate, endDate);
    } catch {
      // Expired token, revoked consent, API hiccup — never fail the whole
      // agent turn over a calendar check; degrade to simulated instead.
      return simulatedCalendarCheck(startDate, endDate, 'Google Calendar request failed');
    }
  },
});

// ─────────────────────────────────────────────────────
// 6. FAMILY & ACTIVITIES TOOLS (Simulated)
// ─────────────────────────────────────────────────────

export const searchActivities = new FunctionTool({
  name: 'search_activities',
  description:
    'Search for family-friendly activities and attractions in a city. Filters by dietary restrictions, age-appropriateness, and accessibility requirements.',
  parameters: z.object({
    city: z.string().describe('Destination city'),
    dietaryRestrictions: z.array(z.string()).optional().describe('e.g. ["nut-free", "gluten-free"]'),
    kidFriendly: z.boolean().optional().describe('Filter for kid-friendly activities'),
    categories: z.array(z.string()).optional().describe('e.g. ["museums", "outdoor", "dining"]'),
  }),
  execute: async ({ city, dietaryRestrictions, kidFriendly }) => {
    const activities = [
      {
        name: `${city} Museum of Nature & Science`,
        type: 'museum',
        rating: 4.7,
        pricePerPerson: 20,
        kidFriendly: true,
        duration: '3-4 hours',
        allergyInfo: 'Museum café offers nut-free options',
      },
      {
        name: `${city} Botanic Gardens`,
        type: 'outdoor',
        rating: 4.6,
        pricePerPerson: 15,
        kidFriendly: true,
        duration: '2-3 hours',
        allergyInfo: 'On-site restaurant with allergen menu available',
      },
      {
        name: `Red Rocks Park & Amphitheatre`,
        type: 'outdoor',
        rating: 4.9,
        pricePerPerson: 0,
        kidFriendly: true,
        duration: '2-3 hours',
        allergyInfo: 'Bring your own food recommended',
      },
      {
        name: `Downtown ${city} Food Tour`,
        type: 'dining',
        rating: 4.4,
        pricePerPerson: 65,
        kidFriendly: true,
        duration: '3 hours',
        allergyInfo: dietaryRestrictions?.includes('nut-free')
          ? 'Verified nut-free accommodations available'
          : 'Standard menu',
      },
    ];

    return {
      city,
      results: activities,
      totalEstimatedCost: activities.reduce((sum, a) => sum + a.pricePerPerson * 4, 0),
      allergyAccommodations: dietaryRestrictions || [],
      note: 'Simulated data — architecture supports real Google Maps/Places API integration',
    };
  },
});

// ─────────────────────────────────────────────────────
// 7. SHOPPING / GEAR TOOLS (Simulated)
// ─────────────────────────────────────────────────────

export const searchGear = new FunctionTool({
  name: 'search_gear_and_supplies',
  description:
    'Search for destination-specific gear, packing supplies, or equipment that may be needed for the trip (e.g. jackets for mountain elevation, sunscreen for beach trips).',
  parameters: z.object({
    destination: z.string().describe('Trip destination'),
    tripType: z.string().optional().describe('e.g. "mountain", "beach", "city"'),
    familySize: z.number().optional().describe('Number of family members'),
  }),
  execute: async ({ destination, tripType, familySize }) => {
    const items = [
      {
        name: 'Packable Family Windbreaker Set',
        quantity: familySize || 4,
        pricePerUnit: 36,
        totalPrice: 36 * (familySize || 4),
        vendor: 'REI Outfitters',
        reason: `${destination} evening temperatures can drop significantly at elevation`,
        priority: 'recommended',
      },
      {
        name: 'Reusable Water Bottles (Insulated)',
        quantity: familySize || 4,
        pricePerUnit: 18,
        totalPrice: 18 * (familySize || 4),
        vendor: 'Amazon',
        reason: 'High altitude requires extra hydration',
        priority: 'recommended',
      },
      {
        name: 'Portable First Aid Kit',
        quantity: 1,
        pricePerUnit: 25,
        totalPrice: 25,
        vendor: 'Target',
        reason: 'Essential for family travel with outdoor activities',
        priority: 'essential',
      },
    ];

    return {
      destination,
      recommendations: items,
      totalEstimatedCost: items.reduce((sum, i) => sum + i.totalPrice, 0),
      note: 'Simulated data — architecture supports real e-commerce API integration',
    };
  },
});

// ─────────────────────────────────────────────────────
// TOOL EXPORTS BY AGENT SCOPE
// ─────────────────────────────────────────────────────

export const travelAgentTools = [searchFlights, searchHotels, readMemoryBank];
export const familyAgentTools = [searchActivities, readMemoryBank, writeMemoryBank];
export const calendarAgentTools = [checkCalendarAvailability];
export const shoppingAgentTools = [searchGear];
export const financeAgentTools = [checkBudget, requestApproval];
export const securityAgentTools = [scanWithModelArmor];
