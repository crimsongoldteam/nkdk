# XDTOTypeName YAML Design

## Context

`round-trip-yaml-1c` on `/home/nikita/git/round-trip/trade` fails during `ibcmd infobase config import`.
`nkdk import` and `nkdk sync` both complete successfully, but the generated XML without `--reference`
contains XDTO type names with prefixes that are not declared on the XML element.

Example from `WebServices/DMILService.xml`:

```xml
<XDTOReturningValueType xmlns:d6p1="http://www.1c.ru/dmil">d6p1:DMILResponse</XDTOReturningValueType>
```

After XML -> YAML -> XML without reference, the element becomes:

```xml
<XDTOReturningValueType>d6p1:DMILResponse</XDTOReturningValueType>
```

The `XDTOPackage/*/Package.bin` files are not the source of the change. They are copied through unchanged.
The loss happens in web service fields of type `XDTOTypeName`: `XDTOReturningValueType` and `XDTOValueType`.

## Problem

The current YAML value stores an XML lexical QName such as `d6p1:DMILResponse`.
That string is incomplete outside the XML element where it was read, because the prefix `d6p1`
is only meaningful together with its namespace declaration.

Current YAML:

```yaml
ТипВозвращаемогоЗначенияXDTO: d6p1:DMILResponse
```

This loses:

```text
d6p1 = http://www.1c.ru/dmil
```

The same prefix can point to different namespaces in different web service files, so it cannot be treated
as globally meaningful.

## Decision

Represent `XDTOTypeName` in YAML as an expanded name object:

```yaml
ТипВозвращаемогоЗначенияXDTO:
  ПространствоИмен: http://www.1c.ru/dmil
  Имя: DMILResponse
```

For parameters, use the same shape:

```yaml
ТипЗначенияXDTO:
  ПространствоИмен: http://www.1c.ru/dmil
  Имя: DMILRequest
```

The YAML contract no longer preserves XML prefixes such as `d6p1`, `d8p1`, `xs`, or `v8` as data.
The prefix is an XML serialization detail chosen during XML export.

## Standard Namespaces

Built-in XDTO names use the same object shape for consistency.

```yaml
ТипВозвращаемогоЗначенияXDTO:
  ПространствоИмен: http://www.w3.org/2001/XMLSchema
  Имя: string
```

```yaml
ТипВозвращаемогоЗначенияXDTO:
  ПространствоИмен: http://v8.1c.ru/8.1/data/core
  Имя: Structure
```

Known prefix mapping:

- `xs` -> `http://www.w3.org/2001/XMLSchema`
- `v8` -> `http://v8.1c.ru/8.1/data/core`

## XML Import

When importing XML:

1. If the value is an XML object with `#text` and an `xmlns:<prefix>` declaration, split `#text` into
   prefix and local name, then emit `{ namespace, name }` using the declaration.
2. If the value is a plain string with a known built-in prefix (`xs` or `v8`), emit the matching standard
   namespace and local name.
3. If the value is a plain string without a prefix, fail with a clear diagnostic. This design does not
   introduce an empty-namespace form for `XDTOTypeName`; it can be added later only with a concrete 1C XML
   example.
4. If the value uses an unknown prefix without a matching `xmlns` declaration, fail with a clear diagnostic
   instead of producing lossy YAML.

For reference XML import, preserving the original XML object is no longer required for these fields,
because the YAML/model value contains the semantic identity directly.

## YAML Export

`toYAML` exports `XDTOTypeName` as the expanded name object.

The object keys are:

- `ПространствоИмен`: namespace URI as a string.
- `Имя`: local XDTO type name as a string.

No XML prefix is emitted to YAML.

## YAML Import

`fromYAML` accepts the expanded name object and creates the model representation used by XML export.

Backward compatibility with the old string form is intentionally not part of the main contract. If migration
support is needed, it can be added as a temporary compatibility path only for known prefixes:

- `xs:*`
- `v8:*`

Unknown old values like `d6p1:*` cannot be safely migrated without the missing namespace, so they should
produce a clear error.

## XML Export

When exporting XML:

1. Use `xs` for `http://www.w3.org/2001/XMLSchema`.
2. Use `v8` for `http://v8.1c.ru/8.1/data/core`.
3. Use `d6p1` for other namespaces in `XDTOTypeName` fields.

Examples:

```xml
<XDTOReturningValueType>xs:string</XDTOReturningValueType>
```

```xml
<XDTOReturningValueType>v8:Structure</XDTOReturningValueType>
```

```xml
<XDTOReturningValueType xmlns:d6p1="http://www.1c.ru/dmil">d6p1:DMILResponse</XDTOReturningValueType>
```

The original prefix does not need to be restored. XML consumers, including 1C, care about the expanded
name: namespace plus local name.

## Scope

Change only the `XDTOTypeName` common object and the web service operation/parameter fields that use it:

- `ТипВозвращаемогоЗначенияXDTO`
- `ТипЗначенияXDTO`

Do not change `ПакетXDTO/Package.bin` handling. External XDTO package files remain copied as opaque files.

## Testing

Add focused tests for `XDTOTypeName` and web service operations:

- XML with `xmlns:d6p1` imports to `{ ПространствоИмен, Имя }`.
- YAML object exports to XML with an `xmlns` declaration for custom namespaces.
- Built-in `xs:string`, `xs:boolean`, `xs:int`, `xs:decimal`, `xs:base64Binary`, `xs:token`
  use the XML Schema namespace.
- Built-in `v8:Structure`, `v8:Array`, `v8:Map`, `v8:ValueStorage` use the v8 data/core namespace.
- Unknown prefix without an `xmlns` declaration fails with a useful message.
- Existing reference-based XML round-trip tests are updated to assert semantic equality rather than preserving
  a specific local prefix.

After implementation, run targeted tests first, then run `round-trip-yaml-1c` on `/home/nikita/git/round-trip/trade`.
Because this is a YAML contract change, run full `pnpm test` before closing the work.

## Consequences

This is a deliberate YAML contract change for `XDTOTypeName`.
Existing YAML files containing strings like `d6p1:DMILResponse` must be regenerated or migrated.
The benefit is that YAML stores the stable semantic value and XML export can generate valid XML without
depending on the original XML reference.
