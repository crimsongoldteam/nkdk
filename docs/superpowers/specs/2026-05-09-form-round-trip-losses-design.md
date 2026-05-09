# Form round-trip losses design

Дата: 2026-05-09

## Контекст

Short round-trip по XML-дампу `trade` показал пачки расхождений в формах документов.
Эта спецификация собирает согласованные решения по задачам из triage. Задачи разбираются
последовательно; каждая фиксируется отдельным разделом после согласования.

Источник первого triage:

1. `Documents/Встреча/Forms/ФормаДокумента/Ext/Form.xml`
2. `Documents/ЗапланированноеВзаимодействие/Forms/ФормаДокумента/Ext/Form.xml`
3. `Documents/ЗапросКоммерческихПредложенийПоставщиков/Forms/ФормаДокумента/Ext/Form.xml`
4. `Documents/ЗаявкаНаВозвратТоваровОтКлиента/Forms/ФормаДокумента/Ext/Form.xml`
5. `Documents/ЗаявкаНаВозвратТоваровОтКлиента/Forms/ФормаДокументаСамообслуживание/Ext/Form.xml`

Источник второго triage:

6. `Documents/ЗаявкаНаКомандировку/Forms/ФормаДокумента/Ext/Form.xml`
7. `Documents/ЗаявлениеОВвозеТоваров/Forms/ФормаВыбораОснования/Ext/Form.xml`
8. `Documents/ЗаявлениеОВвозеТоваров/Forms/ФормаРабочееМесто/Ext/Form.xml`
9. `Documents/КорректировкаНазначенияТоваров.xml`
10. `Documents/ОтчетКомитенту/Forms/ФормаПодбораДокументаПродажи/Ext/Form.xml`
11. `Documents/ПодтверждениеНулевойСтавкиНДС.xml`
12. `Documents/СообщениеSMS/Forms/ФормаДокумента/Ext/Form.xml`
13. `Documents/СчетНаОплатуКлиенту/Forms/ФормаСозданияСчетовНаОплату/Ext/Form.xml`
14. `Documents/ТелефонныйЗвонок/Forms/ФормаДокумента/Ext/Form.xml`
15. `Documents/ЭлектронноеПисьмоВходящее/Forms/ФормаДокумента/Ext/Form.xml`
16. `Documents/ЭлектронноеПисьмоИсходящее/Forms/ФормаДокумента/Ext/Form.xml`
17. `Documents/ЭлектронныйДокументВходящийЭДО/Forms/ФормаПросмотра/Ext/Form.xml`
18. `Documents/ЭлектронныйДокументВходящийЭДО/Forms/ФормаПросмотраМК/Ext/Form.xml`
19. `Documents/ЭлектронныйДокументИсходящийЭДО/Forms/ФормаПросмотра/Ext/Form.xml`
20. `Documents/ЭлектронныйДокументИсходящийЭДО/Forms/ФормаПросмотраМК/Ext/Form.xml`

## Задача 1: Parameter у кнопок формы

### Исходный diff

В нескольких формах после round-trip пропадает узел `Parameter` у кнопок командной панели:

```diff
 <Button name="ФормаОбновитьДанныеДокумента" id="1050">
   <Type>CommandBarButton</Type>
   <CommandName>Form.Command.ОбновитьДанныеДокумента</CommandName>
-  <Parameter xsi:type="xr:MDObjectRef">Document.ЗапросКоммерческихПредложенийПоставщиков</Parameter>
   <ExtendedTooltip name="ФормаОбновитьДанныеДокументаРасширеннаяПодсказка" id="1051"/>
 </Button>
```

Та же потеря встречается у стандартных команд `ShowInList`:

```diff
 <Button name="ФормаПоказатьВСписке" id="172">
   <Type>CommandBarButton</Type>
   <Visible>false</Visible>
   <CommandName>Form.StandardCommand.ShowInList</CommandName>
-  <Parameter xsi:type="xr:MDObjectRef">Document.Встреча</Parameter>
   <ExtendedTooltip name="ФормаПоказатьВСпискеРасширеннаяПодсказка" id="173"/>
 </Button>
```

Владеющий модуль:
`packages/core/metadata/forms/elements/button`.

Вероятное место изменения:
`packages/core/metadata/forms/elements/button/rules.ts`.

### Текущая логика

`ButtonRules` и `CommandBarButtonRules` используют общий набор свойств `commonButtonProperties`.
Сейчас в нём есть `commandName`, `dataPath` и остальные свойства кнопки, но нет `Parameter`.
Поэтому import не кладёт `Parameter` в модель, а export не может восстановить этот XML-узел.

В проекте уже есть общий тип `MetadataItemLink`, который импортирует и экспортирует XML-вида:

```xml
<Parameter xsi:type="xr:MDObjectRef">Document.Встреча</Parameter>
```

как строковую ссылку `Document.Встреча`.

### Решение

Добавить `parameter` в `commonButtonProperties`, чтобы свойство было доступно всем кнопкам,
построенным от общего правила.

Правило свойства:

```ts
parameter: {
  yaml: "Параметр",
  xml: "Parameter",
  type: "MetadataItemLink",
  toEnterprise: false,
}
```

Решение намеренно находится в общем наборе свойств, а не только в `CommandBarButtonRules`.
Причина: XML-свойство `Parameter` относится к кнопочной команде, а текущая архитектура уже
разделяет общие кнопочные свойства через `commonButtonProperties`. Если похожий XML встретится
у обычной кнопки или гиперссылки, round-trip тоже должен сохранить его без отдельного частного
правила.

