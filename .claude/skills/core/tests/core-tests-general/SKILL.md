---
name: core-tests-general
description: Базовый скилл для тестов конвертеров в packages/core/metadata — PropertyRule (testImport/ExportPropertyToXML/YAML) и MetadataItemRule (import/exportMetadataItem*). Читай перед fromXML, toXML, fromYAML, toYAML.
---

Используй этот скилл **первым** для всех тестов конвертеров метаданных в `packages/core/metadata/**`, затем открой узкий скилл по направлению:

| Направление | Скилл |
|-------------|--------|
| Импорт XML | [core-test-fromXML](./core-test-fromXML/SKILL.md) |
| Экспорт XML | [core-tests-toXML](./core-tests-toXML/SKILL.md) |
| Импорт YAML | [core-test-fromYAML](./core-test-fromYAML/SKILL.md) |
| Экспорт YAML | [core-tests-toYAML](./core-tests-toYAML/SKILL.md) |

**Два типа кода:** (1) **свойство** с `rule.type` в `PropertyTypeRegistry` и хелперами из `~/tests/property` (см. ниже); (2) **metadata-item** с `...Rules` — в **продакшен-коде** по-прежнему `importMetadataItemFromXML` / `exportMetadataItemToXML` / `importMetadataItemFromYAML` / `exportMetadataItemToYAML`, но в **тестах** вызывай ту же логику только через обёртки property и хелперы тестов, не через прямые вызовы metadata-item API.

## Обёртки тестов из `packages/core/tests/property` (обязательно)

В `*.test.ts` для конвертеров **не вызывай напрямую** `importMetadataItemFromXML`, `exportMetadataItemToXML`, `importMetadataItemFromYAML`, `exportMetadataItemToYAML` из `~/metadata/orchestration/metadataItem/...`. Вместо этого используй хелперы, которые оборачивают `importPropertyFromXML` / `exportPropertyToXML` / `importPropertyFromYAML` / `exportPropertyToYAML` с `PropertyRule` и стандартным контекстом:

| Направление | Хелпер | модуль |
|-------------|--------|--------|
| XML → модель | `testImportPropertyFromXML` | `~/tests/property/importPropertyFromXML` |
| модель → XML | `testExportPropertyToXML` | `~/tests/property/exportPropertyToXML` |
| YAML → модель | `testImportPropertyFromYAML` | `~/tests/property/importPropertyFromYAML` |
| модель → YAML | `testExportPropertyToYAML` | `~/tests/property/exportPropertyToYAML` |

В `PropertyRule` указывай `type` из реестра property (`PropertyTypeRegistry`), для которого зарегистрировано нужное направление (например union `FilterItem` для XML). Если для сценария тип ещё не зарегистрирован — **сначала** добавь `registerTypeRule` / цепочку через property, **затем** пиши тест через соответствующий `test*`.

**Исключение:** тест **прямого** конвертера в отдельном `fromYAML.ts` / `toYAML.ts` (`importFooFromYAML` / `exportFooFromYAML`) — вызов с `mockContext` по шаблону скилла, без обязательного `testImportPropertyFromYAML` / `testExportPropertyToYAML`, если это не путь через `importPropertyFromYAML` / `exportPropertyToYAML`.

## Что нужно делать

