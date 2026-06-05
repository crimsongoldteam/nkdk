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

на текущем этапе не исправляются. Полный текст предупреждений сохранён в журнале `/tmp/round-trip-yaml-1c-ibcmd.log`; каждый набор повторяется по двум `Dimension` и двум `Resource`.

Причина ещё не утверждена. Гипотеза про порядок полей возможна, но требует отдельной проверки после удаления уже согласованных причин ошибок и предупреждений. Порядок коллекций `ChildObjects` для `MetadataAccountingRegisterRules` в rules уже соответствует исходной выгрузке:

```text
Dimension -> Resource -> Attribute -> Form -> Template -> Command
```

Поэтому этот план не меняет `MetadataRegisterDimensionRules` и `MetadataRegisterResourceRules`.

## Критерии готовности

- `round-trip-yaml-1c` на `all` проходит `nkdk import` и `nkdk sync`.
- Загрузка XML без reference в 1С не содержит ошибок ПВХ `Type of predefined characteristic type...`.
- Загрузка XML без reference в 1С не содержит ошибок подписок `Event name required`.
- Предупреждения `Wrong property... Dimension/Resource`, если останутся, зафиксированы как следующая отдельная задача.
- Загрузка XML без reference в 1С не содержит предупреждений `Standard attribute ExtDimension5...ExtDimension50 has not been loaded`.
- Решения покрыты точечными тестами на правила, без изменения исходных XML-фикстур.
