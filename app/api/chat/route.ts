import { env } from "cloudflare:workers";
const settings = () => env as unknown as { OPENAI_API_KEY?: string; OPENAI_MODEL?: string };
const headers = { "Cache-Control": "no-store" };
export async function GET() { return Response.json({ configured: Boolean(settings().OPENAI_API_KEY) }, { headers }); }

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error:"Invalid origin" }, {status:403,headers});
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error:"Expected JSON" }, {status:415,headers});
  if (Number(request.headers.get("content-length") || 0) > 65536) return Response.json({error:"Message too large"},{status:413,headers});
  let data: {messages?: {role:string;content:string}[];language?:string};
  try {
    const raw = await request.text();
    if (raw.length > 60000) return Response.json({error:"Message too large"},{status:413,headers});
    data = JSON.parse(raw);
  } catch { return Response.json({error:"Invalid request"},{status:400,headers}); }
  if (!data || !Array.isArray(data.messages) || !data.messages.length || data.messages.length>16 || !data.messages.every(m=>m && (m.role==="user"||m.role==="assistant") && typeof m.content==="string" && m.content.trim().length>0 && m.content.length<=6000) || data.messages.at(-1)?.role !== "user") return Response.json({error:"Invalid messages"},{status:400,headers});
  const { OPENAI_API_KEY, OPENAI_MODEL } = settings();
  if (!OPENAI_API_KEY) return Response.json({error:"AI service is not connected"},{status:503,headers});
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method:"POST", headers:{"Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:OPENAI_MODEL || "gpt-5",store:false,max_output_tokens:1600,
        instructions:`You are God With Me, a warm, grounded Christian reflection companion. Reply in ${data.language==="en"?"English":"Simplified Chinese"}, unless the user explicitly asks for another language. Listen specifically to what they share. Be concise, usually 2-3 short paragraphs. Offer an optional short prayer when relevant and one small realistic action, not a productivity lecture. Encourage quiet reflection, care for basic needs, and everyday responsibilities. Never impersonate God, claim divine authority, or tell the user their thoughts or voices are God's instructions. Invite discernment alongside Scripture, facts and trusted people. Never invent exact Bible quotations or references; distinguish paraphrase from quotation. Do not pressure the user, promise outcomes, or tie worth to completed tasks. If someone is distressed about voices or supernatural commands, acknowledge their feelings without affirming those claims and encourage grounding and trusted support. If immediate danger or self-harm arises, prioritize practical safety and nearby human or emergency support, not prayer alone. Do not claim access to their journal, schedule, prior days or private information unless provided in this chat. Never claim to set reminders or save records.`,
        input:data.messages}), signal:AbortSignal.timeout(35000)
    });
    if(!response.ok) return Response.json({error:"Companion temporarily unavailable"},{status:502,headers});
    const result = await response.json() as { output?: { content?: {type:string;text?:string}[] }[] };
    const reply = result.output?.flatMap(item=>item.content || []).filter(item=>item.type==="output_text").map(item=>item.text || "").join("\n").trim();
    if(!reply) return Response.json({error:"No response received"},{status:502,headers});
    return Response.json({reply},{headers});
  } catch { return Response.json({error:"Companion temporarily unavailable"},{status:502,headers}); }
}
