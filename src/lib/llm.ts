const API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPTIONAL_AI_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";
const BASE_URL = "https://openrouter.ai/api/v1";
const REFERER = process.env.OPENROUTER_REFERER || "http://localhost:3000";
const TITLE = process.env.OPENROUTER_TITLE || "TripOS";

export const hasLLM = () => Boolean(API_KEY);

interface JSONSchema {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  description?: string;
}

interface OpenAITool {
  type: "function";
  function: { name: string; description: string; parameters: JSONSchema };
}

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface ChatResponse {
  choices: Array<{
    message: { content: string | null; tool_calls?: ToolCall[] };
    finish_reason: string;
  }>;
}

interface RawCompletionArgs {
  messages: ChatMessage[];
  tools: OpenAITool[];
  tool_choice?: "auto" | "required" | { type: "function"; function: { name: string } };
  max_tokens: number;
}

async function rawCompletion(args: RawCompletionArgs): Promise<ChatResponse["choices"][0]["message"]> {
  if (!API_KEY) throw new Error("OPENROUTER_API_KEY (or OPTIONAL_AI_API_KEY) not set");

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": REFERER,
      "X-Title": TITLE,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: args.max_tokens,
      messages: args.messages,
      tools: args.tools,
      tool_choice: args.tool_choice ?? "auto",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }
  const data = (await res.json()) as ChatResponse;
  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error("LLM returned no message");
  return msg;
}

async function callLLM(args: {
  messages: ChatMessage[];
  tool: OpenAITool;
  max_tokens: number;
}): Promise<Record<string, unknown>> {
  const msg = await rawCompletion({
    messages: args.messages,
    tools: [args.tool],
    tool_choice: { type: "function", function: { name: args.tool.function.name } },
    max_tokens: args.max_tokens,
  });
  const call = msg.tool_calls?.[0];
  if (!call || call.function.name !== args.tool.function.name) {
    throw new Error(`LLM did not call ${args.tool.function.name}`);
  }
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    throw new Error("LLM returned invalid JSON in tool call");
  }
}

export const ITINERARY_CATEGORIES = ["stay", "food", "activity", "travel", "note"] as const;
export type ItineraryCategory = (typeof ITINERARY_CATEGORIES)[number];

export interface AIItineraryItem {
  day_number: number;
  title: string;
  description?: string | null;
  location_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  category?: ItineraryCategory | null;
  estimated_cost?: number | null;
  image_query?: string | null;
}

export interface AIExpense { title: string; amount: number; paid_by: string }
export interface AIVote { topic: string; preferred: string }
export interface AIChatParseResult {
  expenses: AIExpense[];
  itinerary: AIItineraryItem[];
  votes: AIVote[];
  budget: { per_person_cap: number } | null;
  members: string[];
}

const ITINERARY_SYSTEM = `You are a travel planner that designs realistic, locally-grounded day-by-day itineraries.

Rules:
- Output only valid JSON via the provided tool. No prose.
- Plan in chronological day order starting at day_number = 1.
- Include 4–7 stops per day: typically breakfast, mid-morning activity, lunch, afternoon activity, evening/dinner, optional night activity.
- start_time and end_time must be HH:MM (24-hour), or null if flexible.
- category must be one of: stay, food, activity, travel, note.
- estimated_cost is per-person in the trip's currency. Use realistic local values; null if unknown.
- location_name should be a specific named place (e.g. "Anjuna Beach", "A Reverie restaurant"), not generic.
- Title is short and recognisable. Description (1–2 sentences) adds the why/how.
- Cover travel between cities/areas as category "travel" with a realistic duration.
- Day 1 starts with arrival/check-in; final day ends with check-out/departure.
- Always fill image_query: a 2-5 word search query that will return a photo of the place (specific name + city beats generic).`;

