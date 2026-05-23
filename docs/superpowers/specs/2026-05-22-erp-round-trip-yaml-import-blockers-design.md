# ERP round-trip-yaml import blockers

## Контекст

Общий прогон `round-trip-yaml --triage --all-configs` проходит каталоги
`acc` и `doc`, но падает на стадии `import` для `erp`.

Проверенный результат:

- `acc`: `10780` успешно, `0` ошибок;
- `doc`: `4915` успешно, `0` ошибок;
- `erp`: `18460` успешно, `8` ошибок.

Ошибки `erp` сгруппированы так:

- пять обычных форм с `Ext/Form.bin` вместо `Ext/Form.xml`;
- один `Color YAML: rawRef is XML-only`;
- два `DcsMetadataTypedValue YAML: xsi:nil is XML-only`.

Дополнительная проверка каталогов после `erp` выявила еще один import-блокер
в `small`: обычная форма с metadata-файлом, но без `Ext/Form.xml` и
`Ext/Form.bin`. В том же каталоге найден блокер `MetadataValue` для
`v8:StandardPeriod`.

Цель этой спеки - зафиксировать принятые решения по всем группам import-блокеров.

## Принято: обычные формы через `Form.bin`

### Проблема

В `erp` есть формы, у которых есть metadata-файл формы:

```text
Forms/<ИмяФормы>.xml
```

и бинарное тело обычной формы:

```text
Forms/<ИмяФормы>/Ext/Form.bin
```

При этом управляемого XML-тела формы нет:

```text
Forms/<ИмяФормы>/Ext/Form.xml
```

Сейчас `convertFormFromXML` безусловно читает `Ext/Form.xml`, поэтому импорт
всего metadata-объекта падает с `ENOENT`.

### Решение

Обычная форма должна round-trip-иться как сочетание YAML-метаданных и
непрозрачного бинарного файла.

На импорте из XML в nkdk:

1. `Forms/<ИмяФормы>.xml` преобразуется в `Формы/<ИмяФормы>/Форма.yaml`, как
   для управляемых форм.
2. Если вместо `Ext/Form.xml` найден `Ext/Form.bin`, файл копируется в
   `Формы/<ИмяФормы>/Form.bin`.
3. Отсутствие `Ext/Form.xml` не считается ошибкой, если рядом есть
   `Ext/Form.bin`.
4. Бинарное тело формы не разбирается и не нормализуется.

На синхронизации из nkdk в XML:

1. `Формы/<ИмяФормы>/Форма.yaml` восстанавливает `Forms/<ИмяФормы>.xml`.
2. `Формы/<ИмяФормы>/Form.bin` копируется обратно в
   `Forms/<ИмяФормы>/Ext/Form.bin`.
3. Для такой формы `Forms/<ИмяФормы>/Ext/Form.xml` не создается.

### Границы

- Не пытаться декодировать `Form.bin`.
- Не хранить `Forms/<ИмяФормы>.xml` как сырой XML-файл: metadata-часть формы
  остается в YAML.
- Не менять XML-репозиторий и не добавлять отсутствующие `Form.xml`.

### Проверка

- Тест импорта формы с `Forms/<Имя>.xml` и `Forms/<Имя>/Ext/Form.bin` должен
  получить `Форма.yaml` и `Form.bin`.
- Тест синхронизации такой формы должен получить `Forms/<Имя>.xml` и
  `Forms/<Имя>/Ext/Form.bin`, но не `Forms/<Имя>/Ext/Form.xml`.
- Общий `round-trip-yaml --triage --all-configs` должен пройти эти пять форм
  без `ENOENT`.

## Принято: raw `Color` в YAML

### Проблема

Для short XML round-trip уже поддержан raw color reference вида:

```xml
<dcscor:value xsi:type="v8ui:Color">0:615512b6-4378-4fce-86f1-a56725f945da</dcscor:value>
```

XML-импорт сохраняет такое значение как raw-ссылку, а XML-экспорт возвращает
строку без преобразования. Но полный YAML round-trip падает, потому что
`exportColorToYAML` считает raw-ссылку XML-only значением.

### Решение

