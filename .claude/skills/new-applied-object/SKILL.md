---
name: new-applied-object
description: Добавление нового прикладного объекта (Документ, Перечисление, Последовательность и т.п.) по фикстурам и схемам. Используй этот скилл при добавлении объектов из packages/core/metadata/appliedObjects/.
---

# Добавление нового прикладного объекта

## Принцип работы

Процесс **итеративный**, не линейный. Два отдельных цикла: XML-цикл и YAML-цикл. Каждый цикл начинается с round-trip — это жёсткий барьер: пока round-trip не зелёный, следующие шаги цикла не запускаются. Ошибка на любом шаге цикла → фикс `rules.ts` → перезапуск цикла с round-trip.

После YAML-цикла — IO-тесты (`convertFromXML.test.ts` и `syncToXML.test.ts`), которые проверяют работу общего оркестратора с фикстурами на диске.

> **Жёсткий барьер: XML-цикл сначала, YAML-цикл потом.**
> Пока XML-цикл не завершён полностью, запрещено касаться YAML-аннотаций в `rules.ts` и файлов `fromYAML.test.ts` / `toYAML.test.ts`.

## Точка входа

**Новый объект** — начинай с шага 1 (Бриф).

**Существующий объект** (диагностика, починка свойства) — пропускай шаги 1–6 и начинай с XML-цикла (шаг 7). Если XML-цикл уже зелёный и проблема только в YAML — начинай с YAML-цикла (шаг 11). Если нужны только IO-тесты — начинай с шага 14.

---

## Специфика прикладного объекта

Три особенности, которые отличают прикладной объект от обычного metadataItem:

### 1. Обязательное свойство `metaDataObject`

Первым свойством в `rules.ts` прикладного объекта **всегда** идёт `metaDataObject`:

```typescript
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"

export const <MetadataName>Rules = {
  itemType: "<InternalType>",
  itemTypePrefix: "<РусскийПрефикс>",
  properties: {
    metaDataObject: {
      type: "MetaDataObject",
      container: "<ИмяКонтейнера>",   // например: "Catalog", "DocumentNumerator", "Document"
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    // ... остальные свойства
  },
} as const satisfies MetadataItemRule
```

- `container` — имя внутреннего тега XML (`<Catalog>`, `<DocumentNumerator>` и т.п.). Берётся из XML-фикстуры.
- `rootAttributes: V8_MDCLASSES_ROOT` — общий пресет xmlns-атрибутов корневого `<MetaDataObject>`. Не дублировать, импортировать из `orchestration/appliedObject/presets`.
- `forReferenceOnly: true` — свойство не является данными объекта; обрабатывается только оркестратором.

### 2. Опциональные свойства `forms` и `templates`

Если прикладной объект может иметь формы и/или макеты — добавь соответствующие свойства:

```typescript
forms: {
  type: "ChildFormNames",
  xml: "Form",
  folderName: "Формы",           // имя подпапки в файловой системе
  forReferenceOnly: true,
  toYAML: false,
  fromYAML: false,
  xmlParents: ["ChildObjects"],
},
templates: {
  type: "ChildTemplateNames",
  xml: "Template",
  folderName: "Макеты",          // имя подпапки в файловой системе
  forReferenceOnly: true,
  toYAML: false,
  fromYAML: false,
  xmlParents: ["ChildObjects"],
},
```

`folderName` сообщает IO-оркестратору (`syncAppliedObjectToXML`), какую подпапку сканировать при сборке списка форм/макетов из файловой системы.

### 3. IO-тесты и структура `__fixtures__/sync/`

Помимо стандартного квартета round-trip тестов, прикладной объект имеет IO-тесты через общий оркестратор. Структура фикстур и шаблоны тестов — [io-tests.md](../_shared/metadata/io-tests.md).

---

## Шаг 1. Бриф (последовательный)

Не задавай сразу всё списком. Перед каждым вопросом — **быстро исследуй кодовую базу** (XML-фикстуры, `types.ts` рядом, похожие соседние appliedObjects) и спрашивай только то, что из кода не выводится.

Пункты брифа — в этом порядке, по одному:

**XML-сторона:**

