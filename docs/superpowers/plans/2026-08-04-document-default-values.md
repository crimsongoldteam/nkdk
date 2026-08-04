# Document Default Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить девять пар `defaultValueXML` / `implicitValueYAML` пустого документа.

**Architecture:** Значения берутся из существующей минимальной XML-фикстуры и задаются декларативно в `MetadataDocumentRules`. XML → YAML проверяется существующими фикстурами, а восстановление XML без reference — отдельной узкой проверкой девяти скалярных свойств.

**Tech Stack:** TypeScript, Vitest, declarative `rules.ts`, pnpm.

## Global Constraints

- Не изменять XML-фикстуры.
- Не изменять `defaultValueXMLRaw` и `defaults.ts`.
- Не изменять общие metadata-операции и типы правил.
- Не добавлять `!xml`.

---

### Task 1: Неявные YAML-значения документа

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/minimal.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/withNumerator.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/full.ts`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts`

- [x] **Step 1: Сократить ожидаемый YAML трёх фикстур**

Удалить девять значений, соответствующих свойствам пустого документа, оставив
`ВводПоСтроке` явным.

- [x] **Step 2: Подтвердить RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/metadataDocument/fromXMLToYAML.test.ts metadata/appliedObjects/metadataDocument/fromYAMLToXML.test.ts
```

Ожидаемый результат до production-изменения: `minimal.xml` возвращает девять
лишних YAML-полей.

- [x] **Step 3: Добавить RED для XML без reference**

Проверить девять ожидаемых XML-значений при преобразовании минимального YAML без
`referenceXML`; до исправления тест возвращает прежние defaults.

- [x] **Step 4: Исправить обе стороны договора**

Изменить девять пар `defaultValueXML` / `implicitValueYAML` согласно
спецификации.

- [x] **Step 5: Подтвердить GREEN целевыми тестами**

Целевые проверки: 3 файла и 91 тест проходят.

- [x] **Step 6: Выполнить полную проверку**

```bash
pnpm duplicates -- --base 128bfd41d
pnpm type-check
pnpm test
pnpm test:architecture
pnpm duplicates -- --base 128bfd41d
```

Целевые тесты, проверка типов и поиск дублей проходят. `pnpm test` трижды
завершился после 5451 успешного функционального теста ошибкой контроля времени
на `clientApplicationForm/toJSONSchema.test.ts`. `pnpm test:architecture`
возвращает те же 177 нарушений на исходной `develop`.

- [ ] **Step 7: Зафиксировать реализацию**

```bash
git add docs/superpowers/specs/2026-08-04-document-default-values-design.md docs/superpowers/plans/2026-08-04-document-default-values.md packages/core/metadata/appliedObjects/metadataDocument/rules.ts packages/core/metadata/appliedObjects/metadataDocument/fromYAMLToXML.test.ts packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/minimal.ts packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/withNumerator.ts packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/full.ts
git commit -m "fix: :bug: исправить значения по умолчанию документа"
```