Raw `Color` должен иметь YAML-представление по аналогии с `Picture`:

```yaml
Цвет: "0:615512b6-4378-4fce-86f1-a56725f945da"
```

Правила:

- `rawRef` вида `0` и `0:<uuid>` экспортируется в YAML как строка;
- такая строка при импорте из YAML возвращается в модель как `{ rawRef }`;
- обычные цвета `style:`, `win:`, `web:` и `#RRGGBB` сохраняют текущий формат;
- паттерн raw-ссылки остается узким: только `0` и `0:<uuid>`.

### Границы

- Не вводить обертку `{ Вид, Значение }` для raw `Color`.
- Не пытаться разрешать `0:<uuid>` в имя цвета или ссылку на объект.
- Не расширять raw-режим на любые неизвестные префиксы.

### Проверка

- `toYAML` для `{ rawRef: "0:<uuid>" }` возвращает строку `"0:<uuid>"`.
- `fromYAML` для `"0:<uuid>"` возвращает `{ rawRef: "0:<uuid>" }`.
- `toXML` после YAML-цикла восстанавливает исходный `0:<uuid>`.
- Существующие тесты обычных цветов остаются зелеными.

## Принято: metadata-only ordinary form

### Проблема

В `small` найден обычный form metadata-файл:

```text
Enums/ТипыНалогообложенияНДС/Forms/ПродажаНаЭкспорт.xml
```

В нем `FormType=Ordinary`, но нет ни управляемого тела:

```text
Forms/ПродажаНаЭкспорт/Ext/Form.xml
```

ни бинарного тела обычной формы:

```text
Forms/ПродажаНаЭкспорт/Ext/Form.bin
```

Сейчас такой случай падает так же, как ordinary form с `Form.bin`, потому что
`convertFormFromXML` безусловно читает `Ext/Form.xml`.

### Решение

Если `Forms/<ИмяФормы>.xml` имеет `FormType=Ordinary`, а `Ext/Form.xml` и
`Ext/Form.bin` отсутствуют, форма считается metadata-only ordinary form.

На импорте из XML в nkdk:

1. `Forms/<ИмяФормы>.xml` преобразуется в `Формы/<ИмяФормы>/Форма.yaml`.
2. Файл `Формы/<ИмяФормы>/Form.bin` не создается.
3. Отсутствие `Ext/Form.xml` не считается ошибкой только для
   `FormType=Ordinary`.

На синхронизации из nkdk в XML:

1. `Формы/<ИмяФормы>/Форма.yaml` восстанавливает `Forms/<ИмяФормы>.xml`.
2. Если `Формы/<ИмяФормы>/Form.bin` отсутствует, `Forms/<ИмяФормы>/Ext`
   и `Forms/<ИмяФормы>/Ext/Form.xml` не создаются.

### Границы

- Для управляемой формы без `Ext/Form.xml` поведение остается строгим:
  это ошибка входных данных.
- Не создавать пустой `Ext/Form.xml`.
- Не создавать пустой `Form.bin`.

### Проверка

- Тест импорта metadata-only ordinary form получает только `Форма.yaml`.
- Тест синхронизации metadata-only ordinary form получает только
  `Forms/<Имя>.xml`.
- Управляемая форма без `Ext/Form.xml` продолжает падать.

## Принято: `DcsMetadataTypedValue` nil в массиве

### Проблема

Оставшиеся две ошибки `erp` связаны с `DcsMetadataTypedValue`, где XML содержит
nil-элемент внутри массива typed values, например:

```xml
<dcsset:right xsi:nil="true"/>
```

Текущий XML-импорт сохраняет такую позицию как `undefined`, но YAML-экспорт
массива падает:

```text
DcsMetadataTypedValue YAML: xsi:nil is XML-only
```

### Наблюдение

Это не тот же случай, что `SettingsParameterValue`: там можно не писать ключ
`Значение` и восстановить nil по reference. Здесь nil является элементом
массива, поэтому отсутствие YAML-элемента потеряет позицию.

В проекте уже есть близкий формат для `DcsAvailableValues`: nil-элемент
представлен пустым объектом `{}`.

