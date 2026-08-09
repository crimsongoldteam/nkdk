# Общий преобразователь YAML-описания типа — план реализации

> **Для агентных исполнителей:** ОБЯЗАТЕЛЬНЫЙ ДОПОЛНИТЕЛЬНЫЙ НАВЫК: использовать `superpowers:subagent-driven-development` (рекомендуется) или `superpowers:executing-plans` для выполнения плана по задачам. Для отметки прогресса используются флажки (`- [ ]`).

**Цель:** устранить расхождение семантики `TypeDescription` между основным fromYAML, предварительным индексом формы и индексом фактов владельца.

**Архитектура:** чистое преобразование YAML → `TypeDescription` выделяется в отдельный модуль `parseYAML.ts`. Основной fromYAML остаётся переходником правил с проверкой `allowedTypes`, а оба индексатора используют чистую функцию напрямую.

**Технологии:** TypeScript, Vitest, pnpm, существующие `TypeDescriptionRules`, `formulaFormatParser` и проверка проекта NKDK.

## Общие ограничения

- Не добавлять частные условия в `metadata/orchestration`, `metadata/validation` или `metadata/project`.
- Не изменять `rules.ts`, XML-фикстуры и `.agents/architecture.md`.
- Не добавлять поля в общие типы правил.
- Общий преобразователь не зависит от `ConfigurationContext`, `PropertyRule`, валидатора или индекса проекта.
- Структурно неподходящее значение даёт `undefined`; диагностику продолжает формировать JSON Schema.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 0cfca88e0`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test` и `pnpm test:architecture`.
- Архитектурная проверка до реализации уже завершается с 215 известными нарушениями в этой ветке; изменение не должно добавлять новых зависимостей поверх этого состояния. Эталон не обновлять.

---

## Карта файлов

- Создать `packages/core/metadata/commonObjects/typeDescription/parseYAML.ts` — единственная чистая реализация YAML → `TypeDescription`.
- Создать `packages/core/metadata/commonObjects/typeDescription/parseYAML.test.ts` — договор чистого преобразователя на существующей таблице фикстур и неподходящих значениях.
- Изменить `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts` — оставить проверку `allowedTypes`, регистрацию правила и делегирование чистой функции.
- Изменить `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts` — сохранить проверку ограничений переходника; существующие проверки импорта должны остаться зелёными.
- Изменить `packages/core/metadata/validation/dataPath/formYamlIndex.ts` — использовать общий преобразователь и удалить локальную реализацию.
- Изменить `packages/core/metadata/validation/dataPath/formYamlIndex.test.ts` — закрепить одинаковый вид данных для `Дата`, `Время`, `ДатаВремя`.
- Изменить `packages/core/metadata/validation/dataPath/ownerFacts.ts` — использовать общий преобразователь без зависимости от индекса формы.
- Изменить `packages/core/metadata/validation/dataPath/ownerFacts.test.ts` — закрепить полное описание даты в фактах владельца.

### Задача 1: Выделить чистый преобразователь `TypeDescription`

**Файлы:**

- Создать: `packages/core/metadata/commonObjects/typeDescription/parseYAML.ts`
- Создать: `packages/core/metadata/commonObjects/typeDescription/parseYAML.test.ts`
- Изменить: `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
- Проверить: `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`

**Интерфейсы:**

- Принимает: `parseTypeDescriptionYAML(value: unknown)`.
- Возвращает: `TypeDescription | undefined`.
- `importTypeDescriptionFromYAML(context, rule, value)` проверяет `rule.allowedTypes` и возвращает результат `parseTypeDescriptionYAML(value)`.
- Потребители следующей задачи импортируют только `parseTypeDescriptionYAML` из `commonObjects/typeDescription/parseYAML`.

- [ ] **Шаг 1: Написать падающие проверки чистого договора**

Создать `parseYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { typeFixturesTable } from "./__fixtures__/data"
import { parseTypeDescriptionYAML } from "./parseYAML"

