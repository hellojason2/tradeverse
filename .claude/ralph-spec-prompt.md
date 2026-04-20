You are in a Ralph Spec Loop — an autonomous build pipeline for Tradeverse 2.0. Each iteration, advance the project ONE meaningful step forward.

## Core Loop

1. Read `.claude/ralph-state.md` — check the `phase` field in frontmatter
2. Execute the matching phase logic below
3. Update `.claude/ralph-state.md` with your progress before finishing
4. When the product is fully delivered and working: output `\u003cpromise\u003eSPEC COMPLETE\u003c/promise\u003e`

IMPORTANT: Do NOT touch `.claude/ralph-loop.local.md` frontmatter — the stop hook owns that file's YAML. Only read/write `.claude/ralph-state.md` and `.claude/ralph-spec.md`.

## Phase: RESEARCH

This phase should already be complete (CopyPro API, design system, 48 units are documented). 

Your job: verify nothing is missing before building.
- Check that `docs/external/copypro-api-documentation.md` exists and has content
- Check that `design.md` exists and references Inter + Instrument Serif + JetBrains Mono
- Check that `.claude/TASKS.md` has 48 units with What, Files, Test, DependsOn
- Check that `.agents/skills/tradeverse-dev-standards/SKILL.md` exists

If any critical doc is missing, rebuild it. If all exist, update frontmatter to `phase: PLAN`.

## Phase: PLAN

Verify the build plan is solid:
1. Read `.claude/TASKS.md` Waves 1-6 table
2. Confirm every unit has:
   - **What**: One sentence description
   - **Files**: Exact file paths
   - **Test**: One shell command or curl that returns 0/200 on success
   - **DependsOn**: Which earlier units must be PASSED first
3. Ensure no circular dependencies exist
4. Initialize the Unit Status table in `ralph-state.md` if not already present
5. Set frontmatter: `phase: BUILD`, `current_wave: 1`, `total_units: 48`, `iteration: 0`

## Phase: BUILD (Wave-Based Execution)

Read `.claude/ralph-state.md` to get `current_wave`. Read `.claude/TASKS.md` to see which units belong to that wave.

### Wave Execution Rules
- A unit is **ready** when:
  1. It belongs to the current wave or an earlier wave
  2. Its status is PENDING
  3. ALL its `DependsOn` units are PASSED
- Pick ONE ready unit (lowest group letter + number is a good heuristic).
- Build it:
  1. Read all relevant source docs (see `ralph-spec.md` Source Documents table)
  2. Write the code (create/modify files listed in the unit spec)
  3. Run the test command
  4. If PASS: mark unit PASSED in `ralph-state.md`, increment iteration
  5. If FAIL: classify the error and respond:
     - **Syntax error** → fix immediately in this iteration
     - **Missing package** → install it, update Research Findings
     - **Design flaw** → re-spec this unit in your mind, retry
     - **Knowledge gap** → read the relevant doc in `docs/external/`, retry
     - **Environment issue** → fix the environment (start Postgres, etc.)

### Wave Advancement
- When ALL units in the current wave are PASSED (or were already PASSED from earlier), advance `current_wave` by 1.
- If `current_wave` > 6, set `phase: INTEGRATE`.

### Error Handling
- Before retrying, ALWAYS read the Error Log in `ralph-state.md`. Never try the same approach twice.
- Increment the Attempts column on every retry.
- After 3 failed attempts on one unit, mark it BLOCKED and move to the next ready unit.
- If 3+ units are BLOCKED, go back to `phase: PLAN` and re-decompose those units.

### Parallel Agent Note
If you are part of a multi-agent orchestration, each agent picks a different ready unit from the same wave. Since units in a wave are designed to be independent (no cross-dependencies within the same wave), agents do not conflict. After finishing your unit, update `ralph-state.md` and exit so the orchestrator can dispatch the next batch.

## Phase: INTEGRATE

Wire all units together:
1. Ensure `docker-compose.yml` starts Postgres + backend together
2. Run the Wave 6 integration test (H6): full flow end-to-end
3. Verify frontend can hit backend on the expected port
4. Run `npm run build` in both `api/` and `app/` to confirm no TypeScript errors

If PASS: set `phase: DELIVER`
If FAIL: identify which unit's interface is wrong, go back to `BUILD` for that unit

## Phase: DELIVER

1. Verify everything starts with one command (`docker compose up --build`)
2. Write `README.md`:
   - What was built
   - Quick start (one command)
   - Step-by-step usage guide
   - Environment variables, ports, URLs
3. Update the Delivery section of `ralph-state.md`
4. Output: `\u003cpromise\u003eSPEC COMPLETE\u003c/promise\u003e`

## The "Figure It Out" Rule

**NEVER ask the human. NEVER stop unless the product is delivered or iterations are exhausted.**

When you hit an obstacle:
- Unknown library → Read local docs in `docs/external/` or `docs/blueprint/`
- Missing package → Install it (npm install)
- Missing tool → Download it (brew install, curl, apt-get)
- Don't know the approach → Read `ralph-spec.md` or the dev standards SKILL
- Unclear spec detail → Make a reasonable assumption, document it in Research Findings
- Need credentials → Use `.env.example` with placeholders, document in README
- Service not running → Start it (docker compose up)
- Permission error → Fix permissions

The only valid stops: `\u003cpromise\u003eSPEC COMPLETE\u003c/promise\u003e`, max iterations hit, or a physically impossible dependency (document it and skip the unit).

## Rules

- ONE meaningful step per iteration. Don't try to do everything at once.
- Read the Error Log before every BUILD attempt. Never repeat a failed approach.
- Update `ralph-state.md` at the END of every iteration, not the beginning.
- Keep Research Findings under 30 bullet points. Summarize, don't dump.
- Keep Error Log entries concise: iteration number, unit, error summary, what you tried, outcome.
- NEVER ask the human a question. NEVER output a question and wait. Figure it out yourself.
- ALWAYS read `.agents/skills/tradeverse-dev-standards/SKILL.md` before writing backend code.
- ALWAYS read `design.md` before writing frontend code.
