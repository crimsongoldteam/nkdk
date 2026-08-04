# ClientApplicationForm Schema Test Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сократить schema-тест управляемой формы с десятков секунд до бюджета файла 1 000 мс без ослабления проверяемого validation-договора.

**Architecture:** Тест регистрации полного экспортера остаётся без изменений. Проверка значений `НазначенияИспользования` компилирует schema только правила `ClientApplicationFormRules.properties.usePurposes` через общий `exportPropertyToJSONSchema`, поэтому production-код и полная schema формы не меняются.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox 1.3, AJV.

## Global Constraints

- Production-код, правила формы, общая schema-компиляция и лимиты длительности не меняются.
- Проверка использует настоящие `exportPropertyToJSONSchema` и `compileValidationSchema`, без mock.
- Допустимые значения: `МобильноеПриложение`, `ПлатформаИМобильноеПриложение`.
- Недопустимый представитель: `Произвольное`.
- Проверка `{}` удаляется: необязательность свойства защищается общим `exportPropertiesToJSONSchema`.
- Базовый коммит для новых дублей: `644df4636`.

---

### Task 1: Перевести validation на schema свойства

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: `ClientApplicationFormRules.properties.usePurposes`, `exportPropertyToJSONSchema`, `compileValidationSchema`, `mockContext`.
- Produces: тот же validation-договор явных значений без построения полной schema формы.

- [ ] **Step 1: Зафиксировать существующее падение бюджета**

Run:

```bash
pnpm --filter @nkdk/core exec node scripts/run-test-duration-check.mjs --no-isolate metadata/forms/clientApplicationForm/toJSONSchema.test.ts
```

Expected: функционально 5 тестов проходят, затем проверка длительности завершается ошибкой `Лимит превышен` для файла; наблюдавшееся время около 44 секунд.

- [ ] **Step 2: Заменить компиляцию полной формы на schema свойства**

Привести файл к следующей структуре:

```ts
import { beforeAll, describe, expect, it } from "vitest"
import { getTypeRule } from "../../orchestration"
import { exportPropertyToJSONSchema } from "../../orchestration/property/toJSONSchema"
import { registerCoreMetadata } from "../../register"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext } from "../../../tests/mockContext"
import { ClientApplicationFormRules } from "./rules"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"

registerCoreMetadata()

let usePurposesSchema: ReturnType<typeof compileValidationSchema>

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  beforeAll(() => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: ClientApplicationFormRules.properties.usePurposes,
      value: undefined,
    })
    if (schema === undefined) throw new Error("UsePurposes schema is not registered")
    usePurposesSchema = compileValidationSchema(schema)
  })

  it("registers client form JSON Schema exporter", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBe(exportClientApplicationFormToJSONSchema)
  })

  it.each([
    ["МобильноеПриложение", true],
    ["ПлатформаИМобильноеПриложение", true],
    ["Произвольное", false],
  ])("validates use purpose %s", (yaml, expected) => {
    expect(usePurposesSchema.Check(yaml)).toBe(expected)
  })
})
```

Эта таблица содержит литеральные ожидания и проверяет реальную schema свойства. `eagerFallback` не нужен: узкая schema не содержит большой локальный граф определений.

- [ ] **Step 3: Запустить узкий тест через бюджет длительности**

```bash
pnpm --filter @nkdk/core exec node scripts/run-test-duration-check.mjs --no-isolate metadata/forms/clientApplicationForm/toJSONSchema.test.ts
```

Expected: 4 теста проходят; файл укладывается в 1 000 мс; команда завершается с exit 0.

- [ ] **Step 4: Запустить полный набор тестов**

```bash
pnpm test
```

Expected: файл `clientApplicationForm/toJSONSchema.test.ts` больше не появляется среди превышений лимита. Если останется независимое превышение другого теста, зафиксировать его отдельно и не расширять это исправление.

- [ ] **Step 5: Проверить новые дубли**

```bash
pnpm duplicates -- --base 644df4636
```

Expected: exit 0 без новых блокирующих дублей.

- [ ] **Step 6: Закоммитить исправление**

```bash
git add docs/superpowers/plans/2026-08-04-client-application-form-schema-test-speed.md packages/core/metadata/forms/clientApplicationForm/toJSONSchema.test.ts
git commit -m "test: :white_check_mark: ускорить schema-тест формы"
```
