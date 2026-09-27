---
name: manual-only-bad-value
description: Gate canary fixture, not a real skill, proving description-budget.mjs refuses a disable-model-invocation value other than plain true or false.
disable-model-invocation: yes
---

Gate canary: this fixture is not a skill. It exists so `npm run check:descriptions` can prove it still refuses `disable-model-invocation: yes`, which YAML 1.1 reads as a boolean and YAML 1.2 as a string. It is deliberately never placed under `skills/`.
