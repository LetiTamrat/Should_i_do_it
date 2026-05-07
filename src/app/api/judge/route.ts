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
      ? `\nThe user has already asked this same question ${attempt} times — they are stalling, hoping for a different answer. Mock that directly. Reference the re-roll.`
      : "";

  const prompt = `You are a sarcastic, slightly chaotic, very relatable judgment engine. The user submitted: "${question}"

Their bad-decision survival rate has been calculated as ${percentage}%.${metaNote}

Output ONE single roast line, max 110 characters, in ALL CAPS, with terminal-diagnostic energy.

Style examples (for tone, do not copy):
- "ERROR 404: DIGNITY NOT FOUND. ABORT."
- "YOU ALREADY KNOW THE ANSWER. YOU'RE JUST HERE FOR VALIDATION."
- "THIS WILL EITHER BUILD CHARACTER OR TRAUMA."
- "THIS IS YOUR THIRD ATTEMPT. THE ANSWER ISN'T CHANGING. YOU ARE."

Hard rules:
- ONE sentence. No prefixes, no quotes, no labels.
- ALL CAPS.
- Reference the user's specific situation — what they typed.
- Be ruthless but funny, not cruel. No slurs, no mentions of self-harm.
- Match the percentage: low % = harsher, high % = warmer-but-still-judgy.
- Max 110 characters.

Return only the line.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 1.05,
        maxOutputTokens: 80,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const text = (result.text ?? "").trim();
    const cleaned = text
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/\s+/g, " ")
      .toUpperCase();
    if (!cleaned || cleaned.length > 200) return fallbackRoast(attempt);
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