YAML-представление является полноценной частью модели. Свойство должно называться `Параметр`
и хранить строковую ссылку, например:

```yaml
Параметр: Document.Встреча
```

### Фикстуры

Нужна отдельная узкая фикстура для кнопки с параметром, а не расширение большой `full`-фикстуры.
Это сохраняет читаемость тестов и явно показывает, какой XML-узел защищается.

Добавить в `packages/core/metadata/forms/elements/button/__fixtures__/`:

- XML-фикстуру с `<Parameter xsi:type="xr:MDObjectRef">Document.Встреча</Parameter>`;
- TS-фикстуру с моделью, где есть `parameter: "Document.Встреча"`;
- YAML-фикстуру для partial YAML с `Параметр: "Document.Встреча"`;
- typed YAML-фикстуру с `Тип: "КнопкаКоманднойПанели"` и `Параметр: "Document.Встреча"`.

Фикстуры должны быть подключены в `packages/core/metadata/forms/elements/__tests__/fixtures.ts`,
чтобы существующие общие тесты проверили XML- и YAML-циклы.

### Проверки

Минимальный набор тестов:

- `fromXML` импортирует `Parameter xsi:type="xr:MDObjectRef"` в `parameter`;
- `toXML` экспортирует `parameter` обратно как `<Parameter xsi:type="xr:MDObjectRef">...`;
- `fromYAML` импортирует ключ `Параметр` в `parameter`;
- `toYAML` экспортирует `parameter` в ключ `Параметр`;
- typed YAML сохраняет тот же `Параметр` вместе с типом элемента.

Ожидаемый эффект для round-trip: пункты 1-4 triage больше не должны терять `Parameter` у кнопок.
Если в тех же XML-файлах остаются другие расхождения, они разбираются отдельными задачами.

### Не входит

- Исправление потери `ChildItemsWidth` у корня формы.
- Исправление порядка `CommandGroup` и `DefaultVisible` в `CommandInterface`.
- Частный XML-обработчик для `CommandBarButton`.
- Новые правила fromXML/toXML/fromYAML/toYAML вне `rules.ts`.

## Задача 2: ChildItemsWidth у корня формы

### Исходный diff

В двух формах после round-trip пропадает корневой узел `ChildItemsWidth`:

```diff
 <AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
 <AutoTitle>false</AutoTitle>
-<ChildItemsWidth>LeftWide</ChildItemsWidth>
 <Commands>
```

Затронутые файлы из triage:

- `Documents/Встреча/Forms/ФормаДокумента/Ext/Form.xml`;
- `Documents/ЗапланированноеВзаимодействие/Forms/ФормаДокумента/Ext/Form.xml`.

Владеющий модуль:
`packages/core/metadata/forms/clientApplicationForm`.

Вероятное место изменения:
`packages/core/metadata/forms/clientApplicationForm/rules.ts`.

### Текущая логика

У корневой формы уже есть свойство модели `slaveItemsWidth`:

```ts
slaveItemsWidth: {
  yaml: "ШиринаПодчиненныхЭлементов",
  type: "SystemEnumeration",
  typeSE: "ChildFormItemsWidth",
  tag: FormRulesTags.Form,
  defaultValueYAML: "Auto",
}
```

Но правило не содержит XML-имя. Из-за этого import не связывает XML-узел
`<ChildItemsWidth>LeftWide</ChildItemsWidth>` с `slaveItemsWidth`, а export не может
восстановить его обратно.

В соседних правилах элементов формы уже есть тот же проектный смысл и то же XML-имя:

- `packages/core/metadata/forms/elements/usualGroup/rules.ts`;
- `packages/core/metadata/forms/elements/page/rules.ts`.

Там `slaveItemsWidth` описан через `xml: "ChildItemsWidth"`, поэтому для корневой формы
нужен такой же явный XML-мэппинг.

### Решение

Добавить `xml: "ChildItemsWidth"` к существующему свойству `slaveItemsWidth` в
`ClientApplicationFormRules`.

Итоговое правило:

```ts
slaveItemsWidth: {
  yaml: "ШиринаПодчиненныхЭлементов",
  xml: "ChildItemsWidth",
  type: "SystemEnumeration",
  typeSE: "ChildFormItemsWidth",
  tag: FormRulesTags.Form,
  defaultValueYAML: "Auto",
}
```

YAML-представление не меняется: свойство по-прежнему называется
`ШиринаПодчиненныхЭлементов` и хранит значение перечисления, например:

```yaml
ШиринаПодчиненныхЭлементов: LeftWide
```

Решение остаётся в `rules.ts`: отдельные fromXML/toXML-обработчики для корневой формы не нужны.

### Фикстуры

Нужна отдельная узкая фикстура формы с корневым `ChildItemsWidth`, чтобы не расширять большие
полные формы и не смешивать эту проверку с другими свойствами.

Добавить XML/TS/YAML-фикстуры для `ClientApplicationForm`:

- XML-фикстуру с `<ChildItemsWidth>LeftWide</ChildItemsWidth>` на корневом уровне формы;
- TS-фикстуру с `slaveItemsWidth: "LeftWide"`;
- YAML-фикстуру с `ШиринаПодчиненныхЭлементов: LeftWide`.

Фикстура должна проходить существующие общие проверки XML- и YAML-циклов для форм.

