# Round-trip non-name form diffs design

Дата: 2026-05-09

## Контекст

Short round-trip по XML-дампу `trade` показал 18 расхождений. Из них 14 выглядят как
переименование служебных элементов формы с английских суффиксов в `name`
(`ExtendedTooltip`, `SearchString`, `ViewStatus`, `SearchControl`) на русские имена.

Этот документ фиксирует только расхождения, которые не сводятся к английским названиям в именах.
Проблемы разбираются последовательно; после согласования решения для каждой проблемы документ
пополняется отдельным разделом с выбранным подходом.

## Очередь

1. `Catalogs/МашиночитаемыеДоверенности/Forms/ФормаСписка/Ext/Form.xml`
   - `FormAttribute`: добавляется пустой `<Settings xsi:type="v8:TypeDescription"/>`.
2. `Catalogs/РеестрПартийЗЕРНО/Forms/ФормаСписка/Ext/Form.xml`
   - `DynamicList`: теряется `<QueryText>`.
3. `Catalogs/ТСПИоТ/Forms/ФормаСписка/Ext/Form.xml`
   - `DynamicList`: теряются два `<CalculatedField>`.
4. `Catalogs/УчетныеЗаписиМаркетплейсов/Forms/НастройкаОтборовСписка/Ext/Form.xml`
   - форма или связанный элемент: теряется `<CustomSettingsFolder>`.

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

### Проверка прошлых решений

Ровно это решение уже описано в
`docs/superpowers/specs/2026-05-09-form-round-trip-diffs-2-6-design.md`: экспорт не должен
сам придумывать пустой `Settings`; он должен сохранять его только по reference, если такой узел
был в исходном XML.

Коммит `590f411a9 feat: :sparkles: сохранить типизированные Settings формы` реализовал соседнюю
спецификацию про `Chart` и `SpreadsheetDocument`. В ней явно указано, что изменение поведения
пустого `Settings xsi:type="v8:TypeDescription"` для `ValueListType` не входит в границы.
Поэтому текущий код всё ещё содержит старое условие:

```ts
typedSettings === undefined && (data.type?.type.includes("ValueListType") || result.Settings !== undefined)
```

Именно первая часть условия создаёт лишний пустой `Settings` без reference.

### Решение

Принято решение сохранять оба допустимых XML-состояния для `ValueListType` без `valueType`:

1. Если в модели есть `valueType`, экспортировать `<Settings xsi:type="v8:TypeDescription">...</Settings>`.
2. Если `valueType` нет, но reference для этого реквизита содержит пустой
   `<Settings xsi:type="v8:TypeDescription"/>`, сохранить пустой `Settings`.
3. Если `valueType` нет и reference тоже не содержит `Settings`, не создавать `Settings`.
4. Если reference отсутствует, `ValueListType` без `valueType` экспортируется без `Settings`.

Текущую проверку `data.type?.type.includes("ValueListType")` нужно убрать из условия создания
пустого `Settings`; наличие `Settings` должно определяться моделью или reference-данными.

### Тесты

Нужны две XML-фикстуры для `FormAttribute`:

- `valueListWithoutSettings.xml`: `Type` содержит `v8:ValueListType`, `Settings` отсутствует.
- `valueListWithReferenceEmptySettings.xml`: `Type` содержит `v8:ValueListType`, рядом есть пустой
  `<Settings xsi:type="v8:TypeDescription"/>`.

Проверки:

- import обеих XML-фикстур даёт модель без `valueType`;
- export без reference для `valueListWithoutSettings` не создаёт `Settings`;
- export с reference для `valueListWithReferenceEmptySettings` сохраняет пустой `Settings`;
- существующий случай с заполненным `valueType` продолжает экспортировать заполненный `Settings`.

## Проблема 2: QueryText у DynamicList при ManualQuery=false

### Исходный diff

Файл:
`Catalogs/РеестрПартийЗЕРНО/Forms/ФормаСписка/Ext/Form.xml`

После round-trip из `DynamicList` пропадает `QueryText`, хотя в исходном XML он есть рядом с
`ManualQuery=false`:

```diff
 <Settings xsi:type="DynamicList">
   <ManualQuery>false</ManualQuery>
   <DynamicDataRead>true</DynamicDataRead>
-  <QueryText>ВЫБРАТЬ
-       РеестрПартийЗЕРНО.Ссылка,
-       ...
- ИЗ
-       Справочник.РеестрПартийЗЕРНО
- КАК
-       РеестрПартийЗЕРНО</QueryText>
   <MainTable>Catalog.РеестрПартийЗЕРНО</MainTable>
   <ListSettings>
```

Владеющий модуль:
`packages/core/metadata/forms/commonObjects/dynamicList`.

### Текущая логика

