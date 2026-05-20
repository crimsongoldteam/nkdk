# Объектный YAML для неоднозначных значений форм

## Контекст

`round-trip-yaml --triage --batch-size 5 --start-index 6` показал, что `ChoiceParameters` теряет XML-обертку `FormChoiceListDesTimeValue`.

Исходный XML:

```xml
<app:value xsi:type="FormChoiceListDesTimeValue">
  <Presentation/>
  <Value xsi:type="xs:boolean">false</Value>
</app:value>
```

После цикла XML -> YAML -> XML:

```xml
<app:value xsi:type="xs:string">Ложь()</app:value>
```

Причина в компактном YAML-представлении `FormChoiceListDesTimeValue`: значение `Ложь()` выглядит как строковая формула и при обратном чтении может быть восстановлено не как обертка выбора, а как обычная строка. Та же проблема видна для `Истина()`.

## Наблюдаемые расхождения

Расхождения повторяются в разных формах и для обоих boolean-значений.

`BusinessProcesses/ЗаявкаСотрудникаСправка2НДФЛ/Forms/ДействиеВыполнить/Ext/Form.xml`, параметр `Отбор.ПометкаУдаления`:

```diff
-<app:value xsi:type="FormChoiceListDesTimeValue">
-  <Presentation/>
-  <Value xsi:type="xs:boolean">false</Value>
-</app:value>
+<app:value xsi:type="xs:string">Ложь()</app:value>
```

`BusinessProcesses/ОбращениеСотрудника/Forms/ДействиеВыполнить/Ext/Form.xml`, параметр `Отбор.ПометкаУдаления`:

```diff
-<app:value xsi:type="FormChoiceListDesTimeValue">
-  <Presentation/>
-  <Value xsi:type="xs:boolean">false</Value>
-</app:value>
+<app:value xsi:type="xs:string">Ложь()</app:value>
```

`Catalogs/АктыОтбораПробЗЕРНО/Forms/ФормаСписка/Ext/Form.xml`, параметр `Отбор.СоответствуетОрганизации`:

```diff
-<app:value xsi:type="FormChoiceListDesTimeValue">
-  <Presentation/>
-  <Value xsi:type="xs:boolean">true</Value>
-</app:value>
+<app:value xsi:type="xs:string">Истина()</app:value>
```

`Catalogs/ВЕТИСПрисоединенныеФайлы/Forms/ФормаСписка/Ext/Form.xml`, параметр `Отбор.СоответствуетОрганизации`:

```diff
-<app:value xsi:type="FormChoiceListDesTimeValue">
-  <Presentation/>
-  <Value xsi:type="xs:boolean">true</Value>
-</app:value>
+<app:value xsi:type="xs:string">Истина()</app:value>
```

## Решение

Для всех `MetadataValue` с типом `formChoiceListDesTimeValue` YAML-контракт становится только объектным:

```yaml
Представление: ""
Значение: Ложь
```

Для многоязычного представления:

```yaml
Представление:
  ru: Не помечен на удаление
Значение: Ложь
```

Компактный вид вроде `Ложь()`, `Истина()` или `"abc"(текст)` больше не является поддерживаемым контрактом. Обратная совместимость с ним не требуется.

## Границы

- Меняется общий слой `packages/core/metadata/commonObjects/metadataValue/formChoiceList`.
- `exportFormChoiceListToYAML` всегда возвращает объект с ключами `Представление` и, если значение присутствует, `Значение`.
- `importFormChoiceListFromYAML` принимает объектный вид как основной контракт.
- Эвристика общего `MetadataValue` не должна превращать объектный `FormChoiceListDesTimeValue` в строковый `MetadataValue`.
- `ChoiceParameters` не получает собственного частного формата: он использует общий `MetadataValue`-контракт.

## Пустое значение

Если XML содержит `FormChoiceListDesTimeValue` без `Value`, с пустым `Value` или с nil-значением, YAML остается объектом. Ключ `Значение` отсутствует, когда доменное `value` отсутствует:

```yaml
Представление: ""
```

Это сохраняет различие между отсутствующим значением выбора и строкой с пустым текстом.

## Ошибки и валидация

