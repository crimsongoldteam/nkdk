# Schema YAML Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `nkdk schema <target>` удобным выводом для LLM: по умолчанию печатать компактную YAML-сводку, добавить `--keys`, `--required`, `--search`, `--exact`, сохранить точную JSON Schema за `--json-schema`, и обновить внешний навык `.agents`.

**Architecture:** Нормализация JSON Schema живёт в `@nakidka/core`, CLI только выбирает режим, проверяет сочетания флагов и форматирует результат. Все YAML-режимы используют одну структуру `fields`; `--keys` всегда печатает только имена полей по одному на строку.

**Tech Stack:** TypeScript, Vitest, Commander, `yaml`, существующие JSON Schema helpers из `packages/core/metadata/validation`.

---

## File Structure

Создать:

- `packages/core/metadata/validation/schemaSummary.ts` — нормализация JSON Schema в компактную YAML-сводку, поиск и вывод ключей.
- `packages/core/metadata/validation/schemaSummary.test.ts` — unit-тесты на маленькой схеме из спеки и на ветках `anyOf`.

Изменить:

- `packages/core/index.ts` — экспортировать helpers и типы сводки.
- `packages/cli/src/commands/schema.ts` — заменить текущий JSON-only вывод на режимы `--json-schema`, `--keys`, `--required`, `--search`, `--exact`.
- `packages/cli/src/commands/schema.test.ts` — обновить тесты команды под новую семантику.
- `packages/cli/src/cli.ts` — добавить CLI-флаги и обновить описания.
- `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md` — обновить инструкции навыка под новый `nkdk schema`.

Не изменять:

- XML-фикстуры.
- `packages/core/metadata/**/rules.ts`.
- fromXML/toXML/fromYAML/toYAML правила.

---

## Step 0: Preflight Context

**Files:**

- Read `.agents/knowledge/metadata/INDEX.md`
- Read `.agents/knowledge/metadata/sources-of-truth.md`
- Read `docs/superpowers/specs/2026-05-29-cli-schema-llm-summary-design.md`

**Actions:**

- [ ] Прочитать metadata-инструкции перед изменениями в `packages/core/metadata/**`:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
```

Expected: подтверждено, что задача не меняет XML-фикстуры, XSD-источники и правила metadata-преобразований.

- [ ] Прочитать согласованную спеку:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-29-cli-schema-llm-summary-design.md
```

Expected: подтверждены режимы `--keys`, `--required`, `--search`, `--exact`, `--json-schema`; `--template` и `--prop` остаются вне границ задачи.

---

## Step 1: Core YAML Summary Helper

**Files:**

- Create `packages/core/metadata/validation/schemaSummary.ts`
- Create `packages/core/metadata/validation/schemaSummary.test.ts`
- Modify `packages/core/index.ts`

**Tests First:**

