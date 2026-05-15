# Round-trip: TypeDescription Namespace Prefix

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found a diff in:

- `DataProcessors/ОценкаПроизводительности.xml`
- active XML directory: `/Users/nikita/git/round-trip-source/acc`

The generated XML changes the local namespace prefix for the same type:

```diff
-<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>
+<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart" xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>
```

The namespace URI is unchanged: `http://v8.1c.ru/8.2/data/chart`. Only the prefix changes from `d7p1` to the canonical `d5p1` stored in `TypeDescriptionRules`.

## Current Behavior

`importTypeDescriptionFromXML` normalizes prefixed XML values into semantic model values:

```ts
d7p1:Chart -> { type: ["Chart"] }
```

`exportTypeDescriptionToXML` then reconstructs XML from `TypeDescriptionRules`:

```ts
Chart -> d5p1:Chart
```

This is correct for new model/YAML output, but it is not enough for byte round-trip with an XML reference.

## Decision

For XML round-trip, `TypeDescription` export should preserve the type XML representation from `referenceMetadata` when the reference type and the model type are semantically the same.

Preservation should happen only when all of these hold:

- the model type resolves to the same type name as the reference (`Chart`);
- the reference namespace URI matches the known namespace for that type;
- the reference has a concrete `v8:Type` / `v8:TypeSet` XML item that can be reused safely.

For new model/YAML output without `referenceMetadata`, keep the current canonical export behavior from `TypeDescriptionRules`.

Do not store XML prefix details in the public model or YAML shape.

## Proposed Approach

1. Extend `exportTypeDescriptionToXML` to accept and inspect `referenceMetadata`.

2. When exporting each `v8:Type` or `v8:TypeSet`, try to find the corresponding reference XML item by semantic type:
   - parse the reference item text, e.g. `d7p1:Chart`;
   - resolve the prefix to its namespace from the same XML item, e.g. `_xmlns:d7p1`;
   - compare namespace with the namespace configured for the model type.

3. If the semantic type and namespace match, reuse the reference XML item as-is. This keeps both:
   - `#text: "d7p1:Chart"`;
   - `_xmlns:d7p1: "http://v8.1c.ru/8.2/data/chart"`.

4. If there is no safe matching reference item, fall back to current canonical export:
   - `Chart -> d5p1:Chart`;
   - add `xmlns:d5p1` when current rules require local namespace declaration.

## Tests To Add Later

1. Reference-preserve test:
   - import or build reference XML with `<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>`;
   - export model `{ type: ["Chart"] }` with that reference;
   - result keeps `d7p1:Chart` and does not add `xmlns:d5p1`.

2. Canonical export test:
   - export `{ type: ["Chart"] }` without reference;
   - result remains canonical according to `TypeDescriptionRules`.

3. Mismatch safety test:
   - reference type text or namespace does not match the model type;
   - export ignores the reference and uses canonical output.

## Non-goals

- Do not change the canonical prefix for chart types from `d5p1`.
- Do not add prefix or namespace fields to `TypeDescription`.
- Do not change YAML representation.
- Do not implement the fix as part of this brainstorming pass.
