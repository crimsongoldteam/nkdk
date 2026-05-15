# Round-trip: Form Attribute Settings Fragment

## Context

Short XML round-trip shows form attributes with `Settings` being changed to an empty
`v8:TypeDescription`.

One important case is `GanttChart`:

```xml
<Attribute name="ДиаграммаГанта" id="1">
  <Type>
    <v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:GanttChart</v8:Type>
  </Type>
  <Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/chart" xsi:type="d4p1:GanttChart">
    <d4p1:chart>
      ...
    </d4p1:chart>
  </Settings>
</Attribute>
```

Current form attribute settings support:

- `DynamicList`;
- `Chart`;
- `SpreadsheetDocument`;
- `Planner`;
- `v8:TypeDescription` through `valueType`.

`GanttChart` is not registered as a settings fragment. During reference import, the importer notices
that `Settings` exists, but does not import the actual fragment. Export then preserves only the fact
that `Settings` came from XML and emits:

```xml
<Settings xsi:type="v8:TypeDescription"/>
```

There is a related issue inside `Chart`, `Planner`, and `GanttChart` fragments: XML can contain
nil leaf nodes:

```xml
<pl:value xsi:nil="true"/>
<d4p1:valInfo xsi:nil="true"/>
<d4p1:details xsi:nil="true"/>
```

The common XML importer currently ignores the `xsi:nil` attribute, so these nodes collapse to the
same model shape as empty tags. Export cannot distinguish:

```xml
<pl:value xsi:nil="true"/>
```

from:

```xml
<pl:value/>
```

## Decision

Treat `GanttChart` as a first-class form attribute settings fragment, following the existing
`Chart`, `Planner`, and `SpreadsheetDocument` pattern.

Also preserve `xsi:nil="true"` inside all settings fragments. These fragments are intentionally raw:
their job is not to understand chart or planner semantics, but to keep the XML subtree stable through
XML -> model -> XML and YAML -> model -> XML.

## Model And YAML Shape

Add a model property:

```ts
ganttChart?: GanttChart
```

Use a YAML field:

```yaml
ДиаграммаГанта: |
  <d4p1:chart>...</d4p1:chart>
```

This mirrors the existing string YAML shape for:

- `Диаграмма`;
- `ТабличныйДокумент`;
- `Планировщик`.

Nil nodes inside the raw fragment should be representable in the model as a small explicit marker,
for example:

```ts
{ "_xsi:nil": true }
```

YAML export should keep the XML-looking string with `xsi:nil="true"` rather than inventing a special
YAML syntax for nil leaves.

## Proposed Approach

1. Add `forms/commonObjects/ganttChart/types.ts`:
   - reuse `registerSettingsFragmentType`;
   - canonical attributes:
     - `_xmlns:d4p1: "http://v8.1c.ru/8.2/data/chart"`;
     - `_xsi:type: "d4p1:GanttChart"`;
   - match `d4p1:GanttChart` and any namespace prefix ending with `:GanttChart`.

2. Extend `FormAttributeRules`:
   - add `ganttChart` with `type: "GanttChart"`;
   - use `xml: "Settings"`;
   - use `yaml: "ДиаграммаГанта"`;
   - keep direct rule import/export disabled if typed settings are routed through
     `formAttribute/settings.ts`, matching `chart`, `planner`, and `spreadsheetDocument`.

3. Extend `formAttribute/settings.ts`:
   - import and export `GanttChart`;
   - detect `Settings xsi:type="...:GanttChart"`;
   - export priority should remain deterministic and should not let `valueType` replace a populated
     typed settings fragment.

4. Extend `FormAttributeXML`, `FormAttributeYAML`, and model typing so `GanttChart` is part of the
   typed settings union.

5. Update `SettingsFragment` import/export:
   - do not drop `xsi:nil` under settings fragments;
   - normalize nil leaf nodes to a stable marker in the raw object;
   - export the marker back as `xsi:nil="true"`;
   - keep ordinary empty tags as empty tags.

6. Keep this nil preservation local to raw settings fragments unless there is an existing shared XML
   helper that can support it without changing unrelated metadata behavior.

## Tests To Add Later

1. `GanttChart` form attribute import:
   - XML with `Settings xsi:type="d4p1:GanttChart"` maps to `ganttChart`;
   - it does not map to `valueType`.

2. `GanttChart` form attribute export:
   - populated `ganttChart` exports as `Settings xsi:type="d4p1:GanttChart"`;
   - it preserves the nested chart fragment.

3. Nil preservation inside settings fragments:
   - `pl:value xsi:nil="true"` survives Planner import/export;
   - `d4p1:valInfo xsi:nil="true"` survives Chart import/export;
   - ordinary empty tags like `<d4p1:text/>` remain empty tags.

4. YAML round-trip:
   - `ДиаграммаГанта` uses the same raw XML string style as `Диаграмма`;
   - nil markers export back into that string as `xsi:nil="true"`.

## Non-goals

- Do not model the full internal schema of Chart, Planner, or GanttChart.
- Do not change `DynamicList` settings behavior.
- Do not treat every unknown `Settings xsi:type` as supported in this pass.
- Do not implement the fix as part of this brainstorming pass.
