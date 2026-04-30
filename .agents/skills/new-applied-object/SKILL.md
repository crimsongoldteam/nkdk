---
name: new-applied-object
description: Исследование прикладного объекта метаданных 1С перед реализацией — глубокий анализ фикстур, XSD, MCP 1С-платформы и соседей в codebase. Рекурсивно выявляет подчинённые объекты и извлекает для них XML-фикстуры. Выдаёт консолидированный отчёт для `/write-a-prd`. Используй при добавлении нового прикладного объекта (Документ, Последовательность, Перечисление, Нумератор и т.п.).
---

# Исследование прикладного объекта

Скилл **исследует** и **готовит данные для PRD**. Ничего не реализует: не пишет `rules.ts`, `types.ts`, `register.ts`, тесты и не трогает реестры. Единственные файловые артефакты — папки и XML-фикстуры подчинённых объектов (извлекаются из фикстур родителя).

Результат — структурированный отчёт в чате, который пользователь передаёт в `/write-a-prd`.

## Триггер

- Аргумент — путь к каталогу нового прикладного объекта (обычно `packages/core/metadata/appliedObjects/metadata<Name>/`). В каталоге уже должны лежать XML-фикстуры (`__fixtures__/full.xml`, `minimal.xml`; желательно `__fixtures__/sync/xml/<Имя>.xml`).
- Если фикстур нет — останови скилл, попроси пользователя добавить минимум один `full.xml`.

## Обязательные ресурсы

Перед началом **обязательно** прочитай `local-resources.md` рядом с этим SKILL.md (`.Codex/skills/new-applied-object/local-resources.md`). Там приватные пути, без которых Deep Scan неполный:

1. **XSD-каталог** (`.xsd*_root.res` файлы платформы 1С).
2. **MCP `bsl-platform`** подключён в `~/.Codex.json`. После запуска Codex должны быть доступны инструменты `mcp__bsl-platform__search`, `mcp__bsl-platform__getMembers`, `mcp__bsl-platform__getMember`, `mcp__bsl-platform__info`, `mcp__bsl-platform__getConstructors`.
3. **Карта ru↔en** (`~/.cache/mcp-bsl/ru-en-map.json`) — ~10 000 пар русское имя → английский синоним. Файл генерируется один раз из DEBUG-логов `TocParser` MCP-сервера (через публичный API MCP английские не отдаются).

**Если нет файла `local-resources.md` или любого из трёх ресурсов** — остановись, выведи сообщение «настрой локальные ресурсы» со ссылкой на `.Codex/skills/new-applied-object/local-resources.md`. Скилл без них работать не будет.

## Принцип: четыре ортогональных источника

| Источник | Что даёт | Когда использовать |
|---|---|---|
| MCP `getMembers` по `ОбъектМетаданных: <РусскоеИмя>` | **Русские** имена свойств + типы платформы + описания | Получить канонический русский список (= будущие YAML-ключи). |
| Карта `ru-en-map.json` | **Английский** синоним для каждого русского имени | Маппинг в TS-ключи и ориентировка на XML-теги. |
| XSD (`.xsd*_root.res`) | **Английские XML-теги** (могут отличаться от синонимов из карты!) + типы полей + наследование от `MDBaseObj` и т.п. | Источник истины для `xml: "..."` в rules.ts и для `MetadataXxxXML` в types.ts. |
| Соседние applied objects в codebase | Паттерны реализации проекта (как мапятся `MetadataItemLinks`, `SystemEnumeration`, дефолты, `defaultValueXMLEmpty`/`defaultValueXMLRaw` и т.п.) | Фундамент для правил — не изобретать заново. |

**Ни один не заменяет другой.** Если английское имя из карты не совпадает с XSD-тегом — XSD побеждает (это XML-разметка), карта остаётся как указание на «правильный» английский синоним для TS-ключа.

---

## Фаза 1. Deep Scan (молча)

Агент работает автономно, без вопросов пользователю. Короткие инлайн-комментарии «читаю X, нашёл Y» допустимы, но **вопросы не задавать**.

### Чек-лист

1. **Прочитать все XML-фикстуры целиком.** Для каждого файла:
   - `wc -l <file>` → получить число строк.
   - `Read <file> limit=<wc+10>`.
   - **Без `wc -l` Read может вернуть усечённый файл** (частая ошибка — упустить `<Dimension>` в конце `full.xml`).
   - Повторить для `__fixtures__/sync/xml/<Имя>.xml` и всех файлов в `__fixtures__/sync/xml/<Имя>/Ext/*`.
2. **Идентифицировать контейнер.** Корневой тег внутри `<MetaDataObject>` — это `container` для правила (`Sequence`, `Document`, `Catalog`, …).
3. **Собрать все вложенные теги** родителя. Не только в `<ChildObjects>`: сложные объекты могут жить прямо в `<Properties>` (AdditionalIndexes, Characteristics, Predefined, StandardAttributes, составные presentation-типы). И в `Ext/*.xml` — отдельные подфайлы.
4. **Классифицировать каждый тег:**
   - Примитив (`string`, `boolean`, `number`) — inline.
   - `I8nText` (есть `<v8:item><v8:lang>…`) — inline.
   - SystemEnumeration — известное значение из `~/metadata/systemEnumerations/types.ts` (проверь grep-ом).
   - `MetadataItemLinks` — контейнер с `<xr:Item xsi:type="xr:MDObjectRef">…</xr:Item>`.
   - `AdditionalIndex` — известный common.
   - **Подчинённый объект** — сложный тег без существующей реализации в `commonObjects/` и `appliedObjects/`. Для него — рекурсия.
