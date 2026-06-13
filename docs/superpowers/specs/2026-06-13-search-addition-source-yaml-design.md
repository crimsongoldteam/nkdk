# Search additions source YAML design

## Context

После уточнения ошибок `Unexpected property` в ERP YAML остались две группы, связанные с полем `Источник`:

- `Вид: ОтображениеСтрокиПоиска` — `Источник`, 250 ошибок.
- `Вид: УправлениеПоиском` — `Источник`, 116 ошибок.

Ошибки приходят из typed YAML-элементов с полем `Вид`: обычных дочерних элементов командной панели `SearchStringAddition` и `SearchControlAddition`.

`Источник` не должен попадать в YAML для этих элементов и не должен считаться допустимым YAML-полем. Модель и XML-слой при этом продолжают использовать `additionSource` там, где он пришёл из XML/reference.

`Надпись` и `ФорматированныйЗаголовок` в эту работу не входят.

## Goal

Исключить `Источник` из YAML-цикла для `SearchStringAddition` и `SearchControlAddition`, не меняя XML/reference-поведение и не разрешая это поле в YAML-схеме.

## Design

В правилах `SearchStringAdditionRules.additionSource` и `SearchControlAdditionRules.additionSource` оставить текущую модель:

- `type: "TableAdditionalSource"`;
- `additionalSourceType`.

Добавить YAML-аннотации исключения:

- `yaml: "Источник"`;
- `toYAML: false`;
- `fromYAML: false`.

Если проверка покажет, что `fromYAML: false` не исключает поле из JSON Schema, добавить точечное исправление в генератор YAML-схемы: свойства с `fromYAML: false` не должны попадать в схему валидации.

`SingleSearchStringAdditionRules` и `SingleSearchControlAdditionRules` в этой работе не меняются.

## Data Flow

XML -> model:

- `TableAdditionalSource` продолжает читать источник в модель.
- Для reference-режима сохраняется текущее поведение.

model -> YAML:

- `additionSource` у `SearchStringAddition` и `SearchControlAddition` не выгружается.

YAML -> model:

- `Источник` у `SearchStringAddition` и `SearchControlAddition` игнорируется на уровне правил и не считается частью контракта.
- Валидация должна сообщать `Unexpected property`, если пользователь добавит `Источник` в YAML этих элементов.

model -> XML:

- XML/reference-поведение для `additionSource` не меняется.
- Явное YAML-поле `Источник` не участвует в XML-выгрузке.

## Tests

Покрыть поведение точечно:

- JSON Schema для `SearchStringAddition` не содержит `Источник`.
- JSON Schema для `SearchControlAddition` не содержит `Источник`.
- `exportToYAML` для этих элементов не выводит `Источник`.

После изменений прогнать:

- точечные тесты metadata/forms;
- `pnpm --dir packages/core type-check`;
- `pnpm test`;
- повторную CLI-валидацию `/home/nikita/git/temp-yaml/erp`.

## Success Criteria

- Ошибки `Unexpected property` по `Источник` для `ОтображениеСтрокиПоиска` и `УправлениеПоиском` исчезают после повторной выгрузки YAML.
- Если `Источник` вручную присутствует в YAML этих элементов, валидатор продолжает считать его лишним свойством.
- XML/reference-поведение поисковых дополнений не меняется.
