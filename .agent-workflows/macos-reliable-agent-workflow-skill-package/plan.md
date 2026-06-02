# 适配本机 macOS；先在本机跑端到端验证，通过后再发布 reliable-agent-workflow skill/package

## Goal

适配本机 macOS；先在本机跑端到端验证，通过后再发布 reliable-agent-workflow skill/package

## Success Criteria

- Workflow artifact is durable and auditable.
- Approval gates are explicit before execution and release.
- Packets have matching results and structured plugin evidence.
- Verification records prove the final verdict.

## Detection

- Dynamic: yes
- Risk: high
- Signals: approval-risk, verification
- Required plugins: dynamic-workflow, task-gate

## Work Packets

- 01-orchestration: Restate goal, success criteria, constraints, risks, and packet boundaries.
- 02-implementation: Apply local edits or supervised execution after required approvals are granted.
- 03-integration: Integrate packet results, resolve conflicts, and reject stale or unsafe outputs.
- 04-verification: Run narrow-to-broad checks and produce a final evidence-backed verdict.

## Approval Gates

- plan: granted — Creating the local workflow artifact is safe and reversible.
- execute: pending — Execution can spawn helpers, mutate files, or consume external tools; explicit approval is required.
- release: pending — Release or final completion requires verification evidence.
