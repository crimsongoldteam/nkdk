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

### Общие служебные свойства

- `ObjectBelonging` для новых root/child/common rules реализуется аналогично соседним объектам: `yaml: "ПринадлежностьОбъекта"`, `type: "SystemEnumeration"`, `typeSE: "ObjectBelonging"`, `toYAML: false`, `fromYAML: false`, `defaultValueYAML: "Native"`.
- `ExtendedConfigurationObject` реализуется аналогично соседним объектам как `runtimeOnly` поле с XML-тегом `ExtendedConfigurationObject`; в YAML не выводится.
- `InternalInfo` для объектов, где он присутствует в XML (`ExternalDataSource`, `Table`, `Cube`, `DimensionTable`), хранится как служебное XML-only поле аналогично соседним объектам и не выводится в YAML.

### Политика defaultValueYAML

- YAML должен быть минимальным: не выводить пустые и default-значения, если они могут быть однозначно восстановлены при экспорте в XML.
- Для явных scalar-defaults из минимальных XML-фикстур (`boolean`, `number`, `SystemEnumeration`) указывать и `defaultValueXML`, и `defaultValueYAML`, чтобы YAML-экспорт скрывал значения, равные default; XML-экспорт восстанавливает их через XML-default правила.
- Пустые коллекции не выводить в YAML как явные `[]`; для XML они должны восстанавливаться правилами коллекций и обязательных родителей.
- Для пустых XML-строк (`<Comment/>`, `<ExpressionInDataSource/>`, `<Explanation/>`, пустые представления) использовать `defaultValueXMLRaw: ""`; отдельный `defaultValueYAML` не задавать, если соседние rules не задают его для такого типа поля.
- Пустые `Синоним` и `Комментарий` не выводить в YAML; в XML сохранять через `defaultValueXMLRaw: ""` или эквивалентное правило `I8nText`.
- Пустые представления и пояснения (`ObjectPresentation`, `ExtendedObjectPresentation`, `RecordPresentation`, `ExtendedRecordPresentation`, `ListPresentation`, `ExtendedListPresentation`, `Explanation` и аналоги) не выводить в YAML, аналогично другим объектам.
- Пустые ссылки на формы и выбор (`DefaultObjectForm`, `DefaultRecordForm`, `DefaultListForm`, `DefaultChoiceForm`, `ChoiceForm` и аналоги) не выводить в YAML.
- Для обязательных пользовательских значений (`Name`, `Namespace`, `Type`, `NameInDataSource`, где оно требуется XML-фикстурой) не задавать `defaultValueYAML`.
- `NameInDataSource` для `Table`, `Cube`, `DimensionTable`, `Field` и `Resource` считается пользовательским значением без `defaultValueYAML`; значения из fixtures `ПоУмолчанию` не являются автоподстановками.
- Для nullable/typed value-полей (`MinValue`, `MaxValue`, `FillValue`, `UnfilledParentValue`) не задавать отдельный `defaultValueYAML`; сохранять пустоту через существующие правила значений и `defaultValueXMLRaw`.
- Для служебных и внешних свойств (`ObjectBelonging`, `ExtendedConfigurationObject`, `InternalInfo`, `Module`, `Help`, `ExternalFile`) не выводить пользовательский default в YAML, кроме служебного `ObjectBelonging: Native` с `toYAML:false/fromYAML:false`.

### Task 7: реализованный YAML-cycle

- Добавлены `fromYAML`/`toYAML` проверки для `MetadataCommonModule`, `MetadataXDTOPackage`, `MetadataWebSocketClient`, `MetadataExternalDataSource`; проверки сравнивают разобранный YAML, а не строковое форматирование.
- Для `WebSocketClientHeaders` добавлен YAML-переход: модель остаётся `{ key, value }`, YAML выводится списком `{ Ключ, Значение }`; порядок и повторяющиеся ключи сохраняются.
- `ExternalDataSource` sync fixture использует единый файл `ВнешнийИсточникДанныхВсеСвойства/Свойства.yaml`; пустые `Таблицы`, `Кубы`, `Функции` не выводятся.
- YAML-cycle `ExternalDataSource` покрывает вложенные `Таблицы`, `Кубы`, `ТаблицыИзмерений`, `Измерения`, `Ресурсы`, `Функции` и `Поля`.
- `MetadataExternalDataSourceCube` хранит XML-ссылки на таблицы измерений отдельно от YAML-модели: `dimensionTableNames` остаётся XML-only, а `dimensionTables` использует `MetadataExternalDataSourceDimensionTables` как YAML-only вложенную коллекцию.
- `syncToXML` рекурсивно обходит `childCollections`; для таблиц, кубов и таблиц измерений ExternalDataSource указаны YAML/XML-подкаталоги, поэтому их `Module` и `Help` синхронизируются из вложенных папок.
- `Package.bin`, `Module`, `Help`, `InternalInfo`, `xmlRoot`, `ObjectBelonging`, `ExtendedConfigurationObject`, формы/макеты-ссылки не имеют пользовательского YAML-представления.

### Task 8: реализованное sync-покрытие

