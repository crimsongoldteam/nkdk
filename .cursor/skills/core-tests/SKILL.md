---
name: core-tests
description: >-
  Тесты и фикстуры в packages/core: Vitest, *.test.ts, __fixtures__, эталоны в data.ts.
  Без round-trip. Эталонный XML, forReference и порядок узлов в toXML — скил core-xml-reference-tests.
  Контекст репозитория — nakidka-core. Используй при тестах метаданных, XML/YAML/DCS и новых фикстурах.
---

# Тесты и фикстуры packages/core

Общий контекст репозитория и соглашения имён файлов `from*` / `to*` — [nakidka-core](../nakidka-core/SKILL.md).

## Алгоритм написания тестов

1. Из конфигурации 1С выгружается объект метаданных (или его фрагмент) в **`__fixtures__/*.xml`**.
2. В **`__fixtures__/data.ts`** задают **тот же сценарий** по модели объекта (из types.ts). Также добавляется эталон YAML (объекты с постфиксом YAML).
3. Каждый тест попарно сравнивает эталон и результат экспорта/импорта.

## Распространенные ошибки

❌ **Не** писать round-trip тесты.

## Содержимое фикстур

- **XML** — фрагменты выгрузки из 1С в формате XML для разбора или сравнения в тестах.
- **`data.ts`** — модели объектов и YAML.

## Группы тестов для свойств

### fromXML (XML → модель)

Тест хранится в файле `fromXML.test.ts`.

#### Пример

Пример теста можно посмотреть в файле `packages/core/metadata/forms/elements/contextMenu/fromXML.test.ts`.

- В тесте используется функция `testImportPropertyFromXML`, следует всегда использовать её для проверки метаданных.
- XML фикстура читается из файла `__fixtures__/full.xml` (для минимального кейса — `__fixtures__/minimal.xml`).
- В примере теста используется фикстура `fullContextMenu` из файла `__fixtures__/data.ts`.

### toXML (модель → XML)

Тест всегда хранится в файле `toXML.test.ts`.

#### Пример

Пример теста можно посмотреть в файле `packages/core/metadata/forms/elements/contextMenu/toXML.test.ts`.

- Используется **`testExportPropertyToXML`** из `packages/core/tests/exportElementToXML.ts`.
- Эталонный XML читается из `packages/core/tests/fixtures` (в примере — `forms/contextMenu/full.xml` и `forms/contextMenu/minimal.xml`).

Режим эталона (`mockContextFromXML({ forReference: true })`), `referenceMetadata` и порядок узлов в выгрузке — в [core-xml-reference-tests](../core-xml-reference-tests/SKILL.md). Для fromXML используй `testImportPropertyFromXML` из `packages/core/tests/importPropertyFromXML.ts`.

### fromYAML (YAML → модель)

Тест хранится в файле `fromYAML.test.ts`.
Пример: `packages/core/metadata/forms/elements/contextMenu/fromYAML.test.ts`.
Вызывают `importPropertyFromYAML` с контекстом `mockContext` из `packages/core/tests/mockContext`, `rule` и эталонными значениями YAML из `__fixtures__/data.ts` (в примере — `fullContextMenuYAML` / `minimalContextMenuYAML`; для полного кейса также передают `sourceValue`: `fullContextMenuSource` и т.п., как в фикстурах).
Результат сравнивают с объектом из `data.ts` (например `fullContextMenu`, `minimalContextMenu`).

### toYAML (модель → YAML)

Тест хранится в файле `toYAML.test.ts`.
Пример: `packages/core/metadata/forms/elements/contextMenu/toYAML.test.ts`.
Используется `exportPropertyToYAML` с контекстом `mockContext` и `rule`, в котором задан ключ сериализации в YAML (в примере — `yaml: "КонтекстноеМеню"`).
Входное значение — модель из `__fixtures__/data.ts` (например `fullContextMenu`); ожидаемый фрагмент YAML — `fullContextMenuYAML` и аналоги в том же `data.ts` (проверка через `toHaveProperty` / `toEqual` по образцу теста).

### DCS / фрагмент компоновки: XML → модель (`fromDcsXML` и аналоги)

- Читать XML: `readAndParseXMLFixture(import.meta.url, "….xml")` из `packages/core/tests/readFixtureXML.ts`.
- Вызвать `import…FromDcsXML` (контекст `mockContextFromXML()`, при необходимости **rule** с `valueType` / `typeSE`).
- **`expect(результат).toEqual(fixtureИзDataTs)`**.

### DCS: модель → XML (`toDcsXML`)

- Взять объект из `data.ts`, вызвать `export…ToDcsXML`, обернуть в ожидаемый корень (например `{ "dcscor:item": … }`), сериализовать через `xmlExport`.
- Сравнить с эталонным XML: например обе строки прогнать через `importContentFromXML` и сравнить деревья **или** сравнить строку с фикстурой — по образцу соседнего модуля в репозитории.

## Связь с кодом

- Тесты импортируют фикстуры из `./__fixtures__/...` (или через относительный путь от файла теста).
- При добавлении пары **from/to** для нового кейса: положить XML и эталоны в `__fixtures__` и `data.ts`, в тесте сравнивать с **явными** ожидаемыми значениями по образцу соседних `*.test.ts`.

## Связанные скилы

- [nakidka-core](../nakidka-core/SKILL.md) — монорепозиторий, домен `metadata`, `from*` / `to*`, DCS vs обычный XML
- [core-xml-reference-tests](../core-xml-reference-tests/SKILL.md) — эталонный XML, `forReference`, порядок полей
- [rules](../rules/SKILL.md) — при изменении `rules.ts` под новые поля
