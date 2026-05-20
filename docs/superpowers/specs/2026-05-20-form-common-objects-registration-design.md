# Form Common Objects Registration Design

## Context

After registering `childItems` in `packages/core/metadata/forms/index.ts`, form element YAML is no longer exported as raw `UsualGroup` XML. The next `round-trip-yaml` triage still shows raw `#text` leaking through other form-level and element-level properties:

- `События` stays as raw `Event` XML.
- `Команды` stays as raw `Command` XML, including raw `Title`, `ToolTip`, and `Picture`.
- `AdditionSource` inside search/view additions keeps raw XML shape.

The project already has side-effect registration modules for these types under `packages/core/metadata/forms/commonObjects/`. They are collected in `packages/core/metadata/forms/commonObjects/index.ts`, but `packages/core/metadata/forms/index.ts` currently imports only a hand-picked subset of common objects.

## Goal

Make the public forms entrypoint load all existing form common object registrations needed by XML, YAML, JSON schema, enterprise, and graph flows, so public CLI/API code gets the same behavior as tests that import individual common object modules directly.

## Non-Goals

- Do not add new fromXML/toXML/fromYAML/toYAML behavior.
- Do not change existing XML fixtures.
- Do not add a generic whitespace filter for `#text` as the primary fix.
- Do not change YAML naming contracts for form properties.

## Proposed Approach

Replace the manual common object import list in `packages/core/metadata/forms/index.ts` with a single side-effect import:

```ts
import "./commonObjects/index"
```

Keep `import "./elements"` in the forms entrypoint, because element registrations are a separate group. Remove the now-duplicated manual imports for `childItems`, `commandInterface`, and `formAttribute` after confirming `commonObjects/index.ts` imports them.

This follows the same registry pattern as the `childItems` fix, but moves the boundary from “remember every common object by hand” to “forms entrypoint owns all form common object registrations through the existing index file”.

## Regression Coverage

Add a public-entrypoint regression test in `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`.

The test should run an isolated Node process that imports `./index` for side effects, then uses `convertFormFromXML` on a temporary form containing:

- root form `Events`;
- form `Commands` with `Title`, `ToolTip`, `Picture`, `Action`, and `CurrentRowUse`;
- a table child item with a search/view addition that uses `AdditionSource`.

The assertions should verify that generated `Форма.yaml`:

- contains normalized `События` keys instead of raw `Event`;
- contains normalized `Команды` keyed by command name instead of raw `Command`;
- contains command `Заголовок`, `Подсказка`, and `Картинка` through `FormCommandRules`;
- does not contain raw `"#text"` under the covered form common object areas;
- does not contain raw `AdditionSource`, `Title:`, `ToolTip:`, or `Picture:` for the covered command/addition fields.

The first run before the import fix should fail on raw YAML shape. After the import fix, it should pass.

## Verification

Run the focused test:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts --no-isolate
```

Then run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected diagnostic result:

- import and sync both complete with `0 с ошибкой`;
- the first triage diffs are no longer caused by raw form common object YAML for `События`, `Команды`, or `AdditionSource`.

If diffs remain, classify them separately. Do not add unrelated whitespace filtering unless the remaining evidence shows a registered type still intentionally preserves whitespace-only text.

## Risks

`commonObjects/index.ts` imports more registrations than the current manual list. This is intended, but the focused public-entrypoint test must prove the behavior that motivated the change. Existing common object tests remain the guard for individual converters.

If duplicate registrations are not idempotent, importing `commonObjects/index.ts` plus any direct import elsewhere could expose registry overwrite behavior. The current codebase already imports registration modules in tests, so this risk should be verified through the focused test before broader round-trip diagnostics.