describe("parseTypeDescriptionYAML", () => {
  it.each(typeFixturesTable)("преобразует YAML-типы по общему договору: $enterprise", ({ internal, YAML }) => {
    expect(parseTypeDescriptionYAML(YAML)).toEqual(internal)
  })

  it.each([
    undefined,
    "",
    "   ",
    123,
    { ИдентификаторТипа: "8c1e3694-da12-44d5-8b1f-d134b89a1282" },
    { ИдентификаторТипа: [123] },
  ])("не создаёт описание из структурно неподходящего значения %#", (value) => {
    expect(parseTypeDescriptionYAML(value)).toBeUndefined()
  })
})
```

- [ ] **Шаг 2: Убедиться, что проверка падает до реализации**

Выполнить:

```bash
pnpm --filter ./packages/core exec vitest run metadata/commonObjects/typeDescription/parseYAML.test.ts --no-isolate
```

Ожидается: `FAIL` с ошибкой отсутствующего модуля `./parseYAML` или отсутствующего экспорта `parseTypeDescriptionYAML`.

- [ ] **Шаг 3: Перенести чистую семантику в `parseYAML.ts`**

Перенести из `fromYAML.ts` без изменения смысловых ветвей:

- распознавание объекта `ИдентификаторТипа`;
- разбор строк через `formulaFormatParser`;
- преобразование строк, чисел и дат с уточнениями;
- внешние источники данных и системные перечисления;
- ссылочные и составные типы;
- `getStringQualifiers`, `getNumberQualifiers`, `getDateQualifiers`.

Публичная граница должна быть такой:

```ts
export function parseTypeDescriptionYAML(value: unknown): TypeDescription | undefined {
  if (value === undefined) return undefined

  if (isTypeDescriptionYAMLObject(value)) {
    const typeId = getTypeIdsFromYAML(value.ИдентификаторТипа)
    return typeId === undefined ? undefined : { type: [], typeId }
  }

  const stringValues = Array.isArray(value) ? value : [value]
  const validStrings = stringValues.filter(
    (item): item is string => typeof item === "string" && item.trim() !== ""
  )
  if (validStrings.length === 0) return undefined

  return parseTypeDescriptionStrings(validStrings)
}
```

Внутренняя `parseTypeDescriptionStrings` должна содержать существующий цикл из `importTypeDescriptionFromYAML`. Ветка дат остаётся единственной:

```ts
if (type === "Дата" || type === "Время" || type === "ДатаВремя") {
  types.push("dateTime")
  result.dateQualifiers = getDateQualifiers(type)
  continue
}
```

- [ ] **Шаг 4: Превратить `fromYAML.ts` в переходник правил**

После переноса `fromYAML.ts` должен сохранить регистрацию и проверку ограничения:

```ts
export const importTypeDescriptionFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: TypeDescriptionYAML | undefined
): TypeDescription | undefined => {
  if (value === undefined) return undefined

  if (rule?.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    assertTypeDescriptionYAMLAllowed({ value, allowedTypes: rule.allowedTypes })
  }

  return parseTypeDescriptionYAML(value)
}

registerTypeRule("TypeDescription", "importFromYAML", importTypeDescriptionFromYAML)
```

Удалить из `fromYAML.ts` только перенесённые функции и ставшие ненужными импорты. Не переносить `registerTypeRule` и `assertTypeDescriptionYAMLAllowed` в чистый модуль.

- [ ] **Шаг 5: Запустить проверки чистого преобразователя и переходника**

Выполнить:

```bash
pnpm --filter ./packages/core exec vitest run metadata/commonObjects/typeDescription/parseYAML.test.ts metadata/commonObjects/typeDescription/fromYAML.test.ts --no-isolate
```

Ожидается: оба файла проходят; проверки `allowedTypes` по-прежнему отклоняют запрещённые значения.

- [ ] **Шаг 6: Проверить типы и новые дубликаты слоя**

Выполнить:

```bash
pnpm --filter ./packages/core type-check
pnpm duplicates -- --base 0cfca88e0
```

Ожидается: обе команды завершаются успешно, новых дубликатов нет.

- [ ] **Шаг 7: Зафиксировать чистый преобразователь**

```bash
git add packages/core/metadata/commonObjects/typeDescription/parseYAML.ts \
  packages/core/metadata/commonObjects/typeDescription/parseYAML.test.ts \
  packages/core/metadata/commonObjects/typeDescription/fromYAML.ts
git commit -m "refactor: :recycle: выделить преобразователь типов YAML" \
  -m "Основной fromYAML и предварительные индексы должны использовать одну семантику TypeDescription без зависимости чистого преобразования от правил."