### Проверки

Минимальный набор тестов:

- `fromXML` импортирует корневой `ChildItemsWidth` в `slaveItemsWidth`;
- `toXML` экспортирует `slaveItemsWidth: "LeftWide"` обратно в `<ChildItemsWidth>LeftWide</ChildItemsWidth>`;
- `fromYAML` импортирует `ШиринаПодчиненныхЭлементов` в `slaveItemsWidth`;
- `toYAML` экспортирует `slaveItemsWidth` в `ШиринаПодчиненныхЭлементов`.

Ожидаемый эффект для round-trip: пункты 1-2 triage больше не должны терять
`ChildItemsWidth` у корня формы. Если в этих же файлах остаётся потеря `Parameter`, она
закрывается задачей 1.

### Не входит

- Исправление `Parameter` у кнопок формы.
- Исправление порядка `CommandGroup` и `DefaultVisible` в `CommandInterface`.
- Изменение YAML-имени `ШиринаПодчиненныхЭлементов`.
- Новые правила fromXML/toXML/fromYAML/toYAML вне `rules.ts`.

## Задача 3: порядок CommandInterface при одинаковых Item

### Исходный diff

В форме самообслуживания после round-trip меняется порядок полей внутри трёх одинаковых
элементов `CommandInterface.CommandBar.Item`:

```diff
 <Item>
   <Command>Form.StandardCommand.RestoreValues</Command>
   <Type>Auto</Type>
-  <CommandGroup>FormCommandBarImportant</CommandGroup>
   <DefaultVisible>false</DefaultVisible>
+  <CommandGroup>FormCommandBarImportant</CommandGroup>
   <Visible>
```

Затронутый файл из triage:
`Documents/ЗаявкаНаВозвратТоваровОтКлиента/Forms/ФормаДокументаСамообслуживание/Ext/Form.xml`.

Владеющий модуль:
`packages/core/metadata/forms/commonObjects/commandInterface`.

Вероятное место изменения:
`packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`.

### Текущая логика

Для `CommandInterface` уже есть экспорт с учётом reference:

- `fromXML` при `context.fromXML.forReference` сохраняет порядок XML-полей элемента через порядок
  ключей в reference-модели;
- `toXML` ищет соответствующий reference-item и пишет XML-поля в порядке этого reference-item;
- если reference-item не найден, используется fallback-порядок:
  `Command`, `Type`, `Index`, `DefaultVisible`, `CommandGroup`, `Visible`.

Сопоставление reference-item сейчас выполняется по трём полям:

```ts
referenceItem.command === item.command &&
referenceItem.commandGroup === item.commandGroup &&
referenceItem.index === item.index
```

Но helper требует ровно одно совпадение. В проблемной форме есть три одинаковых элемента:

```xml
<Command>Form.StandardCommand.RestoreValues</Command>
<Type>Auto</Type>
<CommandGroup>FormCommandBarImportant</CommandGroup>
<DefaultVisible>false</DefaultVisible>
```

У всех трёх одинаковые `Command`, `CommandGroup` и отсутствующий `Index`. Поэтому поиск находит
три совпадения, отбрасывает reference как неоднозначный и включает fallback-порядок. Именно
fallback переставляет `CommandGroup` после `DefaultVisible`.

### Решение

Сохранить текущий reference-based механизм и упростить поведение при дубликатах: если найдено
несколько подходящих reference-item, брать первый совпавший.

Практически это означает заменить требование `matches.length === 1` на поиск первого совпадения:

```ts
return referenceItems.find(
  (referenceItem) =>
    referenceItem.command === item.command &&
    referenceItem.commandGroup === item.commandGroup &&
    referenceItem.index === item.index
)
```

Причина: в этой задаче reference нужен только как источник порядка XML-полей внутри `Item`.
Для одинаковых элементов любой совпавший reference-item с теми же `Command`, `CommandGroup` и
`Index` даёт нужный порядок. В наблюдаемой форме все три дубликата имеют одинаковый порядок
полей, поэтому сопоставление с состоянием "следующий ещё не использованный reference-item" не нужно.

Fallback-порядок без reference не менять. Он уже покрыт отдельным тестом и остаётся поведением
для экспорта модели без исходного XML.

### Фикстуры

Нужна отдельная фикстура `CommandInterface` с настоящими дубликатами без `Index`, потому что
существующая `duplicateAutoCommandOrder` различает элементы по `Index` и не воспроизводит эту
ветку поиска.

Добавить в `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/`:

- XML-фикстуру с тремя одинаковыми `CommandBar.Item`, где `CommandGroup` стоит перед
  `DefaultVisible`;
- TS-фикстуру с тремя одинаковыми `CommandInterfaceItem` без `index`.

Фикстура должна быть подключена к существующим тестам `fromXML.test.ts` и `toXML.test.ts`.

### Проверки

Минимальный набор тестов:

- `fromXML` импортирует новую XML-фикстуру в модель с тремя одинаковыми элементами;
- `toXML` с reference-данными экспортирует эту модель обратно без перестановки
  `CommandGroup` и `DefaultVisible`;
- существующий тест fallback-порядка без reference остаётся прежним.

Ожидаемый эффект для round-trip: пункт 5 triage больше не должен переставлять
`CommandGroup` и `DefaultVisible` у трёх `Form.StandardCommand.RestoreValues`.

### Не входит

