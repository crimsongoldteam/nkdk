# Font raw StyleItem ref toXML design

## Context

`acc` passes `XML -> YAML` and `YAML -> XML`, but loading generated XML into 1C fails on:

`CommonForms/ВводДанныхДляРасчетаСреднегоЗаработкаОбщий/Ext/Form.xml`

The source XML contains:

```xml
<Font ref="0" height="10" kind="StyleItem"/>
```

The generated XML currently contains:

```xml
<Font ref="style:0" height="10" kind="StyleItem"/>
```

1C rejects `style:0` as invalid `StyleRef`. The YAML representation is already intentional and documented:

```yaml
Шрифт:
  Вид: ЭлементСтиля
  Значение: "0"
  Размер: 10
```

This means the issue is not the YAML contract. The issue is `Font` XML export adding the `style:` prefix to a raw style ref.

## Goal

Preserve raw `Font` refs that are represented in YAML as `Вид + Значение`, so `ref="0"` round-trips back to `ref="0"` instead of `ref="style:0"`.

## Design

Extend the internal `Font` model with an explicit raw-ref marker for refs that must be emitted unchanged.

- `fromXML` imports `kind="StyleItem" ref="0"` as `ref: "0"` and marks it as raw.
- `toYAML` keeps the current YAML contract: `Вид: ЭлементСтиля`, `Значение: "0"`.
- `fromYAML` restores the raw marker when it sees `Вид: ЭлементСтиля` with `Значение`.
- `toXML` emits raw refs unchanged when the marker is present.
- Normal named style refs keep existing behavior:
  - built-in style fonts export as `style:NormalTextFont`;
  - project style refs from `Вид: ЭлементСтиля.Имя` export as `style:Имя`.

## Error Handling

The change does not try to validate whether `0` is semantically correct. It preserves the source XML value because the XML repository is the reference for this diagnostic path.

If a user manually writes `Вид: ЭлементСтиля` and `Значение: "SomeRawValue"`, `toXML` will emit `ref="SomeRawValue"` unchanged. This is consistent with treating `Значение` as raw XML ref for this shape.

## Tests

Add focused tests for `Font`:

- `fromXML` imports `<Font ref="0" height="10" kind="StyleItem"/>` with the raw marker.
- `toYAML` exports it as `Вид: ЭлементСтиля`, `Значение: "0"`, `Размер: 10`.
- `fromYAML` restores the raw marker from that YAML shape.
- `toXML` emits `<Font ref="0" height="10" kind="StyleItem"/>`.
- Existing tests for built-in style fonts and project style refs must keep passing.

After implementation, rerun:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/font
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'env NKDK_XML_REPO=/home/codexwsl/round-trip NKDK_XML_DIR=/home/codexwsl/round-trip/acc NKDK_ROUND_TRIP_YAML_DIR=/tmp/round-trip-yaml-1c NKDK_1C_DATA=/tmp/round-trip-yaml-1c-base NKDK_1C_DB_PATH=/tmp/round-trip-yaml-1c-base NKDK_1C_IBCMD=/opt/1cv8/x86_64/8.3.27.2214/ibcmd ./.agents/skills/round-trip-yaml-1c/round-trip.sh'
pnpm test
```

## Non-Goals

- Do not change the YAML shape for raw font refs.
- Do not rewrite XML fixtures.
- Do not normalize `ref="0"` to a named style item.
- Do not change `Color` or `Border` behavior in this task.
