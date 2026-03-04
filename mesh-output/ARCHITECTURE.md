# Health Service Architecture

## Overview
HTTP service exposing health, circuit breaker, and priority queue endpoints.
AIDA-2026 compliant, deployed to `northamerica-northeast1`.

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Service health + circuit state |
| GET | /circuit | Circuit breaker details |
| POST | /queue | Enqueue priority message |
| GET | /queue/status | Queue depth and stats |
| GET | /metrics | Prometheus-compatible metrics |

## Data Flow
```
Request → Priority Lane Queue → Circuit Breaker → Handler → Response
                                      ↓
                              (if OPEN) → Graceful Degradation
```

## Compliance
- Region locked: `northamerica-northeast1`
- WORM logging enabled
- All responses include `X-Request-Id` header