- Для `MetadataCommonModule`, `MetadataXDTOPackage`, `MetadataWebSocketClient`, `MetadataExternalDataSource` добавлены локальные `__fixtures__/sync`, `syncToXML.test.ts` и `convertFromXML.test.ts`.
- `syncToXML` покрывает `Свойства.yaml -> XML` и внешние файлы: `Модуль.bsl`, `Package.bin`, `Help`, `CommandModule.bsl`, модули таблиц, кубов и таблиц измерений.
- `ExternalDataSource` хранит YAML в едином `Свойства.yaml`, а отдельные XML-файлы пишутся и читаются по путям `Tables/<name>.xml`, `Cubes/<name>.xml`, `Cubes/<cube>/DimensionTables/<name>.xml` без дублирования имени владельца.
- Для отдельных XML-файлов `childCollections` добавлен `fileItemRule`: collection-rule остаётся для вложенного YAML, full item-rule с `XMLRoot` используется для файла.

## Объект: MetadataCommonModule

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/CommonModules`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataCommonModule`
- XML-каталог: `CommonModules`
- XML-контейнер: `CommonModule`
- XDTO-типы: `CommonModule`, `CommonModuleProperties`
- Префикс YAML/metadata path: `ОбщийМодуль`
- Соседи: `metadataScheduledJob`, `metadataCommonTemplate`, `metadataBot`

### Фикстуры

- `ОбщийМодульГлобальный.xml` -> `full.xml`
- `ОбщийМодульПоУмолчанию.xml` -> `minimal.xml`
- `ОбщийМодульПовторный.xml` -> дополнительная sync XML-фикстура
- `ОбщийМодульКлиент.xml` -> дополнительная XML-фикстура клиентского модуля; в XML признак `Client` опущен и проявляется через `ClientManagedApplication=true`
- `ОбщийМодульГлобальный/Ext/Module.bsl` и `ОбщийМодульПовторный/Ext/Module.bsl` -> sync external fixtures для `Module`

### Свойства

| TS-ключ | XML-тег | YAML-ключ | Тип | Default XML/YAML | Источник |
|---|---|---|---|---|---|
| `xmlRoot` | `CommonModule` | - | `XMLRoot` | - | XML |
| `uuid` | `_uuid` | - | `uuid` | - | XML |
| `name` | `Name` | - | `string` | required | XML |
| `synonym` | `Synonym` | `Синоним` | `I8nText` | raw empty XML | XML |
| `comment` | `Comment` | `Комментарий` | `string` | raw empty XML | XML |
| `global` | `Global` | `Глобальный` | `boolean` | `false` / `false` | XML, ru-en-map |
| `clientManagedApplication` | `ClientManagedApplication` | `Клиент` | `boolean` | `false` / `false` | XML, UI screenshot |
| `server` | `Server` | `Сервер` | `boolean` | `true` / `true` | XML |
| `externalConnection` | `ExternalConnection` | `ВнешнееСоединение` | `boolean` | `false` / `false` | XML, ru-en-map |
| `clientOrdinaryApplication` | `ClientOrdinaryApplication` | `КлиентОбычноеПриложение` | `boolean` | `false` / `false` | XML, ru-en-map |
| `serverCall` | `ServerCall` | `ВызовСервера` | `boolean` | `false` / `false` | XML, ru-en-map |
| `privileged` | `Privileged` | `Привилегированный` | `boolean` | `false` / `false` | XML, ru-en-map |
| `returnValuesReuse` | `ReturnValuesReuse` | `ПовторноеИспользованиеВозвращаемыхЗначений` | `SystemEnumeration(ReturnValuesReuse)` | `DontUse` / `DontUse` | XML, XDTO, ru-en-map |
| `module` | `Ext/Module.bsl` | - | `Module` | absent in selected fixtures | соседние правила module |

### Свойства XDTO вне выбранных XML-фикстур

| TS-ключ | XML/XDTO-тег | Тип | Рекомендация |
|---|---|---|---|
| `objectBelonging` | `ObjectBelonging` | `SystemEnumeration(ObjectBelonging)` | включить как служебное: `toYAML: false`, `fromYAML: false`, default YAML `Native` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `string` | включить как `runtimeOnly`, аналогично соседним rules |
| `client` | `Client` | `boolean` | XDTO-поле с неявным default `false`; в переданной XML-выгрузке тег опущен, а видимое UI-поле `Клиент` соответствует XML `ClientManagedApplication`, поэтому `Client` не добавлять как YAML-поле |

### Подчинённые объекты

Нет.

### Внешние файлы

