# Form Elements Discriminated Union Validation Design

## Context

CLI validation of `/home/nikita/git/temp-yaml/erp` reports `1836` `Expected union value` errors. Within `Форма.yaml`, there are `1638` cases. Most of them are not truly unknown form elements: the YAML nodes have a `Вид` field, and that field already identifies the intended form element type.

Today child item JSON Schema is emitted as a plain `Type.Union(...)`. TypeBox validates the union correctly, but when no branch matches it reports the generic union error. This hides the useful nested cause, such as a missing JSON Schema export for a field inside the branch selected by `Вид`.

Example: an error surfaced at a parent `Страницы` node, but the real failing leaf was a nested command bar search string element:

```yaml
СтрокаПоиска_ПрочиеРасходы:
  Вид: ОтображениеСтрокиПоиска
  Источник: ПрочиеРасходы
```

The selected branch is `SearchStringAddition`. The field `Источник` exists in rules, but its type does not currently contribute JSON Schema, so the branch rejects it as an unexpected property. A plain union reports only the parent `Expected union value`.

## Goal

Make form-element child item validation use `Вид` as a discriminator, and expose the same discriminator metadata through `nkdk schema --json-schema`.

The first stage covers only form child item unions:

- `GroupChildItems`
- `CommandBarChildItems`
- `TableChildItems`
- `PagesChildItems`

It does not attempt to fix all invalid schemas behind those branches. It should make the validator point at the selected branch and reveal the real schema errors.

## Non-Goals

- Do not change XML fixtures or generated ERP YAML.
- Do not broaden child item unions just to silence errors.
- Do not address `Свойства.yaml` `Expected union value` cases in this stage.
- Do not handle conditional appearance unions in this stage.

## Design

### Schema Export

When `exportGenericChildItemsDefinitionToJSONSchema` emits a union of element branch schemas, it should add a discriminator option to the TypeBox schema:

```ts
Type.Union(childSchemas, { discriminantKey: "Вид" })
```

Each branch already contains `Вид: Type.Literal(...)` through `exportElementRuleToJSONSchema`, so the schema has enough information to map a YAML value to a branch.

This discriminator option must remain in schemas returned by:

```bash
nkdk schema <target> --json-schema
```

That makes `Вид` part of the public schema contract, not only an internal validator hint.

### CLI Validation

Do not add `typebox-validators` as a dependency. Its package metadata and repository state make it too risky for core validation: the repository README currently warns not to use the library with current TypeBox versions.

Instead, keep TypeBox as the primary validator and add a small discriminated-union router for diagnostics.

The implementation should preserve current behavior and performance:

- the main validation pass still uses one compiled TypeBox schema;
- schemas without `discriminantKey` keep current TypeBox diagnostics;
- discriminated union routing runs only after TypeBox reports a union error;
- routing checks only the selected branch, not every union branch.

For each union schema with `discriminantKey`, the validation layer should lazily build and cache:

```ts
Map<discriminantValue, compiledBranchValidator>
```

For child item unions this means:

```ts
Map<Вид, TypeCompiler.Compile(branchSchema)>
```

When TypeBox reports a union error, the diagnostic layer should:

1. find the failing YAML node using the error path;
2. read `node[discriminantKey]`, for example `node.Вид`;
3. find the matching compiled branch validator in the cached map;
4. return that branch validator's errors instead of the parent `Expected union value`;
5. if the discriminator is missing or unknown, return a targeted discriminator error listing allowed values.

The implementation should preserve current behavior for ordinary schemas:

- diagnostics still flow through the existing `Diagnostic` format.

The expected user-facing change is that `nkdk validate` stops reporting only the parent `Expected union value` for form child items and instead reports branch-specific errors. For the search string example, the useful error should point at `Источник` or the missing schema support behind it.

### Integration Boundary

Introduce a small validation adapter instead of spreading discriminator handling through the codebase. The adapter should expose the same operations current validation needs:

- check whether a value passes;
- return TypeBox-compatible errors for failed values.

`validateParsedFile` should depend on this adapter interface rather than knowing how discriminated union errors are expanded.

The adapter can still wrap TypeBox `TypeCheck<TSchema>` internally. It only needs extra schema access for union errors so it can inspect `discriminantKey` and compile the selected branch lazily.

## Tests

Add focused tests before implementation changes:

1. Schema export test:
   - `ClientApplicationForm` inline schema contains child item union schemas with `discriminantKey: "Вид"`.
   - form element branch schemas still contain `Вид: const(...)`.
   - button schemas still keep `ТипКнопки` separate from the `Вид` discriminator.

2. Validation test:
   - create a minimal form YAML with a known `Вид` branch and an invalid field inside that branch;
   - verify diagnostics include the nested branch-specific error instead of only `Expected union value`.

3. Regression test:
   - ordinary non-discriminated schema validation still reports existing TypeBox diagnostics.

4. Cache behavior test:
   - validate two values with the same discriminated union branch;
   - verify branch compilation is reused, or cover the cache through a small unit around the adapter.

## Verification

Run:

```bash
pnpm --dir packages/core test
pnpm --dir packages/cli test
pnpm -s --dir packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml/erp
```

For the ERP validation run, compare the `Expected union value` count before and after. The first stage succeeds when form child item cases are replaced by more precise branch diagnostics, even if total errors remain because the revealed branch schemas still need fixes.
