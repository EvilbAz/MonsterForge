# MonsterForge · Ember Corps

A buildless monster-sheet generator and hunt workspace, styled to match [The Ember Corps](https://evilbaz.github.io/TheEmberCorps/).

## Use

1. **Forge a monster:** pick tribe, threat, party XP and seed. Auto selections stay within coherent tribe pools. Forge parameters are applied together when you click **Forge monster**.
2. **Combat screen:** declare moves, copy declarations and dice expressions, record incoming damage, and advance Initiative Count. Future resolutions remain pending. Interrupts advance the manually editable next-action clock.
3. **Wounds & climbing:** track 20 IC openings, confirm earned permanent breaks, manage independent climber Control and status timers.
4. **Hunt preparation:** keep GM research clues and notes separate from a safe player announcement.
5. **Saved bestiary:** save profiles and full encounter state, import/export JSON, and share full GM sheet snapshots with a URL.

Everything runs in the visitor's browser. There are no accounts, server-side character records, analytics, or third-party API dependencies. Google Fonts are optional; system font fallbacks work when unavailable. Browser-local saves do not sync between devices. JSON exports are portable backups. Full-sheet share links include GM information; use the player announcement for public briefings.

## Rules and provenance

The generator ports `Ember_Corps_Monster_Forge_Playtest.xlsx` (9 October 2026), preserving its seven tribes, 24 bodies, six threat baselines, eight role modifiers, ten curated mutations, 120 moves/jutsu, fixed-seed selection and damage calibration.

The original `01-Adversary-Forge-Make-a-Copy-.xlsx` catalogs are preserved in `dist/legacy.json`: threat and role data, bodies, 12 minor / 18 major / 8 apex mutations, original role actions, hunt guidance and balance notes. These older HP, AP and mutation-tier rules are references rather than additions to the revised wild-monster profile.

`dist/data.js` contains the playtest catalogs and complete rules. `dist/engine.js` owns generation and chronological replay. No Excel runtime is required.

Source jutsu: Ember Corps Katon, Raiton, Suiton, Doton and Fuuton pages. Character-sheet declaration conventions were checked against the Ember Corps 1.1 sheet. Multi-Throw is an optional carried-weapon reference, retaining source Stamina rather than silently inventing a monster Exertion conversion. The sheet's +0.5 DB increment and the core prose's +0.25 are selectable because the source is inconsistent. Permissions and anatomy must be adjudicated by the GM.

All new wild-monster rules retain their **playtest** status. Inherited baselines are not independently proven balanced. The app shows deterministic stats and roll expressions; it does not roll dice or resolve opposed checks.

### Timing and automation

- Damage carries across six injury gates. One opening per hit; opening damage is not follow-up progress.
- Targeted open-wound hits apply +25% once after mitigation. Wounding-only modifiers affect opening and breaking, not gate damage.
- Wounds include their exact expiry IC, do not refresh on hit, and cannot earn expired breaks. Confirm earned breaks manually.
- Exertion is bounded to 0–10 with injury floors, a non-extending 10 IC collapse and recovery to 7.
- Jutsu resolve after their organ channel. Damage uses Attack Speed only. Next action includes channel + Attack Speed. Ordinary delays are part of Attack Speed.
- Capture requires exactly five gates, Exertion 8+, appropriate gear and restraint, continuous qualification, and a manual continuity confirmation after 10 IC.
- Conditional mutation traits, status severities, defense legality, forced movement, nonlethal outcomes, restraint escapes and inventory remain GM responsibilities.
- The next-action clock is editable. After undoing or aborting an action, review it manually. Climber Control adjustments resolve only after the actual opposed roll.

## Accessibility

Semantic landmarks and headings, labelled controls, keyboard navigation, a skip link, visible focus, text alongside state colors, light/dark themes, large-text mode, responsive layouts, reduced-motion support and print styles. Clipboard fallback provides selectable text. No image is needed to understand a mechanic.

Automated engine and interface smoke checks pass. Browser visual / screen-reader QA was not available in the authoring environment; perform those checks before treating the tool as formally accessibility-audited.

## Development

No install or build step is required. Serve `dist/` with any static web server. The application uses ES modules, so open it through HTTP rather than `file://`.

```sh
npm test
npm run check
```

## GitHub Pages

The workflow publishes `dist/` after pushes to `main`. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions** once. GitHub requires repository administration access for this initial Pages setting. The workflow can then deploy without a personal token. The site's relative assets support the `/MonsterForge/` project path.

The same static files can be hosted by any static hosting provider. Hosted preview metadata in the authoring checkout is separate from this public repository.
