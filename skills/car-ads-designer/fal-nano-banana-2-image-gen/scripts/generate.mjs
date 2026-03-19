#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const FAL_MODEL_ID = "fal-ai/nano-banana-2";
const FAL_RUN_ENDPOINT = `https://fal.run/${FAL_MODEL_ID}`;
const FAL_QUEUE_ENDPOINT = `https://queue.fal.run/${FAL_MODEL_ID}`;

function usage() {
  console.log(
    [
      "Usage:",
      '  node scripts/generate.mjs --prompt "..." [options]',
      "",
      "Options:",
      "  --out <dir>                 Final output directory (must be under artifacts/; default: artifacts/fal-nano-banana-2-image-gen/<run-id>)",
      "  --image-size <preset>       Can be repeated to generate multiple sizes (subfolders).",
      "  --sizes <a,b,c>             Comma-separated alternative to repeating --image-size",
      "  --size <WxH>                Pixel size hint (e.g. 1024x1024). Sent as custom image_size {width,height} when supported.",
      "  --num-images <n>            Default: 1",
      "  --seed <n>",
      "  --negative-prompt <text>",
      "  --format <png|jpeg>         Default: png",
      "  --sync-mode                 Use fal.run sync mode when supported",
      "  --body-json <path>          Merge JSON into the request body (overrides defaults).",
      "  --param <k=v>               Add/override a request body field (repeatable; supports dot-paths).",
      "",
      "Config (required):",
      "  workers.jsonc: { \"fal\": { \"key\": \"key_id:secret\" } }",
      "",
      "Notes:",
      "  - This script intentionally supports generic request bodies because model schemas can vary.",
      `  - Model: ${FAL_MODEL_ID}`,
    ].join("\n"),
  );
}

function toIsoCompact(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function extFromContentType(contentType) {
  const lowered = String(contentType || "").toLowerCase();
  if (lowered.includes("png")) return "png";
  if (lowered.includes("jpeg") || lowered.includes("jpg")) return "jpg";
  if (lowered.includes("webp")) return "webp";
  return null;
}

function parseDataUri(dataUri) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUri || "");
  if (!match) return null;
  return { contentType: match[1], base64: match[2] };
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

  const header = "// Added by fal-nano-banana-2-image-gen (missing required config)\n";
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

function parseArgs(argv) {
  const args = {
    prompt: null,
    outDir: null,
    sizeSpecs: [],
    numImages: 1,
    seed: null,
    negativePrompt: null,
    format: "png",
    syncMode: false,
    bodyJsonPath: null,
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
    else if (token === "--out") args.outDir = next();
    else if (token === "--image-size") args.sizeSpecs.push({ kind: "preset", value: next() });
    else if (token === "--sizes")
      args.sizeSpecs.push(
        ...String(next())
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((value) => ({ kind: "preset", value })),
      );
    else if (token === "--size") args.sizeSpecs.push({ kind: "px", value: next() });
    else if (token === "--num-images") args.numImages = Number(next());
    else if (token === "--seed") args.seed = Number(next());
    else if (token === "--negative-prompt") args.negativePrompt = next();
    else if (token === "--format") args.format = next();
    else if (token === "--sync-mode") args.syncMode = true;
    else if (token === "--body-json") args.bodyJsonPath = next();
    else if (token === "--param") args.params.push(next());
    else throw new Error(`Unknown arg: ${token}`);
  }

  if (!args.prompt) throw new Error("--prompt is required");
  if (!Number.isFinite(args.numImages) || args.numImages < 1) throw new Error("--num-images must be >= 1");
  if (args.seed != null && !Number.isFinite(args.seed)) throw new Error("--seed must be a number");
  if (!["png", "jpeg"].includes(String(args.format).toLowerCase())) throw new Error("--format must be png or jpeg");

  args.sizeSpecs = args.sizeSpecs
    .map((spec) => ({
      kind: spec?.kind,
      value: spec?.value == null ? "" : String(spec.value).trim(),
    }))
    .filter((spec) => spec.kind === "preset" || spec.kind === "px")
    .filter((spec) => spec.value.length)
    .filter((spec, index, all) => all.findIndex((s) => s.kind === spec.kind && s.value === spec.value) === index);
  if (!args.sizeSpecs.length) args.sizeSpecs = [{ kind: "preset", value: null }];

  args.params = args.params.map((s) => String(s || "").trim()).filter(Boolean);
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
    timeoutMs: 300000,
  });
  if (!res.ok) {
    throw new Error(`fal.run error: ${res.status} ${res.statusText}\n${text}`);
  }
  return parseJsonWithContext(text, FAL_RUN_ENDPOINT);
}