const ITEM_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    day_number: { type: "integer", minimum: 1, maximum: 60 },
    title: { type: "string", maxLength: 160 },
    description: { type: ["string", "null"], maxLength: 2000 },
    location_name: { type: ["string", "null"], maxLength: 160, description: "Specific named place, ideally with city" },
    start_time: { type: ["string", "null"], pattern: "^[0-9]{2}:[0-9]{2}$" },
    end_time: { type: ["string", "null"], pattern: "^[0-9]{2}:[0-9]{2}$" },
    category: { type: ["string", "null"], enum: [...ITINERARY_CATEGORIES, null] },
    estimated_cost: { type: ["number", "null"], minimum: 0 },
    image_query: { type: ["string", "null"], maxLength: 120, description: "Short search query for a representative photo, e.g. 'Anjuna Beach Goa sunset'" },
  },
  required: ["day_number", "title"],
};

const ITINERARY_TOOL: OpenAITool = {
  type: "function",
  function: {
    name: "save_itinerary",
    description: "Save the generated itinerary as structured items.",
    parameters: {
      type: "object",
      properties: {
        items: { type: "array", items: ITEM_SCHEMA },
      },
      required: ["items"],
    },
  },
};

export interface GenerateItineraryInput {
  destination: string;
  start_date?: string | null;
  end_date?: string | null;
  num_days?: number;
  budget_per_person?: number | null;
  currency?: string;
  preferences?: string;
}

export async function generateItinerary(input: GenerateItineraryInput): Promise<AIItineraryItem[]> {
  const days = input.num_days ?? deriveDays(input.start_date, input.end_date) ?? 3;
  const budgetLine = input.budget_per_person
    ? `Budget per person: ${input.currency || "INR"} ${input.budget_per_person}. Keep total estimated costs roughly within this.`
    : "No strict budget — favour realistic mid-range options.";
  const datesLine =
    input.start_date && input.end_date
      ? `Trip dates: ${input.start_date} to ${input.end_date}.`
      : "Dates flexible.";
  const userMsg = [
    `Plan a ${days}-day group trip to ${input.destination}.`,
    datesLine,
    budgetLine,
    input.preferences ? `Group preferences: ${input.preferences}` : "",
    `Use save_itinerary with the full ${days}-day plan.`,
  ]
    .filter(Boolean)
    .join("\n");

  const out = (await callLLM({
    max_tokens: 4096,
    tool: ITINERARY_TOOL,
    messages: [
      { role: "system", content: ITINERARY_SYSTEM },
      { role: "user", content: userMsg },
    ],
  })) as { items: AIItineraryItem[] };

  return (out.items || []).map(normaliseItem);
}

const CHAT_SYSTEM = `You extract structured trip data from informal group-chat messages.

Rules:
- Output only valid JSON via the provided tool. No prose.
- expenses: each item is { title, amount (number, local currency), paid_by (the speaker's name only) }.
- itinerary: same shape as the planner — day_number, title, optional description/time/location/category/estimated_cost.
- votes: { topic, preferred } when the chat shows a clear preference between options.
- budget: { per_person_cap } when someone mentions a cap. null otherwise.
- members: distinct speaker names seen in the chat.
- Be conservative — only emit items you are confident about. Empty arrays are fine.`;

const CHAT_TOOL: OpenAITool = {
  type: "function",
  function: {
    name: "save_parsed_chat",
    description: "Save the structured data extracted from the chat dump.",
    parameters: {
      type: "object",
      properties: {
        expenses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              amount: { type: "number", minimum: 0 },
              paid_by: { type: "string" },
            },
            required: ["title", "amount", "paid_by"],
          },
        },
        itinerary: { type: "array", items: ITEM_SCHEMA },
        votes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              topic: { type: "string" },
              preferred: { type: "string" },
            },
            required: ["topic", "preferred"],
          },
        },
        budget: {
          type: ["object", "null"],
          properties: { per_person_cap: { type: "number", minimum: 0 } },
          required: ["per_person_cap"],
        },
        members: { type: "array", items: { type: "string" } },
      },
      required: ["expenses", "itinerary", "votes", "budget", "members"],
    },
  },
};

export async function parseChatToItems(text: string): Promise<AIChatParseResult> {
  const out = (await callLLM({
    max_tokens: 3000,
    tool: CHAT_TOOL,
    messages: [
      { role: "system", content: CHAT_SYSTEM },
      { role: "user", content: `Chat dump:\n\n${text}` },
    ],
  })) as unknown as AIChatParseResult;

  return {
    expenses: out.expenses || [],
    votes: out.votes || [],
    members: out.members || [],
    budget: out.budget ?? null,
    itinerary: (out.itinerary || []).map(normaliseItem),
  };
}

