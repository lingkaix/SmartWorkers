#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/init_run.sh \
    --workspace-root <path> \
    --run-id <run-id> \
    --goal "<goal>" \
    [--max-iterations <n>] \
    [--scope <path>]... \
    [--readonly <path>]... \
    [--guard "<guard>"]... \
    [--standards-source <path>]... \
    [--direction "<research direction>"]... \
    [--reference "<path-or-url>"]... \
    [--tip "<domain tip>"]... \
    [--decision "<explicit user decision>"]...

This scaffolds:
  logs/general/workspace-autoresearch/<run-id>/
    README.md
    goal.md
    research.md
    evaluator.md
    run.json
    results.tsv
EOF
}

json_escape() {
  local value=${1-}
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\t'/\\t}
  printf '%s' "$value"
}

write_json_array() {
  local indent=$1
  shift
  local values=("$@")
  local i
  if [ ${#values[@]} -eq 0 ]; then
    printf '[]'
    return
  fi

  printf '[\n'
  for i in "${!values[@]}"; do
    printf '%s"%s"' "$indent" "$(json_escape "${values[$i]}")"
    if [ "$i" -lt $((${#values[@]} - 1)) ]; then
      printf ','
    fi
    printf '\n'
  done
  printf '  ]'
}

workspace_root="."
run_id=""
goal=""
max_iterations="10"
declare -a scope=()
declare -a readonly=()
declare -a guard=()
declare -a standards_sources=()
declare -a directions=()
declare -a references=()
declare -a tips=()
declare -a decisions=()

while [ $# -gt 0 ]; do
  case "$1" in
    --workspace-root)
      workspace_root=$2
      shift 2
      ;;
    --run-id)
      run_id=$2
      shift 2
      ;;
    --goal)
      goal=$2
      shift 2
      ;;
    --max-iterations)
      max_iterations=$2
      shift 2
      ;;
    --scope)
      scope+=("$2")
      shift 2
      ;;
    --readonly)
      readonly+=("$2")
      shift 2
      ;;
    --guard)
      guard+=("$2")
      shift 2
      ;;
    --standards-source)
      standards_sources+=("$2")
      shift 2
      ;;
    --direction)
      directions+=("$2")
      shift 2
      ;;
    --reference)
      references+=("$2")
      shift 2
      ;;
    --tip)
      tips+=("$2")
      shift 2
      ;;
    --decision)
      decisions+=("$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$run_id" ] || [ -z "$goal" ]; then
  echo "--run-id and --goal are required." >&2
  usage >&2
  exit 1
fi

if ! [[ "$max_iterations" =~ ^[0-9]+$ ]]; then
  echo "--max-iterations must be an integer." >&2
  exit 1
fi

