# Устойчивый бюджет теста импорта расширения — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранить две сквозные проверки заимствованной формы, выполняя один импорт расширения и укладывая каждый test file в предел 1 000 мс.

**Architecture:** Временная копия существующей XML-фикстуры дополняется второй формой без `BaseForm`. Один вызов `importConfigurationFromXml` импортирует исходную форму и новый вариант; два теста читают разные результаты общего импорта.

**Tech Stack:** TypeScript, Vitest, XML-выгрузка 1С, Node.js `fs`.

## Global Constraints

- Не менять production-код.
- Не изменять существующие XML-фикстуры; допустимы только преобразования их временной копии внутри теста.
- Не повышать предел 1 000 мс и не добавлять коэффициенты окружения.
- Не разделять проверки по файлам и не переносить работу в неучитываемый этап Vitest.
- Сохранить оба сквозных договора через `importConfigurationFromXml`.

---

## Структура файлов

- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts` — подготовка двух форм во временной XML-копии, один общий импорт и проверки результатов обеих форм.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts` — явная регистрация стандартных реквизитов плана обмена, чтобы результат теста не зависел от порядка файлов Vitest.
- No production files changed.

### Task 1: Импортировать две разновидности формы одной операцией

**Files:**
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts:26-360`
- Test: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`

**Interfaces:**
- Consumes: `importConfigurationFromXml(...)`, существующую фикстуру `__fixtures__/configurationExtension`, `removeBaseFormElement(path)` и `replaceExactlyOnce(path, source, replacement)`.
- Produces: `ImportedExtension` с полями `form` и `formWithoutBase`; helper `addFormWithoutBase(inputDir): void`; параметризованный `writeBaseForm(projectDir, formName): void`.

- [x] **Step 1: Перевести второй тест на результат общего импорта**

Заменить повторный вызов `importExtension({ removeBaseForm: true })` использованием результата `beforeAll`:

```ts
it("распознаёт заимствованное поле по текущей cf без встроенного BaseForm", () => {
  const { projectDir, formWithoutBase } = importedExtension

  expect((formWithoutBase as { Элементы: Record<string, unknown> }).Элементы.СобственноеПоле)
    .not.toHaveProperty("ПутьКДанным")
  expect((formWithoutBase as { Элементы: Record<string, { ПутьКДанным?: unknown }> }).Элементы.Код)
    .toMatchObject({ ПутьКДанным: "" })
  expect(fs.existsSync(join(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/БазоваяФорма.yaml",
  ))).toBe(false)
})
```

- [x] **Step 2: Запустить целевой тест и подтвердить RED**

Run:

```bash
cd packages/core
pnpm exec vitest --config vitest.config.ts run metadata/importFromXml/importConfigurationExtension.test.ts
```

Expected: FAIL, потому что `importedExtension.formWithoutBase` ещё не создаётся.

- [x] **Step 3: Создать вторую форму во временной XML-копии**

Вызвать `addFormWithoutBase(inputDir)` после существующих замен в `ФормаОтчета/Ext/Form.xml` и перед записью текущих форм `cf`. Тогда новая форма получит уже подготовленные поле `Код`, тип основного реквизита и остальные общие изменения, но helper удалит из неё `BaseForm`.

Helper должен:

1. Скопировать `Forms/ФормаОтчета.xml` в `Forms/ФормаБезОсновы.xml` и каталог `Forms/ФормаОтчета` в `Forms/ФормаБезОсновы`.
2. В новом metadata-файле заменить:

```ts
replaceExactlyOnce(metadataPath, "77777777-7777-4777-8777-777777777777", "99999999-9999-4999-8999-999999999999")
replaceExactlyOnce(metadataPath, "88888888-8888-4888-8888-888888888888", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
replaceExactlyOnce(metadataPath, "<Name>ФормаОтчета</Name>", "<Name>ФормаБезОсновы</Name>")
```

