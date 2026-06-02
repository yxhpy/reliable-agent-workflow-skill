# Orchestration: 适配本机 macOS；先在本机跑端到端验证，通过后再发布 reliable-agent-workflow skill/package

## Execution Rules

- Keep the owner agent responsible for local edits, verification, commits, and final claims.
- Use helpers only for their bounded routes and record structured evidence.
- If a real subagent runner is unavailable, execute packets serially in simulated-packet mode.
- Stop at pending approval gates; continue only with safe read-only planning.
- Integrate packet results explicitly before final verification.

## Packet Order

1. 01-orchestration (owner-plan) depends on none
1. 02-implementation (owner-implementation) depends on 01-orchestration
1. 03-integration (owner-integration) depends on 02-implementation
1. 04-verification (owner-verification) depends on 03-integration
