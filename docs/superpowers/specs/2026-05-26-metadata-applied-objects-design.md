# Новые прикладные объекты metadata

## Цель

Добавить полноценную поддержку корневых прикладных объектов:

- `MetadataCommonModule`
- `MetadataExternalDataSource`
- `MetadataXDTOPackage`
- `MetadataWebSocketClient`

Для каждого объекта нужны XML-фикстуры, `rules.ts`, типы, регистрация, подключение к configuration sync и sync-тесты. `MetadataExternalDataSource` реализуется полностью: родитель, дочерние таблицы, кубы, функции, поля, формы, макеты и внешние модули.

## Общий подход

Работа идёт по объектам один за другим. Для каждого объекта сначала фиксируются источники, свойства, дочерние объекты, внешние файлы, дельта реестров и тестовый набор; затем по этой спеκе будет написан отдельный план реализации.

XML-цикл остаётся первым барьером: сначала `fromXML`/`toXML`/`convertFromXML`/`syncToXML`, затем YAML-аннотации и YAML-тесты. Существующие XML-фикстуры из `/Users/nikita/git/roundTripElements` не изменяются.

## Объект: MetadataCommonModule

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/CommonModules`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataCommonModule`
- XML-каталог: `CommonModules`
- XML-контейнер: `CommonModule`
- Префикс YAML/metadata path: `ОбщийМодуль`
- Соседи: `metadataScheduledJob`, `metadataCommonTemplate`, `metadataBot`

### Фикстуры

- `ОбщийМодульГлобальный.xml` -> `full.xml`
- `ОбщийМодульПоУмолчанию.xml` -> `minimal.xml`
- `ОбщийМодульПовторный.xml` -> дополнительная sync XML-фикстура

### Свойства

| TS-ключ | XML-тег | YAML-ключ | Тип | Default XML/YAML | Источник |
|---|---|---|---|---|---|
| `xmlRoot` | `CommonModule` | - | `XMLRoot` | - | XML |
| `uuid` | `_uuid` | - | `uuid` | - | XML |
| `name` | `Name` | - | `string` | required | XML |
| `synonym` | `Synonym` | `Синоним` | `I8nText` | raw empty XML | XML |
| `comment` | `Comment` | `Комментарий` | `string` | raw empty XML | XML |
| `global` | `Global` | `Глобальный` | `boolean` | `false` / `false` | XML, ru-en-map |
| `clientManagedApplication` | `ClientManagedApplication` | `КлиентУправляемоеПриложение` | `boolean` | `false` / `false` | XML, ru-en-map |
| `server` | `Server` | `Сервер` | `boolean` | `true` / `true` | XML |
| `externalConnection` | `ExternalConnection` | `ВнешнееСоединение` | `boolean` | `false` / `false` | XML, ru-en-map |
| `clientOrdinaryApplication` | `ClientOrdinaryApplication` | `КлиентОбычноеПриложение` | `boolean` | `false` / `false` | XML, ru-en-map |
| `serverCall` | `ServerCall` | `ВызовСервера` | `boolean` | `false` / `false` | XML, ru-en-map |
| `privileged` | `Privileged` | `Привилегированный` | `boolean` | `false` / `false` | XML, ru-en-map |
| `returnValuesReuse` | `ReturnValuesReuse` | `ПовторноеИспользованиеВозвращаемыхЗначений` | `SystemEnumeration(ReturnValuesReuse)` | `DontUse` / `DontUse` | XML, XDTO, ru-en-map |
| `module` | `Ext/Module.bsl` | - | `Module` | absent in selected fixtures | соседние правила module |

### Подчинённые объекты

Нет.

### Внешние файлы

- `Ext/Module.bsl` — поддержать как `Module` с `nkdkPath: "Модуль.bsl"` и `xmlPath: "Ext/Module.bsl"`.
- В выбранных пользователем фикстурах внешнего модуля нет, но соседние фикстуры `ОбщийМодульПодпискаНаСобытие` и `ОбщийМодульРегЗадание` подтверждают путь `Ext/Module.bsl`.

### Дельта реестров и sync

- Добавить `MetadataCommonModule` в `MetadataItemTypeRegistry`.
- Добавить `MetadataCommonModule` в `PropertyTypeRegistry` и `PropertyRuleTypeKeys`.
- Зарегистрировать правило в `metadataCommonModule/index.ts`.
- Подключить в `packages/core/metadata/appliedObjects/index.ts`.
- Добавить в `TopLevelMetadataItemRules`.
- Добавить префикс `ОбщийМодуль` в миграционные пути.
- Добавить sync-тест на чтение из `CommonModules` и запись обратно.