- `Ext/Module.bsl` — поддержать как `Module` с `nkdkPath: "Модуль.bsl"` и `xmlPath: "Ext/Module.bsl"`.
- В YAML самого `WebSocketClient` отдельного поля для модуля нет; внешний файл синхронизируется аналогично другим объектам.
- Файлы `ОбщийМодульПодпискаНаСобытие` и `ОбщийМодульРегЗадание` не входят в набор фикстур.

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
- `Client` объявлен в XDTO, но в реальной XML-выгрузке клиентского модуля тег опущен. Видимое поле конфигуратора `Клиент` выражено через `ClientManagedApplication=true`; `Client` не добавлять как обычное YAML-поле.
- `ClientOrdinaryApplication` оставляем отдельным YAML-полем `КлиентОбычноеПриложение`, потому что XML-тег присутствует в выгрузке, даже если в текущей форме конфигуратора он не выделен отдельным видимым флагом.
- `Server` оставляем YAML-полем `Сервер` с default `true`, как в XML-фикстуре по умолчанию и на скриншотах конфигуратора; `Сервер` выводится в YAML только при отличающемся значении `false`.
- `ServerCall` и `Privileged` оставляем обычными YAML-полями `ВызовСервера` и `Привилегированный` с default `false`; доступность флагов в UI зависит от сочетания других признаков, но XML хранит их как boolean.
- `ReturnValuesReuse=DontUse` скрывается как default; `ПовторноеИспользованиеВозвращаемыхЗначений` выводится в YAML только при отличающемся значении, например `DuringRequest`.

## Следующие объекты

## Объект: MetadataXDTOPackage

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/XDTOPackages`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataXDTOPackage`
- XML-каталог: `XDTOPackages`
- XML-контейнер: `XDTOPackage`
- XDTO-типы: `XDTOPackage`, `XDTOPackageProperties`
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
| `namespace` | `Namespace` | `ПространствоИмен` | `string` | required, no defaultValueYAML | XML, XDTO |
| `package` | `Ext/Package.bin` | - | внешний файл | absent in default fixture | XML fixture, external sync |

### Свойства XDTO вне выбранных XML-фикстур

| TS-ключ | XML/XDTO-тег | Тип | Рекомендация |
|---|---|---|---|
| `objectBelonging` | `ObjectBelonging` | `SystemEnumeration(ObjectBelonging)` | включить как служебное: `toYAML: false`, `fromYAML: false`, default YAML `Native` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `string` | включить как `runtimeOnly`, аналогично соседним rules |
| `package` | `Package` / `Ext/Package.bin` | `ExternalProperty` | обрабатывать внешним sync-механизмом, не как XML-свойство `Properties` |

### Подчинённые объекты

Нет.

### Внешние файлы

- `Ext/Package.bin` — сохранить как внешний файл без переименования: `nkdkPath: "Package.bin"`, `xmlPath: "Ext/Package.bin"`. Не использовать `Module` и не переводить пакет в `.bsl`.
- Добавлен общий внешний тип `ExternalFile` для копирования одиночного файла без разбора содержимого. Для XDTO package правило: `type: "ExternalFile"`, `nkdkPath: "Package.bin"`, `xmlPath: "Ext/Package.bin"`, `syncExternalOnly: true`, `toYAML: false`, `fromYAML: false`.
- В YAML самого `XDTOPackage` представлены только metadata-свойства (`Синоним`, `Комментарий`, `ПространствоИмен`); `Package.bin` не имеет YAML-поля.

### Дельта реестров и sync

- Добавить `MetadataXDTOPackage` в `MetadataItemTypeRegistry`.
- Добавить `MetadataXDTOPackage` в `PropertyTypeRegistry` и `PropertyRuleTypeKeys`.
- Зарегистрировать правило в `metadataXDTOPackage/index.ts`.
- Подключить в `packages/core/metadata/appliedObjects/index.ts`.
- Добавить в `TopLevelMetadataItemRules`.
- Добавить префикс `ПакетXDTO` в миграционные пути.
- Добавить sync-тест на `XDTOPackages/<name>.xml` и `XDTOPackages/<name>/Ext/Package.bin`.

### Риски

- `Package.bin` по расширению бинарный, но текущая фикстура определяется как UTF-8 text. Тест должен сравнивать байты/содержимое без перекодирования и без смены расширения.
- В проекте уже есть common object `XDTOPackages` для ссылок из WebService; новый `MetadataXDTOPackage` не должен конфликтовать с этим типом.
- `ru-en-map` переводит `Package` как `Приложение`, что для XDTO неверно по смыслу; YAML-ключ для внешнего файла не нужен, поэтому этот перевод не использовать.
- `ExternalFile` должен быть минимальным общим типом только для sync external; он не должен парсить `Package.bin` и не должен влиять на YAML.
- `Namespace`/`ПространствоИмен` обязательное metadata-свойство без `defaultValueYAML`; при отсутствии в YAML это ошибка, а не подстановка из фикстуры.

## Следующие объекты

