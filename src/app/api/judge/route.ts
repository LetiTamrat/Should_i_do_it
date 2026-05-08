import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const LOW_KEYWORDS = [
  "ex", "text", "drunk", "drunken", "tequila", "vodka", "shots",
  "quit", "fight", "ghost", "rebound", "tattoo", "shave", "cut my hair",
  "bangs", "dye", "send", "post", "tweet", "delete", "block",
  "argue", "confront", "reply", "respond", "double text", "voice memo",
  "after midnight", "2am", "3am", "4am", "5am", "1am",
  "tinder", "hinge", "bumble", "instagram", "stalk", "screenshot",
  "tell my", "spend my", "buy", "splurge", "loan", "borrow",
  "skip work", "skip class", "skip school", "call out",
  "argue with", "snap at", "yell", "scream", "lie", "cheat",
  "smoke", "vape", "edible", "shrooms", "mushrooms",
];

const HIGH_KEYWORDS = [
  "study", "read", "gym", "workout", "exercise", "run", "lift",
  "sleep", "rest", "nap", "meditate", "stretch", "yoga",
  "work", "finish", "ship", "submit", "send the project",
  "save", "invest", "budget", "plan",
  "drink water", "eat", "cook", "meal prep", "vegetable",
  "apologize", "say sorry", "thank", "compliment",
  "call my mom", "call my dad", "visit", "hug",
  "shower", "brush", "floss", "doctor", "dentist", "therapy",
  "journal", "write", "practice", "learn",
];

interface JudgePayload {
  question: string;
  attempt: number;
}

function biasFromQuestion(question: string, attempt: number) {
  const q = question.toLowerCase();
  let bias = 0;
  for (const k of LOW_KEYWORDS) if (q.includes(k)) bias -= 18;
  for (const k of HIGH_KEYWORDS) if (q.includes(k)) bias += 18;
  // Each re-roll trends slightly worse — committing to the "stalling" bit.
  if (attempt > 1) bias -= (attempt - 1) * 6;
  return bias;
}

function generatePercentage(question: string, attempt: number) {
  const bias = biasFromQuestion(question, attempt);
  const base = Math.floor(Math.random() * 100) + 1;
  const biased = Math.round(base + bias);
  return Math.max(1, Math.min(99, biased));
}

function verdictFor(pct: number) {
  if (pct <= 15) return "ABSOLUTELY NOT.";
  if (pct <= 35) return "NO.";
  if (pct <= 55) return "RISKY.";
  if (pct <= 75) return "PROBABLY.";
  return "DO IT.";
}

const FALLBACK_ROASTS = [
  "ERROR 404: DIGNITY NOT FOUND. ABORT.",
  "YOU ALREADY KNOW THE ANSWER. YOU'RE JUST HERE FOR VALIDATION.",
  "THIS WILL EITHER BUILD CHARACTER OR TRAUMA.",
  "MAIN CHARACTER ENERGY. BAD SCRIPT THOUGH.",
  "YOU'RE NOT THINKING. YOU'RE FEELING.",
  "THIS IS HOW STORIES START. NOT GOOD ONES.",
];

function fallbackRoast(attempt: number) {
  if (attempt >= 4) return "THIS IS YOUR FOURTH TRY. THE ANSWER ISN'T CHANGING. YOU ARE.";
  if (attempt === 3) return "THIRD TIME. STILL NO. NOTICE A PATTERN?";
  if (attempt === 2) return "BACK SO SOON? THE VERDICT REMAINS.";
  return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
}

async function generateRoast(
  question: string,
  percentage: number,
  attempt: number,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackRoast(attempt);

  const ai = new GoogleGenAI({ apiKey });

  const metaNote =
    attempt >= 2
      ? `\nThis is the user's ATTEMPT #${attempt} on this exact same question. They're stalling, hoping for a different number. Lean into that — call out the re-roll, mock the stalling, get meaner each time. Reference the attempt number if it lands.`
      : "";

  const prompt = `You roast people's bad decisions. The user submitted: "${question}"

Their survival rate is ${percentage}%.${metaNote}

Write ONE roast line — punchy, specific, funny. ALL CAPS. Max 110 characters.

GOOD roasts (these actually got laughs):
- Q: "should I text my ex at 2am" → "YOUR THUMBS ARE FASTER THAN YOUR THERAPIST. RECONSIDER."
- Q: "should I quit my job to start a startup" → "STATISTICALLY, YOUR LANDLORD WILL NOT ACCEPT 'PRE-SEED VIBES' AS RENT."
- Q: "should I shave my head" → "78%? GO. WORST CASE YOU LOOK LIKE A VILLAIN. THAT'S A WIN, ACTUALLY."
- Q: "should I message my coworker" → "HR HAS ENTERED THE CHAT. HR HAS LEFT THE CHAT. HR IS UPDATING ITS RESUME."
- Q: "should I get bangs" → "BANGS ARE A CRY FOR HELP THAT YOUR FOREHEAD WILL HEAR FIRST."
- Q: "should I eat the leftover sushi" → "12%. WHATEVER LIVES IN THAT CONTAINER NOW IS NOT SUSHI ANYMORE."
- Q: "should I go to the gym" → "82%. GO. YOUR FUTURE SELF IS LITERALLY BEGGING YOU IN A GROUP CHAT YOU CAN'T SEE."
- Q (attempt 3): "should I text my ex" → "ATTEMPT THREE. THE NUMBER ISN'T MOVING. YOU ARE."

Comedy rules:
- BE SPECIFIC to what they typed. Reference an actual detail from their question. Generic roasts die.
- One vivid image > five abstract insults. ("YOUR LANDLORD" hits harder than "YOU WILL FAIL")
- Setup + turn. Build a tiny expectation, snap it.
- Don't moralize. Don't say "regret." Don't say "you'll learn." Don't say "build character or trauma." Banned.
- Match the %: under 30 = ruthless, 30-60 = grim-amused, 60-90 = warmer but still snarky, 90+ = grudgingly hyping them.
- Internet group-chat voice. Not boomer-dad voice.
- ONE sentence (or two short ones with a period between). No emojis. No quotes around the output. ALL CAPS. Max 110 chars.

Return ONLY the roast line, nothing else.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 1.15,
        maxOutputTokens: 120,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const text = (result.text ?? "").trim();
    let cleaned = text
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/\s+/g, " ")
      .replace(/^Q:\s.*?→\s*/i, "") // strip example-prefix if model echoed one
      .replace(/^A:\s*/i, "")
      .toUpperCase()
      .trim();
    if (!cleaned) return fallbackRoast(attempt);
    // Truncate gracefully at sentence boundary instead of falling back
    if (cleaned.length > 220) {
      const cut = cleaned.slice(0, 220);
      const lastPeriod = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
      cleaned = lastPeriod > 80 ? cut.slice(0, lastPeriod + 1) : cut;
    }
    return cleaned;
  } catch {
    return fallbackRoast(attempt);
  }
}

export async function POST(req: NextRequest) {
  let body: JudgePayload;
  try {
    body = (await req.json()) as JudgePayload;
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }

  const question = body.question?.trim() ?? "";
  const attempt = Math.max(1, Math.min(99, Number(body.attempt) || 1));
  if (!question || question.length > 240) {
    return NextResponse.json({ error: "Bad question." }, { status: 400 });
  }

  const percentage = generatePercentage(question, attempt);
  const verdict = verdictFor(percentage);
  const roast = await generateRoast(question, percentage, attempt);

  return NextResponse.json({ percentage, verdict, roast });
}
