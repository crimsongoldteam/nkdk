# Form round-trip losses design

Дата: 2026-05-09

## Контекст

Short round-trip по XML-дампу `trade` показал пачку расхождений в формах документов.
Эта спецификация собирает согласованные решения по задачам из пачки 1-5. Задачи разбираются
последовательно; каждая фиксируется отдельным разделом после согласования.

Источник triage:

1. `Documents/Встреча/Forms/ФормаДокумента/Ext/Form.xml`
2. `Documents/ЗапланированноеВзаимодействие/Forms/ФормаДокумента/Ext/Form.xml`
3. `Documents/ЗапросКоммерческихПредложенийПоставщиков/Forms/ФормаДокумента/Ext/Form.xml`
4. `Documents/ЗаявкаНаВозвратТоваровОтКлиента/Forms/ФормаДокумента/Ext/Form.xml`
5. `Documents/ЗаявкаНаВозвратТоваровОтКлиента/Forms/ФормаДокументаСамообслуживание/Ext/Form.xml`

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