## Объект: MetadataWebSocketClient

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/WebSocketClients`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataWebSocketClient`
- XML-каталог: `WebSocketClients`
- XML-контейнер: `WebSocketClient`
- XDTO-типы: `WebSocketClient`, `WebSocketClientProperties`
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
| `autoConnect` | `AutoConnect` | `АвтоПодключение` | `boolean` | `false` / `false` | XML, XDTO, HLP |
| `serverURL` | `ServerURL` | `АдресСервера` | `string` | raw empty XML, omitted in YAML when empty | XML, XDTO, HLP |
| `user` | `User` | `Пользователь` | `string` | raw empty XML, omitted in YAML when empty | XML, XDTO |
| `password` | `Password` | `Пароль` | `string` | raw empty XML, omitted in YAML when empty | XML, XDTO |
| `headers` | `Headers` | `Заголовки` | `WebSocketClientHeaders` | empty `xr:ValueList`, omitted in YAML | XML, XDTO |
| `useOSProxy` | `UseOSProxy` | `ИспользоватьПроксиОС` | `boolean` | `false` / `false` | XML, XDTO, ru-en-map |
| `useOSAuthentication` | `UseOSAuthentication` | `ИспользоватьАутентификациюОС` | `boolean` | `false` / `false` | XML, XDTO, ru-en-map |
| `timeout` | `Timeout` | `Таймаут` | `number` | `30` / `30` | XML, XDTO, ru-en-map |
| `module` | `Ext/Module.bsl` | - | `Module` | absent in default fixture | XML fixture, Module external sync |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration(ObjectBelonging)` | `Native` YAML-only default | XDTO |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `ОбъектРасширяемойКонфигурации` | `string` | runtime only | XDTO |

### Свойства XDTO вне выбранных XML-фикстур

| TS-ключ | XML/XDTO-тег | Тип | Рекомендация |
|---|---|---|---|
| `objectBelonging` | `ObjectBelonging` | `SystemEnumeration(ObjectBelonging)` | включить как служебное: `toYAML: false`, `fromYAML: false`, default YAML `Native` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `string` | включить как `runtimeOnly`, аналогично соседним rules |
| `module` | `Module` / `Ext/Module.bsl` | `ExternalProperty` | обрабатывать внешним sync-механизмом |

### Подчинённые объекты

Нет.

### Новый общий тип: WebSocketClientHeaders

Нужен отдельный common object именно для `WebSocketClientHeaders`, без обобщения в `KeyAndValueList`, потому что пока такой формы больше нет среди добавляемых объектов. `Headers` хранится как:

- корень `Headers xsi:type="xr:ValueList"`;
- элементы `xr:Item`;
- внутри `xr:Value xsi:type="v8:KeyAndValue"`;
- ключ и значение как `v8:Key xsi:type="xs:string"` / `v8:Value xsi:type="xs:string"`.

Модель: массив пар `{ key: string; value: string }`. YAML: список объектов с ключами `Ключ` и `Значение`, не map, потому что в 1С могут быть повторяющиеся заголовки с одинаковым ключом. Пустой XML `Headers xsi:type="xr:ValueList"` импортируется как пустой массив и экспортируется обратно с тем же `xsi:type`; в YAML пустой список `Заголовки: []` не выводится.

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
- `Password` хранится как строка в XML-фикстуре; в YAML это обычная строка, специальное шифрование или сокрытие не вводится.
- Defaults берутся из `WebSocketКлиентПоУмолчанию.xml`: `Predefined=false`, `AutoConnect=false`, пустые `ServerURL/User/Password` без вывода в YAML, пустые `Headers` без вывода в YAML, `UseOSProxy=false`, `UseOSAuthentication=false`, `Timeout=30`.
- `Predefined=false` скрывается как default; `Предопределенный: true` выводится только для отличающегося значения.

## Следующие объекты

## Объект: MetadataExternalDataSource

### Контекст

- Источник фикстур: `/Users/nikita/git/roundTripElements/ExternalDataSources`
- Целевой каталог: `packages/core/metadata/appliedObjects/metadataExternalDataSource`
- Текущий статус: каталог уже есть, но содержит только `full.xml`, `minimal.xml` и пустой `sync/data.ts`; реализации нет.
- XML-каталог: `ExternalDataSources`
- XML-контейнер: `ExternalDataSource`
- XDTO-типы: `ExternalDataSource`, `ExternalDataSourceProperties`, `ExternalDataSourceChildObjects`
- Префикс YAML/metadata path: `ВнешнийИсточникДанных`
- Соседи: `metadataCatalog`, `metadataReport`, `metadataDataProcessor`, `metadataSequence`

### Фикстуры

- `ВнешнийИсточникДанныхВсеСвойства.xml` -> `full.xml`
- `ВнешнийИсточникДанныхПоУмолчанию.xml` -> `minimal.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаМодульНабора.xml` -> отдельная sync-фикстура для `Ext/RecordSetModule.bsl`
- `ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml`
- `ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияПоУмолчанию.xml`
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
| `tables` | `Table` under `ChildObjects` | `Таблицы` | `MetadataExternalDataSourceTables` | empty collection omitted in YAML | XML, XDTO |
| `cubes` | `Cube` under `ChildObjects` | `Кубы` | `MetadataExternalDataSourceCubes` | empty collection omitted in YAML | XML, XDTO |
| `functions` | `Function` under `ChildObjects` | `Функции` | `MetadataExternalDataSourceFunctions` | empty collection omitted in YAML | XML, XDTO |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration(ObjectBelonging)` | `Native` YAML-only default | XDTO |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `ОбъектРасширяемойКонфигурации` | `string` | runtime only | XDTO |

