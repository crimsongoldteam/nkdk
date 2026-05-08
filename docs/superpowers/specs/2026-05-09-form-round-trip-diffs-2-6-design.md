# Round-trip diffs 2-6: form XML design

Дата: 2026-05-09

## Контекст

Short round-trip по XML-дампу `trade` показал пачку расхождений 2-6. Третий diff из пачки
(`Catalogs/Номенклатура/Forms/ФормаЭлемента/Ext/Form.xml`) сознательно исключён из разбора.

Проблемы разбираются последовательно. После согласования каждой проблемы этот документ пополняется
отдельным разделом.

## Проблема 1: пустой Settings у FormAttribute ValueListType

### Исходный diff

Файл:
`Catalogs/МашиночитаемыеДоверенности/Forms/ФормаСписка/Ext/Form.xml`

После round-trip у реквизита формы добавляется пустой `Settings`, которого не было в исходном XML:

```diff
 <Attribute name="Полномочия" id="10">
   <Type>
     <v8:Type>v8:ValueListType</v8:Type>
     <v8:Type>xs:string</v8:Type>
     <v8:StringQualifiers>
       <v8:Length>0</v8:Length>
       <v8:AllowedLength>Variable</v8:AllowedLength>
     </v8:StringQualifiers>
   </Type>
+  <Settings xsi:type="v8:TypeDescription"/>
 </Attribute>
```

Владеющий модуль:
`packages/core/metadata/forms/commonObjects/formAttribute`.

### Текущая логика

`FormAttributeRules` описывает два разных свойства:

- `type` экспортируется в `<Type>`.
- `valueType` экспортируется в `<Settings>`.

Общий `exportPropertiesToXML` создаёт `<Settings>` только если в модели есть `valueType`
или если это значение пришло из reference-модели.

Затем `exportFormAttributeToXML` принудительно добавляет `_xsi:type: "v8:TypeDescription"`
в `result.Settings`, если выполнено одно из условий:

- `data.type?.type.includes("ValueListType")`;
- `result.Settings !== undefined`.

Из-за первого условия пустой `<Settings xsi:type="v8:TypeDescription"/>` появляется даже тогда,
когда в исходном XML этого узла не было и `valueType` в модели отсутствует.

### Цель

Поддержать оба допустимых XML-состояния для `ValueListType` без `valueType`:

- с пустым `<Settings xsi:type="v8:TypeDescription"/>`;
- без `<Settings>`.

Экспорт не должен сам придумывать пустой `Settings`. Он должен сохранять его только по reference,
если такой узел был в исходном XML.

### Решение

Правило экспорта для `FormAttribute.Settings`:

1. Если в модели есть `valueType`, экспортировать `<Settings xsi:type="v8:TypeDescription">...</Settings>`.
2. Если `valueType` нет, но reference для этого реквизита содержит пустой
   `<Settings xsi:type="v8:TypeDescription"/>`, сохранить пустой `Settings`.
3. Если `valueType` нет и reference тоже не содержит `Settings`, не создавать `Settings`.
4. Если reference отсутствует, `ValueListType` без `valueType` экспортируется без `Settings`.

Текущую безусловную проверку `data.type?.type.includes("ValueListType")` нужно заменить на проверку
наличия реального `Settings`: из модели или из reference.

### Тесты

Нужны две XML-фикстуры для `FormAttribute`:

- `valueListWithoutSettings.xml`: `Type` содержит `v8:ValueListType`, `Settings` отсутствует.
- `valueListWithReferenceEmptySettings.xml`: `Type` содержит `v8:ValueListType`, рядом есть пустой
  `<Settings xsi:type="v8:TypeDescription"/>`.

Для каждой XML-фикстуры нужна соответствующая TS-фикстура ожидаемой модели. Обе модели не содержат
`valueType`; различие между ними должно проверяться через XML/reference-поведение, а не через новое
доменное поле.

Проверки:

- import обеих XML-фикстур даёт модель без `valueType`;
- export без reference для `valueListWithoutSettings` не создаёт `Settings`;
- export с reference для `valueListWithReferenceEmptySettings` сохраняет пустой `Settings`;
- существующий случай с заполненным `valueType` продолжает экспортировать заполненный `Settings`.

### Не входит

- Поддержка `Settings` для chart/spreadsheet-объектов из других diff'ов.
- Добавление нового поля в модель только для признака пустого `Settings`.
- Изменение семантики `DynamicList` в `Settings`.

## Проблема 2: CommandSet у FormattedDocumentField

### Исходный diff

Файл:
`Catalogs/Новости/Forms/ФормаДокумента/Ext/Form.xml`

После round-trip у поля форматированного документа пропадает `CommandSet`:

```diff
 <FormattedDocumentField name="ФорматированныйТекст" id="278">
   <DataPath>ФорматированныйТекст</DataPath>
   <TitleLocation>None</TitleLocation>
-  <CommandSet>
-    <ExcludedCommand>AlignCenter</ExcludedCommand>
-    <ExcludedCommand>AlignJustify</ExcludedCommand>
-    <ExcludedCommand>AlignLeft</ExcludedCommand>
-    <ExcludedCommand>AlignRight</ExcludedCommand>
-    <ExcludedCommand>BackColor</ExcludedCommand>
-    <ExcludedCommand>Char</ExcludedCommand>
-    <ExcludedCommand>DecreaseFontSize</ExcludedCommand>
-    <ExcludedCommand>DecreaseIndent</ExcludedCommand>
-    <ExcludedCommand>Font</ExcludedCommand>
-    <ExcludedCommand>Hyperlink</ExcludedCommand>
-    <ExcludedCommand>IncreaseFontSize</ExcludedCommand>
-    <ExcludedCommand>IncreaseIndent</ExcludedCommand>
-    <ExcludedCommand>LineSpacing</ExcludedCommand>
-    <ExcludedCommand>Picture</ExcludedCommand>
-    <ExcludedCommand>SaveAs</ExcludedCommand>
-    <ExcludedCommand>SelectAll</ExcludedCommand>
-    <ExcludedCommand>TextColor</ExcludedCommand>
-  </CommandSet>
   <AutoMaxHeight>false</AutoMaxHeight>
 </FormattedDocumentField>
```