Если при импорте YAML для `FormChoiceListDesTimeValue` приходит не объект, это больше не штатный формат. Тесты должны фиксировать новый контракт, а старые проверки компактного вида нужно удалить или заменить.

## Проверки

Нужны точечные тесты:

- `metadataValue/formChoiceList/toYAML`: boolean-значение экспортируется объектом.
- `metadataValue/formChoiceList/fromYAML`: объект с `Представление` и `Значение` восстанавливает `formChoiceListDesTimeValue`.
- `сhoiceParameters/fromYAML` и `toYAML`: параметры выбора с boolean-значениями проходят через общий объектный формат.
- Форма с `ChoiceParameters`: YAML round-trip сохраняет XML-обертку `FormChoiceListDesTimeValue`.

После реализации нужно запустить focused Vitest для затронутых модулей и `round-trip-yaml --triage --batch-size 5`, чтобы первые расхождения по `FormChoiceListDesTimeValue` ушли.

## Font: наблюдаемые расхождения

В той же triage-пачке есть отдельный класс расхождений в `Catalogs/БанковскиеСчета/Forms/ФормаЭлемента/Ext/Form.xml`. Он относится к `packages/core/metadata/commonObjects/font`.

У стильного шрифта теряется явный масштаб:

```diff
-<Font ref="style:NormalTextFont" kind="StyleItem" scale="100"/>
+<Font ref="style:NormalTextFont" kind="StyleItem"/>
```

У автоматического шрифта теряется XML-kind:

```diff
-<Font bold="true" kind="AutoFont"/>
+<Font bold="true" kind="Absolute"/>
```

Причина та же по форме: компактное или неполное YAML-представление не хранит всю XML-семантику. Сейчас `scale` не переводит `Font` в полный YAML-формат, а объектный YAML без `Вид` импортируется как `kind: "Absolute"`, хотя исходный XML мог быть `kind="AutoFont"`.

## Font: решение

`Font` больше не должен экспортироваться в компактную строку. YAML-контракт для шрифта становится всегда объектным.

Простой стильный шрифт:

```yaml
Вид: ОбычныйТекст
```

Стильный шрифт с явным масштабом:

```yaml
Вид: ОбычныйТекст
Масштаб: 100
```

Автоматический шрифт без `ref`:

```yaml
ВидXML: AutoFont
Полужирный: Истина
```

Абсолютный шрифт без `ref`:

```yaml
ВидXML: Absolute
Имя: Arial
Полужирный: Истина
```

`Вид` остается человекочитаемой ссылкой на стильный или системный шрифт. `ВидXML` нужен для редких случаев, когда XML-kind нельзя вывести из `Вид`: например `AutoFont` или `Absolute` без ссылки.

## Font: границы

- Меняется общий слой `packages/core/metadata/commonObjects/font`.
- `exportFontToYAML` всегда возвращает объект.
- `exportFontToYAML` включает `Масштаб`, если `font.scale` задан, включая `100`.
- `exportFontToYAML` включает `ВидXML`, когда `font.kind` нельзя однозначно восстановить из `Вид`.
- `importFontFromYAML` восстанавливает `kind` из `Вид`, если он задан, иначе из `ВидXML`.
- Если нет ни `Вид`, ни `ВидXML`, но есть свойства абсолютного шрифта вроде `Имя`, допускается `kind: "Absolute"` как явный доменный смысл.
- Компактный строковый `Font` больше не является поддерживаемым контрактом. Обратная совместимость с ним не требуется.

## Font: проверки

Нужны точечные тесты:

- `font/toYAML`: `StyleItem` экспортируется объектом с `Вид`.
- `font/toYAML`: `scale: 100` экспортируется как `Масштаб: 100`.
- `font/toYAML`: `kind: "AutoFont"` экспортируется с `ВидXML: AutoFont`.
- `font/fromYAML`: объект с `Вид` восстанавливает `StyleItem`.
- `font/fromYAML`: объект с `ВидXML: AutoFont` восстанавливает `kind: "AutoFont"`.
- Форма с `LabelDecoration` из triage сохраняет `scale="100"` и `kind="AutoFont"` после YAML round-trip.