- Изменение fallback-порядка без reference.
- Сопоставление дубликатов по порядку потребления reference-item с хранением состояния.
- Изменение YAML-представления `CommandInterface`.
- Новые правила fromYAML/toYAML.

## Задача 4: `xsi:type` у MinValue и MaxValue

### Исходный diff

В форме документа после round-trip значение `MinValue` сохраняется, но меняется его XML-тип:

```diff
 <SpinButton>true</SpinButton>
-<MinValue xsi:type="xs:string">1</MinValue>
+<MinValue xsi:type="xs:decimal">1</MinValue>
 <ContextMenu name="ЧислоДнейКонтекстноеМеню" id="114"/>
```

Затронутый файл из triage:
`Documents/ЗаявкаНаКомандировку/Forms/ФормаДокумента/Ext/Form.xml`.

Владеющий модуль:
`packages/core/metadata/forms/elements/inputField`.

Связанный общий код:
`packages/core/metadata/commonObjects/number`.

### Текущая логика

Сейчас `minValue` и `maxValue` в `InputFieldRules` описаны как обычное число с
типизированной XML-выгрузкой:

```ts
minValue: { yaml: "МинимальноеЗначение", type: "number", xml: "MinValue", typedXML: true }
maxValue: { yaml: "МаксимальноеЗначение", type: "number", xml: "MaxValue", typedXML: true }
```

Для `number` значение `typedXML: true` означает старое поведение: экспортировать как
`xsi:type="xs:decimal"`. Поэтому import читает `xs:string` и `xs:decimal` одинаково в число,
а export без знания исходного XML-типа всегда пишет `xs:decimal`.

В исходном XML-дампе встречаются оба допустимых варианта:

- `MinValue/MaxValue xsi:type="xs:string"`;
- `MinValue/MaxValue xsi:type="xs:decimal"`.

Значит, простая замена на постоянный `xs:string` тоже будет ломать round-trip для части форм.

### Решение

Добавить отдельный тип свойства `MinMaxValue`.

Снаружи этот тип ведёт себя как число:

- обычная модель хранит `minValue` / `maxValue` как `number`;
- YAML остаётся числом под теми же ключами `МинимальноеЗначение` и `МаксимальноеЗначение`;
- JSON-схема для YAML остаётся числовой;
- enterprise-представление, если оно используется, остаётся числовым.

Отличие только в XML round-trip: `MinMaxValue` при экспорте с reference должен сохранять
исходный `xsi:type` этого же XML-узла. Если reference содержит `xs:string`, export пишет
`xs:string`; если reference содержит `xs:decimal`, export пишет `xs:decimal`.

Если reference отсутствует или в reference нет `xsi:type`, используется текущий fallback
`xs:decimal`. Это сохраняет поведение для создания нового XML без исходного файла.

### Архитектура

Создать общий модуль:

`packages/core/metadata/commonObjects/minMaxValue/`.

Минимальный состав:

- `types.ts` с типом правила `MinMaxValuePropertyRule`;
- `fromXML.ts`;
- `toXML.ts`;
- `toJSONSchema.ts` с числовой JSON-схемой;
- узкие тесты на XML и YAML-поведение.

Новый `PropertyRuleType`:

```ts
MinMaxValue: {
  item: number
  enterprise: number
  yaml: number
}
```

Reference-import не может хранить исходный `xsi:type` в обычном `number`, потому что число
является примитивом. Поэтому `MinMaxValue` должен иметь внутреннюю служебную форму только для
reference-модели, например `{ value: number, xsiType: "xs:string" | "xs:decimal" }`.

Правило:

- при обычном fromXML возвращать только `number`;
- при `context.fromXML.forReference` возвращать служебный carrier с числом и исходным
  `_xsi:type`;
- при toXML принимать и обычный `number`, и reference-carrier;
- при наличии `referenceMetadata` брать XML-тип из reference-carrier;
- если экспортируется только reference-carrier как значение, экспортировать его числовую часть.

Эта служебная форма не должна попадать в YAML, JSON-схему и публичную модель.
Отдельные fromYAML/toYAML-переходники не нужны: стандартный fallback оркестратора уже
передаёт числовое значение без преобразований. Для JSON-схемы нужен явный обработчик, потому
что без `exportToJSONSchema` новый тип не получит числовую схему автоматически.

### Где применять

Перевести на `type: "MinMaxValue"` все правила `minValue` и `maxValue`, которые реально
участвуют в XML round-trip:

- `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`;
- `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts`;
- `packages/core/metadata/forms/elements/inputField/rules.ts`:
  - `InputFieldRules`;
  - `TableInputFieldRules`.

Для этих правил сохранить существующие XML/YAML-имена, `xmlParents`, `order`,
`defaultValueXMLRaw` и остальные настройки. Меняется только `type` и удаляется потребность
в `typedXML` на месте использования, потому что XML-тип теперь выбирает сам `MinMaxValue`.

Не переводить правила без XML-сопоставления:

- `packages/core/metadata/forms/elements/trackBarField/rules.ts`;
- `packages/core/metadata/forms/elements/progressBarField/rules.ts`.

У них сейчас `minValue` / `maxValue` не имеют `xml`, поэтому новый XML-aware тип не даёт
пользы и может расширить поведение без необходимости.

### Фикстуры

Нужны узкие фикстуры для общего типа `MinMaxValue`:

