---
name: new-applied-object
description: Исследование прикладного объекта метаданных 1С перед реализацией — глубокий анализ фикстур, XSD, справки 1С и соседей в codebase. Рекурсивно выявляет подчинённые объекты и извлекает для них XML-фикстуры. Выдаёт консолидированный отчёт для `/write-a-prd`. Используй при добавлении нового прикладного объекта (Документ, Последовательность, Перечисление, Нумератор и т.п.).
---

# Исследование прикладного объекта

Скилл запускает сценарий исследования нового прикладного объекта. Устойчивые правила исследования живут в `.agents/knowledge/metadata/`.

Перед работой обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/object-research.md`
4. `.agents/knowledge/metadata/registries.md`

Скилл ничего не реализует: не пишет `rules.ts`, `types.ts`, `register.ts`, тесты и не трогает реестры. Единственные файловые результаты — папки и XML-фикстуры подчинённых объектов, извлечённые из фикстур родителя.

Результат — структурированный отчёт в чате для последующей спецификации и плана.

## Триггер

- Аргумент — путь к каталогу нового прикладного объекта (обычно `packages/core/metadata/appliedObjects/metadata<Name>/`). В каталоге уже должны лежать XML-фикстуры (`__fixtures__/full.xml`, `minimal.xml`; желательно `__fixtures__/sync/xml/<Имя>.xml`).
- Если фикстур нет — останови скилл, попроси пользователя добавить минимум один `full.xml`.

## Обязательные локальные ресурсы

Перед началом обязательно прочитай `local-resources.md` рядом с этим SKILL.md (`.agents/skills/new-applied-object/local-resources.md`). Там приватные пути для Deep Scan:

1. **XSD-каталог** (`.xsd*_root.res` файлы платформы 1С);
2. **Каталог справки 1С** `hlp/1/FileStorage/objects`, из которого извлекаются русские имена свойств, типы платформы и описания.
3. **Карта ru↔en** (`~/.cache/mcp-bsl/ru-en-map.json`).

**Если нет файла `local-resources.md` или любого из трёх ресурсов** — остановись, выведи сообщение «настрой локальные ресурсы» со ссылкой на `.agents/skills/new-applied-object/local-resources.md`. Скилл без них работать не будет.

## Фаза 1. Deep Scan

Работай автономно, без вопросов пользователю. Следуй `.agents/knowledge/metadata/object-research.md` и источникам истины из `.agents/knowledge/metadata/sources-of-truth.md`.

### Внутренний отчёт (не в чат)

По итогу Deep Scan у агента должна быть таблица:

```
Родитель: Metadata<Name>
├── container: <XMLTag>
├── свойства: [ {русский, английский, XSDtag, тип, источник: фикстура/XSD/справка}, ... ]
├── подчинённые: [
│     { путь, container, свойства: [...], подчинённые: [...] }
│   ]
├── внешние файлы: [ Ext/AdditionalIndexes.xml → tag "AdditionalIndexes", тип уже есть ]
├── свойства вне фикстур: [ objectBelonging, extendedConfigurationObject, ... ]
├── реестры-дельта: [ новые ключи которые надо добавить ]
└── риски инфраструктуры: [ ... ]
```

---

## Фаза 2. Grill-style вопросы

Формат grill-style: **по одному вопросу**, с **предлагаемым ответом** и **обоснованием**. Агент не переходит к следующему, пока не получил ответ.

Обязательные блоки (порядок):

1. **Свойства родителя** — таблица (русский / английский TS-ключ / XSD-тег / тип / YAML-ключ / источник). «Верно? Добавить/убрать? Переименовать?»
2. **Свойства вне фикстур** — найденные в XSD базового класса или в справке 1С, но отсутствующие в фикстурах (кандидаты `objectBelonging`, `extendedConfigurationObject` и т.п.). Для каждого рекомендуемый режим (`runtimeOnly`, `toYAML: false, fromYAML: false`, или не включать).
3. **Подчинённые объекты** — список рекурсивно найденных, с указанием путей созданных папок и XML-фикстур. Порядок создания (сначала листья). «Пути в `commonObjects/` — OK? Создавать всех сейчас или некоторых отложить?»
4. **Внешние файлы** (`Ext/*.xml` или отдельные .bsl-модули) — для каждого: известный механизм (как у соседа) / runtimeOnly / не включать в rules.
5. **Особые свойства** — модули (`RecordSetModule`, `ObjectModule`), `Predefined`, кастомные теги — как обрабатывать.
6. **Риски инфраструктуры** — если Deep Scan обнаружил статически (неизвестный тип в реестрах, необычные `xmlParents`, возможные баги общих `from/to XML` правил для нужного типа) — для каждого предлагаемое действие.

Если в ходе ответов выясняется, что решение пользователя требует нового под-вопроса — задавай его **тут же**, не копи на конец.

---

## Фаза 3. Консолидированный отчёт в чате

Один сообщение-markdown по шаблону:

```markdown
# Research: Metadata<Name>

## Контекст
- Путь: `packages/core/metadata/appliedObjects/metadata<Name>/`
- Контейнер XML: `<Container>`
- XSD-источник: `<файл>`
- Референс-соседи: `<1-2 пути>`

## Свойства
| TS-ключ | XML-тег | YAML-ключ | Тип | Default | Источник |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## Подчинённые (порядок создания — сначала листья)
1. `Metadata<Sub1>` → `packages/core/metadata/commonObjects/metadata<Sub1>/`
   - Фикстуры извлечены: full.xml [+ minimal.xml]
   - Свойства: …
   - Подчинённых нет [или список]
2. `Metadata<Sub2>` → ...

## Внешние файлы
- `Ext/<File>.xml` — обрабатывать как свойство `<key>: { type: "<T>" }` (по аналогии с <сосед>)

## Свойства вне фикстур (по решению пользователя)
- `objectBelonging` — `SystemEnumeration: ObjectBelonging`, `toYAML: false, fromYAML: false`
- `extendedConfigurationObject` — `string`, `runtimeOnly: true`

## Дельта реестров
- `MetadataItemTypeRegistry`: добавить `Metadata<Name>`, `Metadata<Sub1>`, `Metadata<Sub2>`
- `PropertyTypeRegistry`: добавить `Metadata<Name>`, `Metadata<Sub1>`, `Metadata<Sub1>s` (коллекция), `Metadata<Sub2>`, `Metadata<Sub2>s`
- `PropertyRuleTypeKeys`: те же записи

## Ответы пользователя на грил
1. **Q:** <вопрос> — **A:** <ответ>
2. ...

## Риски / заметки к выполнению
- <перечень статически выявленных>

## Непокрытые свойства (нет в фикстурах, но объявлены в rules)
- ...

## Следующий шаг
Сформируй PRD через `/write-a-prd` на основе этого отчёта. Реализация — отдельная фаза после PRD/plan.
```

---

## Что НЕ делает скилл

- Не создаёт `rules.ts`, `types.ts`, `register.ts`, `index.ts`.
- Не регистрирует ничего в `MetadataItemTypeRegistry`/`PropertyTypeRegistry`/`PropertyRuleTypeKeys`.
- Не пишет тесты (`fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, `toYAML.test.ts`, `convertFromXML.test.ts`, `syncToXML.test.ts`).
- Не запускает `pnpm test` и `type-check`.
- Не правит общую инфраструктуру (`metadataRef`, `metadataField` и т.п.), даже если Deep Scan обнаружил подозрение на баг — это идёт в раздел «Риски».

## Что делает (единственные файловые результаты)

- Папки подчинённых: `packages/core/metadata/commonObjects/metadata<Sub>/`.
- XML-фикстуры подчинённых: `packages/core/metadata/commonObjects/metadata<Sub>/__fixtures__/full.xml` (+ `minimal.xml`).

Все остальные файлы создаются на этапе выполнения плана (после `/write-a-prd` → `/prd-to-plan` → ручная реализация по плану).

## Следующие сценарии

- grill-style — методика вопросов «по одному с рекомендацией».
- `/write-a-prd` — следующий шаг после этого скилла.
