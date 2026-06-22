# Явные пустые значения в erp round-trip YAML

## Контекст

В полном round-trip `XML -> YAML -> XML` для `erp` осталось два diff.
Оба связаны с тем, что пустая XML-форма имеет смысл, но после YAML-цикла
становится неотличимой от отсутствующего значения.

Первый diff находится в форме
`Catalogs/РесурсныеСпецификации/Forms/ФормаЭлемента/Ext/Form.xml`.

Исходный XML содержит верхнее значение параметра выбора формы:

```xml
<app:value xsi:type="FormChoiceListDesTimeValue">
  <Presentation/>
  <Value xsi:nil="true"/>
</app:value>
```

После YAML-цикла оно схлопывается в простое отсутствие значения:

```xml
<app:value xsi:nil="true"/>
```

Причина в том, что пустой `FormChoiceListDesTimeValue` экспортируется в YAML как
пустой объект или пустое значение. В `ChoiceParameters` такая форма уже занята
другим смыслом: параметр выбора есть, но собственного значения у него нет.
После обратного YAML-импорта тип обертки `FormChoiceListDesTimeValue` уже нельзя
восстановить детерминированно.

Второй diff находится в форме
`DataProcessors/УправлениеПродажамиНаМаркетплейсах/Forms/ВыгрузкаТоварногоКаталога/Ext/Form.xml`.

Исходный XML содержит пустую строку внутри DCS SettingsParameterValue:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
  <dcscor:use>false</dcscor:use>
  <dcscor:parameter>НоменклатураВключение</dcscor:parameter>
  <dcscor:value xsi:type="xs:string"/>
</dcscor:item>
```

После YAML-цикла `dcscor:value` пропадает:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
  <dcscor:use>false</dcscor:use>
  <dcscor:parameter>НоменклатураВключение</dcscor:parameter>
</dcscor:item>
```

Причина в том, что присутствующий XML-узел `xs:string` без `#text` сейчас
становится отсутствующим значением. Но в DCS это не одно и то же:
`<dcscor:value xsi:type="xs:string"/>` означает явную пустую строку, а отсутствие
`dcscor:value` означает отсутствие значения.

## Цель

Сделать верхние значения `FormChoiceListDesTimeValue` внутри `ChoiceParameters`
обратимыми через явный YAML-тип, не меняя краткий YAML для обычных значений
параметров выбора.

Также сохранить пустой `dcscor:value xsi:type="xs:string"` как явную пустую
строку, не переводя отсутствующие значения DCS в пустые строки.

## Договор YAML

Обычные параметры выбора остаются в текущей краткой форме:

```yaml
Отбор.Закрыт: Ложь
Отбор.Код: "456"
```

Параметр без значения остается пустым значением:

```yaml
ВыборСчетовГоловнойОрганизации:
```

Если верхнее значение параметра имеет тип `formChoiceListDesTimeValue`, оно
экспортируется явно:

```yaml
ВыборДействующихМаршрутныхКарт:
  Тип: ЗначениеСпискаВыбора
```

Если у значения списка выбора есть внутреннее значение, оно сохраняется в поле
`Значение`:

```yaml
БезПроизводныхЗначений:
  Тип: ЗначениеСпискаВыбора
  Значение: Истина
```

Если есть представление, оно сохраняется в поле `Представление`:

```yaml
Отбор.ТипСчета:
  Тип: ЗначениеСпискаВыбора
  Представление: Нераспределенная прибыль
  Значение: Перечисление.ТипыСчетов.НераспределеннаяПрибыль
```

`Тип: ЗначениеСпискаВыбора` применяется ко всем верхним
`FormChoiceListDesTimeValue` внутри `ChoiceParameters`, включая пустой случай.
Это совпадает с уже выбранной явной формой для элементов `FixedArray`.

## Импорт

`fromYAML` для `ChoiceParameters` должен распознавать объект с
`Тип: ЗначениеСпискаВыбора` как `formChoiceListDesTimeValue`.

Пустая форма:

```yaml
ВыборДействующихМаршрутныхКарт:
  Тип: ЗначениеСпискаВыбора
```

должна импортироваться в модель:

```ts
{
  name: "ВыборДействующихМаршрутныхКарт",
  value: { type: "formChoiceListDesTimeValue" }
}
```

Пустой YAML без `Тип` по-прежнему означает параметр без значения, а не
`FormChoiceListDesTimeValue`.

## Экспорт

`toYAML` для `ChoiceParameters` должен проверять верхний `param.value`.
Если его тип `formChoiceListDesTimeValue`, экспорт идет через явную форму
`Тип: ЗначениеСпискаВыбора`.

Для обычных строк, чисел, булевых значений, ссылок, массивов и параметров без
значения текущий экспорт не меняется.

## Пустой xs:string в DCS SettingsParameterValue

Если в XML присутствует:

```xml
<dcscor:value xsi:type="xs:string"/>
```

импорт должен создавать явное строковое значение:

```ts
{
  parameter: "НоменклатураВключение",
  use: false,
  value: { type: "string", value: "" }
}
```

Это значение уже имеет существующую явную YAML-форму для field-контекста:

```yaml
НоменклатураВключение:
  Использовать: Ложь
  Тип: Строка
  Значение: ""
```

При обратном импорте YAML эта форма должна восстанавливаться как
`{ type: "string", value: "" }`, а XML-экспорт должен вернуть:

```xml
<dcscor:value xsi:type="xs:string"/>
```

Отсутствующий `dcscor:value` не должен превращаться в пустую строку. Различие
строится именно на наличии XML-узла с `xsi:type="xs:string"`.

## XML-эффект

После обратного YAML-импорта `toXML` должен восстановить исходную обертку:

```xml
<app:value xsi:type="FormChoiceListDesTimeValue">
  <Presentation/>
  <Value xsi:nil="true"/>
</app:value>
```

Это устраняет схлопывание в:

```xml
<app:value xsi:nil="true"/>
```

## Тестирование

Нужно покрыть:

- `choiceParameters/toYAML`: верхний `formChoiceListDesTimeValue` экспортируется
  с `Тип: ЗначениеСпискаВыбора`.
- `choiceParameters/fromYAML`: явная пустая форма импортируется как
  `formChoiceListDesTimeValue` без внутреннего значения.
- XML round-trip на минимальном фрагменте `ChoiceParameters`, где
  `app:value` имеет `xsi:type="FormChoiceListDesTimeValue"`, пустой
  `Presentation` и `Value xsi:nil`.
- XML/YAML round-trip на минимальном DCS SettingsParameterValue, где
  `dcscor:value` имеет `xsi:type="xs:string"` без `#text`.
- Проверка, что отсутствие `dcscor:value` остается отсутствующим значением и не
  превращается в пустую строку.
- Полный `pnpm test` перед закрытием работы.
- Диагностический `round-trip-yaml`: diff
  `Catalogs/РесурсныеСпецификации/Forms/ФормаЭлемента/Ext/Form.xml` должен
  исчезнуть.
- Диагностический `round-trip-yaml`: diff
  `DataProcessors/УправлениеПродажамиНаМаркетплейсах/Forms/ВыгрузкаТоварногоКаталога/Ext/Form.xml`
  должен исчезнуть.

## Не входит в задачу

- Не менять XML-фикстуры.
- Не менять XML-договор `FormChoiceListDesTimeValue`.
- Не переводить обычные значения `ChoiceParameters` на полную форму.
- Не восстанавливать пустой `xs:string` только из reference XML: YAML должен
  сохранять явную пустую строку сам.
- Не чинить другие классы оставшихся round-trip diff в этой задаче.
