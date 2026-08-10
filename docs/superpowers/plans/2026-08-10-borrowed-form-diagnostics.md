# Borrowed Form Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать рассинхронизацию заимствованных форм предупреждением и устранить ложные сообщения для элементов вложенных командных панелей.

**Architecture:** `formComponentIndex` получает элементы через существующий обход YAML по `rules.ts`, поэтому import и validation публикуют одинаковую полную структуру формы в ProjectState. Межфайловое сравнение наборов компонентов возвращает `warning`, а противоречия `ПутьКДанным` и структурные нарушения остаются `error`.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm, двоичный ProjectState, декларативные `rules.ts`.

## Global Constraints

- Не изменять существующие XML-фикстуры; интеграционный XML собирать во временном каталоге внутри теста.
- Не добавлять частные условия по именам форм, элементов или каталогов.
- Не создавать новый обход формы: переиспользовать `collectFormDataPathOccurrencesFromYAML` и `ClientApplicationFormRules`.
- Import и validation должны использовать один `formComponentIndex` и один ProjectState.
- Формат ProjectState и `.nkdk/reports/*.jsonl` не изменять.
- После каждого слоя выполнять `pnpm duplicates -- --base 44fd122b8a0b959511f5a4bbcbafcd7e987bf686`.
- Перед завершением выполнить полные тесты и обе архитектурные проверки.

---

## File Structure

- `formComponentIndex.ts` — единый rules-driven индекс компонентов формы.
- `borrowedFormValidation.ts` — уровни diagnostics полной dependency validation.
- `baseFormCompatibility.ts` — уровни прямого сравнения двух YAML-представлений.
- Соседние `*.test.ts` — узкие договоры этих модулей.
- `importConfigurationExtension.test.ts` — последовательный import `cf` → `cfe` и повторная validation без rebuild.

### Task 1: Единый rules-driven индекс элементов формы

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/formComponentIndex.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/formComponentIndex.test.ts`

**Interfaces:**
- Consumes: `collectFormDataPathOccurrencesFromYAML`, `ClientApplicationFormRules`, `resolveClientApplicationFormCollectionItemRule`.
- Produces: прежний `indexClientApplicationFormComponents(yaml): ClientApplicationFormComponentIndex`, но со всеми элементами и полными dotted YAML-путями.

- [ ] **Step 1: Написать падающий тест вложенных коллекций**

Расширить первый тест таким представителем:

```ts
const index = indexClientApplicationFormComponents({
  КоманднаяПанель: {
    Элементы: {
      ГлавнаяКнопка: { Вид: "КнопкаКоманднойПанели", ТипКнопки: "КнопкаКоманднойПанели" },
    },
  },
  Элементы: {
    Товары: {
      Вид: "ТаблицаФормы",
      КоманднаяПанель: {
        Элементы: {
          Добавить: { Вид: "КнопкаКоманднойПанели", ТипКнопки: "КнопкаКоманднойПанели" },
        },
      },
      КонтекстноеМеню: {
        Элементы: {
          Удалить: { Вид: "КнопкаКоманднойПанели", ТипКнопки: "КнопкаКоманднойПанели" },
        },
      },
    },
  },
})

expect(index.elements.get("ГлавнаяКнопка")?.path)
  .toBe("КоманднаяПанель.Элементы.ГлавнаяКнопка")
expect(index.elements.get("Добавить")?.path)
  .toBe("Элементы.Товары.КоманднаяПанель.Элементы.Добавить")
expect(index.elements.get("Удалить")?.path)
  .toBe("Элементы.Товары.КонтекстноеМеню.Элементы.Удалить")
```

Перенести повтор имени из второго теста во вложенную командную панель, чтобы проверить уникальность между разными коллекциями.

- [ ] **Step 2: Подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/formComponentIndex.test.ts
```

Expected: FAIL — три вложенные кнопки не индексируются, межколлекционный повтор не обнаруживается.

- [ ] **Step 3: Реализовать индекс поверх общего обхода**

Заменить `visitElements` функцией `indexElements`:

```ts
function indexElements(yaml: unknown): ReadonlyMap<string, FormComponentEntry> {
  const result = new Map<string, FormComponentEntry>()
  collectFormDataPathOccurrencesFromYAML({
    yaml,
    rule: ClientApplicationFormRules,
    resolveCollectionItemRule: resolveClientApplicationFormCollectionItemRule,
    visitElement({ name, yamlPath, rule }) {
      if (!("enterpriseField" in rule) || !("enterpriseFieldType" in rule)) return
      const path = yamlPath.map(String).join(".")
      if (name.length === 0) throw new FormComponentIndexError("Имя элемента формы не может быть пустым", path)
      if (result.has(name)) throw new FormComponentIndexError(`Повтор имени элемента «${name}»`, path)
      result.set(name, { name, path })
    },
  })
  return result
}
```

Импортировать общий обход, `ClientApplicationFormRules` и resolver. В `indexClientApplicationFormComponents` использовать `elements: indexElements(yaml)`. `indexNamed` оставить для реквизитов, команд и параметров, старый `visitElements` удалить.

- [ ] **Step 4: Запустить потребителей индекса**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/formComponentIndex.test.ts metadata/forms/clientApplicationForm/formStructureProjection.test.ts metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts
```

Expected: PASS.

- [ ] **Step 5: Проверить дубли и закоммитить**

Run:

```bash
pnpm duplicates -- --base 44fd122b8a0b959511f5a4bbcbafcd7e987bf686
git add packages/core/metadata/forms/clientApplicationForm/formComponentIndex.ts packages/core/metadata/forms/clientApplicationForm/formComponentIndex.test.ts
git commit -m "fix: :bug: индексировать вложенные элементы формы"
```

Expected: все команды завершаются успешно.

### Task 2: Предупреждения о рассинхронизации

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts`

**Interfaces:**
- Consumes: существующий `Diagnostic`.
- Produces: `warning` только для отсутствующих компонентов; diagnostics `ПутьКДанным` и `FormComponentIndexError` остаются `error`.

- [ ] **Step 1: Сделать уровни явными в тестах**

В `borrowedFormValidation.test.ts` добавить `severity: "warning"` к трём классам сравнения: компонент текущей `cf` отсутствует в рабочей форме; компонент сохранённой основы отсутствует в рабочей форме; элемент сохранённой основы отсутствует в текущей `cf`.

В тестах пустого, избыточного и неизвестного `ПутьКДанным` добавить:

```ts
expect.objectContaining({ severity: "error" })
```

В `baseFormCompatibility.test.ts` ожидать `warning` для отсутствующего компонента и `error` для пустого имени.

- [ ] **Step 2: Подтвердить падение уровней**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts
```

Expected: FAIL — сравнения пока возвращают `error`.

- [ ] **Step 3: Изменить только diagnostics сравнения**

В `borrowedFormValidation.ts` установить `severity: "warning"` в `missingDiagnostics` и в сообщении «из сохранённой основы отсутствует в текущей форме cf». Остальные уровни не менять.

В `baseFormCompatibility.ts` передавать уровень в общий helper:

```ts
function diagnostic(
  filePath: string,
  message: string,
  path: string,
  severity: Diagnostic["severity"] = "error",
): Diagnostic {
  return { filePath, line: 1, col: 1, severity, source: "cross-file", message, path }
}
```

Для отсутствующего компонента передавать `"warning"`; обработка `FormComponentIndexError` использует `error` по умолчанию.

- [ ] **Step 4: Запустить целевые проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts metadata/validation/projectStateDependencyValidation.test.ts
```

Expected: PASS; сравнения дают `warning`, противоречия дают `error`.

- [ ] **Step 5: Проверить дубли и закоммитить**

Run:

```bash
pnpm duplicates -- --base 44fd122b8a0b959511f5a4bbcbafcd7e987bf686
git add packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.ts packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.ts packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts
git commit -m "fix: :bug: предупреждать о рассинхронизации форм"
```

Expected: все команды завершаются успешно.

### Task 3: Сквозной договор import и validation

**Files:**
- Test: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`

**Interfaces:**
- Consumes: общий `ProjectStateService` существующего сценария import `cf` → `cfe`.
- Produces: предупреждение для вложенной кнопки одинаково видно после import и последующей validation без rebuild.

- [ ] **Step 1: Собрать кнопку во временных XML**

В `importBaseConfiguration`, только для `ФормаОтчета`, раскрыть самозакрывающийся `AutoCommandBar` во временной копии:

```xml
<AutoCommandBar name="ФормаКоманднаяПанель" id="-1">
  <ChildItems>
    <Button name="ОбщаяПанельнаяКнопка" id="10">
      <Type>CommandBarButton</Type>
      <CommandName>Form.StandardCommand.Close</CommandName>
    </Button>
  </ChildItems>