### Риски

- XSD `mobileApp.xsdconfig_root.res` содержит похожий `CommonModule` для мобильного приложения с другими lower-case тегами; для текущего формата главным источником остаются XML-фикстуры MDClasses и XDTO `model.xdtobackend_root.res`.
- `Module` нужен даже если основные три фикстуры без `Ext/Module.bsl`, иначе объект не покроет реальные common module из соседних ссылок.

## Следующие объекты

## Объект: MetadataXDTOPackage

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/XDTOPackages`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataXDTOPackage`
- XML-каталог: `XDTOPackages`
- XML-контейнер: `XDTOPackage`
- Префикс YAML/metadata path: `ПакетXDTO`
- Соседи: `metadataWSReference`, `metadataCommonTemplate`, `commonObjects/xDTOPackages`

### Фикстуры

- `ПакетXDTOВсеСвойства.xml` -> `full.xml`
- `ПакетXDTOПоУмолчанию.xml` -> `minimal.xml`
- `ПакетXDTOВсеСвойства/Ext/Package.bin` -> sync external fixture

### Свойства

| TS-ключ | XML-тег | YAML-ключ | Тип | Default XML/YAML | Источник |
|---|---|---|---|---|---|
| `xmlRoot` | `XDTOPackage` | - | `XMLRoot` | - | XML |
| `uuid` | `_uuid` | - | `uuid` | - | XML |
| `name` | `Name` | - | `string` | required | XML |
| `synonym` | `Synonym` | `Синоним` | `I8nText` | raw empty XML | XML |
| `comment` | `Comment` | `Комментарий` | `string` | raw empty XML | XML |
| `namespace` | `Namespace` | `ПространствоИмен` | `string` | required by XML fixture | XML, XDTO |
| `package` | `Ext/Package.bin` | - | `Module` или отдельный внешний тип | absent in default fixture | XML fixture, Module external sync |

### Подчинённые объекты

Нет.

### Внешние файлы

- `Ext/Package.bin` — сохранить как внешний файл. Предпочтительный вариант: правило `type: "Module"` с `nkdkPath: "Package.bsl"` и `xmlPath: "Ext/Package.bsl"`, чтобы существующая бинарная альтернатива автоматически читала/писала `Package.bin`.
- Если имя `Package.bsl` в nkdk нежелательно для XDTO, в реализации добавить минимальный отдельный внешний тип для произвольного файла; это изменение должно быть покрыто sync-тестом.

### Дельта реестров и sync

- Добавить `MetadataXDTOPackage` в `MetadataItemTypeRegistry`.
- Добавить `MetadataXDTOPackage` в `PropertyTypeRegistry` и `PropertyRuleTypeKeys`.
- Зарегистрировать правило в `metadataXDTOPackage/index.ts`.
- Подключить в `packages/core/metadata/appliedObjects/index.ts`.
- Добавить в `TopLevelMetadataItemRules`.
- Добавить префикс `ПакетXDTO` в миграционные пути.
- Добавить sync-тест на `XDTOPackages/<name>.xml` и `XDTOPackages/<name>/Ext/Package.bin`.

### Риски

- `Package.bin` по расширению бинарный, но текущая фикстура определяется как UTF-8 text. Тест должен сравнивать байты/содержимое без перекодирования.
- В проекте уже есть common object `XDTOPackages` для ссылок из WebService; новый `MetadataXDTOPackage` не должен конфликтовать с этим типом.

## Следующие объекты

## Объект: MetadataWebSocketClient

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/WebSocketClients`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataWebSocketClient`
- XML-каталог: `WebSocketClients`
- XML-контейнер: `WebSocketClient`
- Префикс YAML/metadata path: `WebSocketКлиент`
- Соседи: `metadataBot`, `metadataIntegrationService`, `metadataHTTPService`

### Фикстуры

- `WebSocketКлиентВсеСвойства.xml` -> `full.xml`
- `WebSocketКлиентПоУмолчанию.xml` -> `minimal.xml`
- `WebSocketКлиентВсеСвойства/Ext/Module.bsl` -> sync external fixture

### Свойства