1. Путь к каталогу нового объекта — обычно дан в аргументе команды. Фиксированное место: `packages/core/metadata/appliedObjects/<имя>/`.
2. XML-фикстуры — проверь, что в `__fixtures__/` лежит 1–3 файла с разным заполнением. Если меньше — попроси добавить **до** продолжения.
3. Имя контейнера (`container`) — из XML-фикстуры: тег внутри `<MetaDataObject>`. Подтверди.
4. Схема объекта (XSD) — получи от пользователя, если нет в репозитории.
5. Свойства, не встречающиеся в XML-фикстурах (например, `runtimeOnly`-поля) — запроси отдельным пунктом.
6. Наличие форм и макетов — есть ли `<Form>`-теги в `<ChildObjects>`? Нужны ли свойства `forms` / `templates`?
7. Дочерние коллекции — извлеки из XML-фикстуры, подтверди наличие/отсутствие.
8. Известные ограничения (read-only, «только на запись») — явный вопрос.

**YAML-сторона (обязательно спрашиваем заранее, применяем только на шаге 11):**

9. YAML-имена ключей для каждого свойства (проверь `types.ts` / соседний appliedObject).
10. `itemTypePrefix` — YAML-префикс объекта верхнего уровня (например, `"Документ"`, `"Перечисление"`).
11. Для каких свойств нужен `defaultValueYAML`.
12. Свойства, исключённые из YAML (`toYAML: false`, `fromYAML: false`).
13. Особые YAML-флаги (`excludeIfEqualNameYAML`, `useAsShortValueYAML`) — по аналогии с соседом, предложи явно.

Без брифа не начинай работу.

## Шаг 2. Анализ

Прочитай XML-фикстуры, схему, список свойств. Сверься с 1–2 **похожими существующими appliedObjects** в `packages/core/metadata/appliedObjects/` — как они решают аналогичные задачи. Обрати внимание на `metadataCatalog` (полный кейс с формами и макетами) и `metadataDocumentNumerator` (минимальный кейс без ChildObjects).

## Шаг 3. `types.ts`

Создай файл типов. Подробнее — [types.md](../_shared/metadata/types.md).

## Шаг 4. `rules.ts` — первое приближение ⟲

Создай файл правил. Подробнее — [rules.md](../_shared/metadata/rules.md).

Обязательно:
- Первым свойством добавь `metaDataObject` (см. раздел «Специфика», п. 1).
- Если объект имеет формы или макеты — добавь `forms` / `templates` (см. п. 2).
- Импортируй `V8_MDCLASSES_ROOT` из `~/metadata/orchestration/appliedObject/presets`.

Правило: **предпочитай `rules.ts`** вместо ручных `fromXML`/`toXML`.

## Шаг 5. Регистрация типов

Без регистрации round-trip не запустится. Нужно **три** точки правки:

**5.1. `MetadataItemTypeRegistry`** — `packages/core/metadata/orchestration/metadataItem/registry.ts`.
Добавь ключ типа: `<ObjectName>: { metadata: <ObjectName>; yaml: <ObjectName>YAML }`.

**5.2. `PropertyTypeRegistry` + `PropertyRuleTypeKeys`** — `packages/core/metadata/orchestration/property/registry.ts`.
- `PropertyTypeRegistry` — добавь ключ `<ObjectName>: { item: <ObjectName>; yaml: <ObjectName>YAML }`.
- Массив `PropertyRuleTypeKeys` — добавь строку `<ObjectName>: "<ObjectName>"`.

**5.3. Привязка правила к типу** — в `types.ts` самого объекта вызови `registerMetadataItemRule({ propertyType, itemRule })` (см. [types.md](../_shared/metadata/types.md)).

## Шаг 6. `index.ts`

Создай `index.ts` в каталоге объекта (`packages/core/metadata/appliedObjects/<имя>/index.ts`). Пропиши его в `index.ts` вышестоящего каталога `appliedObjects/`.

---

## XML-цикл

Шаги 7–10 образуют цикл. Ошибка на любом шаге → фикс → перезапуск с шага 7.

## Шаг 7. XML round-trip ⟲ (жёсткий барьер)

Напиши `fromXML.test.ts` с **round-trip блоком**: импорт XML → экспорт полученной структуры → сравнение с исходным XML (строковое, без канонизации). Шаблоны и правила сравнения — [tests.md](../_shared/metadata/tests.md).

