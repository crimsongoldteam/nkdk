# Border Width YAML Undefined Design

## Problem

ERP validation reports seven JSON Schema errors `Expected number` in:

`Обработка/ПанельАдминистрированияУХ/Формы/Казначейство/Форма.yaml`

All seven point to the same shape:

```yaml
Рамка:
  Имя: ЭлементСтиля.ControlBorder
  Ширина:
```

The source is generated YAML, not hand-written input. `Border.width` is absent in the model, but `exportBorderToYAML` currently creates `Ширина: data.width`, which leaves an explicit key with `undefined`. YAML serializes that as an empty value, then JSON Schema rejects it because `Ширина` must be a number.

## Decision

Use the same semantics as XML export: an absent border width means the width is not specified and must not be emitted.

`exportBorderToYAML` should build `BorderYAML` incrementally:

- add `Имя` only when `data.ref !== undefined`;
- add `Ширина` only when `data.width !== undefined`;
- add `ТипРамки` only when the system enumeration exporter returns a value.

`fromYAML` remains strict. A hand-written empty `Ширина:` is still invalid YAML for `Border`, because it is neither a number nor an intentional representation of an absent value.

## Test Coverage

Add a `Border` fixture for a style-only border:

```xml
<Border ref="style:TestBorder"/>
```

Expected internal model:

```ts
{ ref: "TestBorder" }
```

Expected YAML:

```yaml
Имя: ЭлементСтиля.TestBorder
```

Coverage should follow the existing `Border` test style:

- `fromXML`: XML style ref imports to `{ ref: "TestBorder" }`;
- `toXML`: `{ ref: "TestBorder" }` exports to `<Border ref="style:TestBorder"/>`;
- XML round-trip preserves the exact style-only border;
- `fromYAML`: `{ Имя: "ЭлементСтиля.TestBorder" }` imports to `{ ref: "TestBorder" }`;
- `toYAML`: `{ ref: "TestBorder" }` exports without `Ширина`;
- existing `{ ref, width }` behavior still exports numeric `Ширина`.

## Validation

After implementation:

1. Run focused `Border` tests.
2. Re-import ERP XML to YAML.
3. Run CLI validation for `Обработка/ПанельАдминистрированияУХ/Формы/Казначейство/Форма.yaml`.
4. Confirm the seven `Expected number` errors disappear.
5. Run `pnpm test` from the repository root before closing the task.

## Out Of Scope

- Do not relax JSON Schema to allow `null` for `Рамка.Ширина`.
- Do not coerce empty width to `0`.
- Do not change unrelated numeric YAML fields.
