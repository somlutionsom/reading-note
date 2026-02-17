param()

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
  Write-Host "[prepush] $Message"
}

function Write-Warn([string]$Message) {
  Write-Warning "[prepush] $Message"
}

function Fail([string]$Message) {
  throw "[prepush] $Message"
}

function Check-ParentGitContamination {
  $top = git rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($top)) {
    Fail "현재 경로는 Git 저장소가 아닙니다."
  }

  $topPath = (Resolve-Path $top).Path
  $homePath = (Resolve-Path $env:USERPROFILE).Path
  if ($topPath -ieq $homePath) {
    Fail "홈 디렉토리가 Git 루트입니다. 상위 .git 오염을 먼저 정리하세요."
  }
}

function Resolve-Branch {
  $branch = git rev-parse --abbrev-ref HEAD 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch) -or $branch -eq "HEAD") {
    return "main"
  }
  return $branch
}

function Sync-WithRemote {
  $branch = Resolve-Branch

  Write-Info "git fetch origin"
  git fetch origin

  git rev-parse --verify "origin/$branch" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $counts = (git rev-list --left-right --count "$branch...origin/$branch").Trim() -split "\s+"
    $ahead = [int]$counts[0]
    $behind = [int]$counts[1]
    Write-Info "브랜치 비교: local ahead=$ahead, remote ahead=$behind (branch=$branch)"

    if ($behind -gt 0) {
      Write-Info "원격 커밋이 있어 rebase pull 진행"
      git pull --rebase origin $branch
      if ($LASTEXITCODE -ne 0) {
        Write-Warn "rebase 충돌 발생. git status 결과를 확인하세요."
        git status --short
        Fail "충돌 해결 후 다시 실행하세요."
      }
    }
  } else {
    Write-Warn "origin/$branch 브랜치를 찾을 수 없습니다."
  }
}

function Check-Structure {
  if (-not (Test-Path "package.json")) {
    Fail "프로젝트 루트에 package.json이 없습니다."
  }

  $nestedGit = Get-ChildItem -Recurse -Directory -Filter ".git" -Depth 3 -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $nestedGit -and $nestedGit.FullName -ne (Join-Path (Get-Location) ".git")) {
    Write-Warn "중첩 Git 저장소 흔적 감지: $($nestedGit.FullName)"
  }

  Write-Info "git ls-tree 구조 점검"
  git ls-tree -d --name-only HEAD
}

function Ensure-NoTrackedIgnored {
  $tracked = git ls-files -- node_modules .env .env.local .next
  if (-not [string]::IsNullOrWhiteSpace($tracked)) {
    Write-Warn "추적 금지 파일이 감지되었습니다:"
    Write-Host $tracked
    Fail "git rm --cached 후 다시 실행하세요."
  }
}

Check-ParentGitContamination
Sync-WithRemote
Check-Structure
Ensure-NoTrackedIgnored

$status = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($status)) {
  Write-Warn "워킹트리에 변경사항이 남아 있습니다:"
  git status --short
  Fail "푸시 전 상태가 깨끗하지 않습니다."
}

Write-Info "푸시 전 점검 완료: 상태 깨끗함"
