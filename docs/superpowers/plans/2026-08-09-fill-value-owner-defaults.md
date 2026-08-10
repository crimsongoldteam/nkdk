# Fill Value Owner Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Учитывать статические `implicitValueYAML` свойств владельца при проверке `ЗначениеЗаполнения`, чтобы тип и длина стандартного реквизита `Код` совпадали с действующей YAML-моделью даже при опущенных ключах.

**Architecture:** Предметный модуль `commonObjects/fillValue` строит эффективный набор свойств владельца из явно присутствующего YAML и статических значений самого корневого `rules.ts`. Общие типы правил и metadata-операции не меняются; общий классификатор продолжает одинаково обслуживать XML-import и validation.

**Tech Stack:** TypeScript 7, Vitest 4, metadata ruleRuntime, configuration snapshot.

## Global Constraints

- Реализовать договор из `docs/superpowers/specs/2026-08-09-fill-value-owner-defaults-design.md`.
- Не читать `defaultValueXML`, не вычислять функциональный `implicitValueYAML` и не дублировать литералы `Строка`, `9`, `Переменная` вне `rules.ts`.
- Не изменять существующие XML-фикстуры и общие типы `PropertyRule`/`BasePropertyRule`.
- Не затрагивать раскрытие DefinedType, политику пустых владельцев и `!xml`.
- Не включать пользовательское изменение `packages/mcp/README.md` ни в один коммит.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 87a5e5920`.

---

## File Structure

- `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts` — построение эффективных свойств владельца.
- `packages/core/metadata/commonObjects/fillValue/standardMember.test.ts` — приоритет явных и неявных свойств, запрет XML-default и функций.
- `packages/core/metadata/importFromXml/dependentItems.test.ts` — удаление пустого и пробельного кода со снимком.
- `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts` — отсутствие ложных предупреждений при опущенных свойствах справочника.
- `packages/core/metadata/importFromXml/fillValueImport.test.ts` — сквозное поведение импорта кода.

---

### Task 1: Эффективные свойства владельца

**Files:**
- Modify: `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/standardMember.test.ts`

**Interfaces:**
- Produces: `ownerProperties(params)` со значением `explicit YAML -> static implicitValueYAML -> undefined`.
- Preserves: нормализацию `owners` и сигнатуру `classifyStandardAttributeFillValue(...)`.

- [ ] **Step 1: Написать падающие тесты статических значений**

В `standardMember.test.ts` добавить сценарий стандартного реквизита `Код` справочника с корневым YAML без `ТипКода`, `ДлинаКода` и `ДопустимаяДлинаКода`. Передавать настоящий `MetadataCatalogRules` через тот же helper, которым тест вызывает `classifyStandardAttributeFillValue(...)`.

Проверить:

```ts
expect(classifyCatalogCode({ ЗначениеЗаполнения: "" }, {})).toMatchObject({ kind: "implicit" })
expect(classifyCatalogCode({ ЗначениеЗаполнения: "123456789" }, {})).toMatchObject({ kind: "valid" })
expect(classifyCatalogCode({ ЗначениеЗаполнения: "1234567890" }, {})).toMatchObject({ kind: "invalid" })
```

Ожидаемый эффективный договор берётся из `MetadataCatalogRules`: `codeType = String`, `codeLength = 9`, `codeAllowedLength = Variable`.

- [ ] **Step 2: Написать падающие тесты приоритета и границ**

Добавить локальное probe-правило владельца и вызвать экспортируемый классификатор через существующий тестовый helper:

- явный YAML `ТипКода: Число` перекрывает статическое `implicitValueYAML: "String"`;
- правило только с `defaultValueXML: 7` не даёт эффективного YAML-значения;
- функция `implicitValueYAML: () => 7` не вызывается и оставляет свойство неопределённым;
- отсутствующий `Владельцы` по-прежнему нормализуется как отсутствующее значение, а явный массив — как раньше.

Для функционального значения использовать `vi.fn()` и проверить `expect(fn).not.toHaveBeenCalled()`.

- [ ] **Step 3: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/standardMember.test.ts --no-isolate
```

Expected: FAIL — `ownerProperties()` пока пропускает отсутствующие YAML-ключи.

- [ ] **Step 4: Реализовать локальный выбор значения**

В `analyzeItem.ts` заменить ранний пропуск отсутствующего `raw` на небольшой предметный helper:

