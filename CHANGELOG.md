# Changelog

## 0.3.1 - 2026-06-02

### Fixed
- Made the Pi CLI discovery E2E test resolve Homebrew/npm-global symlinked installs on macOS by following the real `pi` binary path and falling back to `npm root -g`.
- Isolated installer E2E tests from real agent home environment variables so temp-home tests cannot write into configured Codex/Claude/Grok/Pi homes.

### Changed
- Added the direct npm global install command to the README release instructions.

### Verified
- Ran the full local macOS test, validation, E2E, and npm-pack install smoke suite on Darwin arm64 before publish.

## 0.3.0 - 2026-06-02

### Added
- Cross-harness frontend page/UI routing: prefer local Gemini CLI (`gemini`) and Agy CLI (`agy`) for frontend specialist work when installed, then fall back to the invoking harness itself when unavailable.
- Pi-specific frontend page/UI routing: when Google Gemini or Vercel AI Gateway credentials are present and a Gemini model is listed, launch frontend UI workers on Gemini-family models.
- Secret-safe Pi credential detection guidance for `google`, `vercel-ai-gateway`, `GEMINI_API_KEY`, and `AI_GATEWAY_API_KEY` without printing token values.
- Updated latest-model examples from official docs: `gpt-5.5` for strong GPT roles, `gpt-5.4-mini` for fast subagents, `gpt-5.3-codex-spark` for fast coding iteration, and Gemini examples such as `google/gemini-3.5-flash` and `google/gemini-3.1-pro-preview`.

### Changed
- Pi defaults now explicitly keep non-frontend workflow roles on GPT-family models and use Gemini only as a task-specific frontend page/UI override.
- Static validation and tests now cover Pi Gemini/AI Gateway frontend routing and secret-safety wording.

### Notes
- Model names remain editable examples; confirm availability with `pi --list-models` before pinning.
- No real global CLI config or auth file is mutated by the installer.

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
