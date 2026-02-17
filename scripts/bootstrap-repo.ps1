param(
  [string]$RepoUrl = "https://github.com/somlutionsom/reading-note.git",
  [string]$TargetBase = "$env:USERPROFILE\Desktop\code",
  [string]$RepoName = "reading-note"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
  Write-Host "[bootstrap] $Message"
}

function Write-Warn([string]$Message) {
  Write-Warning "[bootstrap] $Message"
}

function Fail([string]$Message) {
  throw "[bootstrap] $Message"
}

function Check-ParentGitContamination {
  $top = git rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($top)) {
    return
  }

  $topPath = (Resolve-Path $top).Path
  $homePath = (Resolve-Path $env:USERPROFILE).Path
  if ($topPath -ieq $homePath) {
    Fail "홈 디렉토리($homePath)가 Git 루트입니다. 상위 .git 오염을 먼저 정리하세요."
  }
}

function Ensure-Origin([string]$RepoUrlValue) {
  $origin = git remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($origin)) {
    Write-Warn "origin 원격이 없어 추가합니다: $RepoUrlValue"
    git remote add origin $RepoUrlValue
  }
}

function Resolve-Branch {
  $branch = git rev-parse --abbrev-ref HEAD 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch) -or $branch -eq "HEAD") {
    return "main"
  }
  return $branch
}

function Sync-ExistingRepo {
  Ensure-Origin -RepoUrlValue $RepoUrl
  $branch = Resolve-Branch

  Write-Info "git fetch origin"
  git fetch origin

  $statusOut = git status --short
  if (-not [string]::IsNullOrWhiteSpace($statusOut)) {
    Write-Warn "커밋되지 않은 변경사항이 있습니다."
  }

  git rev-parse --verify "origin/$branch" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $counts = (git rev-list --left-right --count "$branch...origin/$branch").Trim() -split "\s+"
    $ahead = [int]$counts[0]
    $behind = [int]$counts[1]
    Write-Info "브랜치 비교: local ahead=$ahead, remote ahead=$behind (branch=$branch)"

    if ($behind -gt 0) {
      Write-Info "원격이 앞서 있어 rebase pull 실행"
      git pull --rebase origin $branch
    }
  } else {
    Write-Warn "origin/$branch 브랜치를 찾을 수 없습니다."
  }
}

function Fix-NestedRepoIfNeeded([string]$RootDir, [string]$Name) {
  $nestedDir = Join-Path $RootDir $Name
  if (-not (Test-Path $nestedDir)) { return }
  if (Test-Path (Join-Path $RootDir "package.json")) { return }
  if (-not (Test-Path (Join-Path $nestedDir "package.json"))) { return }

  Write-Warn "중첩 폴더 구조 감지: $nestedDir"
  Write-Warn "자동 수정: nested 파일을 루트로 이동"
  Get-ChildItem -LiteralPath $nestedDir -Force | Move-Item -Destination $RootDir -Force
  Remove-Item -LiteralPath $nestedDir -Force -Recurse
}

function Ensure-GitIgnore([string]$RootDir) {
  $gitignore = Join-Path $RootDir ".gitignore"
  if (-not (Test-Path $gitignore)) {
    New-Item -ItemType File -Path $gitignore | Out-Null
  }

  $required = @("node_modules", ".env", ".env.local", ".next")
  $content = Get-Content -Path $gitignore -ErrorAction SilentlyContinue
  foreach ($entry in $required) {
    if ($content -notcontains $entry) {
      Add-Content -Path $gitignore -Value $entry
      Write-Warn ".gitignore 누락 항목 추가: $entry"
    }
  }

  $tracked = git ls-files -- node_modules .env .env.local .next
  if (-not [string]::IsNullOrWhiteSpace($tracked)) {
    Write-Warn "추적 금지 파일이 감지되어 index에서 제거합니다."
    git rm -r --cached --ignore-unmatch node_modules .env .env.local .next 2>$null | Out-Null
  }
}

Check-ParentGitContamination

if (-not (Test-Path $TargetBase)) {
  New-Item -ItemType Directory -Path $TargetBase -Force | Out-Null
}

$targetDir = Join-Path $TargetBase $RepoName
if (Test-Path (Join-Path $targetDir ".git")) {
  Write-Info "기존 저장소 발견: $targetDir"
} else {
  if (Test-Path $targetDir) {
    $backup = "$targetDir.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Write-Warn ".git 없는 동일 경로 발견, 백업 이동: $backup"
    Move-Item -LiteralPath $targetDir -Destination $backup
  }
  Write-Info "저장소 클론: $RepoUrl -> $targetDir"
  git clone $RepoUrl $targetDir
}

Set-Location $targetDir
if (-not (Test-Path ".git")) {
  Fail "프로젝트 루트에 .git 폴더가 없습니다: $targetDir"
}

Ensure-Origin -RepoUrlValue $RepoUrl
Write-Info "remote 확인"
git remote -v

Sync-ExistingRepo
Fix-NestedRepoIfNeeded -RootDir $targetDir -Name $RepoName

if (-not (Test-Path "package.json")) {
  Fail "프로젝트 루트(package.json) 검증 실패: $targetDir"
}

Ensure-GitIgnore -RootDir $targetDir

Write-Info "git ls-tree 구조 점검"
git ls-tree -d --name-only HEAD

Write-Info "최종 상태"
git status --short
Write-Info "완료: $targetDir"