- XML с `<MinValue xsi:type="xs:string">1</MinValue>`;
- XML с `<MaxValue xsi:type="xs:decimal">99.99</MaxValue>`;
- TS-значения как обычные числа;
- YAML-значения как обычные числа.

Для form-element уровня нужна отдельная `InputField`-фикстура с `MinValue xsi:type="xs:string"`,
чтобы защитить исходный diff из triage через общий набор тестов элементов.

Для `metadataAttribute` и `standardAttributeDescription` добавить узкие property-level тесты
на реальных правилах `minValue` и `maxValue`: они должны показать, что смена типа правила на
`MinMaxValue` не меняет числовую модель и сохраняет reference `xsi:type` при XML-export.

### Проверки

Минимальный набор тестов:

- обычный fromXML для `MinMaxValue` импортирует `xs:string` и `xs:decimal` в `number`;
- toXML без reference экспортирует число как `xs:decimal`;
- toXML с reference `xs:string` сохраняет `xs:string`;
- toXML с reference `xs:decimal` сохраняет `xs:decimal`;
- YAML-цикл остаётся числовым;
- `InputField` round-trip с reference больше не меняет `MinValue xsi:type="xs:string"` на
  `xs:decimal`.

Ожидаемый эффект для round-trip: пункт 6 triage больше не должен менять `xsi:type` у
`MinValue`. Если похожие `MinValue/MaxValue` встретятся в атрибутах или стандартных
реквизитах, они используют тот же общий тип свойства.

### Не входит

- Хранение `xsi:type` в публичной модели или YAML.
- Принудительная выгрузка всех `MinValue/MaxValue` как `xs:string`.
- Изменение обычного типа `number`.
- Перевод `trackBarField` и `progressBarField`, пока их `minValue/maxValue` не участвуют в XML.

## Задача 5: KeyField и KeyType у DynamicList

### Исходный diff

В двух формах после round-trip пропадает `KeyField` у динамического списка:

```diff
 <Parameter>
   ...
 </Parameter>
-<KeyField>Ссылка</KeyField>
 <ListSettings>
```

Затронутые файлы из triage:

- `Documents/ЗаявлениеОВвозеТоваров/Forms/ФормаВыбораОснования/Ext/Form.xml`;
- `Documents/ЗаявлениеОВвозеТоваров/Forms/ФормаРабочееМесто/Ext/Form.xml`.

В ещё одной форме пропадает пара `KeyType` и `KeyField`:

```diff
 <Parameter>
   ...
 </Parameter>
-<KeyType>FieldValue</KeyType>
-<KeyField>Ссылка</KeyField>
 <ListSettings/>
```

Затронутый файл:
`Documents/ОтчетКомитенту/Forms/ФормаПодбораДокументаПродажи/Ext/Form.xml`.

Владеющий модуль:
`packages/core/metadata/forms/commonObjects/dynamicList`.

### Текущая логика

В `DynamicListRules` свойство `keyFields` уже описано как часть модели и YAML:

```ts
keyFields: {
  type: "string",
  xml: "KeyField",
  yaml: "ПоляКлюча",
  fromXML: false,
  toXML: false,
}
```

Но XML-импорт и XML-экспорт для него выключены, поэтому `KeyField` не попадает в модель
из XML и не возвращается обратно.

Свойство `keyType` сейчас закомментировано. При этом системное перечисление
`DynamicListKeyType` уже есть и содержит нужные значения:

- `Auto` / `Авто`;
- `FieldValue` / `ЗначениеПоля`;
- `RowKey` / `КлючСтроки`;
- `RowNumber` / `НомерСтроки`.

### Решение

Сделать `KeyField` и `KeyType` полноценными свойствами `DynamicList` с поддержкой XML,
TS-модели и YAML.

Для `keyFields` убрать запреты `fromXML: false` и `toXML: false`, сохранив текущее имя
модели и YAML:

```ts
keyFields: {
  type: "string",
  xml: "KeyField",
  yaml: "ПоляКлюча",
}
```

Для `keyType` включить правило через существующее перечисление:

```ts
keyType: {
  type: "SystemEnumeration",
  typeSE: "DynamicListKeyType",
  xml: "KeyType",
  yaml: "ВидКлюча",
  defaultValueYAML: "Авто",
}
```

YAML-представление:

```yaml
ВидКлюча: ЗначениеПоля
ПоляКлюча: Ссылка
```

TS-модель:

```ts
{
  keyType: "FieldValue",
  keyFields: "Ссылка",
}
```

Не добавлять `defaultValueXML` для `keyType`: если в исходном XML нет `KeyType`, новый
экспорт не должен сам создавать `<KeyType>Auto</KeyType>`.

Решение остаётся в `rules.ts`; отдельные fromXML/toXML/fromYAML/toYAML-обработчики не нужны.

### Фикстуры

Добавить отдельную узкую фикстуру в
`packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/`, не расширяя большую
`full`-фикстуру.

Фикстура должна содержать:

- XML с `<KeyType>FieldValue</KeyType>` и `<KeyField>Ссылка</KeyField>`;
- TS-модель с `keyType: "FieldValue"` и `keyFields: "Ссылка"`;
- YAML-данные в `data.ts` с `ВидКлюча: "ЗначениеПоля"` и `ПоляКлюча: "Ссылка"`.

XML должен быть маленьким для локального чтения, но оставаться валидным
`Settings xsi:type="DynamicList"`. Использовать минимальный динамический список с
`ManualQuery`, `DynamicDataRead`, `QueryText`, `KeyType`, `KeyField` и `ListSettings`.

