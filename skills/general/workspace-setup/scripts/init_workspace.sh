#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
init_workspace.sh: initialize a SmartWorkers-style agent workspace in one shot

Usage:
  # From the skill folder (recommended):
  bash scripts/init_workspace.sh [options]

  # From the repo root (alternative):
  bash skills/general/workspace-setup/scripts/init_workspace.sh [options]

Options:
  --repo PATH         Repo root (default: .)
  --node VERSION      Node version for package.json engines (default: 24)
  --python VERSION    Python version for pyproject.toml (default: 3.14)
  --smart-skill-maker-source SOURCE
                     Override the default GitHub source for smart-skill-maker with a user-provided URL or local path
  --install           Complete the required global mise/npm/skills bootstrap and install skill-creator + smart-skill-maker for Codex (default behavior; kept for clarity)
  --no-install        Skip the bootstrap/install step and only scaffold workspace files
  --uv-sync           Run `uv venv --seed` then `uv sync` (requires uv)
  -h, --help          Show help

Notes:
  - Files are written directly into the repo root.
  - Existing files are never overwritten.
  - By default, this script both scaffolds the workspace and finishes the required bootstrap in one shot.
  - Use `--no-install` only when downloads/runtime changes must be deferred or the environment is offline.
  - Generates the baseline workspace skeleton:
    - repo root: AGENTS.md (workspace policy)
    - logs/: logs/AGENTS.md (agent scratch rules)
    - temp/: temp/AGENTS.md (user temporary-file rules)
    - artifacts/: artifacts/AGENTS.md (deliverables rules)
    - skills/: skills/AGENTS.md (local skill source rules)
    - README.md, WORKFLOW.md, .gitignore, .ignore, workers.example.jsonc
    - package.json, pyproject.toml
  - This script refuses to run if the repo already has an AGENTS.md. Create a new empty folder for a new workspace, or adopt the conventions manually.
EOF
}

repo="."
node_version="24"
python_version="3.14"
workspace_setup_version="1.0.7"
skill_creator_source="https://github.com/anthropics/skills/tree/main/skills/skill-creator"
smart_skill_maker_source_fallback="https://github.com/lingkaix/SmartWorkers/tree/main/skills/general/smart-skill-maker"
smart_skill_maker_source="$smart_skill_maker_source_fallback"
do_install="true"
do_uv_sync="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="${2:-}"; shift 2 ;;
    --node) node_version="${2:-}"; shift 2 ;;
    --python) python_version="${2:-}"; shift 2 ;;
    --smart-skill-maker-source) smart_skill_maker_source="${2:-}"; shift 2 ;;
    --install) do_install="true"; shift ;;
    --no-install) do_install="false"; shift ;;
    --uv-sync) do_uv_sync="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

repo="$(cd "$repo" && pwd)"
if [[ ! -d "$repo" ]]; then
  echo "Repo path does not exist: $repo" >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
assets_dir="$script_dir/../assets/templates"

if [[ ! -d "$assets_dir" ]]; then
  echo "Missing assets templates directory: $assets_dir" >&2
  exit 1
fi

required_templates=(
  "AGENTS.md.tmpl"
  "README.md.tmpl"
  "WORKFLOW.md.tmpl"
  "package.json.tmpl"
  "pyproject.toml.tmpl"
  "workers.example.jsonc.tmpl"
  "logs.AGENTS.md.tmpl"
  "temp.AGENTS.md.tmpl"
  "artifacts.AGENTS.md.tmpl"
  "skills.AGENTS.md.tmpl"
  "gitignore.recommended"
)

missing_templates=()
for template_name in "${required_templates[@]}"; do
  if [[ ! -f "$assets_dir/$template_name" ]]; then
    missing_templates+=("$template_name")
  fi
done

