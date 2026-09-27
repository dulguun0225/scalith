---
name: colon-space
description: This gate canary contains a colon then a space: which YAML reads as a nested mapping, not a string.
---

Gate canary: this fixture is not a skill. It exists so `npm run check:descriptions` can prove it still refuses an unquoted description containing ": " as a parse error. It is deliberately never placed under `skills/`.