</AutoCommandBar>
```

В `importExtension` так же раскрыть `AutoCommandBar` только внутри `<BaseForm version="2.20">`. Верхнюю рабочую панель расширения оставить пустой. Использовать `replaceExactlyOnce`; файлы в `__fixtures__` не менять.

- [ ] **Step 2: Сравнить результат import с повторной validation**

После import выполнить:

```ts
const validation = await projectState.refreshAndValidate({
  projectDir,
  context: mockContextFromXML(),
  concurrency: 1,
})
const validationDiagnostics = [...validation.diagnostics]
validation.diagnostics.release()
```

Проверить `arrayContaining` для `ОбщаяПанельнаяКнопка`: в `result.warnings` и `validationDiagnostics` присутствует `warning`; в `result.failed` его нет. Ни одна коллекция не содержит сообщения, что эта кнопка отсутствует в текущей форме `cf`.

- [ ] **Step 3: Запустить интеграционный и отчётный тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/importConfigurationExtension.test.ts
pnpm --filter @nkdk/mcp exec vitest run src/services/diagnosticReport.test.ts
```

Expected: PASS. Существующий случай 101 смешанной diagnostics подтверждает полный JSONL-отчёт и предел 100 inline-записей; production-код отчёта не меняется.

- [ ] **Step 4: Проверить дубли и закоммитить**

Run:

```bash
pnpm duplicates -- --base 44fd122b8a0b959511f5a4bbcbafcd7e987bf686
git add packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
git commit -m "test: :white_check_mark: проверить предупреждения import форм"
```

Expected: все команды завершаются успешно.

### Task 4: Production-проверка и полный набор тестов

**Files:**
- No repository changes expected.

**Interfaces:**
- Consumes: `nkdk.import_from_xml`, `nkdk.validate_project`, `/Users/nikita/git/sed_xml`.
- Produces: подтверждённый полный отчёт предупреждений и отсутствие двух ложных сообщений.

- [ ] **Step 1: Импортировать `sed_xml` без rebuild**

Создать проект командой `mktemp -d /private/tmp/nkdk-borrowed-form.XXXXXX`. Одним экземпляром ProjectState вызвать:

```text
nkdk.import_from_xml({ xmlDir: "/Users/nikita/git/sed_xml/cf", projectDir: "<tmp>", componentPath: "cf", allowWrite: true })
nkdk.import_from_xml({ xmlDir: "/Users/nikita/git/sed_xml/cfe/дкз", projectDir: "<tmp>", componentPath: "cfe/дкз", allowWrite: true })
nkdk.validate_project({ projectDir: "<tmp>" })
```

Expected: diagnostics рассинхронизации находятся в `warnings`, а не в `failed`; rebuild между операциями не выполняется.

- [ ] **Step 2: Классифицировать полный отчёт**

Прочитать `.nkdk/reports/validation-*.jsonl`, сгруппировать diagnostics по уровню, сообщению и файлу. Проверить отсутствие сообщений:

```text
Заимствованный элемент «ПодобратьТовары» из сохранённой основы отсутствует в текущей форме cf
Заимствованный элемент «ТоварыДобавить» из сохранённой основы отсутствует в текущей форме cf
```

Expected: ошибок заимствованных форм нет. Число предупреждений зафиксировано в итоговом отчёте, но не сравнивается с прежним числом 261. Любой новый вид `error` исследуется до заявления о готовности.

- [ ] **Step 3: Выполнить полную обязательную проверку**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 44fd122b8a0b959511f5a4bbcbafcd7e987bf686
git status --short
```

Expected: все команды завершаются с кодом 0; `git status --short` пуст.

- [ ] **Step 4: Сверить архитектурные границы по diff**

Run:

```bash
git diff 44fd122b8a0b959511f5a4bbcbafcd7e987bf686...HEAD -- packages/core/metadata/forms/clientApplicationForm packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
```

Expected: нет production-условий по конкретным именам, нового обхода YAML, изменений формата ProjectState или diagnostic report.
