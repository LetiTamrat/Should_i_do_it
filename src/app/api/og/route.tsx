import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

let cachedInter: ArrayBuffer | null = null;
let cachedSpaceGrotesk: ArrayBuffer | null = null;
let cachedLogo: string | null = null;

async function loadFonts(): Promise<{ inter: ArrayBuffer; sg: ArrayBuffer }> {
  if (cachedInter && cachedSpaceGrotesk) {
    return { inter: cachedInter, sg: cachedSpaceGrotesk };
  }
  const interPath = path.join(
    process.cwd(),
    "node_modules/@fontsource/inter/files/inter-latin-900-normal.woff",
  );
  const sgPath = path.join(
    process.cwd(),
    "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff",
  );
  const [a, b] = await Promise.all([readFile(interPath), readFile(sgPath)]);
  const inter = a.buffer.slice(a.byteOffset, a.byteOffset + a.byteLength);
  const sg = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  cachedInter = inter;
  cachedSpaceGrotesk = sg;
  return { inter, sg };
}

async function loadLogo(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const buf = await readFile(path.join(process.cwd(), "public/logo.svg"));
  cachedLogo = `data:image/svg+xml;base64,${buf.toString("base64")}`;
  return cachedLogo;
}

const LIME = "#bef500";
const BG = "#0a0a0a";
const WHITE = "#ffffff";
const OUTLINE = "#988e90";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const question = (searchParams.get("q") ?? "").slice(0, 200);
  const percentage = Math.max(
    0,
    Math.min(100, parseInt(searchParams.get("p") ?? "0", 10) || 0),
  );
  const roast = (searchParams.get("r") ?? "").slice(0, 200);
  const verdict = (searchParams.get("v") ?? "").slice(0, 32);

  const [{ inter, sg }, logoSrc] = await Promise.all([loadFonts(), loadLogo()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: BG,
          padding: 56,
          position: "relative",
          fontFamily: "SpaceGrotesk",
        }}
      >
        {/* Lime corner brackets */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 32,
            width: 60,
            height: 60,
            borderTop: `6px solid ${LIME}`,
            borderLeft: `6px solid ${LIME}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 32,
            right: 32,
            width: 60,
            height: 60,
            borderTop: `6px solid ${LIME}`,
            borderRight: `6px solid ${LIME}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 32,
            width: 60,
            height: 60,
            borderBottom: `6px solid ${LIME}`,
            borderLeft: `6px solid ${LIME}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 32,
            width: 60,
            height: 60,
            borderBottom: `6px solid ${LIME}`,
            borderRight: `6px solid ${LIME}`,
            display: "flex",
          }}
        />

        {/* Top label */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginTop: 28,
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.18em",
              color: OUTLINE,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            JUDGMENT_ENGINE // QUERY
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: WHITE,
              fontWeight: 700,
              textAlign: "center",
              maxWidth: 880,
              lineHeight: 1.25,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {`"${question || "WHAT ARE YOU ABOUT TO DO?"}"`}
          </div>
        </div>

        {/* Big % */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Inter",
              fontSize: 360,
              color: LIME,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 0.85,
              display: "flex",
            }}
          >
            {`${percentage}%`}
          </div>
          {verdict && (
            <div
              style={{
                fontSize: 56,
                color: WHITE,
                fontWeight: 700,
                letterSpacing: "0.02em",
                marginTop: 8,
                display: "flex",
              }}
            >
              {verdict}
            </div>
          )}
        </div>

        {/* Roast box */}
        <div
          style={{
            display: "flex",
            border: `3px solid ${WHITE}`,
            padding: "28px 40px",
            maxWidth: 940,
            width: "100%",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: WHITE,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.3,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {roast || "ERROR 404: DIGNITY NOT FOUND. ABORT."}
          </div>
        </div>

        {/* Footer wordmark */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: OUTLINE,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            [STATE_02 // JUDGMENT]
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Should I Do It" width={120} height={72} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: "Inter", data: inter, weight: 900, style: "normal" },
        { name: "SpaceGrotesk", data: sg, weight: 700, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