```

### Задача 2: Перевести предварительные индексы на общий преобразователь

**Файлы:**

- Изменить: `packages/core/metadata/validation/dataPath/formYamlIndex.ts`
- Изменить: `packages/core/metadata/validation/dataPath/formYamlIndex.test.ts`
- Изменить: `packages/core/metadata/validation/dataPath/ownerFacts.ts`
- Изменить: `packages/core/metadata/validation/dataPath/ownerFacts.test.ts`

**Интерфейсы:**

- Принимает из задачи 1: `parseTypeDescriptionYAML(value: unknown): TypeDescription | undefined`.
- Производит: одинаковые `TypeDescription` и `DataPathTypeInfo` для основного fromYAML, формы и фактов владельца.
- Не производит новых диагностик; существующая JSON Schema остаётся источником структурных ошибок значения типа.

- [ ] **Шаг 1: Добавить падающую проверку дат предварительного индекса формы**

Добавить в `formYamlIndex.test.ts`:

```ts
it.each(["Дата", "Время", "ДатаВремя"])("сводит %s к виду dateTime", (yamlType) => {
  const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
  collector.acceptProperty(fact(["Реквизиты", "Период", "Тип"], yamlType))

  expect(collector.finish().getRoot("Период")?.typeInfo).toMatchObject({
    kinds: ["dateTime"],
    sourceText: "dateTime",
  })
})
```

- [ ] **Шаг 2: Добавить падающую проверку полного типа в фактах владельца**

Добавить в `ownerFacts.test.ts`:

```ts
it("сохраняет дату через общий TypeDescription", () => {
  expect(ownerFactFromYAML("type", "Дата")).toEqual({
    type: ["dateTime"],
    dateQualifiers: { dateFractions: "Date" },
  })
})
```

- [ ] **Шаг 3: Убедиться, что обе проверки воспроизводят расхождение**

Выполнить:

```bash
pnpm --filter ./packages/core exec vitest run metadata/validation/dataPath/formYamlIndex.test.ts metadata/validation/dataPath/ownerFacts.test.ts --no-isolate
```

Ожидается: новые проверки падают, потому что текущая локальная функция возвращает `date` без `dateQualifiers`.

- [ ] **Шаг 4: Заменить локальный преобразователь в `formYamlIndex.ts`**

Импортировать общий модуль:

```ts
import { parseTypeDescriptionYAML } from "../../commonObjects/typeDescription/parseYAML"
```

Заменить три вызова `typeDescriptionFromYAML(...)` на `parseTypeDescriptionYAML(...)`:

```ts
attribute.type = parseTypeDescriptionYAML(fact.value)
```

```ts
typeInfo: typeDescriptionToDataPathTypeInfo(parseTypeDescriptionYAML(fact.value))
```

```ts
typeInfo: typeDescriptionToDataPathTypeInfo(parseTypeDescriptionYAML(asRecord(rawColumn)?.["Тип"]))
```

Полностью удалить локальные `typeDescriptionFromYAML`, `primitiveTypeFromYaml` и импорт `getTypeFromYAML`. Не оставлять совместимый экспорт: единственным источником семантики должна быть функция из `parseYAML.ts`.

- [ ] **Шаг 5: Убрать связь фактов владельца с индексом формы**

В `ownerFacts.ts` заменить импорт:

```ts
import { parseTypeDescriptionYAML } from "../../commonObjects/typeDescription/parseYAML"
```

В `normalizedOwnerFact` и `namedTypedItemsFromYaml` использовать только `parseTypeDescriptionYAML(value)`.

- [ ] **Шаг 6: Запустить целевые проверки индексов**

Выполнить:

```bash
pnpm --filter ./packages/core exec vitest run metadata/validation/dataPath/formYamlIndex.test.ts metadata/validation/dataPath/ownerFacts.test.ts --no-isolate
```

Ожидается: проверки проходят; все три YAML-вида даты дают `dateTime`, а факт владельца сохраняет уточнение `Date`.

- [ ] **Шаг 7: Запустить соседние проверки путей данных**

Выполнить:

```bash
pnpm --filter ./packages/core exec vitest run metadata/validation/dataPath/formIndex.test.ts metadata/validation/dataPath/resolver.test.ts metadata/validation/validateForm.test.ts --no-isolate
```

Ожидается: существующее разрешение путей данных и проверки форм проходят без изменений ожидаемых результатов.

- [ ] **Шаг 8: Проверить типы и новые дубликаты слоя**

Выполнить:

```bash
pnpm --filter ./packages/core type-check
pnpm duplicates -- --base 0cfca88e0
```

Ожидается: обе команды завершаются успешно, новых дубликатов нет.

- [ ] **Шаг 9: Зафиксировать перевод индексов**

```bash
git add packages/core/metadata/validation/dataPath/formYamlIndex.ts \
  packages/core/metadata/validation/dataPath/formYamlIndex.test.ts \
  packages/core/metadata/validation/dataPath/ownerFacts.ts \
  packages/core/metadata/validation/dataPath/ownerFacts.test.ts