### Проверки

Минимальный набор тестов:

- `fromXML` импортирует `KeyField` в `keyFields`;
- `fromXML` импортирует `<KeyType>FieldValue</KeyType>` в `keyType: "FieldValue"`;
- `toXML` экспортирует `keyFields` обратно в `<KeyField>Ссылка</KeyField>`;
- `toXML` экспортирует `keyType: "FieldValue"` обратно в `<KeyType>FieldValue</KeyType>`;
- `fromYAML` импортирует `ПоляКлюча` и `ВидКлюча` в модель;
- `toYAML` экспортирует `keyFields` и `keyType` как `ПоляКлюча` и `ВидКлюча`;
- XML round-trip новой фикстуры не теряет `KeyField` и `KeyType`.

Ожидаемый эффект для round-trip: пункты 7, 8 и 10 triage больше не должны терять
`KeyField`; пункт 10 также не должен терять `KeyType`.

### Не входит

- Перевод `keyFields` в массив: текущие наблюдаемые XML используют один `KeyField`, а
  существующее правило уже моделирует это строкой.
- XML-only сохранение через `preserveFromReferenceXML`: выбран полноценный YAML-путь.
- Добавление `order` в правила без отдельной необходимости; порядок должен определяться
  текущим reference-based механизмом.

## Задача 6: nil-элементы внутри FixedArray

### Исходный diff

В документах после round-trip пропадает элемент массива выбора:

```diff
 <app:value xsi:type="v8:FixedArray">
   <v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту</v8:Value>
-  <v8:Value xsi:nil="true"/>
   <v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EmptyRef</v8:Value>
 </app:value>
```

Затронутые файлы из triage:

- `Documents/КорректировкаНазначенияТоваров.xml`;
- `Documents/ПодтверждениеНулевойСтавкиНДС.xml`.

Во втором документе внутри одного `FixedArray` теряются два таких элемента. Порядок важен:
`xsi:nil` здесь является отдельным элементом массива, а не отсутствием всего параметра выбора.

Владеющие модули:

- `packages/core/metadata/commonObjects/metadataValue`;
- `packages/core/metadata/commonObjects/metadataValue/fixedArray`;
- `packages/core/metadata/commonObjects/сhoiceParameters`.

### Текущая логика

Одиночный nil на уровне `ChoiceParameters` уже поддержан:

```xml
<app:item name="ВыборСчетовГоловнойОрганизации">
  <app:value xsi:nil="true"/>
</app:item>
```

Такой параметр импортируется как `ChoiceParameter` без собственного поля `value`, а YAML-фикстура
использует `undefined`:

```ts
{ ВыборСчетовГоловнойОрганизации: undefined }
```

Но `FixedArray` сейчас описан как массив только из `MetadataTypedValue`:

```ts
export interface MetadataFixedArrayValue {
  type: "fixedArray"
  value: MetadataTypedValue[]
}
```

Импорт XML проходит по каждому `v8:Value` и вызывает `importMetadataValueFromXML`. Для
`<v8:Value xsi:nil="true"/>` у узла нет распознаваемого `_xsi:type`, поэтому такой элемент
не получает корректного представления в модели. При экспорте обратно нечего выгружать, и
позиционный nil-элемент пропадает.

### Решение

Поддержать `undefined` как допустимый элемент именно внутри `MetadataValue/fixedArray`.

TS-модель:

```ts
{
  type: "fixedArray",
  value: [
    { type: "ref", value: "Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту" },
    undefined,
    { type: "ref", value: "Enum.ХозяйственныеОперации.EmptyRef" },
  ],
}
```

YAML-модель в TS-фикстурах должна использовать тот же `undefined`:

```ts
[
  "Перечисление.ХозяйственныеОперации.РеализацияКлиенту",
  undefined,
  "Перечисление.ХозяйственныеОперации.EmptyRef",
]
```

Не вводить строковый маркер вроде `"undefined"` и не делать публичный тип `nil`.
Если текстовый YAML-парсер в отдельном сценарии отдаст `null` для пустого элемента списка,
импорт может трактовать его так же, как `undefined`, но экспорт из модели должен возвращать
именно `undefined`.

XML-поведение:

- `fromXML` для `v8:Value xsi:nil="true"` внутри `FixedArray` возвращает элемент
  `undefined` и сохраняет его позицию в массиве;
- `toXML` для `undefined` внутри `FixedArray` выгружает `<v8:Value xsi:nil="true"/>`;
- обычный одиночный `app:value xsi:nil="true"` в `ChoiceParameters` остаётся прежним:
  параметр без поля `value`.

### Архитектура

Расширить типы `MetadataValue` только в границах `FixedArray`:

```ts
export interface MetadataFixedArrayValue {
  type: "fixedArray"
  value: Array<MetadataTypedValue | undefined>
}
```

Для XML-типа `MetadataFixedArrayValueXML` разрешить `v8:Value` как обычное значение или
nil-узел:

```ts
type MetadataFixedArrayItemXML = MetadataPrimitiveValueXML | { "_xsi:nil": true }
```

Для YAML-схемы `MetadataFixedArrayValueJSONSchema` разрешить `Type.Undefined()` среди
элементов массива. Это соответствует уже существующему представлению одиночного nil в
`ChoiceParametersYAML`.

В `metadataValue/fixedArray/fromXML.ts` добавить явную проверку nil-узла перед вызовом
`importMetadataValueFromXML`.

