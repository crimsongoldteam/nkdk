# Дизайн: metadataEnumeration как полноценный metadataItem

## Цель

Довести `packages/core/metadata/appliedObjects/metadataEnumeration` до полноценного metadataItem для объекта 1С `Enum`: XML round-trip, типы, правила, регистрация, дочерние коллекции и дальнейшая подготовка к YAML-циклу.

## Источники

- XML-фикстуры: `/Users/nikita/git/roundTripElements/Enums/ПеречислениеВсеСвойства.xml` и `/Users/nikita/git/roundTripElements/Enums/ПеречислениеПоУмолчанию.xml`.
- Игнорируемая фикстура: `/Users/nikita/git/roundTripElements/Enums/Перечисление1.xml`.
- Схема: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, типы `Enum`, `EnumProperties`, `EnumChildObjects`, `EnumValue`, `EnumValueProperties`.
- Русские имена YAML: текущий `MetadataEnumerationYAML`, соседние `metadataCatalog`/`metadataDocument`, справка `/Users/nikita/git/1c_res/hlp` для подтверждённых свойств `QuickChoice` и `ChoiceHistoryOnInput`.

## Архитектура

`metadataEnumeration` оформляется по образцу `metadataCatalog` и `metadataDocument`. Верхний объект получает `xmlRoot` с контейнером `Enum`, `internalInfo` для `EnumRef`, `EnumManager`, `EnumList`, `uuid`, свойства `EnumProperties`, дочерние коллекции и внешний модуль менеджера.

`EnumValue` реализуется отдельным правилом `MetadataEnumerationValueRules` и коллекционным типом `MetadataEnumerationValues` через `registerMetadataItemCollectionRule`. Верхний `MetadataEnumerationRules` ссылается на коллекцию через свойство `enumValues` с XML-тегом `EnumValue` и YAML-ключом `Значения`.

## Свойства

Верхний объект покрывает свойства схемы:

- `Name`, `Synonym`, `Comment`;
- `ObjectBelonging`, `ExtendedConfigurationObject`;
- `UseStandardCommands`, `StandardAttributes`, `Characteristics`;
- `QuickChoice`, `ChoiceMode`;
- `DefaultListForm`, `DefaultChoiceForm`, `AuxiliaryListForm`, `AuxiliaryChoiceForm`;
- `ManagerModule`;
- `ListPresentation`, `ExtendedListPresentation`, `Explanation`, `ChoiceHistoryOnInput`.

Существующие лишние для `EnumProperties` правила `fullTextSearch`, `objectPresentation`, `extendedObjectPresentation` удаляются из модели Перечисления.

## Дочерние Объекты

`EnumChildObjects` содержит:

- `EnumValue` -> YAML `Значения`, отдельная коллекция через `rules.ts`;
- `Command` -> YAML `Команды`, существующий `MetadataCommands`;
- `Form` -> `ChildFormNames`, только XML/reference;
- `Template` -> `ChildTemplateNames`, только XML/reference.

`managerModule` хранится как внешний файл: `nkdkPath: "МодульМенеджера.bsl"`, `xmlPath: "Ext/ManagerModule.bsl"`, без YAML-ключа в `Свойства.yaml`.

## YAML Договорённости

`itemTypePrefix` верхнего объекта: `Перечисление`.

Русские ключи:

- `UseStandardCommands` -> `ИспользоватьСтандартныеКоманды`;
- `StandardAttributes` -> `СтандартныеРеквизиты`;
- `Characteristics` -> `Характеристики`;
- `QuickChoice` -> `БыстрыйВыбор`;
- `ChoiceMode` -> `СпособВыбора`;
- `DefaultListForm` -> `ОсновнаяФормаСписка`;
- `DefaultChoiceForm` -> `ОсновнаяФормаДляВыбора`;
- `AuxiliaryListForm` -> `ДополнительнаяФормаСписка`;
- `AuxiliaryChoiceForm` -> `ДополнительнаяФормаДляВыбора`;
- `ListPresentation` -> `ПредставлениеСписка`;
- `ExtendedListPresentation` -> `РасширенноеПредставлениеСписка`;
- `Explanation` -> `Пояснение`;
- `ChoiceHistoryOnInput` -> `ИсторияВыбораПриВводе`;
- `Command` -> `Команды`;
- `EnumValue` -> `Значения`.

Не включаются в YAML: `xmlRoot`, `internalInfo`, `uuid`, `forms`, `templates`, `managerModule`, `ObjectBelonging`, `ExtendedConfigurationObject`.

Для `EnumValue` YAML-элемент задаётся по имени. Поля элемента: `Синоним`, `Комментарий`. Для `synonym` используется `excludeIfEqualNameYAML: true`; `useAsShortValueYAML` не используется.

Дефолты, согласованные в брифе:

- `UseStandardCommands`: `false` / `Ложь`;
- `QuickChoice`: `true` / `Истина`;
- `ChoiceMode`: `BothWays`;
- `ChoiceHistoryOnInput`: `Auto`;
- `ObjectBelonging`: `Native`, но свойство исключено из YAML.

Окончательные `implicitValueYAML` применяются только после завершения XML-цикла и обсуждения черновика YAML.

## Проверка

Сначала выполняется XML-цикл:

1. `fromXML.test.ts` с round-trip XML -> модель -> XML для обеих фикстур.
2. TS-фикстуры по результату зелёного round-trip.
3. `fromXML` проверки на равенство TS-фикстурам.
4. `toXML.test.ts`.

YAML-файлы, YAML-фикстуры и YAML-поведенческие аннотации не добавляются до полного завершения XML-цикла.

## Риски

Возможны расхождения на сложных подчинённых объектах `StandardAttributes`, `Characteristics` и `Command`. Если diff принадлежит чужому metadataItem, работа по правилу Перечисления останавливается, фиксируется фрагмент и решение принимается отдельно.