### Решение

Для `DcsMetadataTypedValue[]` принимается формат пустого объекта по аналогии с
`DcsAvailableValues`:

```yaml
ПраваяЧасть:
  - {}
  - ".Поле"
```

- `undefined`-элемент массива экспортируется в YAML как `{}`;
- `{}` при импорте такого массива возвращается в `undefined`;
- одиночное значение `DcsMetadataTypedValue` без массива не получает новый
  nil-маркер без отдельного решения.

Такой формат сохраняет позицию nil-элемента в массиве и не вводит строковый
псевдомаркер.

### Границы

- Не использовать `null` для nil-позиции.
- Не пропускать nil-элемент при экспорте массива.
- Не менять compact YAML для `SettingsParameterValue`.
- Не вводить nil-представление для одиночного `DcsMetadataTypedValue` без
  отдельного подтвержденного случая.

### Проверка

- `toYAML` для массива с `undefined` возвращает `{}` на той же позиции.
- `fromYAML` для `{}` внутри массива возвращает `undefined`.
- XML после YAML-цикла восстанавливает `<dcsset:right xsi:nil="true"/>`.
- Существующие сценарии `SettingsParameterValue` с reference nil остаются без
  явного YAML-маркера.

## Принято: `MetadataValue` StandardPeriod

### Проблема

В `small/CommonForms/ВыборПериодаМП/Ext/Form.xml` choice list содержит значения:

```xml
<Value xsi:type="v8:StandardPeriod">
  <v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant>
  <v8:startDate>0001-01-01T00:00:00</v8:startDate>
  <v8:endDate>0001-01-01T00:00:00</v8:endDate>
</Value>
```

и варианты без дат:

```xml
<Value xsi:type="v8:StandardPeriod">
  <v8:variant xsi:type="v8:StandardPeriodVariant">Today</v8:variant>
</Value>
```

`TypeDescription` уже знает тип `v8:StandardPeriod`, но `MetadataValue` не
поддерживает его как значение и падает:

```text
MetadataValue: не распознан тип: v8:StandardPeriod
```

### Решение

Добавить `StandardPeriod` как отдельный тип `MetadataValue`.

YAML-формат:

```yaml
Вариант: Сегодня
ДатаНачала: 01.01.0001 00:00:00
ДатаОкончания: 01.01.0001 00:00:00
```

Правила:

- XML `v8:variant` экспортируется в YAML-ключ `Вариант` через
  `StandardPeriodVariantToYAML`;
- XML `v8:startDate` экспортируется в `ДатаНачала`;
- XML `v8:endDate` экспортируется в `ДатаОкончания`;
- даты отсутствуют в YAML, если их нет в XML;
- обратный импорт YAML восстанавливает `v8:StandardPeriod`;
- формат даты совпадает с уже используемым форматом
  `StandardBeginningDate`: `ДД.ММ.ГГГГ ЧЧ:ММ:СС`.

### Границы

- Не заменять `StandardPeriod` на строку варианта.
- Не хранить XML `StandardPeriod` как raw-объект.
- Не менять `TypeDescription`: тип уже поддержан там отдельно.

### Проверка

- `MetadataValue fromXML` импортирует `v8:StandardPeriod` с датами и без дат.
- `MetadataValue toYAML` экспортирует `Вариант`, `ДатаНачала`,
  `ДатаОкончания`.
- `MetadataValue fromYAML` импортирует этот объект обратно.
- `MetadataValue toXML` восстанавливает `v8:StandardPeriod`.
- Импорт `small/CommonForms/ВыборПериодаМП` больше не падает на
  `MetadataValue`.

## Критерии готовности серии

- `erp` больше не падает на пяти ordinary forms с `Form.bin`.
- `small` больше не падает на metadata-only ordinary form.
- `erp` больше не падает на raw `Color` в YAML.
- `erp` больше не падает на `DcsMetadataTypedValue` nil внутри массива.
- `small` больше не падает на `MetadataValue` `v8:StandardPeriod`.
- После реализации общий `round-trip-yaml --triage --all-configs` доходит
  дальше текущих import-блокеров `erp`.