1. Тестируй конвертацию целиком через сверку с эталонной фикстурой модели из `__fixtures__/data.ts`.
2. Храни **все тестовые фикстуры** в `__fixtures__/data.ts` (включая модели, YAML-представления, `PropertyRule` и другие входные/ожидаемые данные). Не объявляй fixture-объекты внутри `*.test.ts`.
   - Для фикстур **full** (полное описание всех свойств объекта) объявляй эталонную модель с `satisfies Required<…>`, где в угловых скобках — внутренний тип metadata-модели (например `export const fullDynamicList = { … } satisfies Required<DynamicList>`). Так TypeScript проверяет, что в объекте заданы все ключи модели верхнего уровня. Если в типе есть взаимоисключающие ключи — редко для одного `MetadataItemRule` — используй `Required<Omit<..., keys>>`.
   - Для **YAML-эталона** (`YAMLTypeByRule`, `ToYAML<…>`) не всегда достаточно голого `Required<…>`: у свойств с `defaultValueYAML` в правиле тип значения в YAML **исключает литерал по умолчанию** (см. `YAMLTypeByRule` / `ValueTypeWithDefault` в `metadata/orchestration/metadataItem/yaml.ts`), а в union-типах ключи могут отличаться (как в `ButtonPartialYAML`). Паттерн: **`as const satisfies Required<Omit<YAMLType, K1 | K2 | …>>`**, где в `Omit` перечислены:
     - ключи, которые в типе YAML **конфликтуют** с другими вариантами (пример: `fullButtonPartialYAML` / `Required<Omit<ButtonPartialYAML, "Заголовок" | "ЗапретитьИспользование">>` в `packages/core/tests/fixtures/forms/button/data.ts`);
     - ключи, для которых **литерал по умолчанию исключён** из типа значения — при необходимости добавь пересечение `& { … }` с явными литералами для экспортируемых значений (например `ВидСравнения: "Равно"` при `defaultValueYAML: "Equal"` в правиле), если `satisfies` без этого не сходится.
   - Эталон YAML для сравнения с `exportMetadataItemToYAML` / `exportPropertyToYAML` должен **точно совпадать** с тем, что отдаёт экспорт (включая отсутствие ключей при `undefined`); не требуй в `Required` ключи, которые экспорт не выводит.
3. Для `fromXML` / `fromDcsXML`:
   - читай XML-фикстуру из `__fixtures__/*.xml`,
   - импортируй в модель,
   - сравнивай результат с полной fixture-моделью.
4. Для `fromYAML`:
   - для **свойств** через реестр — `testImportPropertyFromYAML` и `value` из `data.ts` (см. раздел «Обёртки тестов»);
   - для **прямого** `importFooFromYAML` в своём модуле — вызов функции с `mockContext` и эталоном из `data.ts`;
   - сравнивай результат с полной fixture-моделью из `data.ts`.
5. Для `toXML` / `toDcsXML`:
   - бери полную fixture-модель из `data.ts`,
   - экспортируй в XML,
   - сравнивай с XML-эталоном через парсинг XML-структуры (не строкой).
6. Для `toYAML`:
   - для **свойств** через реестр — `testExportPropertyToYAML` (`~/tests/property/exportPropertyToYAML`); в `PropertyRule` нужен `yaml` (ключ выхода);
   - для **прямого** `exportFooToYAML` — вызов с `mockContext` и сверка с `*YAML` из `data.ts`.
7. Общее чтение YAML-файлов в тестах: `~/tests/readAndParseYAMLFile` (аналог разбора XML-фикстур).
8. Используй стандартные контексты (`mockContext`, `mockContextFromXML`, `mockContextToXML`) и шаблоны из таблицы выше — не выдумывай формат теста с нуля, если подходит готовый скилл.
9. В XML-фикстурах не оставляй последнюю пустую строку: файл должен заканчиваться последним содержательным XML-тегом.

## Что не нужно делать

1. Не делай round-trip тесты (например, `XML -> model -> XML -> model` или `YAML -> model -> YAML -> model`).
2. Не тестируй отдельные свойства/поля объекта точечными `expect`-проверками.
3. Не проверяй частичные фрагменты модели, если есть полная fixture-модель для сравнения.
4. Не сравнивай XML как строку, если можно сравнить распарсенные структуры.
5. Не дублируй low-level проверки, если поведение уже покрывается сверкой полной модели с фикстурой.

## Критерий хорошего теста

Тест считается корректным, если он проверяет, что результат конвертации полностью совпадает с эталонной fixture-моделью (или fixture-представлением), без round-trip сценариев и без точечных проверок отдельных свойств.