if (( ${#missing_templates[@]} > 0 )); then
  echo "Missing required workspace-setup templates in $assets_dir:" >&2
  for template_name in "${missing_templates[@]}"; do
    echo "  - $template_name" >&2
  done
  echo "Restore the missing template files, then re-run init_workspace.sh." >&2
  exit 1
fi

sanitize_project_name() {
  local raw="$1"
  raw="$(echo "$raw" | tr '[:upper:]' '[:lower:]')"
  raw="$(echo "$raw" | tr ' ' '-')"
  raw="$(echo "$raw" | tr -cs 'a-z0-9-' '-')"
  raw="$(echo "$raw" | sed -E 's/^-+//; s/-+$//; s/-{2,}/-/g')"
  if [[ -z "$raw" ]]; then
    raw="workspace"
  fi
  echo "$raw"
}

project_name="$(sanitize_project_name "$(basename "$repo")")"

render_template() {
  local template_path="$1"
  local node_v="$2"
  local python_v="$3"
  local proj="$4"

  sed \
    -e "s/{{NODE_VERSION}}/${node_v}/g" \
    -e "s/{{PYTHON_VERSION}}/${python_v}/g" \
    -e "s/{{PROJECT_NAME}}/${proj}/g" \
    -e "s/{{WORKSPACE_SETUP_VERSION}}/${workspace_setup_version}/g" \
    "$template_path"
}

generate_workspace_root_agents_md() {
  render_template "$assets_dir/AGENTS.md.tmpl" \
    "$node_version" "$python_version" "$project_name"
}

generate_folder_agents_md() {
  local template_name="$1"
  render_template "$assets_dir/$template_name" \
    "$node_version" "$python_version" "$project_name"
}

generate_gitignore() {
  cat <<'EOF'
#
# This file is a pragmatic merge of:
# - the repo's existing .gitignore (if present)
# - common patterns from https://github.com/github/gitignore (see recommended block below)
EOF

  echo

  if [[ -f "$repo/.gitignore" ]]; then
    echo "# --- Existing repo .gitignore (as reference) ---"
    cat "$repo/.gitignore"
    echo
  fi

  cat "$assets_dir/gitignore.recommended"
}

generate_ignore_for_workdirs() {
  cat <<'EOF'
#
# Codex (and some tooling) uses ignore files to decide which files are visible/searchable.
# This workspace's `.gitignore` may intentionally ignore paths the agent still needs to
# recognize (e.g. `workers.jsonc`, `logs/`, `temp/`, `artifacts/`). This `.ignore` file re-includes
# the essential working paths for agent runs and deliverables.
#
# NOTE: Visibility is not permission — avoid reading secrets unless the task requires it.
EOF

  echo
  cat <<'EOF'
!workers.jsonc
!logs/
!logs/**
!temp/
!temp/**
!artifacts/
!artifacts/**
!skills/
!skills/**
EOF
}

if [[ -f "$repo/AGENTS.md" ]]; then
  echo "Refusing to initialize workspace: AGENTS.md already exists at $repo/AGENTS.md" >&2
  echo "This skill is for initializing a new workspace. Create a new empty folder and run again with --repo <new-folder>, or adopt the conventions manually." >&2
  exit 1
fi

out_dir="$repo"

mkdir -p "$out_dir"

gitignore_target="$out_dir/.gitignore"
ignore_target="$out_dir/.ignore"
workers_example_target="$out_dir/workers.example.jsonc"
readme_target="$out_dir/README.md"
workflow_target="$out_dir/WORKFLOW.md"
package_json_target="$out_dir/package.json"
pyproject_target="$out_dir/pyproject.toml"
workspace_agents_target="$repo/AGENTS.md"
logs_agents_target="$repo/logs/AGENTS.md"
temp_agents_target="$repo/temp/AGENTS.md"
artifacts_agents_target="$repo/artifacts/AGENTS.md"
skills_agents_target="$repo/skills/AGENTS.md"

write_if_missing() {
  local target="$1"
  local label="$2"
  local tmp
  tmp="$(mktemp)"
  cat >"$tmp"
  if [[ -f "$target" ]]; then
    echo "Skip (already exists): $label -> $target"
    rm -f "$tmp"
    return 0
  fi
  mv "$tmp" "$target"
  echo "Wrote: $label -> $target"
}

generate_gitignore | write_if_missing "$gitignore_target" ".gitignore"

generate_ignore_for_workdirs | write_if_missing "$ignore_target" ".ignore"

render_template "$assets_dir/workers.example.jsonc.tmpl" \
  "$node_version" "$python_version" "$project_name" \
  | write_if_missing "$workers_example_target" "workers.example.jsonc"

render_template "$assets_dir/README.md.tmpl" \
  "$node_version" "$python_version" "$project_name" \
  | write_if_missing "$readme_target" "README.md"

render_template "$assets_dir/WORKFLOW.md.tmpl" \
  "$node_version" "$python_version" "$project_name" \
  | write_if_missing "$workflow_target" "WORKFLOW.md"

render_template "$assets_dir/package.json.tmpl" \
  "$node_version" "$python_version" "$project_name" \
  | write_if_missing "$package_json_target" "package.json"

render_template "$assets_dir/pyproject.toml.tmpl" \
  "$node_version" "$python_version" "$project_name" \
  | write_if_missing "$pyproject_target" "pyproject.toml"

mkdir -p "$repo/logs" "$repo/temp" "$repo/artifacts" "$repo/skills"

generate_workspace_root_agents_md | write_if_missing "$workspace_agents_target" "AGENTS.md"
generate_folder_agents_md "logs.AGENTS.md.tmpl" | write_if_missing "$logs_agents_target" "logs/AGENTS.md"
generate_folder_agents_md "temp.AGENTS.md.tmpl" | write_if_missing "$temp_agents_target" "temp/AGENTS.md"
generate_folder_agents_md "artifacts.AGENTS.md.tmpl" | write_if_missing "$artifacts_agents_target" "artifacts/AGENTS.md"
generate_folder_agents_md "skills.AGENTS.md.tmpl" | write_if_missing "$skills_agents_target" "skills/AGENTS.md"

echo
echo "Initialized (without overwriting existing files) in repo root: $repo"

if [[ "$do_install" == "true" ]]; then
  if ! command -v mise >/dev/null 2>&1; then
    echo "mise not found. Install it globally first: https://mise.jdx.dev/getting-started.html" >&2
    exit 1
  fi

  mise use -g -y "node@$node_version" "python@$python_version" "uv@latest"

  if mise exec "node@$node_version" -- npm list -g skills --depth=0 >/dev/null 2>&1; then
    echo "skills npm package already installed globally."
  else
    mise exec "node@$node_version" -- npm install -g skills
  fi

  mise exec "node@$node_version" -- npx skills add -a codex -y "$skill_creator_source"
  mise exec "node@$node_version" -- npx skills add -a codex -y "$smart_skill_maker_source"
fi

if [[ "$do_install" != "true" ]]; then
  echo
  echo "Setup note: bootstrap was skipped because --no-install was requested."
  echo "This workspace is not fully set up until the required Codex skill tooling is installed:"
  echo "  - global mise runtimes: node@$node_version python@$python_version uv@latest"
  echo "  - global npm package: skills"
  echo "  - Codex skills: skill-creator and smart-skill-maker"
  echo "Finish with:"
  echo "  bash $script_dir/init_workspace.sh --repo $repo --install"
fi

if [[ "$do_uv_sync" == "true" ]]; then
  if command -v uv >/dev/null 2>&1; then
    (cd "$repo" && uv venv --seed)
    (cd "$repo" && uv sync)
  elif command -v mise >/dev/null 2>&1; then
    (cd "$repo" && mise exec "python@$python_version" "uv@latest" -- uv venv --seed)
    (cd "$repo" && mise exec "python@$python_version" "uv@latest" -- uv sync)
  else
    echo "uv not found. Install uv, then re-run with --uv-sync." >&2
    exit 1
  fi
fi
