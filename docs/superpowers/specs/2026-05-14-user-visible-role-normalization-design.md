# UserVisible Role Normalization Design

## Context

Short round-trip XML found that `UserVisible` changes XML attributes like:

- `name="b1d9c8b4-d05c-45c7-8db2-abc84e597700"` to `name="Role.b1d9c8b4-d05c-45c7-8db2-abc84e597700"`;
- `name="Role.ПолныеПрава"` should remain a platform-style reference.

Some platform exports use UUIDs instead of object names. The current `UserVisible` implementation assumes every value is a role name without prefix and always adds `Role.` during XML export. That breaks UUID round-trip.

## Decision

Treat `UserVisibleValue.name` as a canonical platform reference string.

For this task:

- XML import keeps the original `xr:Value` `name` attribute unchanged.
- XML export writes `item.name` unchanged.
- YAML import/export keeps the same technical key form for now, including `Role.ПолныеПрава` and raw UUIDs.
- No Russian-name conversion such as `Role` to `Роль` is introduced in this task.

This matches the `MetadataItemLink` contract in spirit: the value is a metadata reference string, and unknown identifiers are preserved. `UserVisible` is not migrated to the `MetadataItemLink` type in this change because the reference is stored in an XML attribute, not as node text, and a broader type abstraction would be a separate design.

## Components

- `packages/core/metadata/commonObjects/userVisible/fromXML.ts`
  - Remove `Role.` stripping from `xr:Value` names.

- `packages/core/metadata/commonObjects/userVisible/toXML.ts`
  - Remove unconditional `Role.` prefixing during XML export.

- `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`
  - Keep YAML keys unchanged when building model values.

- `packages/core/metadata/commonObjects/userVisible/toYAML.ts`
  - Keep exporting model names as YAML keys unchanged.

## Testing

Add focused tests for `UserVisible` with mixed identifiers:

- `Role.ПолныеПрава` remains `Role.ПолныеПрава`.
- A UUID-only value remains UUID-only.
- XML import/export and YAML import/export both preserve keys without adding or removing `Role.`.

Do not change existing XML fixtures as part of this task.

## Out Of Scope

- Translating YAML keys between `Role.*` and `Роль.*`.
- Introducing a new shared type for metadata references stored in XML attributes.
- Changing unrelated metadata reference conversion rules.