### Свойства XDTO вне выбранных XML-фикстур

| TS-ключ | XML/XDTO-тег | Тип | Рекомендация |
|---|---|---|---|
| `objectBelonging` | `ObjectBelonging` | `SystemEnumeration(ObjectBelonging)` | включить как служебное: `toYAML: false`, `fromYAML: false`, default YAML `Native` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | `string` | включить как `runtimeOnly`, аналогично соседним rules |

### Подчинённые объекты

Порядок реализации: сначала листья, затем контейнеры.

Для YAML все дочерние объекты `ExternalDataSource` объединяются в единое дерево YAML-файла владельца: `Таблицы`, `Кубы`, `Функции`, а внутри них поля, измерения, ресурсы, формы, команды и макеты. Поля `Table` и `DimensionTable` хранятся с YAML-ключом `Поля`; таблицы измерений куба хранятся внутри соответствующего куба с YAML-ключом `ТаблицыИзмерений`; `Dimension` и `Resource` внутри куба хранятся как `Измерения` и `Ресурсы`. XML-раскладка остаётся как в реальной выгрузке 1С: root object в одном XML, таблицы/кубы/dimension tables в отдельных XML-файлах, листья вроде `Field`, `Function`, `Dimension`, `Resource` вложены в XML владельца.

Sync обязан выполнять обратимое преобразование:

- XML -> YAML: собрать root XML, `Tables/<name>.xml`, `Cubes/<name>.xml`, `Cubes/<cube>/DimensionTables/<name>.xml` и вложенные листья в единый YAML-файл внешнего источника данных.
- YAML -> XML: разложить единое YAML-дерево обратно в набор XML-файлов по структуре выгрузки 1С.
- Формы, команды и макеты `Table`/`Cube`/`DimensionTable` представлены в том же YAML-дереве владельца, аналогично другим объектам; их внешнее содержимое (`Form.xml`, `CommandModule.bsl`, `Template.txt`, `Help.xml` и html-страницы справки) остаётся отдельными файлами рядом в nkdk-структуре.
- Для `DimensionTable` в XML куба хранится ссылка `<DimensionTable>Имя</DimensionTable>`, а полный объект находится в `Cubes/<cube>/DimensionTables/<name>.xml`; в YAML это один вложенный список `ТаблицыИзмерений` внутри куба.

1. `MetadataExternalDataSourceField`
   - XML-контейнер: `Field`
   - XDTO-типы: `Field`, `FieldProperties`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceField`
   - Используется в `Table` и `DimensionTable`.
   - Хранится внутри `ChildObjects` владельца, без отдельного XML-файла и без внешних файлов.
   - Свойства близки к `MetadataAttribute`: `Type`, `PasswordMode`, `Format`, `EditFormat`, `ToolTip`, `MinValue`, `MaxValue`, `FillValue`, `FillChecking`, `ChoiceParameterLinks`, `ChoiceParameters`, `QuickChoice`, `CreateOnInput`, `ChoiceHistoryOnInput`, `ChoiceForm`.
   - Дополнительные поля: `NameInDataSource`, `ReadOnly`, `AllowNull`.
   - `Type` обязательный, без `defaultValueYAML`.
   - Defaults из `ПолеПоУмолчанию`/`Поле1`: `PasswordMode=false`, `MarkNegatives=false`, `MultiLine=false`, `ExtendedEdit=false`, `FillFromFillingValue=false`, `FillChecking=DontCheck`, `QuickChoice=Auto`, `CreateOnInput=Auto`, `ChoiceHistoryOnInput=Auto`, `ReadOnly=false`, `AllowNull=true`.
   - `MinValue`, `MaxValue`, `FillValue` не получают отдельный `defaultValueYAML`; использовать существующее поведение типов значений, чтобы сохранить `xsi:nil`, `v8:Null` и конкретный `xsi:type`.
   - XDTO-служебные вне XML-фикстур: `ObjectBelonging`, `ExtendedConfigurationObject`.

2. `MetadataExternalDataSourceFunction`
   - XML-контейнер: `Function`
   - XDTO-типы: `Function`, `FunctionProperties`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceFunction`
   - Свойства: `Name`, `Synonym`, `Comment`, `ReturnValue`, `Type`, `ExpressionInDataSource`, служебные `ObjectBelonging`/`ExtendedConfigurationObject`.
   - Хранится внутри `ExternalDataSource.ChildObjects`, а не отдельным файлом. В YAML это вложенный список `Функции`; отдельного `Functions/<name>.xml` и внешних файлов нет.
   - Defaults из `ФункцияПоУмолчанию` внутри `ВнешнийИсточникДанныхВсеСвойства.xml`: `ReturnValue=true`, `ExpressionInDataSource` как пустой XML-тег.
   - `ReturnValue=true` — обычный default; в YAML выводится только отличающееся значение `false`.
   - `Type` не получает `defaultValueYAML`: значение есть в fixture, но является типом функции, а не универсальным default для всех функций.
   - `ExpressionInDataSource` не получает отдельный `defaultValueYAML`; для XML использовать `defaultValueXMLRaw: ""`.