function normaliseItem(it: AIItineraryItem): AIItineraryItem {
  return {
    day_number: Math.max(1, Math.min(60, Number(it.day_number) || 1)),
    title: String(it.title || "Stop").slice(0, 160),
    description: it.description ?? null,
    location_name: it.location_name ?? null,
    start_time: padTime(it.start_time),
    end_time: padTime(it.end_time),
    category: ITINERARY_CATEGORIES.includes(it.category as ItineraryCategory)
      ? (it.category as ItineraryCategory)
      : null,
    estimated_cost: typeof it.estimated_cost === "number" ? it.estimated_cost : null,
    image_query: typeof it.image_query === "string" ? it.image_query.slice(0, 120) : null,
  };
}

function padTime(t?: string | null): string | null {
  if (!t) return null;
  return /^\d{2}:\d{2}$/.test(t) ? t : null;
}

function deriveDays(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(+s) || isNaN(+e)) return null;
  const diff = Math.round((+e - +s) / 86400000) + 1;
  return diff > 0 && diff <= 60 ? diff : null;
}

// ─── Chat-driven itinerary editor ─────────────────────────────────────

export interface ChatItineraryItemContext {
  id: string;
  day_number: number | null;
  title: string;
  description?: string | null;
  location_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  category?: ItineraryCategory | null;
  estimated_cost?: number | null;
}

export interface ChatTurnInput {
  trip: {
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    budget_per_person: number | null;
    currency: string;
  };
  items: ChatItineraryItemContext[];
  history: { role: "user" | "assistant"; content: string }[];
  user_message: string;
}

export type ItemPatch =
  | { op: "add"; data: AIItineraryItem }
  | { op: "update"; id: string; data: Partial<AIItineraryItem> & { location_name?: string | null } }
  | { op: "delete"; id: string };

export interface ChatTurnOutput {
  message: string;
  quick_replies: string[];
  patches: ItemPatch[];
}

const CHAT_PLAN_SYSTEM = `You are TripOS, a collaborative trip-planning assistant. You help a group iteratively shape their itinerary by editing it through tools.

Behaviour:
- Be warm and concise. One short paragraph max per reply.
- When the user's request is ambiguous (vague budget, missing dates, broad vibe), call respond with 2-4 short quick_replies so they can tap to clarify instead of typing.
- When the user clearly asks for changes, call add_item / update_item / delete_item BEFORE calling respond. You may call several tools in one turn.
- update_item and delete_item must reference an existing item id from the current itinerary you are shown.
- Times are 24h HH:MM. Costs are per-person in the trip currency.
- Always fill image_query when adding an item: a 2-5 word search query for a representative photo.
- End every turn with exactly one respond() call summarising what you did or asking what's next.`;

const ADD_ITEM_TOOL: OpenAITool = {
  type: "function",
  function: {
    name: "add_item",
    description: "Add a new stop to the itinerary.",
    parameters: ITEM_SCHEMA,
  },
};

const UPDATE_ITEM_TOOL: OpenAITool = {
  type: "function",
  function: {
    name: "update_item",
    description: "Update fields of an existing itinerary item by id. Only include the fields you want to change.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Id of the existing item" },
        day_number: { type: ["integer", "null"], minimum: 1, maximum: 60 },
        title: { type: ["string", "null"], maxLength: 160 },
        description: { type: ["string", "null"], maxLength: 2000 },
        location_name: { type: ["string", "null"], maxLength: 160 },
        start_time: { type: ["string", "null"], pattern: "^[0-9]{2}:[0-9]{2}$" },
        end_time: { type: ["string", "null"], pattern: "^[0-9]{2}:[0-9]{2}$" },
        category: { type: ["string", "null"], enum: [...ITINERARY_CATEGORIES, null] },
        estimated_cost: { type: ["number", "null"], minimum: 0 },
        image_query: { type: ["string", "null"], maxLength: 120 },
      },
      required: ["id"],
    },
  },
};