Если расхождения — не переходи к шагу 8. Применяй протокол эскалации ([tests.md](../_shared/metadata/tests.md)), правь `rules.ts`, перезапускай цикл.

**Если расхождение во фрагменте подчинённого объекта** — стоп. Одним сообщением пользователю: имя подчинённого, путь к его каталогу, XML-фрагмент из фикстуры. Жди решения, не правь чужой `rules.ts` сам.

## Шаг 8. TS-фикстуры

На каждую XML-фикстуру `<name>.xml` — отдельный TS-файл `__fixtures__/<name>.ts`. Подробнее — [fixtures-data.md](../_shared/metadata/fixtures-data.md).

YAML-поля на этом шаге **не заполняй** — добавляются на шаге 11.

## Шаг 9. fromXML тест

Допиши в `fromXML.test.ts` блок `it("import <name>")` с `expect(result).toEqual(<fixtureName>)`. Round-trip блок остаётся как регресс.

Если тест падает → фикс → перезапуск цикла с шага 7.

## Шаг 10. toXML тест

Создай `toXML.test.ts`.

Если тест падает → фикс → перезапуск цикла с шага 7.

---

## Барьер: обсуждение YAML-структуры

Не переходи к YAML-циклу, пока XML-цикл не завершён полностью (шаги 7–10 зелёные).

Сгенерируй **черновик YAML** из TS-фикстур по аналогии с 1–2 похожими соседними appliedObjects. Покажи пользователю черновик + список явных вопросов. Без подтверждения пользователя YAML-правила не пиши.

---

## YAML-цикл

Шаги 11–13 образуют цикл. Ошибка на любом шаге → фикс → перезапуск с шага 11.

## Шаг 11. YAML round-trip ⟲ (жёсткий барьер)

Допиши YAML-часть в `rules.ts`. Напиши `fromYAML.test.ts` с **round-trip блоком**: импорт YAML → экспорт → сравнение на уровне parsed object. Добавь экспорт `<fixtureName>YAML` в `__fixtures__/<name>.ts`.

Если round-trip падает — не переходи к шагу 12, устраняй расхождения и перезапускай цикл.

## Шаг 12. fromYAML тест

Допиши в `fromYAML.test.ts` блок `expect(result).toEqual(<fixtureName>)`. Round-trip остаётся как регресс.

Если тест падает → фикс → перезапуск цикла с шага 11.

## Шаг 13. toYAML тест

Создай `toYAML.test.ts`.

Если тест падает → фикс → перезапуск цикла с шага 11.

---

## IO-тесты

Шаги 14–15 проверяют работу общего IO-оркестратора (`convertAppliedObjectFromXML` / `syncAppliedObjectToXML`) с фикстурами на диске. Структура фикстур и шаблоны — [io-tests.md](../_shared/metadata/io-tests.md).

## Шаг 14. `convertFromXML.test.ts`

Создай фикстуры `__fixtures__/sync/`: XML-файл, ожидаемый `data.ts`. Напиши тест по шаблону из [io-tests.md](../_shared/metadata/io-tests.md).

## Шаг 15. `syncToXML.test.ts`

Создай `__fixtures__/sync/nkdk/<Имя>/Свойства.yaml` (и при наличии форм/макетов — подпапки `Формы/`, `Макеты/`). Напиши тест по шаблону из [io-tests.md](../_shared/metadata/io-tests.md).

---

## Шаг 16. Отчёт о покрытии

В финальном сообщении пользователю приведи **явный список свойств**, **не покрытых ни одной XML-фикстурой**.

Формат:

```
Покрытие свойств фикстурами: 12/15
Непокрытые: Parent, Comment, UseStandardCommand
```

## Ссылки

- [rules.md](../_shared/metadata/rules.md) — правила
- [types.md](../_shared/metadata/types.md) — типы
- [fixtures-data.md](../_shared/metadata/fixtures-data.md) — TS-фикстуры
- [tests.md](../_shared/metadata/tests.md) — round-trip, протокол эскалации, раздельные тесты
- [io-tests.md](../_shared/metadata/io-tests.md) — IO-тесты и структура __fixtures__/sync/
- [scripts.md](../_shared/metadata/scripts.md) — вспомогательные раннеры для печати YAML/XML