3. Удалить `BaseForm` из нового `Ext/Form.xml` через `removeBaseFormElement`.
4. Добавить `<Form>ФормаБезОсновы</Form>` после `<Form>ФормаОтчета</Form>` во временном `Catalogs/СправочникПолный.xml` через `replaceExactlyOnce`.

Сигнатура:

```ts
function addFormWithoutBase(inputDir: string): void
```

- [x] **Step 4: Подготовить текущую форму cf для обоих имён**

Изменить helper:

```ts
function writeBaseForm(projectDir: string, formName: string): void
```

Использовать `formName` в пути `Формы/<formName>/Форма.yaml`. Перед импортом вызвать:

```ts
writeBaseForm(projectDir, "ФормаОтчета")
writeBaseForm(projectDir, "ФормаБезОсновы")
```

Содержимое текущей формы оставить одинаковым: оно задаёт основной реквизит, собственное поле и заимствованное базовое поле.

- [x] **Step 5: Вернуть обе импортированные формы**

Удалить параметр `options` у `importExtension`. После импорта прочитать второй YAML:

```ts
const formWithoutBase = readYaml(
  projectDir,
  "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml",
)
```

Вернуть его вместе с текущим результатом:

```ts
return { projectDir, result, configuration, catalog, form, formWithoutBase, yamlText, snapshot }
```

Обновить ожидаемое число успешно импортированных назначений с `3` до `4`. Точный результат также должен содержать вторые записи для `ФормаБезОсновы`:

```ts
{
  severity: "error",
  code: "project_validation",
  message: 'ПутьКДанным "БазовыйОбъект.БазовыйРеквизит.Description": неизвестный реквизит "БазовыйРеквизит"',
  targetProjectPath:
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml",
}
```

и

```ts
{
  severity: "warning",
  code: "unresolved_data_path",
  message: "Не удалось преобразовать ПутьКДанным: БазовыйОбъект.БазовыйРеквизит.Description",
  targetProjectPath: "Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml",
  value: "БазовыйОбъект.БазовыйРеквизит.Description",
}
```

Другие утверждения первого теста оставить без ослабления.

- [x] **Step 6: Запустить целевой файл и подтвердить GREEN**

Run:

```bash
cd packages/core
pnpm exec vitest --config vitest.config.ts run metadata/importFromXml/importConfigurationExtension.test.ts
```

Expected: PASS, 2 tests.

- [x] **Step 7: Изолировать тест разбора metadata targets от порядка загрузки**

Во время прогона с seed `20260731` тест обнаружил скрытую зависимость от побочной регистрации стандартных реквизитов плана обмена другим test file. Добавить в `metadataTargets/parse.test.ts` явный импорт регистрации:

```ts
import "../../appliedObjects/metadataExchangePlan/standardMembers"
```

Запустить целевой файл `metadata/commonObjects/metadataTargets/parse.test.ts` и подтвердить PASS, 33 tests.

- [x] **Step 8: Проверить устойчивость бюджета на трёх seed**

Run из `packages/core`:

```bash
node scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260730
node scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260731
node scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260810
```

Expected для каждого запуска: exit 0; 716 test files и 6 201 tests; отсутствует `Лимит превышен`.

- [x] **Step 9: Выполнить полную проверку проекта**

Run из корня:

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base origin/develop
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: все команды завершаются с exit 0; новых дублей и архитектурных нарушений нет.

- [x] **Step 10: Проверить границы изменения**

Run:

```bash
git diff --check
git status --short
git diff -- packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
```

Expected: изменены два теста и этот план; `packages/mcp/README.md` отсутствует в diff.

Commit:

```bash
git add packages/core/metadata/importFromXml/importConfigurationExtension.test.ts packages/core/metadata/commonObjects/metadataTargets/parse.test.ts docs/superpowers/plans/2026-08-10-extension-import-test-duration.md
git commit -m "test: :zap: ускорить импорт расширения без BaseForm" -m "Две разновидности заимствованной формы проверяются одним сквозным импортом. Это сохраняет покрытие и устраняет повторную дорогую операцию без повышения лимитов."
```
