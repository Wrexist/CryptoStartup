# Lessons Learned

> **This file is maintained by Claude.** After completing any task, Claude should update this file with discoveries, gotchas, and patterns learned. This prevents repeating mistakes and builds project knowledge over time.

Review this at the start of each session.

## Architecture Gotchas
<!-- Patterns around GameContext, provider ordering, tick system, state refs -->

## Type System Notes
<!-- TS strict mode catches, path alias issues, etc. -->

## Common Mistakes
<!-- Things that have been corrected more than once -->

## Platform Differences
<!-- Web vs iOS vs Android behavior differences (haptics, animations, safe area, etc.) -->

## Performance Notes
<!-- Rendering, tick loop, memory, bundle size discoveries -->

## Entries

*(No entries yet. This file accumulates lessons as corrections happen.)*

<!-- Example entry:
### 2026-02-28 — Haptics crash on web
- **What happened**: Added Haptics.impactAsync without platform check, crashed on web.
- **Pattern to watch for**: Any new button/pressable that adds haptic feedback.
- **Rule going forward**: Always wrap Haptics in `if (Platform.OS !== 'web')`.
-->