3. `MetadataExternalDataSourceDimensionTable`
   - XML-контейнер: `DimensionTable`
   - XDTO-типы: `DimensionTable`, `DimensionTableProperties`, `DimensionTableChildObjects`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable`
   - Отдельный XML-файл: `ExternalDataSources/<source>/Cubes/<cube>/DimensionTables/<name>.xml`.
   - В YAML хранится внутри соответствующего куба, а не отдельным YAML-файлом.
   - Свойства: `NameInDataSource`, `PresentationField`, `HierarchyNameInDataSource`, `LevelNumber`, `Hierarchical`, `UnfilledParentValue`, `UseStandardCommands`, `QuickChoice`, формы по умолчанию, представления, `Explanation`, `IncludeHelpInContents`.
   - ChildObjects: `Field`, `Form`, `Command`, `Template`.
   - Внешний файл из фикстуры: `Ext/ManagerModule.bsl`.
   - XDTO-внешние свойства: `ObjectModule`, `ManagerModule`, `Help`; `ManagerModule` реализуется как `Module`, `Help` при наличии фикстуры реализуется через общий тип `Help`.
   - Defaults из `ТаблицаИзмеренияПоУмолчанию.xml`: `LevelNumber=0`, `Hierarchical=false`, `UseStandardCommands=false`, `QuickChoice=false`, `IncludeHelpInContents=false`.
   - Пустые формы, представления, `PresentationField`, `HierarchyNameInDataSource` и `UnfilledParentValue` не получают отдельный `defaultValueYAML`; сохраняются пустыми через правила соответствующих типов.
   - Пустой `<ChildObjects/>` не выводит в YAML явные `Поля: []`, `Формы: []`, `Команды: []`, `Макеты: []`; обязательность полей на первом этапе не валидируется.

4. `MetadataExternalDataSourceTable`
   - XML-контейнер: `Table`
   - XDTO-типы: `Table`, `TableProperties`, `TableChildObjects`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceTable`
   - Отдельный XML-файл: `ExternalDataSources/<source>/Tables/<name>.xml`.
   - Свойства: `TableType`, `NameInDataSource`, `ExpressionInDataSource`, `TableDataType`, `KeyFields`, `PresentationField`, `ParentField`, `UnfilledParentValue`, `Characteristics`, `UseStandardCommands`, `QuickChoice`, `InputByString`, `CreateOnInput`, `SearchStringModeOnInputByString`, `ChoiceDataGetModeOnInputByString`, `ChoiceHistoryOnInput`, формы по умолчанию, представления, `Explanation`, `IncludeHelpInContents`, `ReadOnly`, `TransactionsIsolationLevel`, `DataVersionField`, `EditType`, `BasedOn`, `DataLockFields`, `DataLockControlMode`.
   - ChildObjects: `Field`, `Form`, `Command`, `Template`.
   - Внешние файлы из фикстур: `Ext/ManagerModule.bsl`, `Ext/ObjectModule.bsl`, `Ext/RecordSetModule.bsl`, `Ext/Help.xml`.
   - XDTO-внешние свойства: `ObjectModule`, `RecordSetModule`, `ManagerModule`, `Help`; `Help` реализуется через общий тип `Help` с `filePath/xmlPath: "Ext/Help.xml"` и `nkdkDir: "Справка"`.
   - Defaults из `ТаблицаПоУмолчанию.xml`: `TableType=Table`, `TableDataType=NonobjectData`, `UseStandardCommands=true`, `QuickChoice=false`, `CreateOnInput=Auto`, `SearchStringModeOnInputByString=Begin`, `ChoiceDataGetModeOnInputByString=Directly`, `ChoiceHistoryOnInput=Auto`, `IncludeHelpInContents=false`, `ReadOnly=false`, `TransactionsIsolationLevel=Auto`, `EditType=InDialog`, `DataLockControlMode=Automatic`.
   - Пустые ссылочные и списковые поля (`KeyFields`, `PresentationField`, `ParentField`, `InputByString`, `Default*Form`, `DataVersionField`, `BasedOn`, `DataLockFields`) не получают отдельный `defaultValueYAML`; они сохраняются пустыми через правила соответствующих типов.
   - `UnfilledParentValue` сохраняется через существующий тип значения с поддержкой `xsi:nil="true"`; отдельный `defaultValueYAML` не задаётся.