if [ ${#scope[@]} -eq 0 ]; then
  echo "At least one --scope entry is required." >&2
  exit 1
fi

if [ ${#standards_sources[@]} -eq 0 ]; then
  standards_sources=("user-confirmed run goal")
fi

run_dir="$workspace_root/logs/general/workspace-autoresearch/$run_id"
mkdir -p "$run_dir"

cat > "$run_dir/README.md" <<EOF
# Workspace Autoresearch Run

## Status

pending baseline

## Goal

$goal

## Scope
EOF

for item in "${scope[@]}"; do
  printf -- '- `%s`\n' "$item" >> "$run_dir/README.md"
done

cat >> "$run_dir/README.md" <<EOF

## Read Only
EOF

if [ ${#readonly[@]} -eq 0 ]; then
  printf -- '- none declared\n' >> "$run_dir/README.md"
else
  for item in "${readonly[@]}"; do
    printf -- '- `%s`\n' "$item" >> "$run_dir/README.md"
  done
fi

cat >> "$run_dir/README.md" <<'EOF'

## Files

- `goal.md`
- `research.md`
- `evaluator.md`
- `run.json`
- `results.tsv`
- `summary.md`

## Notes

- This run uses a bounded improvement loop.
- Do not continue past the configured iteration cap.
EOF

cat > "$run_dir/goal.md" <<EOF
# Run Goal

## Goal

$goal

## In Scope
EOF

for item in "${scope[@]}"; do
  printf -- '- `%s`\n' "$item" >> "$run_dir/goal.md"
done

cat >> "$run_dir/goal.md" <<EOF

## Read Only
EOF

if [ ${#readonly[@]} -eq 0 ]; then
  printf -- '- none declared\n' >> "$run_dir/goal.md"
else
  for item in "${readonly[@]}"; do
    printf -- '- `%s`\n' "$item" >> "$run_dir/goal.md"
  done
fi

cat >> "$run_dir/goal.md" <<EOF

## Guard Conditions
EOF

if [ ${#guard[@]} -eq 0 ]; then
  printf -- '- none declared\n' >> "$run_dir/goal.md"
else
  for item in "${guard[@]}"; do
    printf -- '- %s\n' "$item" >> "$run_dir/goal.md"
  done
fi

cat > "$run_dir/research.md" <<'EOF'
# Research Brief

## Research directions
EOF

if [ ${#directions[@]} -eq 0 ]; then
  printf -- '- none provided yet\n' >> "$run_dir/research.md"
else
  for item in "${directions[@]}"; do
    printf -- '- %s\n' "$item" >> "$run_dir/research.md"
  done
fi

cat >> "$run_dir/research.md" <<'EOF'

## Provided references
EOF

if [ ${#references[@]} -eq 0 ]; then
  printf -- '- none provided yet\n' >> "$run_dir/research.md"
else
  for item in "${references[@]}"; do
    printf -- '- `%s`\n' "$item" >> "$run_dir/research.md"
  done
fi

cat >> "$run_dir/research.md" <<'EOF'

## Tips and heuristics
EOF

if [ ${#tips[@]} -eq 0 ]; then
  printf -- '- none provided yet\n' >> "$run_dir/research.md"
else
  for item in "${tips[@]}"; do
    printf -- '- %s\n' "$item" >> "$run_dir/research.md"
  done
fi

cat >> "$run_dir/research.md" <<'EOF'

## Explicit user decisions
EOF

if [ ${#decisions[@]} -eq 0 ]; then
  printf -- '- none recorded yet\n' >> "$run_dir/research.md"
else
  for item in "${decisions[@]}"; do
    printf -- '- %s\n' "$item" >> "$run_dir/research.md"
  done
fi

cat > "$run_dir/evaluator.md" <<EOF
# Run Evaluator

## Run ID

$run_id

## Goal

$goal

## Standards sources
EOF

for item in "${standards_sources[@]}"; do
  printf -- '- `%s`\n' "$item" >> "$run_dir/evaluator.md"
done

cat >> "$run_dir/evaluator.md" <<EOF

## Research inputs
EOF

if [ ${#directions[@]} -eq 0 ] && [ ${#references[@]} -eq 0 ] && [ ${#tips[@]} -eq 0 ] && [ ${#decisions[@]} -eq 0 ]; then
  printf -- '- none recorded yet\n' >> "$run_dir/evaluator.md"
else
  for item in "${directions[@]}"; do
    printf -- '- direction: %s\n' "$item" >> "$run_dir/evaluator.md"
  done
  for item in "${references[@]}"; do
    printf -- '- reference: `%s`\n' "$item" >> "$run_dir/evaluator.md"
  done
  for item in "${tips[@]}"; do
    printf -- '- tip: %s\n' "$item" >> "$run_dir/evaluator.md"
  done
  for item in "${decisions[@]}"; do
    printf -- '- decision: %s\n' "$item" >> "$run_dir/evaluator.md"
  done
fi

cat >> "$run_dir/evaluator.md" <<EOF

## In Scope
EOF

for item in "${scope[@]}"; do
  printf -- '- `%s`\n' "$item" >> "$run_dir/evaluator.md"
done

cat >> "$run_dir/evaluator.md" <<EOF

## Read Only
EOF

if [ ${#readonly[@]} -eq 0 ]; then
  printf -- '- none declared\n' >> "$run_dir/evaluator.md"
else
  for item in "${readonly[@]}"; do
    printf -- '- `%s`\n' "$item" >> "$run_dir/evaluator.md"
  done
fi

cat >> "$run_dir/evaluator.md" <<EOF

## Priority outcomes

1. Fill this in before iteration 1.
2. Fill this in before iteration 1.
3. Fill this in before iteration 1.

## Improvement heuristics

- Replace this placeholder with run-specific standards before iteration 1.

## Required checks

- Replace this placeholder with run-specific checks before iteration 1.

## Guard conditions
EOF

if [ ${#guard[@]} -eq 0 ]; then
  printf -- '- none declared\n' >> "$run_dir/evaluator.md"
else
  for item in "${guard[@]}"; do
    printf -- '- %s\n' "$item" >> "$run_dir/evaluator.md"
  done
fi

cat >> "$run_dir/evaluator.md" <<EOF

## Keep rules

- Keep a change when it improves the workspace according to the goal and does not violate scope or guards.
- Prefer simpler structure and clearer guidance when results are otherwise equal.

## Revert rules

- Revert a change when it makes the workspace harder to navigate, creates inconsistency, breaks references, or fails a guard.
- Revert a change when it expands beyond the declared scope.

## Iteration limit

$max_iterations

## Notes for iteration planning

- Make one focused improvement per iteration.
- Re-read the latest results before choosing the next change.
- Wait for explicit user approval of this evaluator before iteration 1.
EOF

cat > "$run_dir/run.json" <<EOF
{
  "run_id": "$(json_escape "$run_id")",
  "status": "running",
  "goal": "$(json_escape "$goal")",
  "max_iterations": $max_iterations,
  "current_iteration": 0,
  "completed_iterations": [],
  "iteration_statuses": {},
  "scope": $(write_json_array "    " "${scope[@]}"),
  "readonly": $(write_json_array "    " "${readonly[@]}"),
  "guard": $(write_json_array "    " "${guard[@]}")
}
EOF

printf 'iteration\tstage\tdecision\tchange_summary\tchecks_summary\tevidence_used\tdecision_reason\ttouched_paths\trollback_artifact\toutcome_summary\tnext_step\n' > "$run_dir/results.tsv"

echo "Initialized run package at: $run_dir"