В `metadataValue/fixedArray/toXML.ts` экспортировать `undefined` как `{ "_xsi:nil": true }`.
Не фильтровать такие элементы: позиция в массиве является частью данных.

В `metadataValue/fixedArray/fromYAML.ts` и `toYAML.ts` сохранить `undefined` как элемент
массива.

В `metadataValue/graphFromModel.ts` при обходе `fixedArray` пропускать `undefined`-элементы,
потому что они не создают ссылочных рёбер.

### Фикстуры

Добавить низкоуровневую фикстуру в `metadataValue/fixedArray`:

- XML с `v8:FixedArray`, где между двумя `xr:DesignTimeRef` находится
  `<v8:Value xsi:nil="true"/>`;
- TS-модель с `undefined` на той же позиции;
- YAML-массив с `undefined` на той же позиции.

Добавить отдельную фикстуру в `сhoiceParameters`, потому что реальные diff'ы приходят именно
через `ChoiceParameters`:

- XML с `ChoiceParameters/app:item/app:value xsi:type="v8:FixedArray"` и nil-элементом внутри;
- TS-модель `ChoiceParameter`, где `value.type === "fixedArray"` и один элемент массива равен
  `undefined`;
- YAML-данные в `data.ts`, где значение параметра выбора является массивом с `undefined`
  внутри.

### Проверки

Минимальный набор тестов:

- `metadataValue/fixedArray fromXML` импортирует `v8:Value xsi:nil="true"` в `undefined`;
- `metadataValue/fixedArray toXML` экспортирует `undefined` обратно в
  `<v8:Value xsi:nil="true"/>`;
- YAML-цикл `FixedArray` сохраняет `undefined` внутри массива;
- `ChoiceParameters fromXML` импортирует `FixedArray` с nil-элементом без потери позиции;
- `ChoiceParameters toXML` экспортирует тот же nil-элемент обратно;
- `ChoiceParameters fromYAML/toYAML` сохраняет `undefined` внутри массива;
- существующее поведение одиночного `app:value xsi:nil="true"` остаётся прежним.

Ожидаемый эффект для round-trip: пункты 9 и 11 triage больше не должны терять
`<v8:Value xsi:nil="true"/>` внутри `FixedArray`.

### Не входит

- Новый публичный тип `MetadataNilValue` для всех `MetadataValue`.
- XML-only сохранение через reference без YAML-представления.
- Строковый YAML-маркер для nil-элементов.
- Изменение семантики одиночного nil-параметра выбора.

## Задача 7: availableValue у полей СКД

### Исходный diff

В форме создания счетов после round-trip теряются два значения `dcssch:availableValue`
у поля набора данных `Состояние`:

```diff
 <Field xsi:type="dcssch:DataSetFieldField">
   <dcssch:dataPath>Состояние</dcssch:dataPath>
   <dcssch:field>Состояние</dcssch:field>
   <dcssch:title xsi:type="v8:LocalStringType">
     ...
   </dcssch:title>
-  <dcssch:availableValue>
-    <dcssch:value xsi:type="xs:string">Выставлен</dcssch:value>
-    <dcssch:presentation xsi:type="v8:LocalStringType">...</dcssch:presentation>
-  </dcssch:availableValue>
-  <dcssch:availableValue>
-    <dcssch:value xsi:type="xs:string">Аннулирован</dcssch:value>
-    <dcssch:presentation xsi:type="v8:LocalStringType">...</dcssch:presentation>
-  </dcssch:availableValue>
 </Field>
```

Затронутый файл из triage:

- `Documents/СчетНаОплатуКлиенту/Forms/ФормаСозданияСчетовНаОплату/Ext/Form.xml`.

Владеющий модуль текущего diff:
`packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField`.

Связанный модуль, где встречается тот же XML-узел:
`packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField`.

Это не `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields`.
`availableFields` описывает доступные поля настроек СКД через `dcsset:field`, а текущий diff
про доступные значения конкретного поля через `dcssch:availableValue`.

### Текущая логика

`DataCompositionSchemaDataSetFieldRules` содержит `dataPath`, `field`, `title`,
`useRestriction`, `valueType` и другие свойства, но не содержит `availableValue`.
Поэтому import не кладёт доступные значения в модель, а export не может восстановить их
обратно.

В XML-дампах найдено две формы `dcssch:availableValue`:

```xml
<dcssch:availableValue>
  <dcssch:value xsi:type="xs:string">Выставлен</dcssch:value>
  <dcssch:presentation xsi:type="v8:LocalStringType">...</dcssch:presentation>
</dcssch:availableValue>
```

и для вычисляемого поля:

```xml
<dcssch:availableValue>
  <dcssch:value xsi:nil="true"/>
</dcssch:availableValue>
<dcssch:availableValue>
  <dcssch:value xsi:type="xs:boolean">true</dcssch:value>
</dcssch:availableValue>
```

Значит решение должно быть общим для полей набора данных и вычисляемых полей, а nil-значение
нужно представить без `null`.

### Решение

Добавить новый общий модуль:

`packages/core/metadata/commonObjects/dataCompositionSystem/availableValues`.

Модель одного элемента:

```ts
export interface DcsAvailableValue {
  itemType: "DcsAvailableValue"
  value?: MetadataDcsMetadataValue
  presentation?: I8nText | string
}
```

Коллекция:

