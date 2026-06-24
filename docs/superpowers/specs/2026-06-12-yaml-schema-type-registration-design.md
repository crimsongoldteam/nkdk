# Регистрация YAML-типов в JSON Schema

## Контекст

Валидация ERP YAML показывает группу ошибок `Unexpected property`, хотя часть полей корректно читается YAML-импортом. Пример: `Команды.*.Группа` импортируется через `MetadataCommandGroup`, но этот тип не зарегистрирован для `exportToJSONSchema`, поэтому поле отсутствует в схеме владельца.

Проверка регистраций выявила типы, у которых есть `importFromYAML`, но нет `exportToJSONSchema`. Часть из них описана через `rules.ts`, часть реализована ручными преобразователями.

## Решение

Добавить `exportToJSONSchema` для типов, которые реально участвуют в YAML-контракте и сейчас выпадают из схемы.

Для типов, описанных через `rules.ts`, схема должна строиться из существующих правил:

- `GroupItemAuto`
- `GroupItemField`
- `StructureItemGroup`

Для ручных типов схема должна повторять фактический YAML-контракт импортера:

- `MetadataCommandGroup`: строка со стандартной группой команды или ссылкой на metadata item.
- `AssociatedTable`: значение таблицы, принимаемое текущим YAML-импортом.
- `StyleItemValue`: поддерживаемые YAML-значения стиля без расширения синтаксиса.
- `DcsAvailableValues`, `DcsMetadataTypedValue`, `SettingsParameterValueCollection`: компактные и объектные формы, которые уже принимает DCS YAML-импорт.
- `ChildSubsystemNames`, `CommonAttributeContent`: простые ручные структуры по существующему импорту.

Для типов вроде `ClientApplicationInterfaceItems`, `HomePageWorkArea*`, `ClientApplicationForm`, `MetadataEnumerationValues` решение откладывается до отдельного разбора, если они проявятся в текущей ERP-валидации. Они завязаны на ручные регистры или целые модели, поэтому их не нужно чинить механически в этой задаче.

## Защита от повторения

Добавить тест-инвентаризацию регистраций:

- тип с `importFromYAML`, который используется в YAML-правилах, должен иметь `exportToJSONSchema`;
- исключения допускаются только через явный allow-list с причиной;
- тест должен подсвечивать новые незарегистрированные типы до запуска полной ERP-валидации.

## Проверка

Проверить:

- точечные тесты для новых schema exporter;
- `pnpm --filter @nakidka/core test`;
- повторную валидацию `/home/nikita/git/temp-yaml` и снижение `Unexpected property` по исправленным группам.
