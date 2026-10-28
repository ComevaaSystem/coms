# Changelog

## [0.3.0] - 2026-10-28

**Five skills join the loop, and the published ones catch up with seven weeks of client work.**

New: `figma-ads` builds the static ads in Figma from the creative brief (one Ad component
with Square, Story and Feed variants, the brand's variables and text styles, platform safe
zones, names that carry tracking down to the lead) and runs a mechanical proof before
delivery. `kit-components` and `kit-creatives` grow a validated `brand-kit` into a
component batch and into ads. `relecteur-fr` is the French copy review every text passes
before it ships. `playbook` is the method for building a tool with Claude: frame, build,
verify, ship, and the end-of-project routine that rewrites it.

Changed: `plan-media` now waits for validated axes, a dated annual budget and an offer
before writing anything, re-reads past decisions, and its deck fits in five visual pages.
`brief-creas` builds an axis only on a sourced fact, never re-proposes a proposition that
already failed, ships square and story for every concept, and tests the destination
before writing a call to action. `meta-ads` adds the dynamic versus classic creative
choice (never made alone), creative diversity, placements Meta takes back, sequenced
events, guards for agent-driven management, and what to refuse when Meta enables it by
default. Every skill lost its long dashes and its last references to internal tooling.

The scrub blocklist was extended before this release.

## [0.2.0] - 2026-09-11

**The whole loop ships, in French, as it runs on real accounts.**

Seven skills join `understand`: `plan-media` (the twelve-month media plan, with the
structure interview, the reading grid and the deck rules), the three platform
doctrines for 2026 (`meta-ads`, `google-ads`, `linkedin-ads`), the two creative
briefs (`brief-creas` for static concepts, `brief-ugc` for combinatorial scripts, each
with its mechanical quality control and its spreadsheet builder), and `brand-kit`
(the design interview that feeds the Figma plugin shipped in `tools/`).

They are published as they run for our clients, in French. Client names, real
figures and internal tooling references were removed by hand and the blocking scrub
verified the tree before this commit. `install.sh` links every skill into
`~/.claude/skills` in one command.

Next: `analyze` and `steer`.

## [0.1.0] - 2026-08-26

**The foundation: one skill that earns its place, and the machine that keeps client
data out.**

The first stage of the loop ships. `understand` runs the discovery interview a
senior paid consultant runs before touching any budget: bulk-first (let the person
tell the story, then file every sentence, then question only the holes), the
nine-section grid from who-signs to lead absorption, and the guardrails that were
paid for in real calls: the kill criterion asked at the start, the base rate before
any target, the hypothesis offered after the answer and never in its place, no
naked number commitments, data dependencies named out loud, and an oral restatement
before hanging up.

The method was not written from memory. It was mined from real recorded client
calls (one full kick-off, three steering calls, then a critical review of nineteen
transcripts across six accounts) and corrected by the consultant it encodes.

Also in this release: the blocking scrub. A CI gate refuses any commit carrying a
client name, a real figure, an ad account id, or a deliverable verbatim. The
blocklist itself is never committed. An empty blocklist fails the build: a
misconfigured gate must not pass green on nothing.

Next: the three platform doctrines (Meta, Google, LinkedIn), rewritten in English
from the private originals.