```ts
export type DcsAvailableValues = DcsAvailableValue[]
```

YAML-имя свойства у владельцев: `ДоступныеЗначения`.

YAML одного элемента:

```yaml
Значение: "'Выставлен'"
Представление: Выставлен
```

Для `xsi:nil` не использовать `null` и не вводить строковый маркер. Модель и TS/YAML-фикстуры
должны использовать отсутствие значения:

```ts
{ itemType: "DcsAvailableValue", value: undefined }
```

или, когда поле не нужно фиксировать явно:

```ts
{ itemType: "DcsAvailableValue" }
```

XML-экспорт nil-значения нельзя оставить обычному property-export механизму: свойство со
значением `undefined` будет пропущено. Поэтому у `DcsAvailableValue` нужен собственный
XML-обработчик элемента, который:

- импортирует `<dcssch:value xsi:nil="true"/>` как отсутствующее `value`;
- экспортирует отсутствующее `value` как `<dcssch:value xsi:nil="true"/>`;
- обычные значения импортирует и экспортирует через `MetadataDcsMetadataValue` с
  `valueType: "Primitive"`;
- `dcssch:presentation` импортирует и экспортирует через `DcsLocalStringType`;
- не использует `null` ни в модели, ни в YAML.

Правила владельцев:

```ts
availableValues: {
  type: "DcsAvailableValues",
  xml: "dcssch:availableValue",
  yaml: "ДоступныеЗначения",
}
```

Свойство добавить в:

- `DataCompositionSchemaDataSetFieldRules`;
- `CalculatedFieldRules`.

Порядок XML не задавать через `order` без необходимости: для реальных round-trip порядок
должен подтягиваться из reference XML. Если узкая фикстура без reference потребует устойчивый
порядок, допустимо указать порядок только для нового свойства и только рядом с наблюдаемым
местом после `title` / `useRestriction`, чтобы не менять порядок остальных полей.

### Архитектура

Модуль `availableValues` должен регистрировать:

- item rule для `DcsAvailableValue`;
- collection rule `DcsAvailableValues` с XML-элементом `dcssch:availableValue`;
- fromXML/toXML для элемента, потому nil-значение требует явного тега
  `<dcssch:value xsi:nil="true"/>`;
- fromYAML/toYAML можно оставить декларативными через item rule, если отсутствие `Значение`
  корректно сохраняется как `undefined`.

В `dataCompositionSystem/index.ts` нужно подключить новый модуль рядом с соседними DCS-типами.

`PropertyRuleType` расширить:

```ts
DcsAvailableValue: {
  item: DcsAvailableValue
  yaml: DcsAvailableValueYAML
}
DcsAvailableValues: {
  item: DcsAvailableValues
  yaml: DcsAvailableValuesYAML
}
```

`value` внутри элемента не должен использовать тип `DcsMetadataTypedValue`, потому в проекте
уже есть `MetadataDcsMetadataValue` для DCS-значений в тегах `dcscor:value` / `dcssch:value`.
Нужен только небольшой адаптер вокруг имени XML-узла: внутри `availableValue` это
`dcssch:value`, а не `dcscor:value`.

### Фикстуры

Добавить фикстуры в `dataCompositionSystem/availableValues`:

- XML с двумя `dcssch:availableValue`, где значения `xs:string`, а представления заданы через
  `v8:LocalStringType`;
- TS-модель с двумя элементами `DcsAvailableValue`;
- YAML-модель коллекции с элементами, где используются `Значение` и `Представление`;
- XML с `dcssch:value xsi:nil="true"` и XML с `xs:boolean`, чтобы закрыть вычисляемое поле.

Добавить фикстуру для `dataCompositionSchemaDataSetField`:

- XML `Field xsi:type="dcssch:DataSetFieldField"` с `dataPath`, `field`, `title` и двумя
  `dcssch:availableValue`;
- TS-модель с `availableValues`;
- YAML-модель с `ДоступныеЗначения`.

Добавить фикстуру для `calculatedField`:

- XML `CalculatedField` с `dcssch:availableValue/dcssch:value xsi:nil="true"` и
  `dcssch:availableValue/dcssch:value xsi:type="xs:boolean">true</dcssch:value>`;
- TS-модель без `null`: первый элемент с отсутствующим `value`, второй с boolean-значением;
- YAML-модель с тем же отсутствующим `Значение` у первого элемента.

### Проверки

Минимальный набор тестов:

- `availableValues fromXML` импортирует строковые значения и представления;
- `availableValues toXML` экспортирует строковые значения и представления обратно;
- `availableValues fromXML` импортирует `dcssch:value xsi:nil="true"` как отсутствующее
  `value`;
- `availableValues toXML` экспортирует отсутствующее `value` обратно как
  `<dcssch:value xsi:nil="true"/>`;
- `availableValues fromYAML/toYAML` сохраняет `undefined`, не превращая его в `null`;
- `DataCompositionSchemaDataSetField` импортирует и экспортирует `ДоступныеЗначения`;
- `CalculatedField` импортирует и экспортирует `ДоступныеЗначения`;
- XML round-trip формы из пункта 13 больше не теряет оба `dcssch:availableValue`.

### Не входит

- Использование существующего `availableFields`: это другой XML-пространственный контекст и
  другая семантика.
- Использование `null` в модели или YAML.
- Строковый YAML-маркер для nil-значений.
- XML-only сохранение через reference без полноценного YAML-представления.