- [ ] Создать `packages/core/metadata/validation/schemaSummary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  listSchemaSummaryKeys,
  summarizeJSONSchema,
} from "./schemaSummary";

const exampleSchema = {
  type: "object",
  required: ["Вид"],
  properties: {
    Вид: {
      const: "ПолеВвода",
      description: "Вид элемента формы.",
      examples: [],
    },
    ПутьКДанным: {
      type: "string",
      description: "Путь к реквизиту формы.",
      pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
    },
    Видимость: {
      type: "boolean",
      description: null,
      examples: [],
    },
  },
} satisfies Record<string, unknown>;

describe("schema summary", () => {
  it("normalizes object properties into fields and removes empty values", () => {
    expect(summarizeJSONSchema(exampleSchema)).toEqual({
      fields: [
        {
          key: "Вид",
          required: true,
          const: "ПолеВвода",
          description: "Вид элемента формы.",
        },
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к реквизиту формы.",
          pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
        },
        {
          key: "Видимость",
          required: false,
          type: ["boolean"],
        },
      ],
    });
  });

  it("returns plain keys", () => {
    expect(listSchemaSummaryKeys(exampleSchema)).toEqual([
      "Вид",
      "ПутьКДанным",
      "Видимость",
    ]);
  });

  it("filters keys by terms split with pipe", () => {
    expect(listSchemaSummaryKeys(exampleSchema, { keyTerms: "путь|видим" })).toEqual([
      "ПутьКДанным",
      "Видимость",
    ]);
  });

  it("returns only required fields", () => {
    expect(summarizeJSONSchema(exampleSchema, { requiredOnly: true })).toEqual({
      fields: [
        {
          key: "Вид",
          required: true,
          const: "ПолеВвода",
          description: "Вид элемента формы.",
        },
      ],
    });
  });

  it("searches fields by key and textual schema values", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "путь|boolean" })).toEqual({
      fields: [
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к реквизиту формы.",
          pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
        },
        {
          key: "Видимость",
          required: false,
          type: ["boolean"],
        },
      ],
    });
  });

  it("searches exact top-level field names", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "ПутьКДанным", exact: true })).toEqual({
      fields: [
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к реквизиту формы.",
          pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
        },
      ],
    });
  });

  it("returns empty values when nothing matches", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "НесуществующееПоле" })).toBeUndefined();
    expect(listSchemaSummaryKeys(exampleSchema, { search: "НесуществующееПоле" })).toEqual([]);
  });

  it("collects object properties from anyOf branches", () => {
    const branchedSchema = {
      anyOf: [
        {
          type: "object",
          required: ["Вид"],
          properties: {
            Вид: { const: "ОбычнаяГруппа" },
          },
        },
        {
          type: "object",
          properties: {
            Элементы: {
              type: "array",
              items: { $ref: "#/$defs/FormElement" },
            },
          },
        },
      ],
    };

    expect(summarizeJSONSchema(branchedSchema)).toEqual({
      fields: [
        {
          key: "Вид",
          required: true,
          const: "ОбычнаяГруппа",
        },
        {
          key: "Элементы",
          required: false,
          type: ["array"],
          items: { $ref: "#/$defs/FormElement" },
        },
      ],
    });
  });
});
```

- [ ] Запустить тест и убедиться, что он падает из-за отсутствующего модуля:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaSummary.test.ts --no-isolate
```

Expected: Vitest сообщает, что `./schemaSummary` не найден.

**Implementation:**

- [ ] Создать `packages/core/metadata/validation/schemaSummary.ts`:

```ts
export interface SchemaSummaryOptions {
  requiredOnly?: boolean;
  search?: string;
  exact?: boolean;
  keyTerms?: string;
}

export interface SchemaSummary {
  fields: SchemaFieldSummary[];
}

export interface SchemaFieldSummary {
  key: string;
  required: boolean;
  [property: string]: unknown;
}

type JSONRecord = Record<string, unknown>;

interface ObjectSchemaView {
  properties: Record<string, unknown>;
  required: Set<string>;
}

export function summarizeJSONSchema(
  schema: unknown,
  options: SchemaSummaryOptions = {},
): SchemaSummary | undefined {
  const fields = collectFieldSummaries(schema)
    .filter((field) => matchesOptions(field, options))
    .map((field) => filterFieldForKeys(field, options.keyTerms))
    .filter((field): field is SchemaFieldSummary => field !== undefined);

  return cleanEmpty({ fields }) as SchemaSummary | undefined;
}

export function listSchemaSummaryKeys(
  schema: unknown,
  options: SchemaSummaryOptions = {},
): string[] {
  return collectFieldSummaries(schema)
    .filter((field) => matchesOptions(field, options))
    .map((field) => field.key)
    .filter((key) => matchesTerms(key, splitSearchTerms(options.keyTerms)));
}

export function splitSearchTerms(terms: string | undefined): string[] {
  return terms
    ?.split("|")
    .map((term) => term.trim().toLocaleLowerCase("ru-RU"))
    .filter(Boolean) ?? [];
}

function collectFieldSummaries(schema: unknown): SchemaFieldSummary[] {
  const fields = new Map<string, SchemaFieldSummary>();

  for (const objectSchema of collectObjectSchemas(schema)) {
    for (const [key, propertySchema] of Object.entries(objectSchema.properties)) {
      if (fields.has(key)) {
        continue;
      }

      const summary = cleanEmpty({
        key,
        required: objectSchema.required.has(key),
        ...normalizeSchemaNode(propertySchema),
      }) as SchemaFieldSummary | undefined;

      if (summary !== undefined) {
        fields.set(key, summary);
      }
    }
  }

  return [...fields.values()];
}

