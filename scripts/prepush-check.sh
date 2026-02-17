#!/usr/bin/env bash
set -euo pipefail

log() { printf '[prepush] %s\n' "$*"; }
warn() { printf '[prepush][WARN] %s\n' "$*" >&2; }
die() { printf '[prepush][ERROR] %s\n' "$*" >&2; exit 1; }

check_parent_git_contamination() {
  local top
  top="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -z "$top" ]]; then
    die "현재 경로는 Git 저장소가 아닙니다."
  fi

  local top_abs home_abs
  top_abs="$(cd "$top" && pwd)"
  home_abs="$(cd "$HOME" && pwd)"
  if [[ "$top_abs" == "$home_abs" ]]; then
    die "홈 디렉토리가 Git 루트입니다. 상위 .git 오염을 먼저 정리하세요."
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

ensure_gitignore_rules() {
  local tracked
  tracked="$(git ls-files -- node_modules .env .env.local .next || true)"
  if [[ -n "$tracked" ]]; then
    warn "추적 금지 파일이 커밋 대상에 포함되어 있습니다:"
    printf '%s\n' "$tracked"
    die "git rm --cached 후 다시 실행하세요."
  fi
}

check_nested_structure() {
  if [[ ! -f package.json ]]; then
    die "프로젝트 루트에 package.json이 없습니다."
  fi

  local nested_repo
  nested_repo="$(find . -mindepth 2 -maxdepth 3 -type d -name .git | head -n 1 || true)"
  if [[ -n "$nested_repo" ]]; then
    warn "중첩 Git 저장소 흔적 감지: ${nested_repo}"
  fi

  log "git ls-tree 구조 점검"
  git ls-tree -d --name-only HEAD
}

sync_with_remote() {
  local branch
  branch="$(resolve_branch)"

  log "git fetch origin"
  git fetch origin

  if git rev-parse --verify "origin/${branch}" >/dev/null 2>&1; then
    local ahead behind
    read -r ahead behind < <(git rev-list --left-right --count "${branch}...origin/${branch}")
    log "브랜치 비교: local ahead=${ahead}, remote ahead=${behind} (branch=${branch})"
    if [[ "${behind}" -gt 0 ]]; then
      log "원격 커밋이 있어 rebase pull 진행"
      if ! git pull --rebase origin "${branch}"; then
        warn "rebase 충돌 발생. 아래 상태를 확인하세요."
        git status --short || true
        die "충돌 해결 후 스크립트를 재실행하세요."
      fi
    fi
  else
    warn "origin/${branch} 브랜치를 찾을 수 없습니다."
  fi
}

main() {
  check_parent_git_contamination
  sync_with_remote
  check_nested_structure
  ensure_gitignore_rules

  if [[ -n "$(git status --porcelain)" ]]; then
    warn "워킹트리에 변경사항이 남아 있습니다:"
    git status --short
    die "푸시 전 상태가 깨끗하지 않습니다."
  fi

  log "푸시 전 점검 완료: 상태 깨끗함"
}

main "$@"
