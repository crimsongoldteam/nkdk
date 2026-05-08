# Empty ListSettings round-trip

## Context

Short round-trip по XML-дампу `trade` показывает один кластер расхождений в формах списка:

- `Catalogs/КлассификаторТаможенныхПунктовСАТУРН/Forms/ФормаСписка/Ext/Form.xml`
- `Catalogs/КлассификаторТерриториальныхУправленийСАТУРН/Forms/ФормаСписка/Ext/Form.xml`
- `Catalogs/КлассификаторТранспортныхСредствСАТУРН/Forms/ФормаСписка/Ext/Form.xml`

Во всех трех случаях после round-trip пропадает пустой XML-контейнер:

```diff
 <MainTable>Catalog...</MainTable>
-<ListSettings/>
```

Владеющий модуль: `packages/core/metadata/forms/commonObjects/dynamicList`.

## Goal

Сохранить пустой `<ListSettings/>` при экспорте `DynamicList`, если исходный или ожидаемый XML содержит динамический список без пользовательских настроек внутри `ListSettings`.

## Design

Добавить на уровень `DynamicListRules` декларативный обязательный XML-контейнер:

```ts
requiredXMLParents: [["ListSettings"]]
```

Это использует уже существующий механизм `exportPropertiesToXML -> applyRequiredXMLParents`. Если свойства `filter`, `order`, `conditionalAppearance`, `dataParameters` или другие поля с `xmlParents: ["ListSettings"]` уже создали контейнер, он не перезаписывается. Если таких полей нет, экспорт материализует пустой объект, который сериализуется как `<ListSettings/>`.

## Data Flow

1. `fromXML` импортирует `Settings` динамического списка как сейчас.
2. `toXML` экспортирует обычные свойства `DynamicList`: `Field`, `Parameter`, `MainTable` и другие.
3. После обхода свойств `exportPropertiesToXML` вызывает `applyRequiredXMLParents`.
4. `applyRequiredXMLParents` гарантирует наличие `ListSettings` в результате, не меняя уже заполненный контейнер.

## Alternatives

Рекомендованный подход: `requiredXMLParents` на `DynamicListRules`. Он точечно описывает доменную форму XML и не добавляет технических полей в модель.

Отклоненные варианты:

- Техническое свойство в `DynamicListRules` с `xmlParents/defaultValueXMLRaw`: добавляет шум в модель правил.
- Изменение общего `orchestration` для восстановления пустых `xmlParents` из reference XML: шире по влиянию и может создать неожиданные пустые контейнеры в других metadataItem.

## Tests

Добавить новую XML-фикстуру для `DynamicList` с `MainTable` и пустым `<ListSettings/>`; существующие XML-фикстуры не менять.

Проверки:

- `fromXML` импортирует фикстуру в ожидаемую TS-форму.
- `toXML` экспортирует ожидаемую TS-форму с пустым `<ListSettings/>`.
- round-trip `import -> export` сохраняет контейнер.

Быстрая проверка после реализации:

```bash
pnpm --filter '@nakidka/core' exec vitest run -t "DynamicList"
```

Финальная проверка:

```bash
pnpm test
```

## Scope

Входит:

- только модуль `forms/commonObjects/dynamicList`;
- новая фикстура и точечные тесты для пустого `ListSettings`.

Не входит:

- исправление namespace `xmlns:d6p1` в `DCSParameter`;
- общая переработка `xmlParents`;
- изменение существующих XML-фикстур.
