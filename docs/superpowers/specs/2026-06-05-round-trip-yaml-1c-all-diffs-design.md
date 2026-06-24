# round-trip-yaml-1c all diffs design

## Цель

Зафиксировать решения по расхождениям, найденным при проверке:

```text
XML -> модель -> YAML -> модель -> XML без reference -> загрузка XML в 1С
```

на каталоге `/home/nikita/git/round-trip/all`.

Проверка после удаления заведомо невалидной формы дошла до загрузки XML в 1С. `nkdk import` и `nkdk sync` завершились успешно, но `ibcmd` сообщил ошибки и предупреждения.

## Не-цели

- Не менять исходные XML-фикстуры `/home/nikita/git/round-trip`.
- Не возвращать зависимость от reference для генерации XML из YAML.
- Не хранить в YAML технические XML-атрибуты, если они однозначно выводятся из правила владельца.
- Не вводить общий `order` для всех правил без локальной необходимости.

## Наблюдения

Результаты последнего запуска:

```text
YAML: /home/nikita/git/temp-yaml/all
XML без reference: /tmp/round-trip-yaml-1c-xml/all
Журнал 1С: /tmp/round-trip-yaml-1c-ibcmd.log
```

Ошибки загрузки:

```text
ПланВидовХарактеристик.ВидыСубконто - Type of predefined characteristic type does not match the type of chart of characteristic types(СубкнтоОдно)
ПланВидовХарактеристик.ВидыСубконто - Type of predefined characteristic type does not match the type of chart of characteristic types(СубконтоДругое)
ПланВидовХарактеристик.ПланВидовХарактеристикВсеСвойства - Type of predefined characteristic type does not match the type of chart of characteristic types(ПредопределенноеВсеСвойства)
ПланВидовХарактеристик.ПланВидовХарактеристикВсеСвойства - Type of predefined characteristic type does not match the type of chart of characteristic types(ПредопределенноеПоУмолчанию)
ПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойства - Event name required
ПодпискаНаСобытие.ПодпискаНаСобытиеПоУмолчанию - Event name required
```

Предупреждения загрузки:

```text
Wrong property of metadata object. Property ... is not one of metadata object Dimension/Resource
Standard attribute ExtDimension5...ExtDimension50 has not been loaded
```

## Решение 1: Predefined.xml ПВХ

Область решения: только `MetadataChartOfCharacteristicTypes`.

`Predefined.xml` планов видов характеристик хранится в YAML inline внутри `Свойства.yaml`, как и сейчас. Отдельный файл YAML для предопределённых элементов не вводится.

Для негрупповых предопределённых элементов ПВХ нужно сохранять тип значения:

```yaml
Предопределенные:
  Элемент:
    ТипЗначения: Справочник.Номенклатура
```

Правило поля:

- YAML: `ТипЗначения`;
- XML: `Type`;
- тип правила: обычный `TypeDescription`;
- `allowedTypes` не задаётся.

Формат `TypeDescription` уже поддерживает произвольные ссылки, примитивы, перечисления, наборы типов и квалификаторы. Отдельный формат для `PredefinedItem.type` не нужен.

Для групп ПВХ `ТипЗначения` в YAML не выводится. При экспорте XML для группы пишется пустой контейнер:

```xml
<Type/>
```

Если элемент не группа, но `ТипЗначения` отсутствует в YAML, экспорт пишет пустой `<Type/>` как резервное поведение. Это не должно скрывать ошибку в тестах: для реальных негрупповых элементов из `/home/nikita/git/round-trip` тип должен сохраняться.

Атрибут корня:

```xml
xsi:type="PlanOfCharacteristicKindPredefinedItems"
```

выводится автоматически из правила владельца `MetadataChartOfCharacteristicTypes` и не хранится в YAML.

### Текущее уточнение

После повторной проверки `all` YAML уже содержит `ТипЗначения` у предопределённых элементов ПВХ:

```yaml
Предопределенные:
  СубкнтоОдно:
    Код: "000000001"
    Наименование: Субкнто1
    ТипЗначения: Строка(10)
```

Но сгенерированный `Ext/Predefined.xml` теряет контекст владельца при экспорте внешнего `filePath`-свойства:

