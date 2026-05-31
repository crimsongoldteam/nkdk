# External Data Source Reference Children Design

## Context

`round-trip-yaml` stops during `nkdk import` on `MetadataExternalDataSource "ВнешнийИсточникДанныхВсеСвойства"`.

The parent XML may store external data source child objects as reference strings:

```xml
<ChildObjects>
  <Table>ТаблицаВсеСвойства</Table>
</ChildObjects>
```

The full child object is stored in a separate XML file such as `Tables/ТаблицаВсеСвойства.xml`.

The current `childCollections` traversal expects XML-imported collection items to be objects with a `name` property. When it receives a string, it cannot derive the item name and later YAML export receives the string where it expects an object.

## Goal

Fix only this import blocker: string reference children in `childCollections` should be treated as child object names and enriched from their separate XML files.

Do not fix later round-trip diffs in this change.

## Design

Normalize `childCollections` items in `convertAppliedObjectFromXML`:

- If the collection item is an object, keep the existing behavior and read `item.name`.
- If the collection item is a string, treat it as `{ name: item }`.
- Use the normalized name to resolve existing `xmlDir` paths like `Tables/${name}.xml`, `Cubes/${name}.xml`, and dimension table paths.
- When `fileItemRule` reads the separate XML file, merge the parsed child model into the normalized object.

This keeps the model object-shaped for YAML while preserving the XML reference form as the source of the child name.

## Scope

In scope:

- General `childCollections` normalization for string items.
- A focused regression test for `MetadataExternalDataSource` with `<Table>Имя</Table>` in the parent XML and a separate `Tables/Имя.xml` file.
- Verification that import no longer throws for this case and YAML contains the table as an object.

Out of scope:

- New `fromXML` / `toXML` / `fromYAML` / `toYAML` rules.
- XML fixture rewrites.
- Fixing the next `round-trip-yaml` diff after this import blocker.
- Full `pnpm test` during design; implementation verification will choose focused tests first.

## Error Handling

If a string child reference points to a missing separate XML file, keep current behavior as much as possible: the normalized `{ name }` item remains available, and existing file checks decide whether additional data can be merged.

If a non-string primitive appears in a child collection, skip it as invalid input rather than inventing a name.

## Tests

Add or extend a focused import/convert test near `metadataExternalDataSource`:

- Parent XML contains `ChildObjects/Table` as a string reference.
- `Tables/<name>.xml` contains the full table XML.
- Conversion to YAML succeeds.
- YAML output contains `Таблицы: <name>:` with table properties loaded from the separate file.

The implementation should also rerun the original `round-trip-yaml` command far enough to confirm this import blocker is gone, without trying to classify or fix later diffs.