function collectObjectSchemas(schema: unknown): ObjectSchemaView[] {
  if (!isRecord(schema)) {
    return [];
  }

  const result: ObjectSchemaView[] = [];
  if (isRecord(schema.properties)) {
    result.push({
      properties: schema.properties,
      required: new Set(asStringArray(schema.required)),
    });
  }

  for (const keyword of ["anyOf", "oneOf", "allOf"] as const) {
    const branches = schema[keyword];
    if (!Array.isArray(branches)) {
      continue;
    }

    for (const branch of branches) {
      result.push(...collectObjectSchemas(branch));
    }
  }

  return result;
}

function normalizeSchemaNode(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node
      .map((item) => normalizeSchemaNode(item))
      .map(cleanEmpty)
      .filter((item) => item !== undefined);
  }

  if (!isRecord(node)) {
    return node;
  }

  const normalized: JSONRecord = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "type" && typeof value === "string") {
      normalized[key] = [value];
      continue;
    }

    normalized[key] = normalizeSchemaNode(value);
  }

  return cleanEmpty(normalized);
}

function matchesOptions(field: SchemaFieldSummary, options: SchemaSummaryOptions): boolean {
  if (options.requiredOnly === true && field.required !== true) {
    return false;
  }

  const searchTerms = splitSearchTerms(options.search);
  if (searchTerms.length === 0) {
    return true;
  }

  if (options.exact === true) {
    return field.key === options.search?.trim();
  }

  return matchesTerms(collectSearchText(field).join("\n"), searchTerms);
}

function filterFieldForKeys(
  field: SchemaFieldSummary,
  keyTerms: string | undefined,
): SchemaFieldSummary | undefined {
  if (!matchesTerms(field.key, splitSearchTerms(keyTerms))) {
    return undefined;
  }

  return field;
}

function matchesTerms(value: string, terms: string[]): boolean {
  if (terms.length === 0) {
    return true;
  }

  const normalizedValue = value.toLocaleLowerCase("ru-RU");
  return terms.some((term) => normalizedValue.includes(term));
}

function collectSearchText(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectSearchText);
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, childValue]) => [
      key,
      ...collectSearchText(childValue),
    ]);
  }

  return [];
}

function cleanEmpty(value: unknown): unknown {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value.length > 0 ? value : undefined;
  }

  if (Array.isArray(value)) {
    const items = value.map(cleanEmpty).filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)
      .map(([key, childValue]) => [key, cleanEmpty(childValue)] as const)
      .filter(([, childValue]) => childValue !== undefined);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return value;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isRecord(value: unknown): value is JSONRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

- [ ] Добавить экспорт в `packages/core/index.ts`:

```ts
export {
  listSchemaSummaryKeys,
  summarizeJSONSchema,
  splitSearchTerms,
  type SchemaFieldSummary,
  type SchemaSummary,
  type SchemaSummaryOptions,
} from "./metadata/validation/schemaSummary";
```

**Verify:**

