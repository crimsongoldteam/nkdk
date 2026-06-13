# Single search additions source YAML design

## Context

После уточнения ошибок `Unexpected property` в ERP YAML остались две группы, связанные с полем `Источник`:

- `Вид: ОтображениеСтрокиПоиска` — `Источник`, 250 ошибок.
- `Вид: УправлениеПоиском` — `Источник`, 116 ошибок.

Эти элементы в форме бывают в двух режимах:

- обычные дочерние элементы командной панели: `SearchStringAddition` и `SearchControlAddition`;
- singleton-свойства таблицы: `SingleSearchStringAddition` и `SingleSearchControlAddition`.

Для обычных элементов `Источник` является частью YAML. Для singleton-вариантов источник вычисляется из родительской таблицы при экспорте в XML, поэтому `Источник` не должен попадать в YAML и не должен считаться допустимым YAML-полем.

`Надпись` и `ФорматированныйЗаголовок` в эту работу не входят.

## Goal

Исключить `Источник` из YAML-цикла для `SingleSearchStringAddition` и `SingleSearchControlAddition`, не меняя XML-поведение и не разрешая это поле в YAML-схеме.

## Design

В правилах `SingleSearchStringAdditionRules.additionSource` и `SingleSearchControlAdditionRules.additionSource` оставить текущую модель:

- `type: "TableAdditionalSource"`;
- `additionalSourceType`;
- `forSingleElement: true`.

Добавить YAML-аннотации исключения, если генератор схемы уже уважает `fromYAML: false`:

- `yaml: "Источник"`;
- `toYAML: false`;
- `fromYAML: false`.

Если проверка покажет, что `fromYAML: false` не исключает поле из JSON Schema, добавить точечное исправление в генератор YAML-схемы: свойства с `fromYAML: false` не должны попадать в схему валидации.

## Data Flow

XML -> model:

- `TableAdditionalSource` продолжает читать источник в модель.
- Для reference-режима сохраняется текущее поведение.

model -> YAML:

- `additionSource` у single-вариантов не выгружается.
- Обычные `SearchStringAddition` и `SearchControlAddition` продолжают выгружать `Источник`.

YAML -> model:

- `Источник` у single-вариантов игнорируется на уровне правил и не считается частью контракта.
- Валидация должна сообщать `Unexpected property`, если пользователь добавит `Источник` в YAML single-варианта.

model -> XML:

- Для single-вариантов XML `Item` продолжает вычисляться из родительской таблицы через `forSingleElement: true`.
- Явное YAML-поле `Источник` не участвует в XML-выгрузке.

## Tests

Покрыть поведение точечно:

- JSON Schema для `SingleSearchStringAddition` не содержит `Источник`.
- JSON Schema для `SingleSearchControlAddition` не содержит `Источник`.
- `exportToYAML` для таблицы с поисковыми singleton-дополнениями не выводит `Источник`.
- Обычные `SearchStringAddition` и `SearchControlAddition` сохраняют `Источник` в YAML-схеме.

После изменений прогнать:

- точечные тесты metadata/forms;
- `pnpm --dir packages/core type-check`;
- `pnpm test`;
- повторную CLI-валидацию `/home/nikita/git/temp-yaml/erp`.

## Success Criteria

- Ошибки `Unexpected property` по `Источник` для `ОтображениеСтрокиПоиска` и `УправлениеПоиском` исчезают после повторной выгрузки YAML.
- Если `Источник` вручную присутствует в YAML single-варианта, валидатор продолжает считать его лишним свойством.
- XML round-trip для single поисковых дополнений не меняется.
