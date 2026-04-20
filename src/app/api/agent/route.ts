import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const AGENT_API_KEY = process.env.AGENT_API_KEY;
if (!AGENT_API_KEY) {
  console.warn('[agent] AGENT_API_KEY is not set — the /api/agent endpoints will reject all requests.');
}
const CONTENT_DIR = path.join(process.cwd(), "src", "data");

interface ContentItem {
  id: string;
  type: "blog" | "service" | "testimonial" | "faq" | "page";
  title: string;
  content: string;
  slug?: string;
  meta?: Record<string, string>;
  published?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authenticate incoming agent API requests.
 * Rejects all requests if AGENT_API_KEY is not configured in the environment.
 */
function auth(request: NextRequest): boolean {
  if (!AGENT_API_KEY) return false;
  const key = request.headers.get("x-agent-api-key");
  return key === AGENT_API_KEY;
}

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function ensureDataDir() {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
  } catch {
    // directory already exists
  }
}

async function readContentFile(filename: string): Promise<ContentItem[]> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, filename), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeContentFile(filename: string, data: ContentItem[]) {
  await ensureDataDir();
  await fs.writeFile(path.join(CONTENT_DIR, filename), JSON.stringify(data, null, 2));
}

function getFilename(type: string): string {
  switch (type) {
    case "blog": return "blog.json";
    case "service": return "services.json";
    case "testimonial": return "testimonials.json";
    case "faq": return "faqs.json";
    default: return "pages.json";
  }
}

// GET /api/agent — List all content or search
export async function GET(request: NextRequest) {
  if (!auth(request)) {
    return jsonResponse({ error: "Unauthorised. Provide x-agent-api-key header." }, 401);
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const published = searchParams.get("published");

  let results: ContentItem[] = [];

  if (!type || type === "blog") {
    results.push(...(await readContentFile("blog.json")));
  }
  if (!type || type === "service") {
    results.push(...(await readContentFile("services.json")));
  }
  if (!type || type === "testimonial") {
    results.push(...(await readContentFile("testimonials.json")));
  }
  if (!type || type === "faq") {
    results.push(...(await readContentFile("faqs.json")));
  }

  if (published === "true") {
    results = results.filter((item) => item.published !== false);
  }

  return jsonResponse({ success: true, count: results.length, data: results });
}

// POST /api/agent — Create new content
export async function POST(request: NextRequest) {
  if (!auth(request)) {
    return jsonResponse({ error: "Unauthorised. Provide x-agent-api-key header." }, 401);
  }

  try {
    const body = await request.json();
    const { type, title, content, slug, meta, published } = body;

    if (!type || !title || !content) {
      return jsonResponse({ error: "Missing required fields: type, title, content" }, 400);
    }

    const validTypes = ["blog", "service", "testimonial", "faq", "page"];
    if (!validTypes.includes(type)) {
      return jsonResponse({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }, 400);
    }

    const now = new Date().toISOString();
    const id = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const item: ContentItem = {
      id,
      type,
      title,
      content,
      slug: id,
      meta: meta || {},
      published: published !== false,
      createdAt: now,
      updatedAt: now,
    };

    const filename = getFilename(type);
    const existing = await readContentFile(filename);
    const exists = existing.find((e) => e.id === id);

    if (exists) {
      return jsonResponse({ error: `Content with id '${id}' already exists. Use PUT to update.` }, 409);
    }

    existing.push(item);
    await writeContentFile(filename, existing);

    return jsonResponse({ success: true, message: "Content created", data: item }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: `Invalid request body: ${message}` }, 400);
  }
}

// PUT /api/agent — Update existing content
export async function PUT(request: NextRequest) {
  if (!auth(request)) {
    return jsonResponse({ error: "Unauthorised. Provide x-agent-api-key header." }, 401);
  }

  try {
    const body = await request.json();
    const { id, type, title, content, slug, meta, published } = body;

    if (!id || !type) {
      return jsonResponse({ error: "Missing required fields: id, type" }, 400);
    }

    const filename = getFilename(type);
    const existing = await readContentFile(filename);
    const index = existing.findIndex((e) => e.id === id);

    if (index === -1) {
      return jsonResponse({ error: `Content with id '${id}' not found.` }, 404);
    }

    const now = new Date().toISOString();
    existing[index] = {
      ...existing[index],
      ...(title && { title }),
      ...(content && { content }),
      ...(slug && { slug }),
      ...(meta && { meta }),
      ...(published !== undefined && { published }),
      updatedAt: now,
    };

    await writeContentFile(filename, existing);

    return jsonResponse({ success: true, message: "Content updated", data: existing[index] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: `Invalid request body: ${message}` }, 400);
  }
}

// DELETE /api/agent — Delete content
export async function DELETE(request: NextRequest) {
  if (!auth(request)) {
    return jsonResponse({ error: "Unauthorised. Provide x-agent-api-key header." }, 401);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !type) {
    return jsonResponse({ error: "Missing required query params: id, type" }, 400);
  }

  const filename = getFilename(type);
  const existing = await readContentFile(filename);
  const filtered = existing.filter((e) => e.id !== id);

  if (filtered.length === existing.length) {
    return jsonResponse({ error: `Content with id '${id}' not found.` }, 404);
  }

  await writeContentFile(filename, filtered);

  return jsonResponse({ success: true, message: "Content deleted" });
}