```xml
<PredefinedData ... xsi:type="CatalogPredefinedItems" ...>
```

Из-за этого экспорт считает файл предопределёнными данными каталога, не выводит `<Type>` у элементов и 1С сообщает:

```text
Type of predefined characteristic type does not match the type of chart of characteristic types
```

Решение: при экспорте внешних `filePath`-свойств передавать в контекст текущий metadata-объект как владельца. Тогда `PredefinedRules` и `PredefinedItemRules` используют тот же механизм `getParentFromContext`, что и inline-свойства:

- корень ПВХ получает `xsi:type="PlanOfCharacteristicKindPredefinedItems"`;
- негрупповые элементы ПВХ выводят `<Type>`;
- группы ПВХ остаются без пользовательского `ТипЗначения` в YAML и получают пустой XML-контейнер по правилу.

Альтернативы отклонены:

- добавлять специальный признак владельца в `MetadataChartOfCharacteristicTypesRules.predefined` - частное решение вместо уже существующего контекста;
- хранить `xsi:type` в YAML - это техническая XML-деталь, которую можно вывести из владельца.

## Решение 2: порядок MetadataEventSubscription

Область решения: `MetadataEventSubscription`.

`Source`, `Event` и `Handler` не теряются при `XML -> YAML -> XML`, но без reference меняется порядок элементов. В результате 1С сообщает:

```text
Event name required
```

хотя `<Event>` есть в XML.

Для `MetadataEventSubscriptionRules` нужен локальный порядок XML-полей:

```text
Name -> Synonym -> Comment -> Source -> Event -> Handler -> ObjectBelonging
```

Это локальное исключение, потому что поведение загрузчика 1С для подписок чувствительно к порядку. Общая сортировка для всех metadata-объектов не вводится.

## Решение 3: предупреждения регистров

Цель: загрузка через `ibcmd` должна завершаться без `[WARN]`, а не только без `[ERROR]`.

Предупреждения воспроизводятся на `AccountingRegisters/РегистрБухгалтерииВсеСвойстваОбороты.xml`.

### StandardAttributes бухгалтерского регистра

Сейчас без reference правило стандартных реквизитов бухгалтерского регистра синтезирует все канонические `ExtDimension1..50` и `ExtDimensionType1..50`, если группа стандартных реквизитов считается изменённой.

Для `РегистрБухгалтерииВсеСвойстваОбороты` исходный XML содержит только `ExtDimension1..4` и `ExtDimensionType1..4`, а сгенерированный XML добавляет `ExtDimension5..50`. 1С предупреждает, что эти стандартные реквизиты не входят в состав объекта.

Правило: при экспорте `StandardAttributeDescriptions` без reference нельзя синтезировать все канонические стандартные реквизиты бухгалтерского регистра. Нужно выводить:

- реквизиты, явно пришедшие из YAML;
- реквизиты, обязательность которых можно вывести из модели объекта;
- для бухгалтерских `ExtDimension*` только реально используемый диапазон субконто, а не фиксированные 1..50.

Минимально допустимый первый шаг: без reference выводить только явные `ExtDimension*`, присутствующие в модели после `XML -> YAML`.

### Dimension и Resource бухгалтерского регистра

Предупреждения вида:

```text
Wrong property of metadata object. Property Balance is not one of metadata object Dimension
Wrong property of metadata object. Property ChoiceFoldersAndItems is not one of metadata object Resource
```

связаны не с лишними тегами, а с порядком тегов внутри `Properties`. Те же свойства есть в исходном XML `/home/nikita/git/round-trip/all/AccountingRegisters/РегистрБухгалтерииВсеСвойстваОбороты.xml`, но в сгенерированном XML без reference они оказываются позже.

Для `Dimension` исходная выгрузка использует порядок:

```text
... ChoiceHistoryOnInput -> Balance -> AccountingFlag -> DenyIncompleteValues -> Indexing -> FullTextSearch
```

Без reference сейчас получается:

```text
... ChoiceHistoryOnInput -> DenyIncompleteValues -> Indexing -> FullTextSearch -> AccountingFlag -> Balance
```

