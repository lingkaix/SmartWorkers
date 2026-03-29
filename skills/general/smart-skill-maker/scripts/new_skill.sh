#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
new_skill.sh: scaffold a spec-compliant skill folder

Usage:
  # From the smart-skill-maker folder (recommended):
  bash scripts/new_skill.sh --role <role> --name <skill-name> [options]

Options:
  --repo PATH         Repo root (default: .)
  --role ROLE         Role folder under skills/ (default: general)
  --name NAME         Skill name (required; must be AgentSkills-compliant)
  --description TEXT  Frontmatter description (default: placeholder)
  --with-openai-yaml  Also scaffold agents/openai.yaml (default: false)
  --apply             Write into skills/<role>/<skill-name>/ (default: write into logs/)
  -h, --help          Show help

Notes:
  - Without --apply, files are written to logs/smart-skill-maker/<timestamp>/<role>/<skill-name>/ for review.
  - With --apply, this script refuses to overwrite an existing skill directory.
  - Templates are read from skills/general/smart-skill-maker/assets/templates/.
EOF
}

repo="."
role="general"
name=""
description=""
with_openai_yaml="false"
apply="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="${2:-}"; shift 2 ;;
    --role) role="${2:-}"; shift 2 ;;
    --name) name="${2:-}"; shift 2 ;;
    --description) description="${2:-}"; shift 2 ;;
    --with-openai-yaml) with_openai_yaml="true"; shift ;;
    --apply) apply="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$name" ]]; then
  echo "Missing required arg: --name" >&2
  usage
  exit 2
fi

repo="$(cd "$repo" && pwd)"
if [[ ! -d "$repo" ]]; then
  echo "Repo path does not exist: $repo" >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd -- "$script_dir/.." && pwd)"
templates_dir="$skill_dir/assets/templates"

is_valid_skill_name() {
  local s="$1"
  [[ ${#s} -ge 1 && ${#s} -le 64 ]] || return 1
  [[ "$s" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || return 1
  [[ "$s" != *"--"* ]] || return 1
  return 0
}

if ! is_valid_skill_name "$name"; then
  echo "Invalid skill name: '$name'" >&2
  echo "Expected: 1–64 chars, lowercase alphanumerics + single hyphens (e.g. 'pdf-extract')." >&2
  exit 2
fi

timestamp="$(date +'%Y%m%d-%H%M%S')"

template_skill_md="$templates_dir/SKILL.md"
template_openai_yaml="$templates_dir/agents/openai.yaml"

if [[ ! -f "$template_skill_md" ]]; then
  echo "Missing template: $template_skill_md" >&2
  exit 1
fi

if [[ "$apply" == "true" ]]; then
  out_dir="$repo/skills/$role/$name"
  if [[ -e "$out_dir" ]]; then
    echo "Refusing to overwrite existing path: $out_dir" >&2
    exit 1
  fi
else
  out_dir="$repo/logs/smart-skill-maker/$timestamp/$role/$name"
fi

mkdir -p "$out_dir"

render_skill_md() {
  local desc="$1"
  if [[ -z "$desc" ]]; then
    desc="<Verb + object + key nouns>. Use when <common user triggers / synonyms>."
  fi

  local desc_escaped="$desc"
  desc_escaped="${desc_escaped//\\/\\\\}"
  desc_escaped="${desc_escaped//\"/\\\"}"

  sed \
    -e "s/^name: <skill-name>$/name: $name/" \
    -e "s|^description: \"<Verb \\+ object \\+ key nouns>\\. Use when <common user triggers / synonyms>\\.\"$|description: \"${desc_escaped}\"|" \
    "$template_skill_md"
}

render_skill_md "$description" >"$out_dir/SKILL.md"

if [[ "$with_openai_yaml" == "true" ]]; then
  if [[ ! -f "$template_openai_yaml" ]]; then
    echo "Missing template: $template_openai_yaml" >&2
    exit 1
  fi
  mkdir -p "$out_dir/agents"
  cp "$template_openai_yaml" "$out_dir/agents/openai.yaml"
fi

echo "Wrote scaffold:"
echo "  $out_dir/SKILL.md"
if [[ "$with_openai_yaml" == "true" ]]; then
  echo "  $out_dir/agents/openai.yaml"
fi

if [[ "$apply" == "false" ]]; then
  echo
  echo "Preview written. To apply into skills/:"
  if [[ "$with_openai_yaml" == "true" ]]; then
    echo "  bash scripts/new_skill.sh --role \"$role\" --name \"$name\" --apply --with-openai-yaml"
  else
    echo "  bash scripts/new_skill.sh --role \"$role\" --name \"$name\" --apply"
  fi
fi