- [ ] Запустить:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaSummary.test.ts --no-isolate
```

Expected: все тесты в `schemaSummary.test.ts` проходят.

- [ ] Зафиксировать изменения:

```bash
git add packages/core/metadata/validation/schemaSummary.ts packages/core/metadata/validation/schemaSummary.test.ts packages/core/index.ts
git commit -m "feat: :sparkles: добавить YAML-сводку schema"
```

---

## Step 2: CLI Schema Modes

**Files:**

- Modify `packages/cli/src/commands/schema.ts`
- Modify `packages/cli/src/commands/schema.test.ts`
- Modify `packages/cli/src/cli.ts`

**Tests First:**

- [ ] Обновить `packages/cli/src/commands/schema.test.ts`, сохранив style существующих тестов:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { printSchema } from "./schema";

describe("schema command", () => {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  afterEach(() => {
    writeSpy.mockClear();
  });

  it("prints YAML summary by schema name by default", () => {
    printSchema("InputField");

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output).toContain("fields:");
    expect(output).toContain("key: Вид");
    expect(output).toContain("const: ПолеВвода");
    expect(output).not.toContain("enum: []");
    expect(output).not.toContain("description: null");
  });

  it("prints plain keys", () => {
    printSchema("InputField", { keys: true });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output.split("\n")).toContain("Вид");
    expect(output).not.toContain("fields:");
  });

  it("filters plain keys by pipe-separated terms", () => {
    printSchema("InputField", { keys: "путь|вид" });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output.split("\n")).toContain("Вид");
    expect(output.split("\n")).toContain("ПутьКДанным");
  });

  it("prints required fields as YAML summary", () => {
    printSchema("InputField", { required: true });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output).toContain("fields:");
    expect(output).toContain("key: Вид");
    expect(output).not.toContain("schema:");
  });

  it("prints required keys only", () => {
    printSchema("InputField", { required: true, keys: true });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output.trim()).toBe("Вид");
  });

  it("prints search results in the same YAML shape", () => {
    printSchema("InputField", { search: "ПутьКДанным" });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output).toContain("fields:");
    expect(output).toContain("key: ПутьКДанным");
    expect(output).not.toContain("matches:");
    expect(output).not.toContain("query:");
  });

  it("prints exact search result", () => {
    printSchema("InputField", { search: "ПутьКДанным", exact: true });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output).toContain("key: ПутьКДанным");
    expect(output).not.toContain("key: Вид\n");
  });

  it("prints exact search keys only", () => {
    printSchema("InputField", { search: "ПутьКДанным", exact: true, keys: true });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");

    expect(output.trim()).toBe("ПутьКДанным");
  });

  it("prints JSON Schema when requested", () => {
    printSchema("InputField", { jsonSchema: true });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    const schema = JSON.parse(output) as Record<string, unknown>;

    expect(schema).toHaveProperty("$schema");
    expect(schema).toHaveProperty("definitions");
  });

  it("prints inlined JSON Schema when requested", () => {
    printSchema("InputField", { jsonSchema: true, inline: true });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    const schema = JSON.parse(output) as Record<string, unknown>;

    expect(schema).toHaveProperty("$schema");
    expect(output).not.toContain('"$ref"');
  });

  it("prints JSON Schema for project file with refs", () => {
    printSchema("Справочник/Договоры/Формы/ФормаЭлемента/Форма.yaml", {
      jsonSchema: true,
      project: "examples",
    });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    const schema = JSON.parse(output) as Record<string, unknown>;

    expect(schema).toHaveProperty("$schema");
    expect(output).toContain('"$ref"');
  });

  it("prints inlined JSON Schema for project file", () => {
    printSchema("Справочник/Договоры/Формы/ФормаЭлемента/Форма.yaml", {
      jsonSchema: true,
      project: "examples",
      inline: true,
    });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    const schema = JSON.parse(output) as Record<string, unknown>;

    expect(schema).toHaveProperty("$schema");
    expect(output).not.toContain('"$ref"');
  });

  it("does not print anything for unknown target", () => {
    printSchema("UnknownSchema");

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("rejects incompatible JSON Schema flags", () => {
    expect(() => printSchema("InputField", { jsonSchema: true, keys: true })).toThrow(
      "--json-schema несовместим",
    );
  });

  it("rejects inline without JSON Schema", () => {
    expect(() => printSchema("InputField", { inline: true })).toThrow(
      "--inline можно использовать только вместе с --json-schema",
    );
  });

  it("rejects exact without search", () => {
    expect(() => printSchema("InputField", { exact: true })).toThrow(
      "--exact можно использовать только вместе с --search",
    );
  });

  it("rejects required with search", () => {
    expect(() => printSchema("InputField", { required: true, search: "путь" })).toThrow(
      "--required и --search нельзя использовать одновременно",
    );
  });
});
```

- [ ] Запустить тест и убедиться, что он падает на текущем API:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: TypeScript или тесты падают из-за отсутствующего `printSchema` и новых опций.

**Implementation:**

