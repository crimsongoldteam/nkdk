# Round-Trip XML: следующие расхождения

## Контекст

`round-trip.sh --triage --batch-size 5` для XML-каталога `/Users/nikita/git/round-trip-source/acc`
остановился на `DocumentJournals/Взаимодействия/ФормаСписка` из-за
`DcsMetadataTypedValue XML: unsupported _xsi:type v8:Type`.

До остановки были видны три группы расхождений:

- пустой `<Type/>` у `MetadataAttribute` пропадает при экспорте;
- локальный `xmlns:dcsset` у `v8:Type` теряется в `DataProcessor`;
- `dcscor:Field` внутри DCS-значений экспортируется как `xs:string`.

Отдельно включаем блокер `v8:Type`, чтобы следующий triage мог пройти дальше.

## Принятые решения

### Пустой Type у MetadataAttribute

Пустой XML-узел `<Type/>` должен сохраняться в XML round-trip для `MetadataAttribute`.
Решение: локально для свойства `type` в `MetadataAttributeRules` использовать существующий
механизм пустого XML-значения, например `defaultValueXMLRaw: ""`.

Не менять общий экспорт `TypeDescription`: это затронуло бы все места, где отсутствие типа
сейчас корректно означает отсутствие XML-узла.

Проверка: добавить точечный тест на round-trip пустого `Type` без изменения XML-фикстур.

### Namespace для dcsset TypeDescription в DataProcessor

Не добавлять namespace глобально в `TypeDescriptionRules.SettingsComposer`: в формах `dcsset`
обычно уже объявлен на корневом `<Form>`, и локальный `xmlns:dcsset` на каждом `v8:Type`
стал бы лишним.

Решение: добавить в правила свойства `TypeDescription` явный XML-флаг, который говорит
экспорту объявлять namespace типа локально на `v8:Type`. Включить этот флаг для атрибутов
`DataProcessor`, где `MetaDataObject` не объявляет `dcsset` на корне и эталонный XML содержит
локальное объявление:

```xml
<v8:Type xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings">dcsset:SettingsComposer</v8:Type>
```

Проверка: один тест для `DataProcessor`/`MetaDataObject`-стиля с локальным `xmlns:dcsset`,
один тест для form-стиля без локального `xmlns`, чтобы не добавить лишний namespace в формы.

### DCS Field внутри DesignTimeValue

XML-тип `dcscor:Field` должен сохраняться без угадывания:

- XML -> модель: `xsi:type="dcscor:Field"` импортируется как явное значение `{ type: "Field", value }`;
- модель -> XML: явное значение `{ type: "Field", value }` экспортируется как `dcscor:Field`;
- YAML -> модель: не угадывать поле по строке, потому что строка с точкой может быть буквальным текстом;
- для YAML добавить явную форму, например:

```yaml
Текст:
  Тип: Поле
  Значение: Сертификаты.СертификатПредставление
```

Краткая YAML-строка остаётся строкой и не превращается в `dcscor:Field` эвристически.

### DcsMetadataTypedValue v8:Type Undefined

`DcsMetadataTypedValue` с XML-формой:

```xml
<dcsset:right xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</dcsset:right>
```

не должен становиться отдельным смысловым значением модели. Это явный XML-способ представить
отсутствующее значение.

Решение:

- обычный XML-импорт читает `v8:Type` со значением `*:Undefined` как `undefined`;
- reference XML-импорт сохраняет исходный объект с `_xsi:type`, `#text` и `_xmlns:<prefix>`;
- XML-экспорт при пустом значении использует reference-объект, если он был именно валидным
  `v8:Type *:Undefined`;
- если reference содержит другой `v8:Type`, значение без namespace или не `Undefined`, оно не
  восстанавливается автоматически.

Это повторяет уже существующий паттерн для `DCSParameter.value`, где `dcssch:value`
`v8:Type Undefined` импортируется как отсутствующее значение, но сохраняется из reference при
обратном XML-экспорте.

Проверка: добавить тесты для обычного импорта, reference-импорта, экспорта пустого значения с
reference и отказа от восстановления некорректного reference.

### StandardAttribute RecordType у регистров накопления

Следующий triage после снятия DCS-блокеров показал однотипное расхождение в первых пяти файлах:
у balance-регистров накопления удаляется стандартный реквизит `RecordType`.

По XML-источнику `HEAD` все 69 регистров накопления в текущем наборе имеют
`<RegisterType>Balance</RegisterType>` и блок:

```xml
<xr:StandardAttribute name="RecordType">
```

Причина: `MetadataAccumulationRegisterStandardAttributeNames` не содержит `RecordType`, а экспорт
`StandardAttributeDescriptions` разворачивает секцию только по списку стандартных реквизитов из
правила.

Решение:

- добавить `RecordType: "ВидДвижения"` в общий словарь стандартных реквизитов;
- добавить `RecordType: "ВидДвижения"` в YAML/graph-словарь стандартных реквизитов
  `MetadataAccumulationRegister`;
- для XML-экспорта сделать список стандартных реквизитов контекстным: при
  `registerType === "Turnovers"` не добавлять `RecordType`, во всех остальных случаях считать
  регистр balance/default и ставить `RecordType` перед `Active`.

Проверка: точечный тест `StandardAttributeDescriptions` должен подтверждать экспорт и порядок
`RecordType` перед `Active`; тест накопительного регистра должен подтверждать, что `Turnovers`
не получает `RecordType`, а `Balance` получает; затем повторить round-trip triage.

### Событие формы OnUpdateUserSettingSetAtServer

После исправления `RecordType` следующий triage показал смену регистра XML-имени события формы:

```diff
- <Event name="OnUpdateUserSettingSetAtServer">
+ <Event name="onUpdateUserSettingSetAtServer">
```

Причина: XML-импорт нормализует имя события в ключ модели с маленькой первой буквой, а XML-экспорт
возвращает canonical XML-case только для событий, известных правилу. Событие
`onUpdateUserSettingSetAtServer` уже есть у элемента `Table`, но отсутствует в списке событий
корневой формы.

Решение: добавить `onUpdateUserSettingSetAtServer:
"ПриОбновленииСоставаПользовательскихНастроекНаСервере"` в
`MetadataClientApplicationFormRules.properties.events.items`.

Проверка: точечный тест экспорта `Events` по правилу корневой формы должен выдавать
`name="OnUpdateUserSettingSetAtServer"`.
