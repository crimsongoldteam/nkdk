# Спек: приведение тестов `metadataDocument` к стандарту `new-metadata-item`

**Дата:** 2026-04-26
**Каталог объекта:** `packages/core/metadata/appliedObjects/metadataDocument/`
**Эталон:** `packages/core/metadata/appliedObjects/metadataCatalog/`

## Цель

Привести шесть тестовых файлов `metadataDocument` к шаблону, описанному в `.claude/skills/new-metadata-item/SKILL.md` и `.claude/skills/_shared/metadata/tests.md`. Допускается, что часть тестов после миграции станет красной — это честный сигнал об инфраструктурных блокерах, перечисленных в `2026-04-26-metadata-document-round-trip-gaps-design.md`. Маскировать падения через `it.skip` или ослабленные assertions запрещено.

## Расхождения, которые закрываем

1. **TS-фикстуры отсутствуют.** На каждую XML-фикстуру (`full.xml`, `minimal.xml`, `withNumerator.xml`) нужен файл `__fixtures__/<name>.ts` с экспортом `<name>: MetadataDocument` и (на втором этапе, после YAML-цикла) `<name>YAML: MetadataDocumentYAML`.
2. **`fromXML.test.ts`** проверяет отдельные поля. Заменяем на `expect(result).toEqual(<fixture>)` для каждой XML-фикстуры. Добавляем round-trip-блок через `it.each([...])` по образцу Catalog.
3. **`toXML.test.ts`** работает в smoke-режиме (`toContain`) и имеет `it.skip` на основной round-trip. Переписываем на `expect(exportFixture(full, "full.xml")).toEqual(expected)` для каждой XML-фикстуры. `it.skip` удаляется.
4. **`syncToXML.test.ts`** smoke. Переписываем на построчное сравнение `toBe(expectedXML)` с эталонным XML, по аналогии с Catalog.
5. **`fromYAML.test.ts` / `toYAML.test.ts`** проверяют по 1–2 поля. Переписываем через `<name>YAML` фикстуры на `toEqual(full)` / `toEqual(fullYAML)` + кейс `undefined`.
6. **`convertFromXML.test.ts`** smoke на содержание подстроки. Переписываем на `toBe(readDocumentYAML)` по образцу Catalog.
7. **`withNumerator.xml`** не используется — добавляется во все релевантные тесты.

## Стратегия генерации TS-фикстур

Ожидаемый объект для `<name>` фиксируем по принципу «снимок текущего поведения импорта» — запускаем `importMetadataItemFromXML` на каждой XML-фикстуре и переносим результат в TS. Это:

- делает `fromXML` зелёным (форма соответствует фактическому импорту);
- честно красит `toXML` и round-trip там, где сломан экспорт (известные блокеры);
- даёт стабильную точку отсчёта: дальнейшие правки `rules.ts` будут проявляться как diff фикстуры в PR.

Если форма импорта явно противоречит XML-источнику (например, `posting` потерян, тогда как в XML он есть) — фикстура править не должна, такое расхождение поднимается в issue, но в рамках этого спека не закрывается.

## Структура `__fixtures__/sync/`

`Catalog` использует разделение `xml/` (источник) и `nkdk/` (YAML-источник). У `Document` сейчас только один каталог `__fixtures__/sync/ДокументВсеСвойства/` + `__fixtures__/sync/ДокументВсеСвойства.xml`. На этом этапе:

- `convertFromXML.test.ts` сравнивает результирующий `Свойства.yaml` с эталонным `Свойства.yaml` (создаётся как `__fixtures__/sync/expected/Свойства.yaml`, либо через snapshot-захват текущего вывода — выбираем второе, чтобы не блокироваться отсутствующим эталоном);
- `syncToXML.test.ts` сравнивает результирующий XML с эталонным `__fixtures__/sync/ДокументВсеСвойства.xml` (он уже есть).

Перестройку каталога `sync/` под катало­говую структуру (`xml/` + `nkdk/` + `out/`) откладываем — не входит в задачу «стандартизация тестов».

## YAML-фикстуры

YAML-цикл по скиллу — после XML. Поскольку XML-цикл сейчас не зелёный (round-trip красный из-за инфра-блокеров), но скилл говорит «без зелёного XML — не трогать YAML», мы сознательно нарушаем это требование: YAML-тесты тоже надо привести к стандарту. Альтернатива — оставить YAML-тесты smoke-уровнем, но это противоречит исходной задаче «сделать тесты стандартными». Делаем.

YAML-фикстуры тоже снимаем как «снимок текущего вывода `exportMetadataItemToYAML`».

## Файлы, которых касаемся

### Создаём
- `__fixtures__/full.ts` — `full`, `fullYAML`
- `__fixtures__/minimal.ts` — `minimal`, `minimalYAML`
- `__fixtures__/withNumerator.ts` — `withNumerator`, `withNumeratorYAML`
- `__fixtures__/sync/data.ts` — `readDocumentYAML` (snapshot текущего `Свойства.yaml`)

### Переписываем
- `fromXML.test.ts`
- `toXML.test.ts`
- `syncToXML.test.ts`
- `fromYAML.test.ts`
- `toYAML.test.ts`
- `convertFromXML.test.ts`

### Не трогаем
- `rules.ts`, `types.ts`, `defaults.ts`, `index.ts`
- XML-фикстуры (источник истины)
- `__fixtures__/sync/ДокументВсеСвойства/` (YAML-сторона sync)

## Ожидаемый результат после прогона `pnpm test`

| Тест | Ожидание |
|------|----------|
| `fromXML.test.ts` — `it("import full")` | зелёный (фикстура снята с импорта) |
| `fromXML.test.ts` — `it("import minimal")` | зелёный |
| `fromXML.test.ts` — `it("import withNumerator")` | зелёный |
| `fromXML.test.ts` — round-trip | **красный** (export сломан, см. блокеры) |
| `toXML.test.ts` — все фикстуры | **красный** |
| `syncToXML.test.ts` | **красный** |
| `fromYAML.test.ts` | зелёный |
| `toYAML.test.ts` | зелёный |
| `convertFromXML.test.ts` | зелёный (snapshot текущего YAML) |

Красные тесты — ожидаемое следствие незакрытых инфра-блокеров. После их фикса в отдельных issue (PR #142 закрывает часть rules-пробелов; остальные пять блокеров остаются) тесты позеленеют без правок.

## Что НЕ входит в задачу

- Починка `mockContextToXML.uuid`
- Сортировка `StandardAttributes`
- `InternalInfo` на `DocumentTabularSection`
- Сериализация `<Form>` / `<Template>` (PRD-2)
- Удаление `<Use>ForItem</Use>` у атрибутов
- Перестройка `__fixtures__/sync/` под каталоговую структуру

Эти пункты ведутся отдельно (см. `2026-04-26-metadata-document-round-trip-gaps-design.md`).