- [ ] Заменить содержимое `packages/cli/src/commands/schema.ts`:

```ts
import {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  listSchemaSummaryKeys,
  summarizeJSONSchema,
  type SchemaSummaryOptions,
} from "@nakidka/core";
import { stringify } from "yaml";

export interface SchemaCommandOptions {
  project?: string;
  inline?: boolean;
  jsonSchema?: boolean;
  keys?: boolean | string;
  required?: boolean;
  search?: string;
  exact?: boolean;
}

export function printSchema(target: string, options: SchemaCommandOptions = {}): void {
  validateSchemaOptions(options);

  const schema = loadJSONSchema(target, options);
  if (schema == null) {
    return;
  }

  if (options.jsonSchema === true) {
    process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`);
    return;
  }

  const summaryOptions: SchemaSummaryOptions = {
    requiredOnly: options.required === true,
    search: options.search,
    exact: options.exact === true,
    keyTerms: typeof options.keys === "string" ? options.keys : undefined,
  };

  if (options.keys !== undefined) {
    const keys = listSchemaSummaryKeys(schema, summaryOptions);
    if (keys.length > 0) {
      process.stdout.write(`${keys.join("\n")}\n`);
    }
    return;
  }

  const summary = summarizeJSONSchema(schema, summaryOptions);
  if (summary == null) {
    if (options.exact === true) {
      throw new Error(`Поле "${options.search?.trim()}" не найдено в JSON Schema`);
    }
    return;
  }

  process.stdout.write(stringify(summary));
}

export function printJSONSchema(target: string, options: SchemaCommandOptions = {}): void {
  printSchema(target, { ...options, jsonSchema: true });
}

function loadJSONSchema(target: string, options: SchemaCommandOptions): unknown {
  return options.project != null
    ? exportJSONSchemaForProjectFile(options.project, target, {
        inlineRefs: options.inline === true,
      })
    : exportJSONSchemaForSchemaName(target, {
        inlineRefs: options.inline === true,
      });
}

function validateSchemaOptions(options: SchemaCommandOptions): void {
  if (options.inline === true && options.jsonSchema !== true) {
    throw new Error("--inline можно использовать только вместе с --json-schema");
  }

  if (options.jsonSchema === true) {
    const hasSummaryFlags =
      options.keys !== undefined ||
      options.required === true ||
      options.search != null ||
      options.exact === true;

    if (hasSummaryFlags) {
      throw new Error("--json-schema несовместим с --keys, --required, --search и --exact");
    }
    return;
  }

  if (options.required === true && options.search != null) {
    throw new Error("--required и --search нельзя использовать одновременно");
  }

  if (options.exact === true && options.search == null) {
    throw new Error("--exact можно использовать только вместе с --search");
  }

  if (options.search != null && options.search.trim().length === 0) {
    throw new Error("--search требует непустой запрос");
  }
}
```

- [ ] Изменить `packages/cli/src/cli.ts` для команды `schema`:

```ts
program
  .command("schema <target>")
  .description("Показать YAML-сводку JSON Schema по имени схемы или пути YAML-файла")
  .option("--project <yamlDir>", "Корень YAML-проекта для разрешения пути файла")
  .option("--json-schema", "Вывести точную JSON Schema вместо YAML-сводки")
  .option("--inline", "Встроить $ref в режиме --json-schema")
  .option("--keys [terms]", "Вывести только имена полей; terms фильтрует по частям строки через |")
  .option("--required", "Показать только обязательные поля")
  .option("--search <terms>", "Найти поля по частям строки через |")
  .option("--exact", "Точный поиск имени поля в режиме --search")
  .action((target: string, options: SchemaCommandOptions) => {
    printSchema(target, options);
  });