async function runFalQueue({ body, headers, sizeWorkDir }) {
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
  await fs.writeFile(path.join(sizeWorkDir, "queue-submit.json"), JSON.stringify(submitJson, null, 2) + "\n", "utf8");

  const statusUrl = submitJson?.status_url;
  const responseUrl = submitJson?.response_url;
  const requestId = submitJson?.request_id;
  if (!statusUrl || !responseUrl || !requestId) {
    throw new Error(`Queue submit response missing required URLs/request_id: ${submitText}`);
  }

  const pollDeadline = Date.now() + 15 * 60 * 1000;
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
    throw new Error(`fal.queue request ${requestId} timed out after 15 minutes`);
  }

  await fs.writeFile(path.join(sizeWorkDir, "queue-status.json"), JSON.stringify(statusJson, null, 2) + "\n", "utf8");

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

function folderSafeLabel(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, "-");
}

function parsePixelSize(value) {
  const match = /^(\d+)\s*x\s*(\d+)$/i.exec(String(value || "").trim());
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return null;
  return { width, height };
}

function resolveSizeSpec(spec) {
  if (!spec || spec.kind === "preset") {
    const preset = spec?.value == null ? null : String(spec.value).trim();
    if (!preset) return { imageSize: null, label: "default", detail: "model default" };
    return { imageSize: preset, label: folderSafeLabel(preset), detail: `preset: ${preset}` };
  }

  if (spec.kind === "px") {
    const parsed = parsePixelSize(spec.value);
    if (!parsed) throw new Error(`Invalid --size (expected WxH): ${spec.value}`);
    const label = folderSafeLabel(`${parsed.width}x${parsed.height}`);
    return {
      imageSize: { width: parsed.width, height: parsed.height },
      label,
      detail: `custom: ${parsed.width}x${parsed.height}`,
    };
  }

  throw new Error(`Unknown size spec kind: ${spec.kind}`);
}

function parseParamValue(raw) {
  const value = String(raw);
  const trimmed = value.trim();
  if (!trimmed.length) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    if (Number.isFinite(n)) return n;
  }
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to string
    }
  }
  return value;
}

function setByDotPath(obj, dotPath, value) {
  const parts = String(dotPath || "")
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) throw new Error(`Invalid --param key: ${dotPath}`);
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