`DynamicListRules.queryText` хранится во внешнем файле
`ДинамическийСписок/<ИмяРеквизита>.query`, а `customQuery` (`ManualQuery`) объявлен как
производное поле:

```ts
customQuery: {
  type: "boolean",
  xml: "ManualQuery",
  derivedFrom: { externalFile: "queryText" },
  defaultValue: false,
  defaultValueXML: false,
}
```

В `DynamicList` есть отдельное переопределение `importFromXML`: если `ManualQuery=false`, оно
удаляет `queryText` из модели, чтобы не создавать лишний `.query`. Реальный XML показывает, что
`ManualQuery=false` и `QueryText` могут сосуществовать, поэтому такая эвристика теряет данные.

### Решение

Принято решение явно фиксировать редкий случай, когда в XML есть `QueryText`, но `ManualQuery=false`.

Обычный путь остаётся прежним:

1. `queryText` хранится во внешнем `.query`.
2. `ManualQuery=true` по-прежнему может выводиться из наличия `.query`.
3. Если `.query` нет, `ManualQuery` по умолчанию остаётся `false`.

Особый случай:

1. При import из XML не удалять `queryText`, если `QueryText` присутствует при `ManualQuery=false`.
2. При export в YAML записывать явное значение `ManualQuery=false` только для такого случая.
3. При import из YAML читать это явное значение и не заменять его производным `true` от наличия
   `.query`.
4. При export в XML возвращать одновременно `<ManualQuery>false</ManualQuery>` и `<QueryText>...`.

Так мы сохраняем исходный XML без отказа от внешнего `.query` и без обязательного шума в YAML
для обычных динамических списков.

### Тесты

Нужен focused reproducer для `DynamicList`:

- XML-фикстура `queryTextWithManualQueryFalse.xml`: `Settings xsi:type="DynamicList"` с
  `ManualQuery=false`, `QueryText`, `MainTable` и минимальным `ListSettings`.
- TS-фикстура ожидаемой модели: содержит `queryText` и явный `customQuery: false`.
- YAML round-trip: `.query` создаётся, а YAML содержит явный `ПроизвольныйЗапрос: Ложь`
  только для этого случая.

Проверки:

- import XML не теряет `queryText`;
- export XML возвращает `ManualQuery=false` и `QueryText`;
- XML → YAML + `.query` → XML сохраняет оба узла;
- обычный случай с `.query` и без явного `customQuery=false` продолжает экспортировать
  `ManualQuery=true`.

## Проблема 3: несколько CalculatedField у DynamicList

### Исходный diff

Файл:
`Catalogs/ТСПИоТ/Forms/ФормаСписка/Ext/Form.xml`

После round-trip из `DynamicList` исчезают два вычисляемых поля:

```diff
 <Settings xsi:type="DynamicList">
   <ManualQuery>false</ManualQuery>
   <DynamicDataRead>true</DynamicDataRead>
-  <CalculatedField>
-    <dcssch:dataPath>РабочееМесто</dcssch:dataPath>
-    <dcssch:expression>ФискальноеУстройство.РабочееМесто</dcssch:expression>
-    <dcssch:title xsi:type="v8:LocalStringType">
-      <v8:item>
-        <v8:lang>ru</v8:lang>
-        <v8:content>Рабочее место</v8:content>
-      </v8:item>
-    </dcssch:title>
-  </CalculatedField>
-  <CalculatedField>
-    <dcssch:dataPath>ОбщееСостояниеПодключения</dcssch:dataPath>
-    <dcssch:expression/>
-    <dcssch:title xsi:type="v8:LocalStringType">
-      <v8:item>
-        <v8:lang>ru</v8:lang>
-        <v8:content>Настройки</v8:content>
-      </v8:item>
-    </dcssch:title>
-    <dcssch:appearance>
-      <dcscor:item xsi:type="dcsset:SettingsParameterValue">
-        <dcscor:parameter>ЦветТекста</dcscor:parameter>
-        <dcscor:value xsi:type="v8ui:Color">#1C55AE</dcscor:value>
-      </dcscor:item>
-    </dcssch:appearance>
-  </CalculatedField>
   <MainTable>Catalog.ТСПИоТ</MainTable>
```

Владеющий модуль:
`packages/core/metadata/forms/commonObjects/dynamicList`.

### Текущая логика

`CalculatedField` уже описан как одиночный metadata item в
`packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField`.

В `DynamicListRules` поле сейчас тоже объявлено как одиночное:

```ts
calculatedFields: {
  type: "CalculatedField",
  xml: "CalculatedField",
  yaml: "ВычисляемыеПоля",
}
```

