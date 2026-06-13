# Agent Metadata Knowledge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make metadata rules mandatory for all `packages/core/metadata/**` work by moving stable methodology into `.agents/knowledge/metadata/` and leaving skills as thin executable scenarios.

**Architecture:** Add a short `INDEX.md` as the mandatory entry point, referenced from `AGENTS.md`. Split current long skill content into focused knowledge documents, then rewrite `new-applied-object`, `new-metadata-item`, and `round-trip-xml` so they route agents to that knowledge instead of duplicating standards.

**Tech Stack:** Markdown project instructions, Codex skills in `.agents/skills/**/SKILL.md`, shell verification with `rg`, `find`, `pnpm test`.

---

## File Structure

Create:

- `.agents/knowledge/metadata/INDEX.md` — mandatory routing map for all metadata work.
- `.agents/knowledge/metadata/sources-of-truth.md` — fixtures, XSD, MCP, ru-en-map, and neighbor-object source hierarchy.
- `.agents/knowledge/metadata/object-research.md` — research protocol for new applied/common metadata objects.
- `.agents/knowledge/metadata/metadata-item-implementation.md` — implementation cycle for metadataItem objects.
- `.agents/knowledge/metadata/round-trip-cycle.md` — XML/YAML round-trip barriers and escalation rules.
- `.agents/knowledge/metadata/yaml-contract.md` — YAML naming, defaults, exclusions, and XML/YAML cycle separation.
- `.agents/knowledge/metadata/registries.md` — required registry touch points and runtime rule registration.

Modify:

- `AGENTS.md` — add mandatory metadata knowledge entry point.
- `.agents/skills/new-applied-object/SKILL.md` — keep scenario, move standards to knowledge references.
- `.agents/skills/new-metadata-item/SKILL.md` — keep scenario, move implementation standards to knowledge references.
- `.agents/skills/round-trip-xml/SKILL.md` — add knowledge routing for round-trip rules.
- `.agents/skills/_shared/metadata/*.md` — leave in place for the first migration pass; only add short deprecation/source-of-truth notes if a duplicated rule becomes misleading.

Do not modify:

- XML fixtures under `packages/core/metadata/**/__fixtures__/**/*.xml`.
- TypeScript implementation files under `packages/core/**`.
- Existing tests, except if link-check or Markdown verification scripts are added later by explicit request.

## Task 1: Add Mandatory Metadata Entry Point

**Files:**
- Create: `.agents/knowledge/metadata/INDEX.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Create the knowledge directory**

Run:

```bash
mkdir -p .agents/knowledge/metadata
```

Expected: command exits with code `0`.

- [ ] **Step 2: Create `INDEX.md`**

Create `.agents/knowledge/metadata/INDEX.md` with this exact content:

```markdown
# Metadata Knowledge Index

Этот индекс обязателен перед любыми изменениями в `packages/core/metadata/**`.

Читай только документы, относящиеся к текущей задаче. Если задача затрагивает несколько пунктов, применяй все соответствующие разделы.

## Всегда

- `sources-of-truth.md` — источники истины, приоритет XML/XSD/MCP/ru-en-map/соседей.

## Если меняешь `rules.ts`, `types.ts`, фикстуры или тесты metadataItem

- `metadata-item-implementation.md`
- `round-trip-cycle.md`
- `registries.md`

## Если добавляешь или исследуешь новый прикладной объект

- `object-research.md`
- `sources-of-truth.md`
- `registries.md`

## Если работа касается YAML

- `yaml-contract.md`
- `round-trip-cycle.md`

## Если чинится round-trip

- `round-trip-cycle.md`
- При расхождении в чужом metadataItem остановись и зафиксируй фрагмент, не правь чужой `rules.ts` без отдельного решения пользователя.

## Переходные источники

До полного переноса подробные шаблоны остаются в `.agents/skills/_shared/metadata/`:

- `.agents/skills/_shared/metadata/rules.md`
- `.agents/skills/_shared/metadata/types.md`
- `.agents/skills/_shared/metadata/fixtures-data.md`
- `.agents/skills/_shared/metadata/tests.md`
- `.agents/skills/_shared/metadata/io-tests.md`
- `.agents/skills/_shared/metadata/scripts.md`

Если `knowledge` и `_shared` расходятся, для обязательных правил поведения приоритет у `knowledge`; для шаблонов кода и тестов используй `_shared`.
```

- [ ] **Step 3: Add `AGENTS.md` routing rule**

In `AGENTS.md`, after the `## TypeScript` section and before `## Запуск тестов`, add:

```markdown
## Работа с metadata

- перед любыми изменениями в `packages/core/metadata/**` обязательно прочитай `.agents/knowledge/metadata/INDEX.md` и следуй указанным там документам для текущей задачи
```

- [ ] **Step 4: Verify the entry point exists and is referenced**

Run:

```bash
rg -n "knowledge/metadata/INDEX.md|Работа с metadata" AGENTS.md .agents/knowledge/metadata/INDEX.md
```

Expected output contains:

```text
AGENTS.md
.agents/knowledge/metadata/INDEX.md
```

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md .agents/knowledge/metadata/INDEX.md
git commit -m "docs: :memo: добавить вход в metadata knowledge"
```

## Task 2: Add Core Metadata Knowledge Documents

**Files:**
- Create: `.agents/knowledge/metadata/sources-of-truth.md`
- Create: `.agents/knowledge/metadata/round-trip-cycle.md`
- Create: `.agents/knowledge/metadata/yaml-contract.md`
- Create: `.agents/knowledge/metadata/registries.md`

- [ ] **Step 1: Create `sources-of-truth.md`**

Create `.agents/knowledge/metadata/sources-of-truth.md` with:

```markdown
# Metadata Sources Of Truth

## XML Fixtures

- Существующие XML-фикстуры являются источником истины.
- Не изменяй XML-фикстуры, если пользователь явно не попросил.
- Перед анализом полного XML-файла получи число строк через `wc -l`, затем читай файл целиком.
- Для прикладных объектов проверяй не только `__fixtures__/full.xml` и `minimal.xml`, но и `__fixtures__/sync/xml/**`, включая `Ext/*`.

## XSD

- XSD определяет фактические XML-теги и наследование.
- Если английский синоним из ru-en-map отличается от XSD-тега, в `rules.ts` побеждает XSD-тег через `xml: "..."`.
- Для нового контейнера найди complexType по имени XML-контейнера.

## MCP bsl-platform

- MCP даёт русские имена свойств, типы платформы и описания.
- Русские имена из MCP являются главным кандидатом на YAML-ключи.
- Если MCP недоступен для deep-scan нового прикладного объекта, останови исследование и попроси настроить локальные ресурсы.

## ru-en-map

- `~/.cache/mcp-bsl/ru-en-map.json` даёт английский синоним русского свойства.
- Используй его для выбора TS-ключа, но не как источник XML-тега.

## Соседние объекты

- Перед новым правилом прочитай 1-2 похожих metadataItem.
- Предпочитай существующие паттерны проекта вместо новых fromXML/toXML/fromYAML/toYAML правил.
- Если сосед решает такой же тип через `rules.ts`, используй `rules.ts`.

## Приоритеты

1. XML-фикстуры — фактическое round-trip поведение.
2. XSD — XML-теги, типы и наследование.
3. MCP — русские свойства и платформенные типы.
4. ru-en-map — английские синонимы для TS-ключей.
5. Соседи — проектный способ реализации.
```

- [ ] **Step 2: Create `round-trip-cycle.md`**

Create `.agents/knowledge/metadata/round-trip-cycle.md` with:

```markdown
# Metadata Round-Trip Cycle

## XML Barrier

XML-цикл всегда идёт раньше YAML-цикла.

Пока XML-цикл не зелёный, запрещено:

- добавлять YAML-фикстуры;
- добавлять `fromYAML.test.ts` и `toYAML.test.ts`;
- добавлять YAML-поведенческие аннотации в `rules.ts`: `implicitValueYAML`, `toYAML: false`, `fromYAML: false`, `excludeIfEqualNameYAML`, `useAsShortValueYAML`.

Разрешено сразу:

- TS-ключи свойств;
- русские имена в `yaml: "..."`;
- `itemType`;
- `itemTypePrefix`;
- XML-аннотации: `xml`, `xmlParents`, `defaultValueXML`, `defaultValueXMLRaw`, `forReferenceOnly`, `required`.

## XML Cycle

1. Напиши или сохрани round-trip блок: XML -> модель -> XML.
2. Запусти точечный тест.
3. При diff правь `rules.ts`.
4. Перезапускай цикл с round-trip.
5. После зелёного round-trip добавляй TS-фикстуры, fromXML и toXML проверки.

## YAML Cycle

1. Начинай только после полного зелёного XML-цикла.
2. Покажи пользователю черновик YAML-структуры.
3. После подтверждения добавь YAML-поведенческие аннотации.
4. Проверь YAML round-trip на уровне parsed object, не строк.
5. Добавь fromYAML и toYAML проверки.

## Эскалация

- Простые diff: отсутствующее правило, булева нормализация, явный XML-default — чини сам.
- Композиты, ссылки, неизвестные атрибуты и смысловые расхождения — спрашивай пользователя.
- Если diff принадлежит подчинённому или чужому metadataItem, остановись, назови тип, путь и фрагмент XML/YAML. Не правь чужой `rules.ts` без отдельного решения.
- После трёх итераций без прогресса остановись и покажи текущий diff пользователю.
```

- [ ] **Step 3: Create `yaml-contract.md`**

Create `.agents/knowledge/metadata/yaml-contract.md` with:

```markdown
# Metadata YAML Contract

## Имена

- `yaml: "..."` в `rules.ts` хранит русское имя ключа.
- Для top-level объекта обязательно согласуй `itemTypePrefix`.
- Если русское имя видно из MCP или соседей, предложи его и попроси подтверждение только при неоднозначности.

## Примитивы

- `boolean` в YAML — `StringboolYAML`: `"Истина"` или `"Ложь"`.
- `number` — число.
- `string` — строка.
- `SystemEnumeration` — русское имя из соответствующего YAML-маппинга.
- `I8nText` — строка для одного языка `ru`, иначе словарь языков.

## Дефолты

- `defaultValueXML` применяется для явно присутствующего XML-дефолта.
- `defaultValueXMLRaw` применяется для пустых XML-тегов вроде `<Synonym/>`, `<Comment/>`, `<ToolTip/>`.
- `implicitValueYAML` применяется только после XML-барьера.
- `defaultValue` применяй только для значения, которое должно жить в модели всегда.

## Исключения

- Технические поля вроде `xmlRoot`, `internalInfo`, `uuid`, ссылочные списки форм и шаблонов обычно не входят в YAML.
- `toYAML: false` и `fromYAML: false` добавляй только на YAML-цикле.
- `excludeIfEqualNameYAML` и `useAsShortValueYAML` добавляй по подтверждённой договорённости или по прямой аналогии с соседом.
```

- [ ] **Step 4: Create `registries.md`**

Create `.agents/knowledge/metadata/registries.md` with:

```markdown
# Metadata Registries

## Обязательные точки регистрации

Для нового metadataItem проверь три места:

1. `packages/core/metadata/orchestration/metadataItem/registry.ts`
   - `MetadataItemTypeRegistry`
2. `packages/core/metadata/orchestration/property/registry.ts`
   - `PropertyTypeRegistry`
   - `PropertyRuleTypeKeys`
3. `types.ts` самого объекта
   - `registerMetadataItemRule`
   - или `registerMetadataItemCollectionRule` для массивов

## Одиночный объект

Используй `registerMetadataItemRule`, когда модель хранит объект как одно значение.

## Коллекция

Используй `registerMetadataItemCollectionRule`, когда модель хранит объект как массив `T[]`.

Для коллекции регистрируй и item-тип, и collection-тип, если оба нужны правилам.

## Проверка

После регистрации проверь:

```bash
rg -n "<ObjectName>|<ObjectName>s" packages/core/metadata/orchestration packages/core/metadata
```

Ожидаемо должны находиться:

- тип в `MetadataItemTypeRegistry`, если это metadataItem;
- тип в `PropertyTypeRegistry`;
- ключ в `PropertyRuleTypeKeys`;
- runtime-регистрация в `types.ts`.
```

- [ ] **Step 5: Verify document routing**

Run:

```bash
for file in sources-of-truth.md round-trip-cycle.md yaml-contract.md registries.md; do test -f ".agents/knowledge/metadata/$file"; done
```

Expected: command exits with code `0`.

- [ ] **Step 6: Commit**

```bash
git add .agents/knowledge/metadata
git commit -m "docs: :memo: вынести базовые правила metadata"
```

## Task 3: Add Research And Implementation Knowledge Documents

**Files:**
- Create: `.agents/knowledge/metadata/object-research.md`
- Create: `.agents/knowledge/metadata/metadata-item-implementation.md`

- [ ] **Step 1: Create `object-research.md`**

Create `.agents/knowledge/metadata/object-research.md` with:

```markdown
# Metadata Object Research

Используй этот документ перед реализацией нового прикладного или общего объекта metadata.

## Локальные ресурсы

Для deep-scan нового прикладного объекта нужны:

- XSD-каталог платформы 1С;
- MCP `bsl-platform`;
- `~/.cache/mcp-bsl/ru-en-map.json`.

Если ресурс недоступен, остановись и попроси настроить `.agents/skills/new-applied-object/local-resources.md`.

## Deep Scan

1. Прочитай XML-фикстуры целиком.
2. Определи XML-контейнер внутри `<MetaDataObject>`.
3. Собери все вложенные теги, включая `Properties`, `ChildObjects`, `Ext/*.xml` и сложные свойства внутри `Properties`.
4. Классифицируй теги: примитив, `I8nText`, `SystemEnumeration`, `MetadataItemLinks`, существующий common object, новый подчинённый объект.
5. Для нового подчинённого объекта извлеки XML-фрагмент как `full.xml` и при наличии вариативности `minimal.xml`.
6. Прочитай XSD родителя и подчинённых.
7. Запроси MCP members для русских имён свойств.
8. Сверь русские имена, ru-en-map и XSD-теги.
9. Прочитай 1-2 соседних объекта.
10. Проверь реестры.

## Результат исследования

Подготовь таблицу:

- родительский тип;
- XML-контейнер;
- свойства: русский ключ, TS-ключ, XML-тег, тип, источник;
- подчинённые объекты и порядок реализации от листьев к корню;
- внешние файлы;
- свойства вне фикстур;
- дельта реестров;
- риски инфраструктуры.

## Вопросы пользователю

После deep-scan задавай вопросы по одному:

1. свойства родителя;
2. свойства вне фикстур;
3. подчинённые объекты;
4. внешние файлы;
5. особые свойства;
6. риски инфраструктуры.

Каждый вопрос должен содержать рекомендуемый ответ и обоснование.
```

- [ ] **Step 2: Create `metadata-item-implementation.md`**

Create `.agents/knowledge/metadata/metadata-item-implementation.md` with:

```markdown
# Metadata Item Implementation

Используй этот документ при добавлении или существенной правке metadataItem.

## Бриф

Перед реализацией выясни и зафиксируй:

1. путь каталога объекта;
2. наличие XML-фикстур;
3. XSD-источник;
4. свойства вне XML-фикстур;
5. родительский каталог для `index.ts`;
6. дочерние коллекции;
7. read-only и write-only ограничения;
8. YAML-имена ключей;
9. `itemTypePrefix`;
10. YAML-дефолты;
11. свойства, исключённые из YAML;
12. особые YAML-флаги.

Если ответ выводится из кода, схемы или соседей, не спрашивай с нуля: покажи найденное и попроси подтверждение.

## Порядок реализации

1. Проанализируй XML, XSD и соседние metadataItem.
2. Создай или обнови `types.ts`.
3. Создай или обнови `rules.ts`.
4. Зарегистрируй типы по `registries.md`.
5. Создай или обнови `index.ts` и экспорт родителя.
6. Пройди XML-цикл из `round-trip-cycle.md`.
7. После зелёного XML-цикла создай TS-фикстуры.
8. Добавь fromXML и toXML проверки.
9. Покажи пользователю черновик YAML.
10. После подтверждения пройди YAML-цикл.
11. В финале укажи покрытие свойств фикстурами.

## Ограничения

- Не пиши ручные fromXML/toXML/fromYAML/toYAML правила без явного запроса.
- Предпочитай `rules.ts`.
- Не меняй XML-фикстуры без явного запроса.
- Не добавляй `order`, если порядок можно получить из референса.
- Минимизируй `as any` и `as unknown`; если приведение нужно, держи его на границе интеграции и покрой тестом.
```

- [ ] **Step 3: Verify the index links point to existing files**

Run:

```bash
for file in INDEX.md sources-of-truth.md object-research.md metadata-item-implementation.md round-trip-cycle.md yaml-contract.md registries.md; do test -f ".agents/knowledge/metadata/$file"; done
```

Expected: command exits with code `0`.

- [ ] **Step 4: Commit**

```bash
git add .agents/knowledge/metadata/object-research.md .agents/knowledge/metadata/metadata-item-implementation.md
git commit -m "docs: :memo: описать исследование и реализацию metadata"
```

## Task 4: Thin The Metadata Skills

**Files:**
- Modify: `.agents/skills/new-applied-object/SKILL.md`
- Modify: `.agents/skills/new-metadata-item/SKILL.md`
- Modify: `.agents/skills/round-trip-xml/SKILL.md`

- [ ] **Step 1: Update `new-applied-object` front matter and opening**

Keep the existing front matter name. Replace the body before `## Триггер` with:

```markdown
# Исследование прикладного объекта

Скилл запускает сценарий исследования нового прикладного объекта. Устойчивые правила исследования живут в `.agents/knowledge/metadata/`.

Перед работой обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/object-research.md`
4. `.agents/knowledge/metadata/registries.md`

Скилл ничего не реализует: не пишет `rules.ts`, `types.ts`, `register.ts`, тесты и не трогает реестры. Единственные файловые результаты — папки и XML-фикстуры подчинённых объектов, извлечённые из фикстур родителя.

Результат — структурированный отчёт в чате для последующей спецификации и плана.
```

Then remove duplicated long explanations that now live in knowledge, but keep scenario-specific sections:

- `## Триггер`
- local resources stop condition
- grill-style question order
- final report template
- `## Что НЕ делает скилл`
- `## Что делает`

Do not remove `.agents/skills/new-applied-object/local-resources.md`.

- [ ] **Step 2: Update `new-metadata-item` opening**

Keep the front matter. Replace the body from `# Добавление нового объекта метаданных` through `## Точка входа` with:

```markdown
# Добавление нового объекта метаданных

Скилл запускает сценарий добавления или существенной правки metadataItem. Устойчивые правила реализации живут в `.agents/knowledge/metadata/`.

Перед работой обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/metadata-item-implementation.md`
4. `.agents/knowledge/metadata/round-trip-cycle.md`
5. `.agents/knowledge/metadata/yaml-contract.md`
6. `.agents/knowledge/metadata/registries.md`

## Точка входа

Новый объект — начинай с брифа из `.agents/knowledge/metadata/metadata-item-implementation.md`.

Существующий объект — начинай с XML-цикла из `.agents/knowledge/metadata/round-trip-cycle.md`. Если XML-цикл уже зелёный и проблема только в YAML, начинай с YAML-цикла.
```

Then shorten duplicated sections while preserving scenario order:

- brieﬁng order may remain as a local checklist if it references knowledge;
- XML cycle and YAML cycle must reference `round-trip-cycle.md`;
- implementation details for `types.ts`, `rules.ts`, fixtures and tests must reference `_shared/metadata/*.md` as templates;
- final coverage report must remain in this skill.

- [ ] **Step 3: Add knowledge routing to `round-trip-xml`**

Near the top of `.agents/skills/round-trip-xml/SKILL.md`, after the title, add:

```markdown
Перед диагностикой metadata round-trip обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/round-trip-cycle.md`
```

- [ ] **Step 4: Verify skills reference knowledge**

Run:

```bash
rg -n "knowledge/metadata" .agents/skills/new-applied-object/SKILL.md .agents/skills/new-metadata-item/SKILL.md .agents/skills/round-trip-xml/SKILL.md
```

Expected: each of the three files has at least one match.

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/new-applied-object/SKILL.md .agents/skills/new-metadata-item/SKILL.md .agents/skills/round-trip-xml/SKILL.md
git commit -m "docs: :memo: сделать metadata skills сценариями"
```

## Task 5: Check For Contradictions And Broken References

**Files:**
- Modify if needed: `.agents/knowledge/metadata/*.md`
- Modify if needed: `.agents/skills/**/*.md`

- [ ] **Step 1: Check required knowledge files**

Run:

```bash
find .agents/knowledge/metadata -maxdepth 1 -type f | sort
```

Expected output:

```text
.agents/knowledge/metadata/INDEX.md
.agents/knowledge/metadata/metadata-item-implementation.md
.agents/knowledge/metadata/object-research.md
.agents/knowledge/metadata/registries.md
.agents/knowledge/metadata/round-trip-cycle.md
.agents/knowledge/metadata/sources-of-truth.md
.agents/knowledge/metadata/yaml-contract.md
```

- [ ] **Step 2: Check for stale mandatory-standard wording in skills**

Run:

```bash
rg -n "источник истины|жёсткий барьер|PropertyRuleTypeKeys|ru-en-map|MCP|XSD" .agents/skills/new-applied-object/SKILL.md .agents/skills/new-metadata-item/SKILL.md
```

Expected: any remaining matches are scenario-specific reminders or links, not full duplicated standards. If a full duplicated standard remains, move it to the matching `.agents/knowledge/metadata/*.md` file and replace it with a link.

- [ ] **Step 3: Check for missing referenced files**

Run:

```bash
rg -o "\.agents/knowledge/metadata/[A-Za-z0-9._-]+\.md" AGENTS.md .agents/skills .agents/knowledge | sort -u
```

For each printed path, run:

```bash
test -f "<printed-path>"
```

Expected: every `test -f` exits with code `0`.

- [ ] **Step 4: Run baseline tests**

Run:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected:

- Langium generation exits with code `0`.
- `pnpm test` exits with code `0`.

- [ ] **Step 5: Commit final cleanups**

If Step 2 or Step 3 required edits:

```bash
git add .agents/knowledge/metadata .agents/skills
git commit -m "docs: :memo: выровнять ссылки metadata knowledge"
```

If no edits were needed, do not create an empty commit.

## Task 6: Final Review

**Files:**
- Read: `docs/superpowers/specs/2026-05-12-agent-metadata-knowledge-design.md`
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `AGENTS.md`

- [ ] **Step 1: Verify spec coverage**

Run:

```bash
rg -n "INDEX.md|sources-of-truth|object-research|metadata-item-implementation|round-trip-cycle|yaml-contract|registries" docs/superpowers/specs/2026-05-12-agent-metadata-knowledge-design.md .agents/knowledge/metadata/INDEX.md AGENTS.md
```

Expected:

- spec mentions the design;
- index mentions all knowledge documents;
- `AGENTS.md` mentions `.agents/knowledge/metadata/INDEX.md`.

- [ ] **Step 2: Verify branch status**

Run:

```bash
git status --short
```

Expected: no output.

- [ ] **Step 3: Report**

Final report must include:

- worktree path;
- branch name;
- commits created;
- `pnpm test` result;
- note that XML fixtures were not modified.