| TS-ключ | XML-тег | YAML-ключ | Тип | Default XML/YAML | Источник |
|---|---|---|---|---|---|
| `xmlRoot` | `WebSocketClient` | - | `XMLRoot` | - | XML |
| `uuid` | `_uuid` | - | `uuid` | - | XML |
| `name` | `Name` | - | `string` | required | XML |
| `synonym` | `Synonym` | `Синоним` | `I8nText` | raw empty XML | XML |
| `comment` | `Comment` | `Комментарий` | `string` | raw empty XML | XML |
| `predefined` | `Predefined` | `Предопределенный` | `boolean` | `false` / `false` | XML, XDTO |
| `autoConnect` | `AutoConnect` | `ПодключатьАвтоматически` | `boolean` | `false` / `false` | XML, XDTO, ru-en-map |
| `serverURL` | `ServerURL` | `URLСервера` | `string` | raw empty XML | XML, XDTO, ru-en-map |
| `user` | `User` | `Пользователь` | `string` | raw empty XML | XML, XDTO |
| `password` | `Password` | `Пароль` | `string` | raw empty XML | XML, XDTO |
| `headers` | `Headers` | `Заголовки` | `WebSocketClientHeaders` | empty `xr:ValueList` / `[]` | XML, XDTO |
| `useOSProxy` | `UseOSProxy` | `ИспользоватьПроксиОС` | `boolean` | `false` / `false` | XML, XDTO, ru-en-map |
| `useOSAuthentication` | `UseOSAuthentication` | `ИспользоватьАутентификациюОС` | `boolean` | `false` / `false` | XML, XDTO, ru-en-map |
| `timeout` | `Timeout` | `Таймаут` | `number` | `30` / `30` | XML, XDTO, ru-en-map |
| `module` | `Ext/Module.bsl` | - | `Module` | absent in default fixture | XML fixture, Module external sync |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration(ObjectBelonging)` | `Native` YAML-only default | XDTO |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `ОбъектРасширяемойКонфигурации` | `string` или `uuid` | runtime only | XDTO |

### Подчинённые объекты

Нет.

### Новый общий тип: WebSocketClientHeaders

Нужен отдельный common object, потому что `Headers` хранится как:

- корень `Headers xsi:type="xr:ValueList"`;
- элементы `xr:Item`;
- внутри `xr:Value xsi:type="v8:KeyAndValue"`;
- ключ и значение как `v8:Key xsi:type="xs:string"` / `v8:Value xsi:type="xs:string"`.

Модель: массив пар `{ key: string; value: string }`. YAML: список объектов с ключами `Ключ` и `Значение`. Пустой XML `Headers xsi:type="xr:ValueList"` импортируется как пустой массив и экспортируется обратно с тем же `xsi:type`.

### Внешние файлы

- `Ext/Module.bsl` — поддержать как `Module` с `nkdkPath: "Модуль.bsl"` и `xmlPath: "Ext/Module.bsl"`.

### Дельта реестров и sync

- Добавить `MetadataWebSocketClient` в `MetadataItemTypeRegistry`.
- Добавить `MetadataWebSocketClient` и `WebSocketClientHeaders` в `PropertyTypeRegistry` и `PropertyRuleTypeKeys`.
- Зарегистрировать правило в `metadataWebSocketClient/index.ts`.
- Подключить в `packages/core/metadata/appliedObjects/index.ts`.
- Добавить в `TopLevelMetadataItemRules`.
- Добавить префикс `WebSocketКлиент` в миграционные пути.
- Добавить sync-тест на `WebSocketClients/<name>.xml` и `WebSocketClients/<name>/Ext/Module.bsl`.

### Риски

- `Headers` нельзя реализовать через текущий `MetadataValue`: он сохраняет только пустой `xr:ValueList` и потеряет пары ключ/значение.
- `Password` хранится как строка в XML-фикстуре; специальное шифрование или сокрытие в YAML не вводится без отдельного требования.

## Следующие объекты

## Объект: MetadataExternalDataSource

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/ExternalDataSources`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataExternalDataSource`
- Текущий статус: каталог уже есть, но содержит только `full.xml`, `minimal.xml` и пустой `sync/data.ts`; реализации нет.
- XML-каталог: `ExternalDataSources`
- XML-контейнер: `ExternalDataSource`
- Префикс YAML/metadata path: `ВнешнийИсточникДанных`
- Соседи: `metadataCatalog`, `metadataReport`, `metadataDataProcessor`, `metadataSequence`

### Фикстуры

- `ВнешнийИсточникДанныхВсеСвойства.xml` -> `full.xml`
- `ВнешнийИсточникДанныхПоУмолчанию.xml` -> `minimal.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml`
- Внешние файлы форм, макетов, команд и модулей из дерева `ВнешнийИсточникДанныхВсеСвойства/**/Ext/*`.

### Свойства родителя

| TS-ключ | XML-тег | YAML-ключ | Тип | Default XML/YAML | Источник |
|---|---|---|---|---|---|
| `xmlRoot` | `ExternalDataSource` | - | `XMLRoot` | - | XML |
| `internalInfo` | `InternalInfo` | - | `InternalInfo` | generated types: `Manager`, `TablesManager`, `CubesManager` | XML |
| `uuid` | `_uuid` | - | `uuid` | - | XML |
| `name` | `Name` | - | `string` | required | XML |
| `synonym` | `Synonym` | `Синоним` | `I8nText` | raw empty XML | XML |
| `comment` | `Comment` | `Комментарий` | `string` | raw empty XML | XML |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration(DefaultDataLockControlMode)` | `Automatic` / `Automatic` | XML, XDTO |
| `tables` | `Table` under `ChildObjects` | `Таблицы` | `MetadataExternalDataSourceTables` | `[]` | XML, XDTO |
| `cubes` | `Cube` under `ChildObjects` | `Кубы` | `MetadataExternalDataSourceCubes` | `[]` | XML, XDTO |
| `functions` | `Function` under `ChildObjects` | `Функции` | `MetadataExternalDataSourceFunctions` | `[]` | XML, XDTO |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration(ObjectBelonging)` | `Native` YAML-only default | XDTO |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `ОбъектРасширяемойКонфигурации` | `string` или `uuid` | runtime only | XDTO |

### Подчинённые объекты

Порядок реализации: сначала листья, затем контейнеры.

1. `MetadataExternalDataSourceField`
   - XML-контейнер: `Field`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceField`
   - Используется в `Table` и `DimensionTable`.
   - Свойства близки к `MetadataAttribute`: `Type`, `PasswordMode`, `Format`, `EditFormat`, `ToolTip`, `MinValue`, `MaxValue`, `FillValue`, `FillChecking`, `ChoiceParameterLinks`, `ChoiceParameters`, `QuickChoice`, `CreateOnInput`, `ChoiceHistoryOnInput`, `ChoiceForm`.
   - Дополнительные поля: `NameInDataSource`, `ReadOnly`, `AllowNull`.

2. `MetadataExternalDataSourceFunction`
   - XML-контейнер: `Function`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceFunction`
   - Свойства: `Name`, `Synonym`, `Comment`, `ReturnValue`, `Type`, `ExpressionInDataSource`, служебные `ObjectBelonging`/`ExtendedConfigurationObject`.
   - Хранится внутри `ExternalDataSource.ChildObjects`, а не отдельным файлом.

3. `MetadataExternalDataSourceDimensionTable`
   - XML-контейнер: `DimensionTable`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable`
   - Отдельный XML-файл: `ExternalDataSources/<source>/Cubes/<cube>/DimensionTables/<name>.xml`.
   - Свойства: `NameInDataSource`, `PresentationField`, `HierarchyNameInDataSource`, `LevelNumber`, `Hierarchical`, `UnfilledParentValue`, `UseStandardCommands`, `QuickChoice`, формы по умолчанию, представления, `Explanation`, `IncludeHelpInContents`.
   - ChildObjects: `Field`, `Form`, `Command`, `Template`.
   - Внешний файл из фикстуры: `Ext/ManagerModule.bsl`.

4. `MetadataExternalDataSourceTable`
   - XML-контейнер: `Table`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceTable`
   - Отдельный XML-файл: `ExternalDataSources/<source>/Tables/<name>.xml`.
   - Свойства: `TableType`, `NameInDataSource`, `ExpressionInDataSource`, `TableDataType`, `KeyFields`, `PresentationField`, `ParentField`, `UnfilledParentValue`, `Characteristics`, `UseStandardCommands`, `QuickChoice`, `InputByString`, `CreateOnInput`, `SearchStringModeOnInputByString`, `ChoiceDataGetModeOnInputByString`, `ChoiceHistoryOnInput`, формы по умолчанию, представления, `Explanation`, `IncludeHelpInContents`, `ReadOnly`, `TransactionsIsolationLevel`, `DataVersionField`, `EditType`, `BasedOn`, `DataLockFields`, `DataLockControlMode`.
   - ChildObjects: `Field`, `Form`, `Command`, `Template`.
   - Внешние файлы из фикстур: `Ext/ManagerModule.bsl`, `Ext/ObjectModule.bsl`, `Ext/RecordSetModule.bsl`.

5. `MetadataExternalDataSourceCube`
   - XML-контейнер: `Cube`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube`
   - Отдельный XML-файл: `ExternalDataSources/<source>/Cubes/<name>.xml`.
   - Свойства: `NameInDataSource`, `Characteristics`, `UseStandardCommands`, `DefaultRecordForm`, `DefaultListForm`, представления, `Explanation`, `IncludeHelpInContents`.
   - ChildObjects: `DimensionTable`, `Dimension`, `Resource`, `Form`, `Command`, `Template`.
   - `Dimension` и `Resource` можно переиспользовать через существующие `MetadataRegisterDimension`/`MetadataRegisterResource` только после проверки XML-тегов; если поля не совпадут, завести отдельные типы `MetadataExternalDataSourceCubeDimension` и `MetadataExternalDataSourceCubeResource`.
   - Внешний файл из фикстуры: `Ext/RecordSetModule.bsl`.

### Переиспользуемые общие механизмы

- `ChildFormNames` для ссылок `<Form>...`.
- `ChildTemplateNames` для ссылок `<Template>...`.
- `MetadataCommands` для вложенных `<Command>`.
- `TypeDescription`, `I8nText`, `MinMaxValue`, `MetadataValue`, `ChoiceParameterLinks`, `ChoiceParameters`, `TypeLink`, `CharacteristicsDescription`, `MetadataItemLinks`/списки ссылок — по существующим правилам.
- `Module` для `.bsl`.
- `Template` для `Ext/Form.xml`, `Ext/Template.txt` и похожих внешних файлов, если текущий механизм корректно копирует companion-файлы.

### Внешние файлы

- Table:
  - `Tables/<table>/Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl`
  - `Tables/<table>/Ext/ObjectModule.bsl` -> `МодульОбъекта.bsl`
  - `Tables/<table>/Ext/RecordSetModule.bsl` -> `МодульНабораЗаписей.bsl`
  - `Tables/<table>/Forms/<form>/Ext/Form.xml`
  - `Tables/<table>/Templates/<template>/Ext/Template.txt`
  - `Tables/<table>/Commands/<command>/Ext/CommandModule.bsl`
- Cube:
  - `Cubes/<cube>/Ext/RecordSetModule.bsl` -> `МодульНабораЗаписей.bsl`
  - `Cubes/<cube>/Forms/<form>/Ext/Form.xml`
  - `Cubes/<cube>/Templates/<template>/Ext/Template.txt`
  - `Cubes/<cube>/Commands/<command>/Ext/CommandModule.bsl`
- DimensionTable:
  - `Cubes/<cube>/DimensionTables/<table>/Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl`

### Дельта реестров и sync

- Добавить `MetadataExternalDataSource` в `MetadataItemTypeRegistry`.
- Добавить parent и все новые child/common-типы в `PropertyTypeRegistry` и `PropertyRuleTypeKeys`.
- Зарегистрировать parent в `metadataExternalDataSource/index.ts`.
- Зарегистрировать коллекционные правила для `tables`, `cubes`, `functions`, `fields`, при необходимости `dimensions` и `resources`.
- Подключить в `packages/core/metadata/appliedObjects/index.ts`.
- Добавить в `TopLevelMetadataItemRules`.
- Добавить префикс `ВнешнийИсточникДанных` в миграционные пути.
- Обновить sync-тесты так, чтобы проверялись:
  - корневой XML;
  - отдельные XML-файлы tables/cubes/dimension tables;
  - внешние `.bsl`, `Form.xml`, `Template.txt`, `CommandModule.bsl`;
  - отсутствие дублирования имени владельца в выходных путях.

### Риски

- Внешний источник данных затрагивает уже существующую карту child object types в configuration; надо убедиться, что новые правила не ломают распознавание top-level children.
- Для `FieldList` (`KeyFields`, `InputByString`, `DataLockFields`) может понадобиться новый общий тип, если существующие `MetadataItemLinks`/`FieldsList` не сохраняют тег `xr:Field`.
- `UnfilledParentValue`, `FillValue`, `MinValue`, `MaxValue` используют разные `xsi:nil` и `xsi:type`; их надо покрыть XML round-trip до YAML.
- `Dimension`/`Resource` куба похожи на регистровые поля, но XDTO для `DimensionProperties` шире. Переиспользование существующих типов допустимо только после точечного XML-теста.
- `ExternalDataSource` содержит отдельные файлы ниже второго уровня вложенности; sync-тесты должны явно проверять относительные пути.

`MetadataExternalDataSource` идёт последним, потому что он раскрывает отдельное дерево дочерних объектов и внешних файлов.
