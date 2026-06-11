---
name: config-validate-yaml
description: Use when checking a 1C YAML configuration project with nkdk validate, especially after editing YAML files, forms, DataPath values, or schema-governed metadata.
---

# Validate YAML Configuration

Use this skill to validate a finished YAML configuration project. The validator checks supported YAML files globally; do not rely on a local-only check for DataPath correctness.

## Inputs

Find or ask for one input at a time:

1. YAML project directory.
2. Optional single YAML file to focus on.

Before running validation, check that the project directory exists and looks like a YAML configuration project: it usually contains `Конфигурация.yaml` or object folders such as `Справочник`, `Документ`, `Перечисление`, `Обработка`, `РегистрСведений`, or `РегистрНакопления`.

## Commands

Prefer the installed command:

```bash
nkdk validate "<yaml-project-dir>"
nkdk validate "<yaml-project-dir>" --file "<project-relative-or-absolute-yaml-file>"
```

If `nkdk` is not available, run the CLI from the workspace that contains `@nakidka/cli`; keep the YAML project path pointing at the target project:

```bash
pnpm --filter @nakidka/cli dev validate "<yaml-project-dir>"
pnpm --filter @nakidka/cli dev validate "<yaml-project-dir>" --file "<project-relative-or-absolute-yaml-file>"
```

Use `--file` only to limit the initial file set. DataPath validation can still read related project files lazily when it needs owner metadata.

## Exit Codes

- `0`: no errors. Warnings may still be printed.
- `1`: validation found project errors.
- `2`: command usage error, for example missing YAML directory, non-directory project path, `--file` outside the project, or unsupported file shape.

## Output

Diagnostics are printed as project-relative POSIX paths:

```text
Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml:4:5 error: <message>
summary: 1 error, 0 warning
```

When reporting results back, summarize the important diagnostics with path, line, severity, and message. Do not invent structured JSON output: the command is meant for readable text output.

## DataPath Notes

DataPath checks are configured through `rules.ts`. If a rule specifies `allowedKinds`, an unknown or missing resolved type is an error. If a rule disallows composite values, a composite final type is an error even when every branch has the requested kind.

Known form platform data sources that are not implemented yet should appear as warnings, not as successful validation.