```ts
function effectiveOwnerPropertyValue(root: Record<string, unknown>, rule: PropertyRule): unknown {
  if (typeof rule.yaml !== "string") return undefined
  if (Object.prototype.hasOwnProperty.call(root, rule.yaml)) return root[rule.yaml]
  return typeof rule.implicitValueYAML === "function" ? undefined : rule.implicitValueYAML
}
```

В `ownerProperties()` добавлять поле только при результате, отличном от `undefined`; для `owners` продолжать вызывать `normalizeOwners(...)`. Импортировать `PropertyRule` только как тип. Не использовать truthy-проверку: явные `0`, `false`, `""` и `[]` имеют приоритет.

- [ ] **Step 5: Получить зелёный предметный слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/standardMember.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
git diff --check
git add packages/core/metadata/commonObjects/fillValue/analyzeItem.ts packages/core/metadata/commonObjects/fillValue/standardMember.test.ts
git commit -m "fix: :bug: учитывать неявные свойства владельца"
```

Expected: PASS; изменение ограничено предметным модулем.

---

### Task 2: Import и validation кода без явных свойств

**Files:**
- Modify: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Modify: `packages/core/metadata/importFromXml/fillValueImport.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`

**Interfaces:**
- Consumes: общий `classifyStandardAttributeFillValue(...)` из Task 1.
- Produces: одинаковую классификацию в XML-import и чистой validation.

- [ ] **Step 1: Зафиксировать удаление пустого и пробельного кода**

В `dependentItems.test.ts` параметризовать сценарии `""`, `" "` и `"   "` для справочника без корневых `ТипКода`/`ДлинаКода`. У каждого кандидата задать отличимый `xmlValue` и `logicalAddress`.

Проверить, что:

- `ЗначениеЗаполнения` удалено;
- `normalizeImportedDependentItems(...)` возвращает `1`;
- fragment содержит точную форму `xsiType` и `xmlText`, включая количество пробелов.

- [ ] **Step 2: Зафиксировать содержательное значение и validation**

В `fillValueImport.test.ts` добавить импорт представителя со значением `--`, явной длиной `3` и опущенным типом кода. Ожидать, что значение остаётся обычным YAML.

В `yamlFactExtractor.fillValue.test.ts` проверить два YAML:

```yaml
СтандартныеРеквизиты:
  Код:
    ЗначениеЗаполнения: "123"
```

и:

```yaml
ДлинаКода: 3
СтандартныеРеквизиты:
  Код:
    ЗначениеЗаполнения: "--"
```

Оба не должны создавать предупреждения `не определён тип кода`/`не определена длина кода`. Значение длинее эффективной длины должно по-прежнему давать ошибку несовместимости.

- [ ] **Step 3: Выполнить узкие проверки**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
git diff --check
```

Expected: PASS; импорт и validation используют один классификатор.

- [ ] **Step 4: Создать коммит слоя**

```bash
git add packages/core/metadata/importFromXml/dependentItems.test.ts packages/core/metadata/importFromXml/fillValueImport.test.ts packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts
git commit -m "test: :white_check_mark: закрепить значения кода по умолчанию"
```

---

### Task 3: Полная проверка и контрольный импорт SED

**Files:**
- Runtime output only: `/Users/nikita/git/sed_nkdk/cf`
- Runtime output only: `/Users/nikita/git/sed_nkdk/cfe`

- [ ] **Step 1: Выполнить обязательные проверки репозитория**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 87a5e5920
git diff --check
```

Expected: все команды завершаются с кодом 0; baseline dependency-cruiser не меняется.

- [ ] **Step 2: Повторить чистый импорт в согласованные каталоги**

Перед удалением подтвердить точные цели `/Users/nikita/git/sed_nkdk/cf` и `/Users/nikita/git/sed_nkdk/cfe`, удалить только их, затем импортировать `/Users/nikita/git/sed_xml/cf` и расширения из `/Users/nikita/git/sed_xml/cfe` штатной командой NKDK.

- [ ] **Step 3: Проверить ожидаемую группу**

Проверить итоговые diagnostics и YAML:

- отсутствуют 20 предупреждений `не определён тип кода`;
- отсутствуют 3 предупреждения `не определена длина кода`;
- 22 пустых/пробельных значения кода отсутствуют в YAML;
- `Справочник/СтраныМира/Свойства.yaml` содержит `ЗначениеЗаполнения: "--"`;
- остальные группы предупреждений не маскируются.

Не добавлять generated-проект SED в git-индекс NKDK.
