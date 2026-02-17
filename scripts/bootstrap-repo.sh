#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-https://github.com/somlutionsom/reading-note.git}"
TARGET_BASE="${2:-$HOME/Desktop/code}"
REPO_NAME="${3:-reading-note}"
TARGET_DIR="${TARGET_BASE}/${REPO_NAME}"

log() { printf '[bootstrap] %s\n' "$*"; }
warn() { printf '[bootstrap][WARN] %s\n' "$*" >&2; }
die() { printf '[bootstrap][ERROR] %s\n' "$*" >&2; exit 1; }

check_parent_git_contamination() {
  local top
  if ! top="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    return
  fi

  local top_abs home_abs
  top_abs="$(cd "$top" && pwd)"
  home_abs="$(cd "$HOME" && pwd)"

  if [[ "$top_abs" == "$home_abs" ]]; then
    die "홈 디렉토리($home_abs)가 Git 루트입니다. 상위 .git 오염을 먼저 해소하세요.
해결 예시:
  1) mv \"$HOME/.git\" \"$HOME/.git.backup.\$(date +%Y%m%d%H%M%S)\"
  2) 이후 스크립트를 다시 실행"
  fi
}

ensure_remote_origin() {
  local current
  current="$(git remote get-url origin 2>/dev/null || true)"
  if [[ -z "$current" ]]; then
    warn "origin 원격이 없어 추가합니다: $REPO_URL"
    git remote add origin "$REPO_URL"
  fi
}

resolve_branch() {
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ -z "$branch" || "$branch" == "HEAD" ]]; then
    branch="main"
  fi
  printf '%s' "$branch"
}

sync_existing_repo() {
  ensure_remote_origin

  local branch
  branch="$(resolve_branch)"

  log "git fetch origin"
  git fetch origin

  local status_out
  status_out="$(git status --short || true)"
  if [[ -n "$status_out" ]]; then
    warn "커밋되지 않은 변경사항이 있습니다. pull/rebase 충돌 가능성이 있습니다."
  fi

  if git rev-parse --verify "origin/${branch}" >/dev/null 2>&1; then
    local ahead behind
    read -r ahead behind < <(git rev-list --left-right --count "${branch}...origin/${branch}")
    log "브랜치 비교: local ahead=${ahead}, remote ahead=${behind} (branch=${branch})"

    if [[ "${behind}" -gt 0 ]]; then
      log "원격이 앞서 있어 rebase pull 실행: git pull --rebase origin ${branch}"
      git pull --rebase origin "${branch}"
    fi
  else
    warn "origin/${branch} 브랜치를 찾을 수 없습니다."
  fi
}

fix_nested_repo_if_needed() {
  local nested_dir="${TARGET_DIR}/${REPO_NAME}"
  if [[ ! -d "$nested_dir" ]]; then
    return
  fi

  if [[ -f "${TARGET_DIR}/package.json" ]]; then
    return
  fi

  if [[ -f "${nested_dir}/package.json" ]]; then
    warn "중첩 폴더 구조를 감지했습니다: ${nested_dir}"
    warn "package.json을 루트로 이동하는 자동 수정 수행"
    shopt -s dotglob nullglob
    mv "${nested_dir}"/* "${TARGET_DIR}/"
    shopt -u dotglob nullglob
    rmdir "${nested_dir}" || true
  fi
}

ensure_gitignore_entries() {
  local gitignore_file="${TARGET_DIR}/.gitignore"
  touch "$gitignore_file"

  local changed=0
  local required=(
    "node_modules"
    ".env"
    ".env.local"
    ".next"
  )

  for entry in "${required[@]}"; do
    if ! grep -qxF "$entry" "$gitignore_file"; then
      printf '%s\n' "$entry" >> "$gitignore_file"
      changed=1
    fi
  done

  if [[ "$changed" -eq 1 ]]; then
    warn ".gitignore에 누락 항목을 추가했습니다."
  fi

  local tracked
  tracked="$(git ls-files -- node_modules .env .env.local .next || true)"
  if [[ -n "$tracked" ]]; then
    warn "추적되면 안 되는 파일/폴더가 감지되어 index에서 제거합니다."
    git rm -r --cached --ignore-unmatch node_modules .env .env.local .next >/dev/null 2>&1 || true
  fi
}

main() {
  check_parent_git_contamination

  mkdir -p "$TARGET_BASE"

  if [[ -d "${TARGET_DIR}/.git" ]]; then
    log "기존 저장소 발견: ${TARGET_DIR}"
  else
    if [[ -e "${TARGET_DIR}" && ! -d "${TARGET_DIR}/.git" ]]; then
      local backup
      backup="${TARGET_DIR}.backup.$(date +%Y%m%d%H%M%S)"
      warn ".git 없는 동일 경로가 있어 백업 이동: ${backup}"
      mv "${TARGET_DIR}" "${backup}"
    fi
    log "저장소 클론: ${REPO_URL} -> ${TARGET_DIR}"
    git clone "${REPO_URL}" "${TARGET_DIR}"
  fi

  cd "${TARGET_DIR}"

  [[ -d .git ]] || die "프로젝트 루트에 .git 폴더가 없습니다: ${TARGET_DIR}"
  ensure_remote_origin

  log "remote 확인"
  git remote -v

  sync_existing_repo
  fix_nested_repo_if_needed

  [[ -f package.json ]] || die "프로젝트 루트(package.json) 검증 실패: ${TARGET_DIR}"

  ensure_gitignore_entries

  log "git ls-tree 구조 점검"
  git ls-tree -d --name-only HEAD

  log "최종 상태"
  git status --short
  log "완료: ${TARGET_DIR}"
}

main "$@"
