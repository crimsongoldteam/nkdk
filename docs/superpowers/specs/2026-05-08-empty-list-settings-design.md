# Round-trip diffs 10-14 design notes

## Cluster 1: Empty ListSettings

### Context

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

### Goal

Сохранить пустой `<ListSettings/>` при экспорте `DynamicList`, если исходный или ожидаемый XML содержит динамический список без пользовательских настроек внутри `ListSettings`.

### Design

Добавить на уровень `DynamicListRules` декларативный обязательный XML-контейнер:

```ts
requiredXMLParents: [["ListSettings"]]
```

Это использует уже существующий механизм `exportPropertiesToXML -> applyRequiredXMLParents`. Если свойства `filter`, `order`, `conditionalAppearance`, `dataParameters` или другие поля с `xmlParents: ["ListSettings"]` уже создали контейнер, он не перезаписывается. Если таких полей нет, экспорт материализует пустой объект, который сериализуется как `<ListSettings/>`.

### Data Flow

1. `fromXML` импортирует `Settings` динамического списка как сейчас.
2. `toXML` экспортирует обычные свойства `DynamicList`: `Field`, `Parameter`, `MainTable` и другие.
3. После обхода свойств `exportPropertiesToXML` вызывает `applyRequiredXMLParents`.
4. `applyRequiredXMLParents` гарантирует наличие `ListSettings` в результате, не меняя уже заполненный контейнер.

### Alternatives

Рекомендованный подход: `requiredXMLParents` на `DynamicListRules`. Он точечно описывает доменную форму XML и не добавляет технических полей в модель.

Отклоненные варианты:

- Техническое свойство в `DynamicListRules` с `xmlParents/defaultValueXMLRaw`: добавляет шум в модель правил.
- Изменение общего `orchestration` для восстановления пустых `xmlParents` из reference XML: шире по влиянию и может создать неожиданные пустые контейнеры в других metadataItem.

### Tests

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

### Scope

Входит:

- только модуль `forms/commonObjects/dynamicList`;
- новая фикстура и точечные тесты для пустого `ListSettings`.

Не входит:

- исправление namespace `xmlns:d6p1` в `DCSParameter`;
- общая переработка `xmlParents`;
- изменение существующих XML-фикстур.

## Cluster 2: Reference d6p1 Undefined value

### Context

Следующие два расхождения относятся к `Catalogs/КлючиРеестраДокументов/Forms`:

- `ФормаВыбора/Ext/Form.xml`
- `ФормаСписка/Ext/Form.xml`

В обоих случаях round-trip теряет локальное объявление namespace на значении параметра динамического списка:

```diff
-<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>
+<dcssch:value xsi:type="v8:Type">d6p1:Undefined</dcssch:value>
```

Владеющий модуль: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter`. Низкоуровневый экспорт значения проходит через `MetadataDcsMetadataValue` и `MetadataValue` `typeRef`.

### Goal

Сохранить reference-значение `d6p1:Undefined` целиком, включая `xmlns:d6p1`, когда модель не задаёт значение параметра явно, а исходный XML уже содержал такое значение.

### Design

Для `DCSParameter.value` добавить узкий fallback при экспорте:

- поле `value` в модели отсутствует или равно `undefined`;
- reference-элемент содержит `dcssch:value` с `_xsi:type: "v8:Type"`;
- текст reference-значения имеет вид `<prefix>:Undefined`;
- reference-значение содержит соответствующий namespace-атрибут `_xmlns:<prefix>`.

Если условия выполнены, экспортирует reference-узел целиком. Это сохраняет исходный namespace и не требует расширять модель новым техническим полем.

Явное `null` остаётся отдельной семантикой и продолжает экспортироваться как `xsi:nil`.

### Data Flow

1. `fromXML` обычного импорта может не хранить `value` в модели, если для параметра нет осмысленного значения в YAML.
2. `fromXML` reference-импорта сохраняет XML-only значение параметра как reference-данные.
3. `toXML` для `DCSParameter.value` видит `value === undefined` или отсутствие ключа.
4. Если reference-значение соответствует `v8:Type` / `*:Undefined`, экспорт использует reference XML-узел вместо генерации нового `xsi:nil` или потери namespace.

### Alternatives

Рекомендованный подход: специальный fallback на уровне `DCSParameter.value`. Он совпадает с пользовательской семантикой: значение восстанавливается только тогда, когда модель его не задаёт, а reference уже содержит нужный XML.

Отклоненные варианты:

- Всегда добавлять namespace в `MetadataValue` `typeRef` для `*:Undefined`: меняет общий экспорт без reference и затрагивает существующие фикстуры.
- Переносить namespace для любых совпавших DCS-значений: шире нужного и может скрыть отличия между моделью и reference.
- Делать общий preserve XML-атрибутов для всех `preserveFromReferenceXML`: рискованно для `orchestration` и не требуется для текущего кластера.

### Tests

Добавить новый тестовый случай для `DCSParameter` с reference-значением:

```xml
<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>
```

Проверки:

- если поле `value` отсутствует в модели, экспорт сохраняет reference-узел целиком;
- если поле `value` явно задано как `undefined`, экспорт тоже сохраняет reference-узел целиком;
- `value: null` продолжает давать `xsi:nil`.

Быстрая проверка после реализации:

```bash
pnpm --filter '@nakidka/core' exec vitest run -t "DCSParameter"
```

Финальная проверка:

```bash
pnpm test
```

### Scope

Входит:

- только поведение `DCSParameter.value` при наличии reference-значения `*:Undefined`;
- тесты для отсутствующего `value` и явного `value: undefined`.

Не входит:

- изменение общего `MetadataValue` `typeRef`;
- изменение XML-импорта;
- общий preserve namespace-атрибутов для всех XML-узлов.