5. **Рекурсия подчинённых** (бесконечная по глубине):
   - Извлечь XML-фрагмент из фикстуры родителя. Если фрагментов несколько экземпляров — выбрать полный + минимальный.
   - Определить имя: `metadata<ContainerName>` — CamelCase. Путь по умолчанию: `packages/core/metadata/commonObjects/metadata<ContainerName>/`. Если сомнения — положить в commonObjects, пользователь скорректирует в грил-вопросе.
   - Создать папку + `__fixtures__/full.xml` и (если есть вариативность) `__fixtures__/minimal.xml`. Фрагменты сохранять **как есть** из родителя, без нормализации.
   - Рекурсивно пройти по тегам подчинённого (Deep Scan внутри него).
6. **Прочитать XSD** родителя и каждого подчинённого:
   - `grep -l '<xs:complexType name="<Container>"' /Users/nikita/git/1c_res/*.xsd*_root.res` — найти файл.
   - Read найденного файла (`wc -l` → `Read limit`).
   - Извлечь `<xs:sequence>` свойств + `<xs:extension base="..."/>` базовых типов.
7. **Запросить MCP:**
   - `mcp__bsl-platform__search` с query = русское имя типа, type = "type" — найти точное имя (например `ОбъектМетаданных: Последовательность`).
   - `mcp__bsl-platform__getMembers` с `typeName` = найденное имя — получить список свойств на русском с типами.
8. **Для каждого русского имени свойства** прочитать `~/.cache/mcp-bsl/ru-en-map.json` и взять английский синоним. Сохранить тройку `(русский, английский, тип-платформы)`.
9. **Сверка английских имён из карты и XSD:** для каждого свойства проверить, совпадает ли английский синоним с `<xs:element name="...">` в XSD. При расхождении — **XSD побеждает** (это фактический XML-тег), но синоним сохранить для пометки в отчёте.
10. **Прочитать 1–2 соседних applied object.** Приоритет: (а) объекты с тем же ключом `itemType` базы (если MDBaseObj — почти все); (б) объекты с похожими свойствами (если родитель имеет `MetadataItemLinks` — смотреть `metadataDocument`; если `AdditionalIndex` — `metadataCatalog`; и т.п.). Файлы: `rules.ts`, `types.ts`, `index.ts`, `__fixtures__/full.ts`.
11. **Проверить реестры:**
    - `packages/core/metadata/orchestration/metadataItem/registry.ts` (`MetadataItemTypeRegistry`)
    - `packages/core/metadata/orchestration/property/registry.ts` (`PropertyTypeRegistry` + `PropertyRuleTypeKeys`)
    - Для каждого потенциального типа (родителя + подчинённых + их коллекций) — есть ли запись.

### Внутренний отчёт (не в чат)

По итогу Deep Scan у агента должна быть таблица:

```
Родитель: Metadata<Name>
├── container: <XMLTag>
├── свойства: [ {русский, английский, XSDtag, тип, источник: фикстура/XSD/MCP}, ... ]
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

Формат — строго по `.Codex/skills/grill-me/SKILL.md`: **по одному вопросу**, с **предлагаемым ответом** и **обоснованием**. Агент не переходит к следующему, пока не получил ответ.

Обязательные блоки (порядок):

1. **Свойства родителя** — таблица (русский / английский TS-ключ / XSD-тег / тип / YAML-ключ / источник). «Верно? Добавить/убрать? Переименовать?»
2. **Свойства вне фикстур** — найденные в XSD базового класса или в MCP, но отсутствующие в фикстурах (кандидаты `objectBelonging`, `extendedConfigurationObject` и т.п.). Для каждого рекомендуемый режим (`runtimeOnly`, `toYAML: false, fromYAML: false`, или не включать).
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

## Что делает (единственные файловые артефакты)

- Папки подчинённых: `packages/core/metadata/commonObjects/metadata<Sub>/`.
- XML-фикстуры подчинённых: `packages/core/metadata/commonObjects/metadata<Sub>/__fixtures__/full.xml` (+ `minimal.xml`).

Все остальные файлы создаются на этапе выполнения плана (после `/write-a-prd` → `/prd-to-plan` → ручная реализация по плану).

## Ссылки

- [grill-me](../grill-me/SKILL.md) — методика вопросов «по одному с рекомендацией»
- [write-a-prd](../write-a-prd/SKILL.md) — следующий шаг после этого скилла
- [_shared/metadata/rules.md](../_shared/metadata/rules.md) — справка по правилам для фазы реализации
- [_shared/metadata/types.md](../_shared/metadata/types.md)
- [_shared/metadata/fixtures-data.md](../_shared/metadata/fixtures-data.md)
- [_shared/metadata/tests.md](../_shared/metadata/tests.md)
- [_shared/metadata/io-tests.md](../_shared/metadata/io-tests.md)
