#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const FAL_MODEL_ID = "fal-ai/veo3.1/image-to-video";
const FAL_RUN_ENDPOINT = `https://fal.run/${FAL_MODEL_ID}`;
const FAL_QUEUE_ENDPOINT = `https://queue.fal.run/${FAL_MODEL_ID}`;

function usage() {
  // Keep minimal; SKILL.md is the primary UX.
  console.log(
    [
      "Usage:",
      '  node scripts/generate.mjs --prompt "..." --image <file-or-url> [--image <file-or-url> ...] [options]',
      "",
      "Options:",
      "  --out <dir>                 Final output directory (must be under artifacts/; default: artifacts/fal-veo3-image-to-video/<run-id>)",
      "  --sync-mode                 Use fal.run (sync) instead of queue polling",
      "  --image-field <name>        Request body field for image(s). Default: image_url (1 image) or image_urls (>1 image).",
      "  --param <k>=<v>             Add/override request body fields (repeatable).",
      "                              Coercions: true/false, numbers, json:<JSON>, @<path-to-json-file>",
      "",
      "Config (required):",
      "  workers.jsonc: { \"fal\": { \"key\": \"key_id:secret\" } }",
    ].join("\n"),
  );
}

function toIsoCompact(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function isUrl(value) {
  return /^https?:\/\//i.test(value);
}

function parseDataUri(dataUri) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUri || "");
  if (!match) return null;
  return { contentType: match[1], base64: match[2] };
}

function estimateDataUriBytes(dataUri) {
  const parsed = parseDataUri(dataUri);
  if (!parsed) return null;
  return Math.floor((parsed.base64.length * 3) / 4);
}

function summarizeValueForLog(value) {
  if (typeof value !== "string") return value;
  if (value.startsWith("data:")) {
    const bytes = estimateDataUriBytes(value);
    return `[data-uri omitted${bytes != null ? ` (${bytes} bytes)` : ""}]`;
  }
  if (value.length > 200) return `${value.slice(0, 180)}…`;
  return value;
}

function sanitizeRequestBodyForLog(body) {
  const clone = JSON.parse(JSON.stringify(body || {}));
  for (const key of Object.keys(clone)) {
    const value = clone[key];
    if (typeof value === "string") clone[key] = summarizeValueForLog(value);
    if (Array.isArray(value)) clone[key] = value.map(summarizeValueForLog);
  }
  return clone;
}

async function fileToDataUri(filePath) {
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function parseJsonc(raw) {
  const noBlockComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const noLineComments = noBlockComments.replace(/^\s*\/\/.*$/gm, "");
  const noTrailingCommas = noLineComments.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(noTrailingCommas);
}

async function maybeReadJsonc(filePath) {
  try {
    return parseJsonc(await fs.readFile(filePath, "utf8"));
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) return null;
    throw err;
  }
}

async function ensureWorkersJsoncHint({ filePath, pathParts, placeholder }) {
  const current = (await maybeReadJsonc(filePath)) || {};

  let cursor = current;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part];
  }

  const leafKey = pathParts[pathParts.length - 1];
  if (cursor[leafKey] == null) cursor[leafKey] = placeholder;

  const header = "// Added by fal-veo3-image-to-video (missing required config)\n";
  const content = header + JSON.stringify(current, null, 2) + "\n";
  await fs.writeFile(filePath, content, "utf8");
}

async function getFalKey() {
  const config = await maybeReadJsonc(path.resolve(process.cwd(), "workers.jsonc"));
  const key = config?.fal?.key;
  if (!key) return null;
  if (key === "YOUR_FAL_KEY" || key === "[PLEASE ENTER KEY HERE]") return null;
  return String(key);
}

function deepSet(target, dottedKey, value) {
  const parts = String(dottedKey || "")
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) throw new Error(`Invalid --param key: ${dottedKey}`);
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

