# YAML Property Order Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Уменьшить выделения памяти и время `sortYamlRuleProperties`, полностью сохранив существующий порядок и значения YAML-свойств.

**Architecture:** Функция продолжает использовать один модульный `Intl.Collator` и прежнюю функцию приоритета. Вместо массива пар она сортирует только массив ключей и переносит значения циклом; ключ `__proto__` создаётся как собственное data-свойство через `Object.defineProperty`.

**Tech Stack:** TypeScript, Vitest, Node.js 26.

## Global Constraints

- Изменяется только реализация `sortYamlRuleProperties` и её непосредственные проверки.
- Приоритеты `Заголовок`, `Синоним`, `Вид`, `Тип` и русский `Intl.Collator` не изменяются.
- Вложенные объекты и массивы рекурсивно не сортируются.
- Кэш порядка ключей не добавляется.
- Обычный ключ `__proto__` должен остаться собственным перечислимым свойством и не менять прототип результата.
- Публичная сигнатура остаётся `sortYamlRuleProperties(value: Record<string, unknown>): Record<string, unknown>`.

---

### Task 1: Оптимизировать перенос отсортированных свойств

**Files:**
- Modify: `packages/core/metadata/orchestration/property/yamlPropertyOrder.ts`
- Modify: `packages/core/metadata/orchestration/property/yamlPropertyOrder.test.ts`

**Interfaces:**
- Consumes: `Record<string, unknown>` с собственными перечислимыми строковыми ключами.
- Produces: новый `Record<string, unknown>` с теми же значениями и прежним порядком ключей.

- [x] **Step 1: Добавить характеризующие проверки**

Добавить эталонную сортировку на основе текущей реализации и проверки пустого объекта, одного ключа, нескольких наборов ключей и собственного `__proto__`:

```ts
const referenceSort = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(value).sort(
      ([left], [right]) => priority(left) - priority(right) || collator.compare(left, right)
    )
  )

expect(Object.entries(sortYamlRuleProperties(value))).toEqual(Object.entries(referenceSort(value)))
expect(Object.prototype.hasOwnProperty.call(sorted, "__proto__")).toBe(true)
expect(Object.getPrototypeOf(sorted)).toBe(Object.prototype)
```

- [x] **Step 2: Запустить проверки до рефакторинга**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/yamlPropertyOrder.test.ts
```

Expected: PASS; это характеризующие проверки эквивалентности существующего поведения.

- [x] **Step 3: Заменить массив пар на массив ключей**

Реализовать функцию следующим образом:

```ts
export const sortYamlRuleProperties = (value: Record<string, unknown>): Record<string, unknown> => {
  const keys = Object.keys(value).sort(
    (left, right) => priority(left) - priority(right) || collator.compare(left, right)
  )
  const result: Record<string, unknown> = {}

  for (const key of keys) {
    if (key === "__proto__") {
      Object.defineProperty(result, key, {
        value: value[key],
        enumerable: true,
        configurable: true,
        writable: true,
      })
    } else {
      result[key] = value[key]
    }
  }

  return result
}
```

- [x] **Step 4: Запустить локальные проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/yamlPropertyOrder.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: обе команды завершаются успешно.

- [x] **Step 5: Измерить локальную производительность**

Повторить изолированное сравнение эталона и новой реализации после прогрева на объектах с `4`, `10`, `30` и `80` ключами. Проверить контрольную сумму результатов и убедиться, что новая реализация не медленнее эталона на каждом размере.

- [x] **Step 6: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: все тесты проекта проходят.

- [x] **Step 7: Зафиксировать реализацию**

```bash
git add packages/core/metadata/orchestration/property/yamlPropertyOrder.ts \
  packages/core/metadata/orchestration/property/yamlPropertyOrder.test.ts \
  docs/superpowers/plans/2026-07-30-yaml-property-order-performance.md
git commit -m "perf: :zap: сократить выделения при сортировке YAML"
```