Для `Resource` исходная выгрузка использует порядок:

```text
... ChoiceHistoryOnInput -> Balance -> AccountingFlag -> ExtDimensionAccountingFlag -> FullTextSearch
```

Без reference сейчас получается:

```text
... ChoiceHistoryOnInput -> FullTextSearch -> AccountingFlag -> Balance -> ExtDimensionAccountingFlag
```

Причина: бухгалтерские поля `balance`, `accountingFlag`, `extDimensionAccountingFlag` не имеют локального `order`, поэтому без reference попадают после общих полей `MetadataRegisterField`.

Решение: задать локальный XML-порядок только для бухгалтерских полей в `MetadataRegisterDimensionRules` и `MetadataRegisterResourceRules`.

Для `MetadataRegisterDimensionRules`:

- `balance` должен идти после `choiceHistoryOnInput` и до `denyIncompleteValues`;
- `accountingFlag` должен идти после `balance` и до `denyIncompleteValues`.

Для `MetadataRegisterResourceRules`:

- `balance` должен идти после `choiceHistoryOnInput` и до `fullTextSearch`;
- `accountingFlag` должен идти после `balance` и до `fullTextSearch`;
- `extDimensionAccountingFlag` должен идти после `accountingFlag` и до `fullTextSearch`.

Общий механизм сортировки и порядок всех регистров не меняются. Порядок коллекций `ChildObjects` для `MetadataAccountingRegisterRules` уже соответствует исходной выгрузке:

```text
Dimension -> Resource -> Attribute -> Form -> Template -> Command
```

Если после локального порядка останутся предупреждения по тем же свойствам, следующий шаг - проверять не порядок, а контекст владельца при экспорте `Dimension/Resource`.

### CommonForm ДинамическийСписок

После исправления ошибок ПВХ, подписок и лишних `ExtDimension*` первая ошибка загрузки `all` через `ibcmd`:

```text
File: /tmp/round-trip-yaml-1c-xml/all/CommonForms/ДинамическийСписок/Ext/Form.xml, invalid data path: "СОсновнойТаблицей.ЭтоГруппа".
```

Контрольная загрузка исходного XML `/home/nikita/git/round-trip/all` в отдельную файловую базу падает с тем же сообщением:

```text
File: /home/nikita/git/round-trip/all/CommonForms/ДинамическийСписок/Ext/Form.xml, invalid data path: "СОсновнойТаблицей.ЭтоГруппа".
```

Значит это не новая ошибка `XML -> YAML -> XML`, а свойство самого набора `all`. Для проверки загрузки результата без этого внешнего блокера нужна отдельная договорённость: исправить или исключить исходную форму в тестовом наборе, не меняя её как XML-фикстуру без явного решения.

## Критерии готовности

Границы ближайшей итерации: исправляется критическая ошибка ПВХ и локальный порядок бухгалтерских `Dimension/Resource`. Остальные предупреждения регистров разбираются отдельно, если останутся после повторной проверки.

- `round-trip-yaml-1c` на `all` проходит `nkdk import` и `nkdk sync`.
- Загрузка XML без reference в 1С не содержит ошибок ПВХ `Type of predefined characteristic type...`.
- `ChartsOfCharacteristicTypes/*/Ext/Predefined.xml` без reference получает `xsi:type` из владельца, а не дефолтный `CatalogPredefinedItems`.
- Негрупповые предопределённые элементы ПВХ сохраняют `ТипЗначения` из YAML в XML `<Type>`.
- Загрузка XML без reference в 1С не содержит ошибок подписок `Event name required`.
- Предупреждения `Wrong property... Dimension/Resource` устранены локальным порядком бухгалтерских полей или, если останутся, зафиксированы с новым журналом как отдельная задача.
- Загрузка XML без reference в 1С не содержит предупреждений `Standard attribute ExtDimension5...ExtDimension50 has not been loaded`.
- Ошибка `CommonForms/ДинамическийСписок/Ext/Form.xml` зафиксирована как внешний блокер исходного набора `all`, потому что воспроизводится на исходном XML без участия YAML.
- Решения покрыты точечными тестами на правила, без изменения исходных XML-фикстур.