```

- [ ] Убедиться, что импорт в `packages/cli/src/cli.ts` использует `printSchema`, а не `printJSONSchema`.

**Verify:**

- [ ] Запустить:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: все тесты `schema.test.ts` проходят.

- [ ] Запустить ручные проверки:

```bash
pnpm --filter @nakidka/cli dev schema InputField --keys
pnpm --filter @nakidka/cli dev schema InputField --search ПутьКДанным --exact
pnpm --filter @nakidka/cli dev schema InputField --json-schema
```

Expected:

- первая команда печатает имена полей, включая `Вид`;
- вторая команда печатает YAML с корнем `fields` и полем `ПутьКДанным`;
- третья команда печатает JSON, начинающийся с `{`.

- [ ] Зафиксировать изменения:

```bash
git add packages/cli/src/commands/schema.ts packages/cli/src/commands/schema.test.ts packages/cli/src/cli.ts
git commit -m "feat: :sparkles: обновить вывод schema"
```

---

## Step 3: External Skill Update

**Files:**

- Modify `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`

**Implementation:**

- [ ] Открыть навык и найти разделы, где он просит читать полную JSON Schema через `nkdk schema`.

```bash
rg -n "nkdk schema|schema" /Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md
```

- [ ] Обновить инструкции навыка этим фрагментом:

````md
Для ориентации по YAML-формату сначала используй компактную сводку:

```bash
nkdk schema "Справочник/Договоры/Формы/ФормаЭлемента/Форма.yaml" --project examples
```

Для быстрых вопросов:

```bash
nkdk schema InputField --keys
nkdk schema InputField --keys "путь|вид"
nkdk schema InputField --required
nkdk schema InputField --required --keys
nkdk schema InputField --search "путь|тип"
nkdk schema InputField --search ПутьКДанным --exact
```

Если сводки недостаточно и нужно увидеть исходную JSON Schema, используй:

```bash
nkdk schema InputField --json-schema
nkdk schema InputField --json-schema --inline
nkdk schema "Справочник/Договоры/Формы/ФормаЭлемента/Форма.yaml" --project examples --json-schema
```
````

- [ ] Если sandbox запрещает редактировать `/Users/nikita/git/new_config_add_item_test/.agents`, запросить разрешение на запись в этот путь и повторить изменение.

**Verify:**

- [ ] Прочитать обновлённый фрагмент:

```bash
sed -n '1,220p' /Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md
```

Expected: навык описывает YAML-сводку по умолчанию, `--keys`, `--required`, `--search`, `--exact`, и `--json-schema` как запасной режим.

- [ ] Проверить, является ли внешний каталог git-репозиторием:

```bash
git -C /Users/nikita/git/new_config_add_item_test status --short
```

Expected: если команда успешна, в статусе есть только ожидаемое изменение `SKILL.md` или другие пользовательские изменения, которые не трогаем.

- [ ] Если внешний каталог является git-репозиторием и пользовательские изменения не мешают, зафиксировать только файл навыка:

```bash
git -C /Users/nikita/git/new_config_add_item_test add .agents/skills/config-add-item/SKILL.md
git -C /Users/nikita/git/new_config_add_item_test commit -m "docs: :memo: обновить навык schema"
```

---

## Step 4: Full Verification

**Commands:**

- [ ] Проверить core helper:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaSummary.test.ts --no-isolate
```

Expected: тесты `schemaSummary.test.ts` проходят.

- [ ] Проверить CLI command:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: тесты `schema.test.ts` проходят.

- [ ] Проверить весь проект:

```bash
pnpm test
```

Expected: все пакеты проходят; допустимы только уже существующие skipped-тесты.

- [ ] Проверить рабочее дерево:

```bash
git status --short
```

Expected: нет незакоммиченных изменений в worktree `/Users/nikita/git/nakidka-core/.worktrees/schema-yaml-summary`.

**Manual CLI Smoke:**

- [ ] Выполнить:

```bash
pnpm --filter @nakidka/cli dev schema InputField --keys
pnpm --filter @nakidka/cli dev schema InputField --search "путь|вид"
pnpm --filter @nakidka/cli dev schema InputField --search ПутьКДанным --exact
pnpm --filter @nakidka/cli dev schema InputField --required --keys
pnpm --filter @nakidka/cli dev schema InputField --json-schema
```

Expected:

- `--keys` печатает plain text без YAML;
- `--search` печатает YAML с корнем `fields`;
- `--exact` печатает один field при точном совпадении;
- `--required --keys` печатает только обязательные имена;
- `--json-schema` печатает точную JSON Schema.
