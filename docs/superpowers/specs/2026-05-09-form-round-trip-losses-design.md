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