const DELETE_ITEM_TOOL: OpenAITool = {
  type: "function",
  function: {
    name: "delete_item",
    description: "Remove an itinerary item by id.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
};

const RESPOND_TOOL: OpenAITool = {
  type: "function",
  function: {
    name: "respond",
    description: "Send the final user-facing reply. Always call this last. Use quick_replies (2-4 short chips) when asking the user to choose between options.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", maxLength: 800 },
        quick_replies: {
          type: ["array", "null"],
          items: { type: "string", maxLength: 60 },
        },
      },
      required: ["message"],
    },
  },
};

const CHAT_TOOLS: OpenAITool[] = [ADD_ITEM_TOOL, UPDATE_ITEM_TOOL, DELETE_ITEM_TOOL, RESPOND_TOOL];

function tripContextLine(t: ChatTurnInput["trip"]): string {
  const parts = [
    t.destination ? `Destination: ${t.destination}` : null,
    t.start_date && t.end_date ? `Dates: ${t.start_date} → ${t.end_date}` : null,
    t.budget_per_person ? `Budget per person: ${t.currency} ${t.budget_per_person}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No trip metadata set yet.";
}

function itemsSummary(items: ChatItineraryItemContext[]): string {
  if (!items.length) return "Itinerary is currently empty.";
  return items
    .map((it) => {
      const time = it.start_time ? ` ${it.start_time.slice(0, 5)}` : "";
      const loc = it.location_name ? ` @ ${it.location_name}` : "";
      return `- [${it.id}] Day ${it.day_number ?? 1}${time}: ${it.title}${loc}`;
    })
    .join("\n");
}

export async function chatPlanTurn(input: ChatTurnInput): Promise<ChatTurnOutput> {
  const systemContext = [
    CHAT_PLAN_SYSTEM,
    "",
    "Current trip:",
    tripContextLine(input.trip),
    "",
    "Current itinerary:",
    itemsSummary(input.items),
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemContext },
    ...input.history.map((h) => ({ role: h.role, content: h.content }) as ChatMessage),
    { role: "user", content: input.user_message },
  ];

  const patches: ItemPatch[] = [];
  let finalMessage = "";
  let quickReplies: string[] = [];

  for (let step = 0; step < 6; step++) {
    const msg = await rawCompletion({
      messages,
      tools: CHAT_TOOLS,
      tool_choice: "required",
      max_tokens: 1200,
    });

    const calls = msg.tool_calls || [];
    if (!calls.length) {
      finalMessage = msg.content?.trim() || "Okay.";
      break;
    }

    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: calls });

    let done = false;
    for (const c of calls) {
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(c.function.arguments); } catch {}

      if (c.function.name === "add_item") {
        const item = normaliseItem(args as unknown as AIItineraryItem);
        patches.push({ op: "add", data: item });
        messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify({ ok: true }) });
      } else if (c.function.name === "update_item") {
        const id = String(args.id || "");
        if (id) {
          patches.push({ op: "update", id, data: args as Partial<AIItineraryItem> });
          messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify({ ok: true }) });
        } else {
          messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify({ ok: false, error: "missing id" }) });
        }
      } else if (c.function.name === "delete_item") {
        const id = String(args.id || "");
        if (id) {
          patches.push({ op: "delete", id });
          messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify({ ok: true }) });
        } else {
          messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify({ ok: false, error: "missing id" }) });
        }
      } else if (c.function.name === "respond") {
        finalMessage = String((args as { message?: string }).message || "Okay.").slice(0, 800);
        const qr = (args as { quick_replies?: unknown }).quick_replies;
        if (Array.isArray(qr)) {
          quickReplies = qr.filter((s): s is string => typeof s === "string").slice(0, 4).map((s) => s.slice(0, 60));
        }
        done = true;
        break;
      } else {
        messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify({ ok: false, error: "unknown tool" }) });
      }
    }
    if (done) break;
  }

  if (!finalMessage) finalMessage = "Done.";
  return { message: finalMessage, quick_replies: quickReplies, patches };
}
