# Переименование defaultValueYAML в implicitValueYAML

## Контекст

`defaultValueYAML` в rules.ts звучит как значение, которое нужно подставлять при
импорте YAML. Фактический контракт другой: это значение подразумевается
отсутствием ключа в YAML и поэтому не выгружается как явное.

В кодовой базе уже есть `implicitValueYAML`, но оно используется как специальный
маркер для открытого `SystemEnumeration`: явное `implicitValueYAML: undefined`
разрешает неизвестные YAML-значения для `CompatibilityMode`.

## Решение

Старая роль `implicitValueYAML` удаляется. Поддержка неизвестных значений
`CompatibilityMode`, завязанная на `implicitValueYAML: undefined`, также
удаляется.

`defaultValueYAML` переименовывается в `implicitValueYAML` во всех правилах,
типах, обработчиках и тестах. Новый смысл поля:

- при экспорте YAML значение, равное `implicitValueYAML`, не записывается;
- при импорте YAML отсутствие ключа не создаёт значение в модели;
- schema и типы YAML могут исключать явное значение, равное
  `implicitValueYAML`, если это поддержано для конкретного типа;
- поле не является модельным default и не заменяет `defaultValue`,
  `defaultValueXML` или `defaultValueXMLRaw`.

## Затрагиваемые части

- `packages/core/metadata/orchestration/property/types.ts`: контракт правила.
- `packages/core/metadata/orchestration/property/toYAML.ts`: фильтрация
  неявных значений при выгрузке.
- `packages/core/metadata/orchestration/metadataItem/yaml.ts` и `element.ts`:
  типовой вывод YAML и модели.
- `packages/core/metadata/systemEnumerations/*`: удаление старого маркера
  открытых перечислений.
- `packages/core/metadata/**/rules.ts`: массовое переименование поля.
- Тесты orchestration, systemEnumerations и объектов, где название поля
  проверяется явно.

## Проверка

Минимальная проверка:

- targeted-тесты для `property/fromYAML`, `property/toYAML`,
  `systemEnumerations/fromYAML`, `systemEnumerations/toYAML`,
  `systemEnumerations/toJSONSchema`;
- `pnpm test` из корня перед закрытием задачи.

## Не входит

- Введение нового флага для неизвестных будущих значений `CompatibilityMode`.
- Изменение XML-фикстур.
- Добавление новых правил fromXML/toXML/fromYAML/toYAML без необходимости:
  существующий механизм rules.ts должен остаться основным.
