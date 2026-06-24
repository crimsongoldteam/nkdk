# Fix Form ChildItems YAML Registration

## Context

After `unified-form-yaml`, full XML -> YAML -> XML round-trip on `acc` no longer fails on import, but produces many diffs in `Forms/*/Ext/Form.xml`. The first diffs are formatting-only: extra blank lines and shifted closing tags inside form XML.

Inspection of the generated `Форма.yaml` shows that form child items are exported in a raw XML-like structure:

```yaml
Элементы:
  - UsualGroup:
      Title:
        v8:item:
          v8:lang: ru
          v8:content: Быстрые отборы
          "#text": "\n\t\t\t..."
```

This bypasses the intended form element rules. In the correct YAML path, `GroupChildItems` should export each element through its registered element rule, so `Title` and `ToolTip` go through `I8nText` and become concise YAML values.

## Root Cause

The `GroupChildItems`, `CommandBarChildItems`, `TableChildItems`, and `PagesChildItems` type handlers exist in `packages/core/metadata/forms/commonObjects/childItems/`, but the form side-effect entrypoint does not import them.

As a result, the generic property orchestration does not find `exportToYAML` for `GroupChildItems`. It falls back to serializing the raw imported XML object. Since XML import preserves whitespace text nodes, the raw object contains whitespace-only `#text` entries, and those entries are then emitted into YAML and later back into XML.

## Chosen Approach

Restore the missing `childItems` registrations from `packages/core/metadata/forms/index.ts`:

- `commonObjects/childItems/fromXML`
- `commonObjects/childItems/toYAML`
- `commonObjects/childItems/fromYAML`
- `commonObjects/childItems/toXML`

This fixes the source of the problem: child items are handled as form elements again, and nested properties such as `Title` use their existing `I8nText` rules.

## Alternatives Considered

Filtering whitespace-only `#text` during form YAML export would remove the visible noise, but form elements would still be exported in the wrong raw shape.

Ignoring whitespace-only `#text` during XML export would reduce XML diffs, but would mask the broken `GroupChildItems` registration and leave `Форма.yaml` incorrect.

## Implementation Notes

Add a regression test at the CLI or form conversion level using a small form XML with a `UsualGroup` title. The test should prove that generated `Форма.yaml`:

- contains the human-readable element tree shape;
- contains `Заголовок: Быстрые отборы`;
- does not contain `"#text"` under `Элементы`.

The test should not modify existing XML fixtures.

## Verification

Run a focused test for the new regression.

Then run a focused import/sync check on one affected form or the existing `round-trip-yaml` triage command to confirm the first formatting diffs no longer come from raw `#text` in form child items.

Do not treat a remaining form diff as failure by itself: restoring child item rules may reveal real YAML round-trip gaps that were hidden behind the raw export path.