При нескольких соседних `<CalculatedField>` XML-парсер отдаёт массив, а стандартная регистрация
одиночного metadata item не является коллекцией. В результате несколько вычисляемых полей не могут
стабильно пройти XML → модель → XML.

### Решение

Принято решение ввести отдельный коллекционный тип `CalculatedFields`:

1. `CalculatedField` остаётся одиночным объектом.
2. `CalculatedFields` хранит `CalculatedField[]`.
3. Import XML принимает одиночный `<CalculatedField>` и массив `<CalculatedField>`.
4. Export XML возвращает повторяющиеся `<CalculatedField>`.
5. YAML представляет `ВычисляемыеПоля` как список вычисляемых полей.
6. В `DynamicListRules.calculatedFields` заменить `type: "CalculatedField"` на
   `type: "CalculatedFields"`.

Так множественность остаётся на уровне свойства `DynamicList`, а не смешивается с одиночной
моделью `CalculatedField`. Аналогичный подход уже используется рядом для
`CalculatedFieldOrderExpression`.

### Тесты

Нужен focused reproducer для `DynamicList`:

- XML-фикстура `multipleCalculatedFields.xml`: `Settings xsi:type="DynamicList"` с двумя
  `<CalculatedField>`, `MainTable` и минимальным `ListSettings`.
- TS-фикстура ожидаемой модели: `calculatedFields` как массив из двух `CalculatedField`.
- YAML-фикстура или проверка YAML round-trip: `ВычисляемыеПоля` экспортируется списком.

Проверки:

- import XML читает оба `CalculatedField` в массив;
- export XML возвращает оба узла в исходном порядке;
- XML → YAML → XML сохраняет оба вычисляемых поля;
- существующий одиночный `CalculatedField` продолжает импортироваться и экспортироваться
  без изменения XML.

## Проблема 4: CustomSettingsFolder у формы

### Исходный diff

Файл:
`Catalogs/УчетныеЗаписиМаркетплейсов/Forms/НастройкаОтборовСписка/Ext/Form.xml`

После round-trip у корня формы пропадает `CustomSettingsFolder`:

```diff
 <CommandSet>
   <ExcludedCommand>EndEdit</ExcludedCommand>
 </CommandSet>
-<CustomSettingsFolder>ГруппаПользовательскихНастроек</CustomSettingsFolder>
 <AutoCommandBar name="ФормаКоманднаяПанель" id="-1">
   <HorizontalAlign>Right</HorizontalAlign>
 </AutoCommandBar>
```

Владеющий модуль:
`packages/core/metadata/forms/clientApplicationForm`.

### Текущая логика

Похожее свойство уже есть у элемента `Table`:

```ts
userSettingsGroup: { yaml: "ГруппаПользовательскихНастроек", type: "string" }
```

Но оно относится к XML-тегу `<UserSettingsGroup>` внутри `<Table>`. В найденном diff тег
`<CustomSettingsFolder>` расположен на верхнем уровне `<Form>`, сразу после `CommandSet`, поэтому
это свойство самой формы, а не таблицы.

В `ClientApplicationFormRules` такого поля сейчас нет, поэтому import игнорирует XML-узел, а export
не может восстановить его.

### Решение

Принято решение добавить полноценное поле формы в `ClientApplicationFormRules`:

```ts
customSettingsFolder: {
  yaml: "ГруппаПользовательскихНастроек",
  xml: "CustomSettingsFolder",
  type: "string",
  tag: FormRulesTags.Form,
}
```

Это обычное смысловое свойство формы: значение ссылается на группу формы по имени и должно явно
переживать XML → модель → YAML → XML.

### Тесты

Нужны реальные XML- и TS-фикстуры, подключённые к существующим `fromXML`/`toXML` тестам, чтобы
проверка выполнялась в обычном наборе тестов.

Фикстуры:

- XML-фикстура формы, например
  `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolder.xml`,
  с корневым `<Form>` и тегом
  `<CustomSettingsFolder>ГруппаПользовательскихНастроек</CustomSettingsFolder>`.
- Парная metadata XML-фикстура, если существующий тестовый помощник формы требует отдельный
  `MetaDataObject`.
- TS-фикстура, например
  `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolder.ts`,
  с ожидаемой моделью `ClientApplicationForm`, где есть
  `customSettingsFolder: "ГруппаПользовательскихНастроек"`.

Проверки:

- `fromXML.test.ts` импортирует XML-фикстуру и сравнивает с TS-фикстурой;
- `toXML.test.ts` экспортирует TS-фикстуру и сравнивает с XML-фикстурой;
- YAML-проверка, если форма покрывает YAML round-trip: свойство выводится как
  `ГруппаПользовательскихНастроек`;
- тесты должны быть обычными `it(...)`, не `skip`, чтобы новая фикстура участвовала в `pnpm test`.