git commit -m "fix: :bug: унифицировать типы предварительных индексов" \
  -m "Формы и факты владельцев теперь используют тот же TypeDescription, что основной fromYAML, поэтому корректные даты не отклоняются на первом проходе."
```

### Задача 3: Проверить реальную конфигурацию и весь проект

**Файлы:**

- Временно создать и затем удалить: `packages/core/scripts/run-validation-sed.ts`
- Производственные файлы не изменять.

**Интерфейсы:**

- Проверяет публичную операцию `validateProject({ projectDir })` на `/Users/nikita/git/sed_nkdk`.
- Производит доказательство, что группа `ожидается dateTime` исчезла, а остальные диагностики не были скрыты.

- [ ] **Шаг 1: Создать временный штатный запуск валидатора из исходников**

Создать `packages/core/scripts/run-validation-sed.ts`:

```ts
import { writeFile } from "node:fs/promises"
import { validateProject } from "../metadata/validation/validateProject"

const result = await validateProject({ projectDir: "/Users/nikita/git/sed_nkdk" })
const diagnostics = [...result.diagnostics]
await writeFile("/private/tmp/sed-shared-type-validation.json", JSON.stringify(diagnostics, null, 2))
console.log(JSON.stringify({
  errors: diagnostics.filter(({ severity }) => severity === "error").length,
  warnings: diagnostics.filter(({ severity }) => severity === "warning").length,
}))
```

- [ ] **Шаг 2: Удалить внутренний снимок и выполнить чистую валидацию**

Постоянное разрешение пользователя допускает удаление внутренних `.nkdk`-снимков без повторного согласования.

```bash
rm -f /Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin
pnpm --filter ./packages/core exec tsx scripts/run-validation-sed.ts
```

Ожидается: `66` ошибок и `128` предупреждений вместо `74` и `128`; точное количество допустимо уточнить только за счёт вторичной проверки расширения, но ошибки даты должны исчезнуть полностью.

- [ ] **Шаг 3: Проверить отсутствие диагностик даты и сохранность остальных групп**

```bash
jq '[.[] | select(.severity == "error" and (.message | contains("конечный тип не подходит, ожидается dateTime")))] | length' /private/tmp/sed-shared-type-validation.json
```

Ожидается: `0`.

Дополнительно выполнить:

```bash
jq '[.[] | select(.severity == "error") | .message |
  if contains("неизвестный корень") then "unknown-root"
  elif contains("неизвестная колонка") then "unknown-column"
  elif contains("путь колонки должен начинаться") then "table-context"
  elif contains("ЗначениеЗаполнения") or contains("значение заполнения") or contains("неявное значение") then "fill-value"
  else "other" end] | group_by(.) | map({group: .[0], count: length})' \
  /private/tmp/sed-shared-type-validation.json
```

Ожидается: остальные ранее найденные группы остаются видимыми; изменение не подавляет их общей фильтрацией.

- [ ] **Шаг 4: Удалить временный сценарий**

Удалить `packages/core/scripts/run-validation-sed.ts` через `apply_patch` и убедиться, что он отсутствует в `git status --short`.

- [ ] **Шаг 5: Выполнить полные проверки**

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base 0cfca88e0
pnpm test:architecture
git diff --check
git status --short
```

Ожидается:

- `type-check`, `test`, `duplicates` и `git diff --check` проходят;
- рабочее дерево чистое после двух коммитов реализации;
- `test:architecture` не добавляет нарушений к известным 215 и не требует изменения эталона; если команда остаётся красной только из-за известного состояния ветки, зафиксировать это в итоговом отчёте;
- все существующие XML-фикстуры остаются неизменными.

## Итог тестов

- Новый `parseYAML.test.ts` защищает самостоятельный договор общего чистого преобразователя и безопасную обработку входа `unknown`.
- Расширенный `formYamlIndex.test.ts` защищает одинаковый вид `dateTime` для трёх вариантов даты.
- Расширенный `ownerFacts.test.ts` защищает сохранение полного `TypeDescription`, включая уточнение даты.
- Существующий `fromYAML.test.ts` продолжает защищать `allowedTypes` и регистрацию переходника.
- Существующие проверки `formIndex`, `resolver` и `validateForm` подтверждают отсутствие регрессий путей данных.
- Проверка реального `/Users/nikita/git/sed_nkdk` подтверждает исчезновение восьми ложных диагностик, которые воспроизводили исходную проблему.
