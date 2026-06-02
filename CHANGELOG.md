# Changelog

## 0.2.0 - 2026-06-02

### Added
- Role-specific model routing guidance for the reliable workflow.
- Editable GPT-series presets for scouts, researchers, designers, workers, reviewers, verifiers, security/oracle roles, and Best-of-N candidates.
- Harness-specific configuration examples for Codex, Claude Code, Pi/pi-subagents, and Grok.
- One-command upgrade instructions in the README.

### Changed
- Validation now checks that model-routing guidance remains present in `SKILL.md`.

### Notes
- The release does not mutate real global CLI configuration; users copy the provided snippets into their own harness settings when desired.
- GPT-series model names are examples and should be verified against the user's available provider/model list.