function parseParamValue(raw) {
  const value = String(raw ?? "");
  if (value.startsWith("json:")) return JSON.parse(value.slice("json:".length));
  if (value.startsWith("@")) return { __json_file__: value.slice(1) };
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

async function resolveParamValue(value) {
  if (value && typeof value === "object" && value.__json_file__) {
    const filePath = path.resolve(process.cwd(), value.__json_file__);
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  }
  return value;
}

function parseArgs(argv) {
  const args = {
    images: [],
    prompt: null,
    outDir: null,
    syncMode: false,
    imageField: null,
    params: [],
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    const next = () => argv[++i];

    if (token === "--help" || token === "-h") {
      usage();
      process.exit(0);
    }

    if (token === "--prompt") args.prompt = next();
    else if (token === "--image") args.images.push(next());
    else if (token === "--out") args.outDir = next();
    else if (token === "--sync-mode") args.syncMode = true;
    else if (token === "--image-field") args.imageField = next();
    else if (token === "--param") args.params.push(next());
    else throw new Error(`Unknown arg: ${token}`);
  }

  if (!args.prompt) throw new Error("--prompt is required");
  if (!args.images.length) throw new Error("At least one --image is required");

  return args;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatFetchError(err) {
  const message = err?.message ? String(err.message) : String(err);
  const details = [];
  const cause = err?.cause;
  if (cause?.code) details.push(`code=${cause.code}`);
  if (cause?.errno) details.push(`errno=${cause.errno}`);
  if (cause?.syscall) details.push(`syscall=${cause.syscall}`);
  if (cause?.address) details.push(`address=${cause.address}`);
  if (cause?.port) details.push(`port=${cause.port}`);
  if (!details.length) return message;
  return `${message} (${details.join(", ")})`;
}

async function fetchTextWithTimeout(url, { method = "GET", headers, body, timeoutMs = 120000 } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new Error(`Fetch failed for ${url}: ${formatFetchError(err)}`);
  }
  return { res, text: await res.text() };
}

function parseJsonWithContext(text, context) {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON from ${context}: ${err?.message || String(err)}`);
  }
}

async function runFalSync({ body, headers }) {
  const { res, text } = await fetchTextWithTimeout(FAL_RUN_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    timeoutMs: 15 * 60 * 1000,
  });
  if (!res.ok) {
    throw new Error(`fal.run error: ${res.status} ${res.statusText}\n${text}`);
  }
  return parseJsonWithContext(text, FAL_RUN_ENDPOINT);
}

async function runFalQueue({ body, headers, workDir }) {
  const { res: submitRes, text: submitText } = await fetchTextWithTimeout(FAL_QUEUE_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    timeoutMs: 120000,
  });

  if (!submitRes.ok) {
    throw new Error(`fal.queue submit error: ${submitRes.status} ${submitRes.statusText}\n${submitText}`);
  }

  const submitJson = parseJsonWithContext(submitText, `${FAL_QUEUE_ENDPOINT} (submit)`);
  await fs.writeFile(path.join(workDir, "queue-submit.json"), JSON.stringify(submitJson, null, 2) + "\n", "utf8");

  const statusUrl = submitJson?.status_url;
  const responseUrl = submitJson?.response_url;
  const requestId = submitJson?.request_id;
  if (!statusUrl || !responseUrl || !requestId) {
    throw new Error(`Queue submit response missing required URLs/request_id: ${submitText}`);
  }

  const pollDeadline = Date.now() + 25 * 60 * 1000;
  let statusJson = null;
  while (Date.now() < pollDeadline) {
    const { res: statusRes, text: statusText } = await fetchTextWithTimeout(statusUrl, {
      method: "GET",
      headers,
      timeoutMs: 120000,
    });
    if (!statusRes.ok) {
      throw new Error(`fal.queue status error: ${statusRes.status} ${statusRes.statusText}\n${statusText}`);
    }

    statusJson = parseJsonWithContext(statusText, `${statusUrl} (status)`);
    const status = String(statusJson?.status || "").toUpperCase();
    if (status === "COMPLETED") break;
    if (status === "FAILED" || status === "CANCELED" || status === "CANCELLED") {
      throw new Error(`fal.queue request ${requestId} ${status.toLowerCase()}\n${statusText}`);
    }
    await sleep(1500);
  }

  if (String(statusJson?.status || "").toUpperCase() !== "COMPLETED") {
    throw new Error(`fal.queue request ${requestId} timed out after 25 minutes`);
  }

  await fs.writeFile(path.join(workDir, "queue-status.json"), JSON.stringify(statusJson, null, 2) + "\n", "utf8");

  const { res: responseRes, text: responseText } = await fetchTextWithTimeout(responseUrl, {
    method: "GET",
    headers,
    timeoutMs: 180000,
  });
  if (!responseRes.ok) {
    throw new Error(`fal.queue response error: ${responseRes.status} ${responseRes.statusText}\n${responseText}`);
  }

  const responseJson = parseJsonWithContext(responseText, `${responseUrl} (response)`);
  if (responseJson && typeof responseJson === "object" && responseJson.response && responseJson.status) {
    return responseJson.response;
  }
  return responseJson;
}

function extFromContentType(contentType) {
  const lowered = String(contentType || "").toLowerCase();
  if (lowered.includes("mp4")) return "mp4";
  if (lowered.includes("webm")) return "webm";
  if (lowered.includes("gif")) return "gif";
  if (lowered.includes("quicktime") || lowered.includes("mov")) return "mov";
  return null;
}

function extFromUrl(url) {
  try {
    const parsed = new URL(url);
    const match = /\.([a-z0-9]{2,6})(?:$|\?)/i.exec(parsed.pathname);
    return match ? match[1].toLowerCase() : null;
  } catch {
    const match = /\.([a-z0-9]{2,6})(?:$|\?)/i.exec(String(url || ""));
    return match ? match[1].toLowerCase() : null;
  }
}

function looksLikeVideoUrl(url) {
  const ext = extFromUrl(url);
  return ext === "mp4" || ext === "webm" || ext === "mov" || ext === "gif";
}

function collectMediaCandidates(root) {
  const candidates = [];
  const visited = new Set();

  function addCandidate(candidate) {
    const key = JSON.stringify(candidate);
    if (visited.has(key)) return;
    visited.add(key);
    candidates.push(candidate);
  }

  function walk(value, depth) {
    if (depth > 12) return;
    if (value == null) return;

    if (typeof value === "string") {
      if (value.startsWith("data:video/")) addCandidate({ kind: "data-uri", value });
      if (isUrl(value) && looksLikeVideoUrl(value)) addCandidate({ kind: "url", url: value });
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1);
      return;
    }

    if (typeof value !== "object") return;

    const url = value.url;
    const contentType = value.content_type || value.contentType || value.mime_type || value.mimeType;
    if (typeof url === "string") {
      if (url.startsWith("data:video/")) addCandidate({ kind: "data-uri", value: url, contentType });
      if (isUrl(url) && (looksLikeVideoUrl(url) || String(contentType || "").toLowerCase().includes("video")))
        addCandidate({ kind: "url", url, contentType });
    }

    for (const k of Object.keys(value)) walk(value[k], depth + 1);
  }

  // Prefer common top-level shapes first.
  if (root && typeof root === "object") {
    if (Array.isArray(root.videos)) walk(root.videos, 0);
    if (root.video) walk(root.video, 0);
  }
  walk(root, 0);

  return candidates;
}

async function downloadToFile(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText} (${url})`);
  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function listFiles(dir) {
  const results = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      else if (entry.isFile()) results.push(path.relative(dir, fullPath));
    }
  }
  await walk(dir);
  return results.sort((a, b) => a.localeCompare(b));
}

