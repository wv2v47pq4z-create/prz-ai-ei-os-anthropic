# PATH Finder Report
**Host**: PRZCODEX | **Platform**: win32
**Scanned**: 2026-02-26, 5:23:13 p.m.

## PATH Diagnostic
| Metric | Value |
|--------|-------|
| Total Entries | 35 |
| Valid Entries | 28 |
| Invalid Entries | 7 |
| Duplicates | 1 |

### Invalid PATH Entries
- `C:\Users\super\.gemini\antigravity\scratch\node_modules\.bin`
- `C:\Users\super\.gemini\antigravity\node_modules\.bin`
- `C:\Users\super\.gemini\node_modules\.bin`
- `C:\Users\super\node_modules\.bin`
- `C:\Users\node_modules\.bin`
- `C:\node_modules\.bin`
- `C:\Users\super\AppData\Roaming\npm\bin`

## Discovered Tools
| Tool | Location | In PATH | Version |
|------|----------|---------|---------|
| docker | `C:\Program Files\Docker\Docker\resources\bin` | ✅ | Docker version 29.2.1, build a5c7197 |
| docker-compose | `C:\Program Files\Docker\Docker\resources\bin` | ✅ | Docker Compose version v5.0.2 |
| gh | `C:\Program Files\GitHub CLI` | ❌ | — |
| code | `C:\Users\10000\AppData\Local\Programs\Microsoft VS Code\bin` | ❌ | — |
| node | `C:\Program Files\nodejs` | ✅ | v25.7.0 |
| python | `C:\Users\super\AppData\Local\Programs\Python\Python311` | ✅ | Python 3.14.3 |
| git | `C:\Program Files\Git\cmd` | ✅ | git version 2.53.0.windows.1 |
| go | `C:\Program Files\Go\bin` | ✅ | go version go1.26.0 windows/amd64 |
| nvidia-smi | `C:\Windows\System32` | ✅ | NVIDIA-SMI version  : 591.86 |
| wsl | `C:\Windows\System32` | ✅ | — |
| ssh | `C:\Windows\System32\OpenSSH` | ✅ | — |
| curl | `C:\Windows\System32` | ✅ | — |

## ⚠️ Installed but NOT in PATH
- **gh** → `C:\Program Files\GitHub CLI`
- **code** → `C:\Users\10000\AppData\Local\Programs\Microsoft VS Code\bin`

## Recommendations
🟡 **WARNING**: 7 PATH entries point to non-existent directories
   → Remove invalid PATH entries to speed up command resolution
🔵 **INFO**: 1 duplicate PATH entries found
   → Deduplicate PATH for cleaner environment
🔴 **CRITICAL**: 2 installed tool(s) not in PATH: gh, code
   → Add missing directories to PATH
🔴 **CRITICAL**: PRZ-required tools not found: gcloud
   → Install missing tools for full PRZ-OS functionality

## Fixes Applied
✅ Add gh (C:\Program Files\GitHub CLI) to User PATH
✅ Add code (C:\Users\10000\AppData\Local\Programs\Microsoft VS Code\bin) to User PATH