async function readBodyJson(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  const raw = await fs.readFile(absolute, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in --body-json file (${filePath}): ${err?.message || String(err)}`);
  }
}

function normalizeImageItem(item) {
  if (typeof item === "string") return { url: item, contentType: null };
  if (!item || typeof item !== "object") return null;
  const url = typeof item.url === "string" ? item.url : null;
  if (!url) return null;
  const contentType =
    typeof item.content_type === "string"
      ? item.content_type
      : typeof item.contentType === "string"
        ? item.contentType
        : null;
  return { url, contentType };
}

function extractImageItems(json) {
  if (!json || typeof json !== "object") return [];

  const images = Array.isArray(json.images) ? json.images.map(normalizeImageItem).filter(Boolean) : [];
  if (images.length) return images;

  if (typeof json.image === "string" && json.image.length) return [{ url: json.image, contentType: null }];

  const output = Array.isArray(json.output) ? json.output.map(normalizeImageItem).filter(Boolean) : [];
  if (output.length) return output;

  const data = Array.isArray(json.data) ? json.data.map(normalizeImageItem).filter(Boolean) : [];
  if (data.length) return data;

  return [];
}

async function copyFinalImages({ fromDir, toDir }) {
  await ensureDir(toDir);
  const entries = await fs.readdir(fromDir, { withFileTypes: true });
  const imageFiles = entries
    .filter((entry) => entry.isFile() && /^image-\d+\./.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (!imageFiles.length) return 0;
  for (const file of imageFiles) {
    await fs.copyFile(path.join(fromDir, file), path.join(toDir, file));
  }
  return imageFiles.length;
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
  const workRoot = path.resolve(process.cwd(), "temp", "fal-nano-banana-2-image-gen", runId);
  await ensureDir(workRoot);

  const outDir = args.outDir || path.resolve(process.cwd(), "artifacts", "fal-nano-banana-2-image-gen", runId);
  const resolvedOutDir = path.resolve(outDir);
  const artifactsRoot = path.resolve(process.cwd(), "artifacts") + path.sep;
  if (!resolvedOutDir.startsWith(artifactsRoot)) {
    throw new Error("--out must be under artifacts/ (final outputs only).");
  }
  await ensureDir(resolvedOutDir);

  await fs.writeFile(
    path.join(workRoot, "inputs.json"),
    JSON.stringify(
      {
        prompt: args.prompt,
        options: {
          out: resolvedOutDir,
          sizes: args.sizeSpecs,
          num_images: args.numImages,
          seed: args.seed,
          negative_prompt: args.negativePrompt,
          format: args.format,
          sync_mode: args.syncMode,
          body_json: args.bodyJsonPath,
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
    title: "fal-nano-banana-2-image-gen (working logs)",
    status: "in-progress",
    inputs: [
      `Prompt: ${JSON.stringify(args.prompt)}`,
      `Sizes: ${args.sizeSpecs.length ? args.sizeSpecs.map((s) => (s.kind === "px" ? `${s.value} (px)` : s.value || "(default)")).join(", ") : "(default)"}`,
      `Run ID: ${runId}`,
      `Final output dir: ${resolvedOutDir}`,
    ],
    notes: [
      "Do not share secrets from workers.jsonc.",
      "Working logs stay in logs/; only final images are copied to artifacts/.",
    ],
  });

  let bodyJson = null;
  if (args.bodyJsonPath) {
    bodyJson = await readBodyJson(args.bodyJsonPath);
    await fs.copyFile(path.resolve(process.cwd(), args.bodyJsonPath), path.join(workRoot, "body.json"));
  }

  let totalFinalImages = 0;
  const resolvedSizes = args.sizeSpecs.map(resolveSizeSpec);
  for (const resolvedSize of resolvedSizes) {
    const sizeWorkDir = path.join(workRoot, resolvedSize.label);
    await ensureDir(sizeWorkDir);

    const body = {
      prompt: args.prompt,
      num_images: args.numImages,
      output_format: String(args.format).toLowerCase(),
      sync_mode: args.syncMode,
    };
    if (resolvedSize.imageSize) body.image_size = resolvedSize.imageSize;
    if (args.seed != null) body.seed = args.seed;
    if (args.negativePrompt) body.negative_prompt = args.negativePrompt;

    if (bodyJson && typeof bodyJson === "object" && !Array.isArray(bodyJson)) Object.assign(body, bodyJson);
    for (const param of args.params) {
      const idx = param.indexOf("=");
      if (idx === -1) throw new Error(`Invalid --param (expected k=v): ${param}`);
      const key = param.slice(0, idx).trim();
      const rawValue = param.slice(idx + 1);
      setByDotPath(body, key, parseParamValue(rawValue));
    }

    await fs.writeFile(
      path.join(sizeWorkDir, "request.json"),
      JSON.stringify(
        {
          model: FAL_MODEL_ID,
          mode: args.syncMode ? "sync" : "queue",
          endpoint: args.syncMode ? FAL_RUN_ENDPOINT : FAL_QUEUE_ENDPOINT,
          body,
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
      json = args.syncMode ? await runFalSync({ body, headers }) : await runFalQueue({ body, headers, sizeWorkDir });
    } catch (err) {
      const msg = err?.message ? String(err.message) : String(err);
      await fs.writeFile(path.join(sizeWorkDir, "error.txt"), msg + "\n", "utf8");
      await writeReadme({
        dir: workRoot,
        title: "fal-nano-banana-2-image-gen (working logs)",
        status: "blocked",
        inputs: [
          `Prompt: ${JSON.stringify(args.prompt)}`,
          `Sizes: ${args.sizeSpecs.length ? args.sizeSpecs.map((s) => (s.kind === "px" ? `${s.value} (px)` : s.value || "(default)")).join(", ") : "(default)"}`,
          `Run ID: ${runId}`,
          `Final output dir: ${resolvedOutDir}`,
        ],
        notes: [
          `Network/fetch error for size "${resolvedSize.detail}" (see ${path.relative(workRoot, path.join(sizeWorkDir, "error.txt"))})`,
          "If this is a DNS/network outage, restore connectivity and re-run.",
          "If this is an environment restriction, run this script in a network-enabled environment.",
        ],
      });
      throw new Error(`Error calling fal API (saved logs/.../error.txt): ${msg}`);
    }

    await fs.writeFile(
      path.join(sizeWorkDir, "result.json"),
      JSON.stringify(
        {
          request: {
            model: FAL_MODEL_ID,
            mode: args.syncMode ? "sync" : "queue",
            endpoint: args.syncMode ? FAL_RUN_ENDPOINT : FAL_QUEUE_ENDPOINT,
            body,
          },
          response: json,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );

    const imageItems = extractImageItems(json);
    if (!imageItems.length) {
      console.log(`Wrote: ${path.join(sizeWorkDir, "result.json")}`);
      throw new Error(`No images found in response for size "${resolvedSize.detail}". See logs for result.json.`);
    }

    for (let i = 0; i < imageItems.length; i++) {
      const image = imageItems[i];
      const parsed = parseDataUri(image.url);
      if (parsed) {
        const ext = extFromContentType(parsed.contentType) || (args.format === "jpeg" ? "jpg" : "png");
        const filePath = path.join(sizeWorkDir, `image-${i + 1}.${ext}`);
        await fs.writeFile(filePath, Buffer.from(parsed.base64, "base64"));
        continue;
      }

      if (typeof image.url === "string" && image.url.length) {
        const ext = extFromContentType(image.contentType) || (args.format === "jpeg" ? "jpg" : "png");
        const filePath = path.join(sizeWorkDir, `image-${i + 1}.${ext}`);
        await downloadToFile(image.url, filePath);
        continue;
      }

      throw new Error(`Unrecognized image payload at index ${i}`);
    }

    const finalSizeDir = resolvedSizes.length > 1 ? path.join(resolvedOutDir, resolvedSize.label) : resolvedOutDir;
    totalFinalImages += await copyFinalImages({ fromDir: sizeWorkDir, toDir: finalSizeDir });
  }

  await writeReadme({
    dir: workRoot,
    title: "fal-nano-banana-2-image-gen (working logs)",
    status: "done",
    inputs: [
      `Prompt: ${JSON.stringify(args.prompt)}`,
      `Sizes: ${resolvedSizes.map((s) => s.detail).join(", ")}`,
      `Run ID: ${runId}`,
      `Final output dir: ${resolvedOutDir}`,
    ],
    notes: [`Generated ${totalFinalImages} final image(s).`],
  });

  await writeReadme({
    dir: resolvedOutDir,
    title: "fal-nano-banana-2-image-gen (final deliverables)",
    status: "done",
    inputs: [
      `Prompt: ${JSON.stringify(args.prompt)}`,
      `Sizes: ${resolvedSizes.map((s) => s.detail).join(", ")}`,
      `Run ID: ${runId}`,
      `Working dir: ${workRoot}`,
    ],
    notes: [
      "This folder contains only final images (and this README).",
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
