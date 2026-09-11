# COMS

**Comevaa Open Marketing System.**

> Turn paid media into a measurable pipeline channel.

The complete method of a senior paid acquisition consultant, packaged as Claude Code
skills. Not another pile of generic marketing prompts: one channel, in depth, with
the numeric thresholds, the arbitrages, and the discipline that agencies charge for
and never publish.

Built for lead generation, where the loop does not close at the click or the ROAS:
it closes in the CRM, at the cost per qualified stage, and that signal goes back to
the platforms.

## Who this is for

Anyone who runs paid acquisition seriously with Claude Code at hand: a consultant
managing accounts, an in-house marketer, a founder running their own budget. The
skills never assume which one you are. They talk about "the business", whether it is
yours or one you manage.

## The loop

Six stages. Each one is a skill, each output feeds the next, and the last one feeds
back into the first.

```
understand -> plan-media -> meta-ads / google-ads / linkedin-ads
     ^                                                  |
     |                                           brief-creas / brief-ugc
     |                                              (brand-kit alongside)
     +---------------- steer <---- analyze <------------+
        (the CRM signal, cost per qualified stage, re-feeds the plan)
```

| Stage | Skill | What it does |
|---|---|---|
| 1. Understand | `understand` | The discovery interview a senior consultant runs before touching any budget. Run this first. |
| 2. Plan | `plan-media` | From the business map to a media plan: generic vs focus, dispatch, budget as a setting, not a headline. |
| 3. Platform | `meta-ads`, `google-ads`, `linkedin-ads` | The 2026 doctrine of each platform: structures, data thresholds, bidding, measurement. |
| 4. Create | `brief-creas`, `brief-ugc`, `brand-kit` | From validated angles to shoot-ready briefs: static concepts for a designer, combinatorial UGC scripts for a founder on camera. `brand-kit` runs the design interview that feeds the Figma plugin in `tools/`. |
| 5. Analyze | `analyze` (next) | Read the accounts after launch: platforms never added together, cost per CRM stage, never conclude on a stopped campaign. |
| 6. Steer | `steer` (next) | The weekly ritual: pre-call brief, decisions restated, commitments tracked, work narrated. The client's perception of the work is the leads AND what you tell them. |

## Quick start

```bash
git clone https://github.com/ComevaaSystem/coms ~/coms && ~/coms/install.sh
```

`install.sh` links each skill into `~/.claude/skills`. Then open Claude Code and
type `/understand` on your own business. Twenty minutes of interview, and you will
know whether this system is for you.

The skills are written in French, as they run for our clients (`brand-kit` is in
English). They run the conversation in your language.

## Why this exists

Every existing option gives you half the job:

| | What they have | What they lack |
|---|---|---|
| Generic marketing skill packs | Breadth, easy install | No doctrine, no thresholds, "write ad copy" |
| B2B attribution SaaS | Serious closed-loop measurement | 1000+ EUR/month, the tool without the method |
| Agencies | The thresholds, the experience | All of it kept private, none of it installable |

COMS takes the empty lane: the complete doctrine of one channel, from a
practitioner, with the closed loop ads-to-CRM built from what the business already
has (forms, UTMs, a CRM), no extra tool required.

## Where the method comes from

Real client work, continuously. The skills encode what actually happened on managed
accounts: the mistakes paid for in real budgets, the thresholds measured before
being written down, the interview patterns mined from real recorded calls. A
blocking scrub runs in CI: no client name, figure, or deliverable ever ships. What
ships is the method, always anonymized, never invented.

Releases follow the client work. Each changelog entry tells what that work taught,
and what changed in the skills because of it.

## Status

Version 0.2.0. Eight skills are live: `understand`, `plan-media`, `meta-ads`,
`google-ads`, `linkedin-ads`, `brief-creas`, `brief-ugc`, `brand-kit`. `analyze` and
`steer` come next.

## License

MIT. The knowledge is public. The state (account memory, history, automations) is a
product, and lives elsewhere.