async function writeReadme({ dir, title, status, inputs, notes }) {
  const files = await listFiles(dir);
  const content = [
    `# ${title}`,
    "",
    `Status: **${status}**`,
    "",
    "## Inputs",
    "",
    ...inputs.map((line) => `- ${line}`),
    "",
    "## Notes",
    "",
    ...(notes?.length ? notes.map((line) => `- ${line}`) : ["- (none)"]),
    "",
    "## Files",
    "",
    ...files.map((file) => `- \`${file}\``),
    "",
  ].join("\n");
  await fs.writeFile(path.join(dir, "README.md"), content, "utf8");
}

async function copyFinalVideos({ fromDir, toDir }) {
  await ensureDir(toDir);
  const entries = await fs.readdir(fromDir, { withFileTypes: true });
  const videoFiles = entries
    .filter((entry) => entry.isFile() && /^video-\d+\./.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (!videoFiles.length) return 0;
  for (const file of videoFiles) {
    await fs.copyFile(path.join(fromDir, file), path.join(toDir, file));
  }
  return videoFiles.length;
}

async function main() {
  const args = parseArgs(process.argv);

  const falKey = await getFalKey();
  if (!falKey) {
    await ensureWorkersJsoncHint({
      filePath: path.resolve(process.cwd(), "workers.jsonc"),
      pathParts: ["fal", "key"],
      placeholder: "[PLEASE ENTER KEY HERE]",
    });
    throw new Error("Missing fal.ai key. Fill `workers.jsonc` with `fal.key`, then re-run.");
  }

  const runId = toIsoCompact(new Date());
  const workRoot = path.resolve(process.cwd(), "temp", "fal-veo3-image-to-video", runId);
  await ensureDir(workRoot);

  const outDir = args.outDir || path.resolve(process.cwd(), "artifacts", "fal-veo3-image-to-video", runId);
  const resolvedOutDir = path.resolve(outDir);
  const artifactsRoot = path.resolve(process.cwd(), "artifacts") + path.sep;
  if (!resolvedOutDir.startsWith(artifactsRoot)) {
    throw new Error("--out must be under artifacts/ (final outputs only).");
  }
  await ensureDir(resolvedOutDir);

  const imageUrls = [];
  for (const image of args.images) {
    if (isUrl(image)) {
      imageUrls.push(image);
      continue;
    }
    const absolute = path.resolve(process.cwd(), image);
    imageUrls.push(await fileToDataUri(absolute));
  }

  const body = {};
  body.prompt = args.prompt;

  const imageField =
    args.imageField || (imageUrls.length > 1 ? "image_urls" : "image_url");
  body[imageField] = imageUrls.length > 1 ? imageUrls : imageUrls[0];

  for (const raw of args.params) {
    const match = /^([^=]+)=(.*)$/.exec(String(raw || ""));
    if (!match) throw new Error(`Invalid --param (expected k=v): ${raw}`);
    const key = match[1].trim();
    const value = await resolveParamValue(parseParamValue(match[2]));
    deepSet(body, key, value);
  }

  await fs.writeFile(
    path.join(workRoot, "inputs.json"),
    JSON.stringify(
      {
        prompt: args.prompt,
        images: args.images,
        options: {
          out: resolvedOutDir,
          sync_mode: args.syncMode,
          image_field: imageField,
          params: args.params,
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  await writeReadme({
    dir: workRoot,
    title: "fal-veo3-image-to-video (working logs)",
    status: "in-progress",
    inputs: [
      `Prompt: ${JSON.stringify(args.prompt)}`,
      `Images: ${args.images.join(", ")}`,
      `Mode: ${args.syncMode ? "sync (fal.run)" : "queue (polling)"}`,
      `Image field: ${imageField}`,
      `Run ID: ${runId}`,
      `Final output dir: ${resolvedOutDir}`,
    ],
    notes: [
      "Do not share secrets from workers.jsonc.",
      "Working logs stay in logs/; only final videos are copied to artifacts/.",
    ],
  });

  await fs.writeFile(
    path.join(workRoot, "request.json"),
    JSON.stringify(
      {
        model: FAL_MODEL_ID,
        mode: args.syncMode ? "sync" : "queue",
        endpoint: args.syncMode ? FAL_RUN_ENDPOINT : FAL_QUEUE_ENDPOINT,
        body: sanitizeRequestBodyForLog(body),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  let json;
  try {
    const headers = {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    };
    json = args.syncMode
      ? await runFalSync({ body, headers })
      : await runFalQueue({ body, headers, workDir: workRoot });
  } catch (err) {
    const msg = err?.message ? String(err.message) : String(err);
    await fs.writeFile(path.join(workRoot, "error.txt"), msg + "\n", "utf8");
    await writeReadme({
      dir: workRoot,
      title: "fal-veo3-image-to-video (working logs)",
      status: "blocked",
      inputs: [
        `Prompt: ${JSON.stringify(args.prompt)}`,
        `Images: ${args.images.join(", ")}`,
        `Mode: ${args.syncMode ? "sync (fal.run)" : "queue (polling)"}`,
        `Image field: ${imageField}`,
        `Run ID: ${runId}`,
        `Final output dir: ${resolvedOutDir}`,
      ],
      notes: [
        "Network/fetch error (see error.txt).",
        "If this is a DNS/network outage, restore connectivity and re-run.",
        "If this is an environment restriction, run this script in a network-enabled environment.",
      ],
    });
    throw new Error(`Error calling fal API (saved logs/.../error.txt): ${msg}`);
  }

  await fs.writeFile(
    path.join(workRoot, "result.json"),
    JSON.stringify(
      {
        request: {
          model: FAL_MODEL_ID,
          mode: args.syncMode ? "sync" : "queue",
          endpoint: args.syncMode ? FAL_RUN_ENDPOINT : FAL_QUEUE_ENDPOINT,
          body: sanitizeRequestBodyForLog(body),
        },
        response: json,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const candidates = collectMediaCandidates(json);
  if (!candidates.length) {
    console.log(`Wrote: ${path.join(workRoot, "result.json")}`);
    throw new Error("No video URLs found in response JSON.");
  }

  let finalCount = 0;
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate.kind === "data-uri") {
      const parsed = parseDataUri(candidate.value);
      if (!parsed) continue;
      const ext = extFromContentType(candidate.contentType) || "mp4";
      const filePath = path.join(workRoot, `video-${finalCount + 1}.${ext}`);
      await fs.writeFile(filePath, Buffer.from(parsed.base64, "base64"));
      finalCount += 1;
      continue;
    }

    if (candidate.kind === "url") {
      const ext = extFromContentType(candidate.contentType) || extFromUrl(candidate.url) || "mp4";
      const filePath = path.join(workRoot, `video-${finalCount + 1}.${ext}`);
      await downloadToFile(candidate.url, filePath);
      finalCount += 1;
      continue;
    }
  }

  if (!finalCount) {
    console.log(`Wrote: ${path.join(workRoot, "result.json")}`);
    throw new Error("Found candidates but could not materialize any video file(s).");
  }

  finalCount = await copyFinalVideos({ fromDir: workRoot, toDir: resolvedOutDir });

  await writeReadme({
    dir: workRoot,
    title: "fal-veo3-image-to-video (working logs)",
    status: "done",
    inputs: [
      `Prompt: ${JSON.stringify(args.prompt)}`,
      `Images: ${args.images.join(", ")}`,
      `Mode: ${args.syncMode ? "sync (fal.run)" : "queue (polling)"}`,
      `Image field: ${imageField}`,
      `Run ID: ${runId}`,
      `Final output dir: ${resolvedOutDir}`,
    ],
    notes: [`Generated ${finalCount} final video(s).`],
  });

  await writeReadme({
    dir: resolvedOutDir,
    title: "fal-veo3-image-to-video (final deliverables)",
    status: "done",
    inputs: [
      `Prompt: ${JSON.stringify(args.prompt)}`,
      `Images: ${args.images.join(", ")}`,
      `Mode: ${args.syncMode ? "sync (fal.run)" : "queue (polling)"}`,
      `Image field: ${imageField}`,
      `Run ID: ${runId}`,
      `Working dir: ${workRoot}`,
    ],
    notes: [
      "This folder contains only final videos (and this README).",
      "Full request/response logs are in the working dir under logs/.",
    ],
  });

  console.log(`Wrote final: ${resolvedOutDir}`);
  console.log(`Working dir: ${workRoot}`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