Владеющий модуль:
`packages/core/metadata/forms/elements/formattedDocumentField`.

### Текущая логика

Общий тип `CommandSet` уже реализован:

- `fromXML` читает `CommandSet/ExcludedCommand` в массив строк;
- `toXML` экспортирует массив строк обратно в `ExcludedCommand`.

Соседние элементы формы уже используют это свойство:

- `SpreadSheetDocumentFieldRules.commandSet`;
- `PDFDocumentFieldRules.commandSet`;
- `PlannerFieldRules.commandSet`;
- `TableRules.commandSet`.

В `FormattedDocumentFieldRules` свойства `commandSet` сейчас нет, поэтому import игнорирует XML-узел,
а export не может восстановить его.

### Цель

Сохранять `CommandSet` у `FormattedDocumentField` так же, как у соседних form field элементов.

### Решение

Добавить в `FormattedDocumentFieldRules.properties` поле:

```ts
commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false }
```

Это использует существующий тип `CommandSet` и не требует нового кода import/export.

### Альтернативы

Рекомендованный вариант: точечно добавить `commandSet` в `FormattedDocumentFieldRules`.

Отклонённые варианты:

- Перенести `commandSet` в `formFieldCommonProperties`: слишком широко, свойство появится у элементов,
  где платформа может его не поддерживать.
- Сохранять сырой XML `CommandSet` по reference: не нужно, потому что доменная модель уже есть.

### Тесты

Добавить XML/TS фикстуру для `FormattedDocumentField` с несколькими `ExcludedCommand`.

Проверки:

- import читает `CommandSet` в `commandSet: string[]`;
- export возвращает тот же список `ExcludedCommand` в исходном порядке;
- существующие фикстуры `FormattedDocumentField` без `CommandSet` не начинают экспортировать пустой узел.

## Проблема 3: typed MinValue/MaxValue у TableInputField

### Исходные diff'ы

Файлы:

- `Catalogs/ОтветственныеЗаАктуализациюТокеновАвторизацииИСМП/Forms/ФормаЭлемента/Ext/Form.xml`
- `Catalogs/ОтветственныеЗаПодписаниеСообщенийЗЕРНО/Forms/ФормаЭлемента/Ext/Form.xml`

В обоих случаях после round-trip у табличного поля ввода теряется `xsi:type` на числовых границах:

```diff
 <InputField name="ОтветственныеВремя" id="23">
   <DataPath>Объект.Ответственные.Время</DataPath>
   <Width>10</Width>
   <HorizontalStretch>false</HorizontalStretch>
   <AutoMarkIncomplete>true</AutoMarkIncomplete>
-  <MinValue xsi:type="xs:decimal">1</MinValue>
-  <MaxValue xsi:type="xs:decimal">59</MaxValue>
+  <MinValue>1</MinValue>
+  <MaxValue>59</MaxValue>
 </InputField>
```

Владеющий модуль:
`packages/core/metadata/forms/elements/inputField`.

### Текущая логика

Для обычного `InputField` свойства `minValue` и `maxValue` объявлены с `typedXML: true`.
`number/toXML` при таком правиле экспортирует значение как:

```ts
{ "_xsi:type": "xs:decimal", "#text": String(value) }
```

Для `TableInputFieldRules` свойства `minValue` и `maxValue` переопределены без `typedXML`.
Из-за этого табличный `InputField` экспортирует plain number, и сериализатор пишет `<MinValue>1</MinValue>`.

### Цель

Сохранять `xsi:type="xs:decimal"` для `MinValue` и `MaxValue` у табличных input-полей так же,
как у обычных `InputField`.

### Решение

В `TableInputFieldRules` нужно перестать терять `typedXML` для `minValue` и `maxValue`.
Допустимые реализации:

- убрать локальное переопределение этих двух свойств, если оно не нужно для другой семантики;
- или оставить переопределение, но добавить `typedXML: true`.

Предпочтение: убрать переопределение, если проверка существующих тестов подтвердит, что оно не несёт
другой функции. Если переопределение нужно сохранить ради порядка или будущей читаемости, оно должно
быть полным эквивалентом обычного `InputField`-правила по XML-форме.

### Альтернативы

Рекомендованный вариант: вернуть typed decimal на уровне `TableInputFieldRules`. Это минимально и
совпадает с уже принятой семантикой обычного `InputField`.

Отклонённые варианты:

- Сохранять `xsi:type` только по reference: сложнее и не нужно, потому что `MinValue/MaxValue`
  являются числовыми границами и должны иметь стабильную typed XML-форму.
- Считать табличный вариант отдельной канонической формой без `xsi:type`: противоречит исходному XML 1С.

### Тесты

Добавить отдельную XML/TS фикстуру для `TableInputField` с `MinValue` и `MaxValue`, где оба узла имеют
`xsi:type="xs:decimal"`.

Проверки:

- import читает typed decimal в числа;
- export возвращает `MinValue` и `MaxValue` с `xsi:type="xs:decimal"`;
- существующие фикстуры `TableInputField` не получают неожиданных изменений, кроме осознанной
  нормализации этих двух числовых узлов.
