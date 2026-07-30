# Task 4 — порядок из YAML и rules без общего XML-состояния

## Реализация

- Общий property collector больше не сохраняет `present`, aliases,
  `excludedEqualName` и `userSettingsId`. В снимок попадают только identity и
  смысловые XML-поля через `setIdentity`, `setXmlFlag` и `setXmlValue`.
- Общий экспорт свойств выбирает XML-ключ из `rule.xml ?? capitalize(propertyKey)`
  и принимает решение о default/required только по YAML и правилам.
- Из generic metadata collection удалён `preserveOmittedItemNames`. Обычные
  элементы следуют порядку YAML, а вычисляемые `completeItemNames` — порядку
  регистрации/rules.
- `StandardAttributeDescriptions` формируют канонические и динамические
  `ExtDimension*` в порядке rules без сохранённого порядка снимка.
- `Events` экспортируются в порядке ключей YAML: сначала события, затем call
  types каждого события; при отсутствии call types используется
  `EVENT_CALL_TYPES_XML`.
- `ClientApplicationInterface`, DCS `StructureItemGroup` и `CommandInterface`
  больше не собирают и не читают snapshot order.
- `createBaseFormConfigurationIndexReader` проецирует целые entity: identity
  выбранных адресов берётся из extension, остальные поля — из base.
  Проекции отдельных XML-узлов, `present` и aliases удалены.
- Остальные потребители переведены на identity/XML API снимка 1.3; тесты
  проверяют отсутствие удалённого общего состояния.

## RED / GREEN evidence

### RED

Команда из brief через package-script запустила весь набор, поэтому точный RED
зафиксирован прямым вызовом Vitest:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  metadata/forms/commonObjects/event/toXML.test.ts \
  metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts
```

```text
Test Files  4 failed (4)
Tests  78 failed | 13 passed (91)
```

Падения подтверждали обращения к удалённому legacy API collector и ожидания
сохранённых `present`, aliases и order.

### GREEN

Итоговая команда затронутых преобразований:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property \
  metadata/orchestration/metadataCollection \
  metadata/forms/commonObjects/event \
  metadata/forms/clientApplicationForm/baseForm.test.ts \
  metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  metadata/commonObjects/clientApplicationInterface \
  metadata/commonObjects/dataCompositionSystem/structureItemGroup \
  metadata/forms/commonObjects/commandInterface \
  metadata/commonObjects/standardAttributeDescription
```

```text
Test Files  52 passed (52)
Tests  398 passed (398)
Duration  2.49s
```

### TypeScript gate

Полный package type-check:

```bash
pnpm --filter @nkdk/core exec tsc --noEmit --pretty false
```

завершился с кодом 1 на ещё не мигрированных потребителях Tasks 5–8.
Программный фильтр полного вывода по изменённым файлам вернул:

```json
{
  "tsc_exit_code": 1,
  "changed_file_errors": [],
  "other_error_count": 175
}
```

`git diff --check` завершился с кодом 0.

## Самопроверка

- Проверены отрицательные ожидания для property, collection, Events,
  StandardAttributeDescriptions, ClientApplicationInterface, DCS и
  CommandInterface.
- Порядок Events следует YAML; стандартные реквизиты следуют rules, включая
  вычисляемые `ExtDimension*`.
- Base-form reader согласован для `entity`, `entities` и поиска по source path;
  extension не подменяет смысловые XML-поля base.
- XML-фикстуры не изменялись.
- Неотслеживаемый `_partial_xml_tmp/` не изменялся и не будет добавлен в
  коммит.

## Problems / concerns

- Общий core type-check остаётся красным на потребителях следующих задач; в
  39 изменённых файлах ошибок TypeScript нет.
- Package-script `test -- <path>` не ограничивает Vitest указанными файлами,
  поэтому RED/GREEN зафиксированы прямым `vitest run`.

## Fix round 1

### Изменения

- Добавлен единый договор адреса XML-state свойства: при
  `configurationIndexAddressing: "yamlPath"` используется YAML-ключ, иначе —
  внутренний `propertyKey`. Один helper применяется при import, всех чтениях
  export и копировании состояния в новый снимок.
- `xmlText` теперь записывается по уже вычисленному адресу вместе с
  `xsiNil`, `explicitEmpty`, `xsiType` и `xmlPrefix`.
- Добавлена no-reference регрессия, восстанавливающая по YAML-path адресу
  `extended`, `xsiNil`, `explicitEmpty`, `xsiType`, `xmlText` и `xmlPrefix`.
- Одиночное неизвестное Event при отсутствии сопоставления handler с
  `rule.items` получает канонический ключ события. Это одинаково работает для
  обычной binding и binding с одним callType.

### RED

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/forms/commonObjects/event/fromXML.test.ts \
  metadata/forms/commonObjects/event/toXML.test.ts
```

```text
Test Files  4 failed (4)
Tests  6 failed | 99 passed (105)
Duration  2.50s
```

Property-тесты получили XML-state по internal key или пустой XML вместо
YAML-path состояния. Event-тесты получили handler name вместо `vendorEvent`.

### GREEN

Точная команда RED после исправления:

```text
Test Files  4 passed (4)
Tests  105 passed (105)
Duration  2.58s
```

Полный gate задачи 4:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property \
  metadata/orchestration/metadataCollection \
  metadata/forms/commonObjects/event \
  metadata/forms/clientApplicationForm/baseForm.test.ts \
  metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  metadata/commonObjects/clientApplicationInterface \
  metadata/commonObjects/dataCompositionSystem/structureItemGroup \
  metadata/forms/commonObjects/commandInterface \
  metadata/commonObjects/standardAttributeDescription
```

```text
Test Files  52 passed (52)
Tests  403 passed (403)
Duration  2.75s
```

TypeScript gate:

```bash
pnpm --filter @nkdk/core exec tsc --noEmit --pretty false
```

```json
{
  "tsc_exit_code": 1,
  "changed_file_errors": [],
  "other_error_count": 175
}
```

Оставшиеся ошибки относятся к не изменённым потребителям Tasks 5–8.
