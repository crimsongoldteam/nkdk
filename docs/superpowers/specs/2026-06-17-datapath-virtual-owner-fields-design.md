# DataPath Virtual Owner Fields Design

## Problem

ERP YAML validation still reports 93 `DataPath` errors after the `ValueList` fix. The largest connected remaining group is caused by platform virtual fields on metadata owners:

- `ChartOfAccounts` forms use object fields such as `Order`, `Type`, `OffBalance`, and accounting flags from `ПризнакиУчета`.
- `ChartOfCalculationTypes` forms use virtual calculation-type tables such as `BaseCalculationTypes`, `LeadingCalculationTypes`, and `DisplacingCalculationTypes`.

These fields are valid platform `DataPath` targets, but they are not ordinary YAML attributes of the owner. The current resolver only checks the owner model field index and therefore reports `неизвестный реквизит`.

## Goals

- Reduce the remaining ERP `DataPath` error count by resolving this connected virtual-owner-field class.
- Keep the fix limited to validation.
- Preserve YAML/XML round-trip behavior and the current YAML contract.
- Keep unknown fields strict: do not turn arbitrary owner misses into warnings.

## Non-Goals

- Do not add these virtual fields to YAML output.
- Do not change `rules.ts`, fromXML/toXML, fromYAML/toYAML, or XML fixtures.
- Do not create a generic fallback that accepts every unknown owner field.
- Do not solve unrelated remaining classes such as form-only columns, `RowsCount`, or unknown catalog attributes.

## Design

Add a narrow virtual-field fallback in the `DataPath` resolver after the ordinary owner field lookup fails. The fallback is selected by metadata owner kind and by exact segment name.

For `ChartOfAccounts` owners:

- `Order` resolves as terminal `scalar`.
- `Type` resolves as terminal `scalar`.
- `OffBalance` resolves as terminal `boolean`.
- Names listed in the owner model `accountingFlags` / YAML `ПризнакиУчета` resolve as terminal `boolean`.

For `ChartOfCalculationTypes` owners:

- `ActionPeriodIsBasic` resolves as terminal `boolean`.
- `BaseCalculationTypes`, `LeadingCalculationTypes`, and `DisplacingCalculationTypes` resolve as strict `tableSource`.
- The only virtual column for these calculation-type tables is `CalculationType`.
- `CalculationType` resolves as an object reference to the current `ChartOfCalculationTypes` owner.

The fallback returns the same `ResolveDataPathState` shape as ordinary fields, so existing terminal type checks, table context checks, and `allowedKinds` policies continue to work.

## Data Flow

1. `resolveDataPath` resolves the root form attribute as it does now.
2. When the path enters an object owner and `resolveObjectFieldSegment` returns no field, the resolver calls `resolveVirtualOwnerField`.
3. `resolveVirtualOwnerField` receives the owner metadata and the requested segment.
4. If the owner kind and segment match one of the supported platform virtual fields, it returns a typed state.
5. Otherwise the resolver keeps the existing `неизвестный реквизит` diagnostic.

## Error Handling

- Unknown `ChartOfAccounts` fields remain `неизвестный реквизит`.
- Unknown calculation-type table columns remain `неизвестная колонка`.
- The same segment names on unrelated owner kinds remain errors.
- If an accounting flag is not listed in `ПризнакиУчета`, it is not accepted as a virtual field.

## Testing

Add resolver tests for:

- `Объект.Order`, `Объект.Type`, and `Объект.OffBalance` on `ChartOfAccountsRef`.
- `Объект.Валютный` or another `ПризнакиУчета` flag on `ChartOfAccountsRef`.
- A missing accounting flag staying an error.
- The same virtual fields staying errors on a non-`ChartOfAccounts` owner.
- `Объект.BaseCalculationTypes` resolving as a table source on `ChartOfCalculationTypesRef`.
- `Объект.BaseCalculationTypes.CalculationType` resolving as a reference to the current calculation type plan.
- `LeadingCalculationTypes` and `DisplacingCalculationTypes` using the same table behavior.
- Unknown calculation-type virtual table columns staying errors.

Add an integration test in `validateForm.test.ts` with a minimal form for each owner kind:

- `ChartOfAccounts` form using `Order`, `OffBalance`, and an accounting flag.
- `ChartOfCalculationTypes` form using `BaseCalculationTypes` and `BaseCalculationTypes.CalculationType`.

## Verification

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/dataPath/resolver.test.ts metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts
```

Then run ERP YAML validation against `/tmp/round-trip-yaml-validation/erp` and confirm the selected class disappears from `DataPath` errors.

Finally run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm test'
```

## Expected Result

The connected group of virtual owner field errors should drop by roughly 28 diagnostics:

- `ПланСчетов` virtual fields and accounting flags.
- `ПланВидовРасчета` virtual calculation-type tables.

Remaining `DataPath` errors should still be strict and available for the next focused pass.