5. `MetadataExternalDataSourceCube`
   - XML-контейнер: `Cube`
   - XDTO-типы: `Cube`, `CubeProperties`, `CubeChildObjects`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube`
   - Отдельный XML-файл: `ExternalDataSources/<source>/Cubes/<name>.xml`.
   - Свойства: `NameInDataSource`, `Characteristics`, `UseStandardCommands`, `DefaultRecordForm`, `DefaultListForm`, представления, `Explanation`, `IncludeHelpInContents`.
   - ChildObjects: `DimensionTable`, `Dimension`, `Resource`, `Form`, `Command`, `Template`.
   - `Dimension` и `Resource` нельзя безопасно переиспользовать вслепую: XDTO `DimensionProperties`/`ResourceProperties` шире и отличаются от register-полей. Рекомендация: завести отдельные типы `MetadataExternalDataSourceCubeDimension` и `MetadataExternalDataSourceCubeResource`.
   - Внешние файлы из фикстур: `Ext/RecordSetModule.bsl`, `Ext/Help.xml`.
   - XDTO-внешние свойства: `RecordSetModule`, `ManagerModule`, `Help`; `Help` реализуется через общий тип `Help` с `filePath/xmlPath: "Ext/Help.xml"` и `nkdkDir: "Справка"`.
   - Defaults из `КубПоУмолчанию.xml`: `UseStandardCommands=false`, `IncludeHelpInContents=false`.
   - Пустой `<ChildObjects/>` не выводит в YAML явные `ТаблицыИзмерений: []`, `Измерения: []`, `Ресурсы: []`, `Формы: []`, `Команды: []`, `Макеты: []`.
   - Пустые формы, представления и `Characteristics` не получают отдельный `defaultValueYAML`; сохраняются пустыми через правила соответствующих типов.

6. `MetadataExternalDataSourceCubeDimension`
   - XML-контейнер: `Dimension`
   - XDTO-типы: `Dimension`, `DimensionProperties`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension`
   - Хранится внутри XML-файла куба в `Cube.ChildObjects`, без отдельного XML-файла; фикстуры считаются реальной выгрузкой из конфигурации.
   - Свойства из фикстуры: `Type`, `PasswordMode`, `Format`, `EditFormat`, `ToolTip`, `MarkNegatives`, `Mask`, `MultiLine`, `ExtendedEdit`, `MinValue`, `MaxValue`, `FillFromFillingValue`, `FillValue`, `FillChecking`, `ChoiceFoldersAndItems`, `ChoiceParameterLinks`, `ChoiceParameters`, `QuickChoice`, `CreateOnInput`, `ChoiceForm`, `LinkByType`, `ChoiceHistoryOnInput`.
   - `Type` обязательный, без `defaultValueYAML`.
   - Defaults из `ИзмерениеПоУмолчанию`: `PasswordMode=false`, `MarkNegatives=false`, `MultiLine=false`, `ExtendedEdit=false`, `FillFromFillingValue=false`, `FillChecking=DontCheck`, `ChoiceFoldersAndItems=Items`, `QuickChoice=Auto`, `CreateOnInput=Auto`, `ChoiceHistoryOnInput=Auto`.
   - XDTO-свойства вне фикстуры реализовать в MVP по существующим паттернам: `DocumentMap`/`RegisterRecordsMap` как в `metadataSequenceDimension`; `DenyIncompleteValues`, `BaseDimension`, `ScheduleLink`, `UseInTotals`, `Master`, `MainFilter`, `Balance`, `AccountingFlag`, `TypeReductionMode` как в `metadataRegisterDimension`; `Indexing`, `FullTextSearch`, `DataHistory` как в `commonRegisterFieldProperties`.
   - Для XDTO-свойств вне фикстур defaults брать из существующих rules-паттернов.
   - `DocumentMap`: YAML-ключ `СоответствиеРеквизитамДокументов`, тип `MetadataItemLinks`, `defaultValueXMLRaw: ""`; поведение и defaults взять из `metadataSequenceDimension`.
   - `RegisterRecordsMap`: YAML-ключ `СоответствиеРеквизитамДвижений`, тип `MetadataItemLinks`, `defaultValueXMLRaw: ""`; поведение и defaults взять из `metadataSequenceDimension`.
   - `RegisterDimension`: YAML-ключ `ИзмерениеРегистра` из `ru-en-map`, тип `MetadataItemLink` с `typedXML: "xr:MDObjectRef"`, XDTO `MDObjectRef`; HLP внешних источников данных явного свойства не содержит, отдельный общий тип не вводить.
   - `LeadingRegisterData`: YAML-ключ `ДанныеВедущихРегистров` из `ru-en-map`, тип `MetadataItemLinks`, XDTO `MDListType`; HLP внешних источников данных явного свойства не содержит, отдельный общий тип не вводить.

7. `MetadataExternalDataSourceCubeResource`
   - XML-контейнер: `Resource`
   - XDTO-типы: `Resource`, `ResourceProperties`
   - Путь: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource`
   - Хранится внутри XML-файла куба в `Cube.ChildObjects`, без отдельного XML-файла; фикстуры считаются реальной выгрузкой из конфигурации.
   - Свойства из фикстуры: `Type`, `PasswordMode`, `Format`, `EditFormat`, `ToolTip`, `MarkNegatives`, `Mask`, `MultiLine`, `ChoiceParameterLinks`, `ChoiceParameters`, `QuickChoice`, `ChoiceForm`, `ExtendedEdit`, `NameInDataSource`.
   - `Type` обязательный, без `defaultValueYAML`; `NameInDataSource` обязательный по XML-фикстуре, без `defaultValueYAML`.
   - Defaults из `РесурсПоУмолчанию`: `PasswordMode=false`, `MarkNegatives=false`, `MultiLine=false`, `ExtendedEdit=false`, `QuickChoice=Auto`.
   - XDTO-свойства вне фикстуры реализовать в MVP по существующим паттернам: `MinValue`, `MaxValue`, `FillChecking`, `ChoiceFoldersAndItems`, `CreateOnInput`, `LinkByType`, `ChoiceHistoryOnInput`, `FullTextSearch`, `FillFromFillingValue`, `FillValue`, `Indexing`, `DataHistory`, `BinaryDataStorageLocationUse`, `BinaryDataStorageLocationUseField` как в `commonRegisterFieldProperties`; `Balance`, `AccountingFlag`, `ExtDimensionAccountingFlag` как в `metadataRegisterResource`.
   - Для XDTO-свойств вне фикстур defaults брать из существующих rules-паттернов.

### Переиспользуемые общие механизмы

- `ChildFormNames` для ссылок `<Form>...`.
- `ChildTemplateNames` для ссылок `<Template>...`.
- `MetadataCommands` для вложенных `<Command>`.
- `TypeDescription`, `I8nText`, `MinMaxValue`, `MetadataValue`, `ChoiceParameterLinks`, `ChoiceParameters`, `TypeLink`, `CharacteristicsDescription`, `MetadataItemLinks`/списки ссылок — по существующим правилам.
- `FieldsList` уже существует и сохраняет `xr:Field`; использовать для `KeyFields`, `InputByString`, `DataLockFields`.
- `Module` для `.bsl`.
- `Help` для `Ext/Help.xml` и каталога `Ext/Help/*`; в nkdk это каталог `Справка`, как у соседних прикладных объектов.
- `Template` для `Ext/Form.xml`, `Ext/Template.txt` и похожих внешних файлов, если текущий механизм корректно копирует companion-файлы.

### Внешние файлы

- Table:
  - `Tables/<table>/Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl`
  - `Tables/<table>/Ext/ObjectModule.bsl` -> `МодульОбъекта.bsl`
  - `Tables/<table>/Ext/RecordSetModule.bsl` -> `МодульНабораЗаписей.bsl`
  - `Tables/<table>/Ext/Help.xml` и `Tables/<table>/Ext/Help/*` -> `Справка/*`
  - `Tables/<table>/Forms/<form>/Ext/Form.xml`
  - `Tables/<table>/Templates/<template>/Ext/Template.txt`
  - `Tables/<table>/Commands/<command>/Ext/CommandModule.bsl`
- Cube:
  - `Cubes/<cube>/Ext/RecordSetModule.bsl` -> `МодульНабораЗаписей.bsl`
  - `Cubes/<cube>/Ext/Help.xml` и `Cubes/<cube>/Ext/Help/*` -> `Справка/*`
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
  - отдельную таблицу `ТаблицаМодульНабора` как проверку `RecordSetModule` без смешивания с остальными внешними модулями;
  - внешние `.bsl`, `Form.xml`, `Template.txt`, `CommandModule.bsl`;
  - отсутствие дублирования имени владельца в выходных путях.

### Риски

- Внешний источник данных затрагивает уже существующую карту child object types в configuration; надо убедиться, что новые правила не ломают распознавание top-level children.
- Для родителя `ExternalDataSource` default `dataLockControlMode` берётся из `ВнешнийИсточникДанныхПоУмолчанию.xml`: `Automatic` / `Automatic`.
- Пустой `<ChildObjects/>` родителя не выводит в YAML явные `Таблицы: []`, `Кубы: []`, `Функции: []`; XML `<ChildObjects/>` восстанавливается при экспорте.
- Для `Table` поле из `ТаблицаПоУмолчанию.xml` (`Поле1`) не является default-значением и не должно создаваться автоматически. У таблицы требуется хотя бы одно поле, поэтому минимальная fixture содержит поле как валидный пример; строгую проверку непустого списка `Поля` в первом этапе можно не вводить.
- Для `FieldList` новый тип не нужен: существующий `FieldsList` уже регистрирует `fromXML/toXML/fromYAML/toYAML` и работает с `xr:Field`.
- `UnfilledParentValue`, `FillValue`, `MinValue`, `MaxValue` используют разные `xsi:nil` и `xsi:type`; их надо покрыть XML round-trip до YAML.
- `Dimension`/`Resource` куба похожи на регистровые поля, но XDTO для `DimensionProperties` и `ResourceProperties` шире. Нужны отдельные типы, иначе часть свойств вне фикстур будет невидимой.
- `ExternalDataSource` содержит отдельные файлы ниже второго уровня вложенности; sync-тесты должны явно проверять относительные пути.
- `configuration/childObjects.ts` уже содержит XML-контейнеры `CommonModule`, `XDTOPackage`, `ExternalDataSource`, `WebSocketClient`; новые top-level rules должны подключиться к существующему обходу, а не вводить новый механизм.

`MetadataExternalDataSource` идёт последним, потому что он раскрывает отдельное дерево дочерних объектов и внешних файлов.
