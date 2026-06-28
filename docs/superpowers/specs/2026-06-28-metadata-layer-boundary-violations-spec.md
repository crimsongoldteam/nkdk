# Нарушения границ metadata-слоёв

## Контекст

Аудит опирается на согласованный принцип: `packages/core/metadata/orchestration`,
`packages/core/metadata/validation` и `packages/core/metadata/project` не должны
знать про конкретные реализации метаданных. Общие слои должны работать через
нейтральные договоры, `rules.ts`, регистрации property/item-типов и
подключаемые обработчики.

Эта спека фиксирует текущие нарушения принципа. Это не план одной большой
переделки: случаи нужно разбирать последовательно, небольшими шагами, сохраняя
поведение и тесты.

## Границы аудита

- Анализируется только runtime-код.
- Тесты и фикстуры используются как подсказки к поведению, но сами не считаются
  нарушением.
- Цель каждого шага - убрать знание о конкретном rules-объекте из общего слоя
  или оформить это знание как декларативный договор/регистрацию рядом с
  конкретным объектом.
- Существующий код, уточняющий `rules.ts`, считается переходным, если он живёт
  рядом с конкретным объектом. Нарушением становится попадание такого знания в
  `orchestration`, `validation` или `metadata/project`.

## Область текущей спеки

Эта спека планирует реализацию для всех найденных нарушений границ:

- центральные реестры типов в `orchestration`;
- предметная сборка структуры проекта в `metadata/project`;
- частные условия по файловым дочерним именам в
  `orchestration/appliedObject`;
- metadata-target owner/root logic в общем property-слое;
- `validation/dataPath` как applied-resolver внутри общего слоя;
- `ProjectMetadataResolver` как предметный resolver в `validation`;
- form validation и dynamic list warnings в общем `validation`.

Работа всё равно идёт последовательно: приоритет 1 разбирается первым,
приоритеты 2 и 3 входят в эту же спеку как продолжение серии, но не должны
смешиваться с первыми шагами в одном крупном изменении.

## Сквозной договор регистраций

- У каждого metadata-объекта должна быть одна точка побочных регистраций:
  соседний `register.ts`.
- `rules.ts` описывает декларативные правила объекта и не регистрирует
  поведение сам по себе.
- `types.ts` содержит типы, TypeBox-схемы и связанные type-only конструкции; он
  не должен выполнять runtime-регистрации.
- `types.ts` может содержать чистые локальные строители property-rule, например
  `numberRule(...)` или `i8nTextRule(...)`: они только добавляют фиксированный
  `type` и типизируют допустимые поля, не меняя runtime-поведение.
- `register.ts` может импортировать `rules.ts`, `types.ts` и локальные
  обработчики объекта, а затем вызывать все нужные регистрации:
  `registerMetadataItemRule`, `registerMetadataItemCollectionRule`,
  `registerTypeRule`, будущие `registerProjectSpec`, `registerJSONSchema` и
  регистрации project resources.
- Агрегирующие entrypoint-файлы applied/common/forms должны подключать
  `register.ts`, а не полагаться на побочные эффекты импорта `types.ts` или
  `rules.ts`.
- Перенос существующих регистраций из `types.ts` и `rules.ts` в `register.ts`
  входит в эту спецификацию и выполняется по мере разбора соответствующего
  объекта или группы объектов.

## Очередь разбора

### 1. Центральные реестры типов в `orchestration` - Приоритет 1

Файлы:

- `packages/core/metadata/orchestration/property/registry.ts`
- `packages/core/metadata/orchestration/metadataItem/registry.ts`
- `packages/core/metadata/orchestration/property/types.ts`

Признаки нарушения:

- `property/registry.ts` импортирует applied/forms/common-типы напрямую.
- `metadataItem/registry.ts` содержит явную секцию `Applied objects`.
- `property/types.ts` типизирует `MetadataItem.itemType` через общий
  `MetadataItemType`, собранный из конкретных объектов.

Почему это важно:

Общий слой становится местом, которое нужно менять при добавлении или
переименовании rules-объекта. Это противоречит идее, что конкретный объект сам
регистрирует свои типы и обработчики.

Направление выноса:

- Убрать `MetadataItemTypeRegistry` и `PropertyTypeRegistry` как глобальные
  списки всех известных metadata/property-типов. Не заменять их пустым
  расширяемым глобальным договором.
- Оставить в `orchestration` только нейтральные договоры: строковый ключ типа,
  форму `MetadataItemRule`, форму `BasePropertyRule`, runtime-реестр операций
  `registerTypeRule`/`getTypeRule` и общие алгоритмы, которые принимают
  конкретный `rules.ts` параметром.
- Типы конкретного metadata-объекта выводить рядом с объектом из его `rules.ts`:
  `MetadataTypeByRule<typeof ObjectRules>` и
  `YAMLTypeByRule<typeof ObjectRules>`.
- Допустимые поля property-rule проверять не через центральный union
  `PropertyRule`, а через локальные строители в `types.ts` соответствующего
  property-типа: `numberRule(...)`, `i8nTextRule(...)`,
  `systemEnumerationRule(...)`, `xmlRootRule(...)` и т.п.
- Строитель property-rule меняет только декларацию: результат должен быть
  эквивалентен прежнему объекту `{ type: "...", ...params }`.
- Если берём metadata-объект в работу, весь его `rules.ts` переводится на
  строители целиком; смешанный стиль внутри одного `rules.ts` не допускается.
- Первый пробный объект для обкатки подхода - `MetadataLanguage`: он небольшой,
  не содержит внешних файлов и покрывает `XMLRoot`, `uuid`, `string`,
  `I8nText`, `SystemEnumeration`.

Категория зависимости: in-process.

### 2. Предметная сборка структуры проекта в `metadata/project` - Приоритет 1

Файлы:

- `packages/core/metadata/project/specs.ts`
- `packages/core/metadata/project/schemaRegistry.ts`
- `packages/core/metadata/project/syncStateFiles.ts`
- `packages/core/metadata/project/directoryStructure.ts`
- `packages/core/metadata/project/resources.ts`
- `packages/core/metadata/project/ruleResources.ts`

Признаки нарушения:

- `specs.ts` импортирует конкретные applied-правила и содержит overrides для
  `Справочник`, `Документ`, `Перечисление`.
- `schemaRegistry.ts` вручную регистрирует конкретные schemas и property refs:
  `MetadataCatalog`, `MetadataDocument`, `ClientApplicationForm`,
  `MetadataCatalogAttributes`, `FormAttributes` и другие.
- `syncStateFiles.ts` знает про `Подсистема`, `Подсистемы`,
  `ClientApplicationForm`, `DynamicList`, `WSDefinitionSchemas`.
- `directoryStructure.ts` и `resources.ts` знают про `Формы`, `Форма.yaml`,
  `Подсистема`, `Подсистемы`.
- При этом `ruleResources.ts` уже показывает правильное направление: он
  извлекает ресурсы из `MetadataItemRule` и type-rule регистраций.

Почему это важно:

`metadata/project` должен отвечать на нейтральный вопрос "какие ресурсы описаны
правилами проекта", а не хранить частный список прикладных объектов, форм и
папок.

Направление выноса:

- Развить `ruleResources.ts` в единый источник описания project-ресурсов.
- Ввести регистрацию `MetadataProjectSpec`/schema exporter в `register.ts`
  конкретных объектов, не создавая отдельные `project.ts`/`schema.ts` для
  каждого объекта.
- Описать формы, вложенные подсистемы, внешние XML/asset-ресурсы и динамические
  ресурсы через `MetadataItemRule`, property rules или type-rule операции.
- Перевести `schemaRegistry`, `directoryStructure`, `resources`,
  `syncStateFiles` на общий описатель, без ручных проверок конкретных папок и
  itemType.

Категория зависимости: local-substitutable, потому что поведение проверяется на
локальной файловой системе.

### 3. Частные условия в `orchestration/appliedObject` - входит в текущую спеку

Файлы:

- `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- `packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.ts`

Признаки нарушения:

- `syncToXML.ts` отдельно собирает `ChildFormNames` и `ChildTemplateNames`.
- Внешняя синхронизация выбирает каталоги по `propRule.type ===
  "ChildFormNames" || propRule.type === "ChildTemplateNames"`.
- `getExpectedFormNames` знает про локальные ссылки на формы.
- `isFileChildNameRule` проверяет `ChildFormNames`/`Form` и
  `ChildTemplateNames`/`Template`.
- `preserveReferenceChildNameFilesToXML` выбирает XML-папки `Forms` и
  `Templates`.
- `convertFromXML.ts` дублирует `isFileChildNameRule`.
- При этом часть механизма уже нейтральная: `childCollections`, `fileItemRule`,
  `xmlDir`, `nkdkDir`, type-rule операции `syncExternalFromXML` и
  `syncExternalToXML`.

Почему это важно:

Алгоритм синхронизации уже почти работает через правила, но крайние случаи форм
и макетов всё ещё закреплены в общем коде. Каждый новый "похожий" дочерний
ресурс будет провоцировать ещё одно условие.

Направление выноса:

- Ввести нейтральную операцию property-типа в `registerTypeRule` (рабочее имя:
  `fileChildNamesDescriptor`). `appliedObject` спрашивает у property-типа
  описатель, а не сравнивает `PropertyRule.type` со строками
  `ChildFormNames`/`ChildTemplateNames`.
- Описатель должен задавать минимум:
  - папку проекта с дочерними файлами (`folderName` из конкретного rule);
  - XML-папку дочерних ресурсов (`Forms`, `Templates`);
  - XML-элемент имени в `ChildObjects` (`Form`, `Template`);
  - режим синхронизации для file item collections с собственными директориями:
    когда `name`/`referenceName` нужно передавать пустым;
  - нужно ли сохранять reference XML-папку, если в проекте нет собственной
    папки дочерних файлов;
  - как собрать ожидаемые имена для проверки внешних файлов.
- `ChildFormNames` регистрирует описатель рядом со своим property-типом. Он
  использует `folderName` из rule, XML-папку `Forms`, XML-элемент `Form` и
  расширенный сбор ожидаемых имён: явный список `ChildFormNames` плюс локальные
  ссылки на формы из свойств с `metadataTarget`/старым `referenceScope`.
- `ChildTemplateNames` регистрирует описатель рядом со своим property-типом. Он
  использует `folderName` из rule, XML-папку `Templates`, XML-элемент
  `Template` и ожидаемые имена из значения свойства.
- В `syncToXML.ts` и `convertFromXML.ts` заменить `isFileChildNameRule`,
  проверки `propRule.type === "ChildFormNames"`/`"ChildTemplateNames"` и выбор
  `Forms`/`Templates` на чтение описателя через type-rule registry.
- Не переносить реализацию синхронизации форм/макетов в `appliedObject`:
  `syncExternalFromXML`, `syncExternalToXML`, `projectResources` и
  `xmlSyncRoutes` остаются у конкретных property-типов.

Категория зависимости: local-substitutable.

### 4. Metadata target owner/root в property-оркестрации - Приоритет 2

Файлы:

- `packages/core/metadata/orchestration/property/metadataTargetString.ts`
- `packages/core/metadata/orchestration/property/fromYAML.ts`
- `packages/core/metadata/orchestration/property/toYAML.ts`

Признаки нарушения:

- `metadataTargetString.ts` содержит fallback `Нумератор ->
  DocumentNumerator`.
- Там же есть ветвления по `ClientApplicationForm`, `MetadataAttribute`,
  `MetadataExternalDataSource`, `MetadataExternalDataSourceTable`,
  `MetadataExternalDataSourceCube`,
  `MetadataExternalDataSourceDimensionTable`.
- `rootByOwnerItemType` вручную перечисляет applied itemType и metadata roots.
- `fromYAML.ts`/`toYAML.ts` передают стек владельцев как `{ itemType, name }`,
  после чего общий property-слой интерпретирует эти itemType.

Почему это важно:

Преобразование строковых metadata-target ссылок является общим механизмом, но
выбор владельца и корня зависит от конкретных rules-объектов.

Направление выноса:

- Не менять смысл property-rules с `metadataTarget`. Они по-прежнему описывают
  ограничение значения: ссылка на member текущего объекта, ссылка на top-level
  объект, допустимые roots, memberKinds, filters.
- Разделить два знания:
  - property-rule говорит, куда можно ссылаться;
  - item-rule или регистрация объекта говорит, кто такой `owner: "this"` для
    этого объекта.
- Для простых корневых объектов добавить декларацию владельца прямо в
  `rules.ts`, например:
  - `MetadataDocumentRules` -> `metadataTargetOwner: { kind: "self", root:
    "Document" }`;
  - `MetadataDocumentNumeratorRules` -> `metadataTargetOwner: { kind: "self",
    root: "DocumentNumerator" }`.
- Для объектов, которые не должны становиться владельцем metadata-target,
  объявить наследование владельца, например `ClientApplicationFormRules` ->
  `metadataTargetOwner: { kind: "inherit" }`. Тогда форма внутри документа
  продолжает использовать owner документа: `Document.АвансовыйОтчет`.
- Для сложных вложенных объектов оставить в `rules.ts` только нейтральный факт
  участия в metadata-target, а построение пути зарегистрировать в `register.ts`
  объекта. Примеры:
  - `MetadataExternalDataSourceTable` строит owner как
    `ExternalDataSource.<Источник>.Table.<Таблица>`;
  - `MetadataExternalDataSourceCube` строит owner как
    `ExternalDataSource.<Источник>.Cube.<Куб>`;
  - `MetadataExternalDataSourceDimensionTable` строит owner как
    `ExternalDataSource.<Источник>.Cube.<Куб>.DimensionTable.<Таблица>`.
- Перевести стек владельцев из `{ itemType, name }` к нейтральному виду, где
  общий property-слой получает готовый `MetadataTargetOwner` или resolver,
  способный его построить.
- После этого `metadataTargetString.ts` больше не должен содержать fallback
  `Нумератор -> DocumentNumerator`, проверки `ClientApplicationForm`,
  `MetadataAttribute`, `MetadataExternalDataSource*` и таблицу
  `rootByOwnerItemType`.

Категория зависимости: in-process.

### 5. `validation/dataPath` как applied-resolver внутри общего слоя - Приоритет 3

Файлы:

- `packages/core/metadata/validation/dataPath/types.ts`
- `packages/core/metadata/validation/dataPath/ownerCache.ts`
- `packages/core/metadata/validation/dataPath/typeDescription.ts`
- `packages/core/metadata/validation/dataPath/objectFields.ts`
- `packages/core/metadata/validation/dataPath/resolver.ts`
- `packages/core/metadata/validation/dataPath/formIndex.ts`
- `packages/core/metadata/validation/dataPath/formTraversal.ts`

Признаки нарушения:

- `types.ts` перечисляет concrete owner kinds: `Справочник`, `Документ`,
  `РегистрСведений`, `ПланСчетов`, `ОтчетОбъект` и другие.
- `ownerCache.ts` знает соответствия owner kind -> project dir и импортирует
  конкретные applied rules для `Константа`, `ОпределяемыйТип`,
  `ОбщийРеквизит`, `КритерийОтбора`, `ХранилищеНастроек`, `Нумератор`.
- `typeDescription.ts` содержит таблицы `CatalogRef -> Справочник`,
  `DocumentRef -> Документ`, register record set types и платформенные типы.
- `objectFields.ts` знает стандартные реквизиты `Ref`, `Owner`, `Parent`,
  `ValueType`, `BusinessProcess`, `RoutePoint`, а также mapping
  `Catalog -> Справочник`, `Document -> Документ`.
- `resolver.ts` содержит virtual fields для `ExchangePlan`,
  `InformationRegister`, `ChartOfAccounts`, `ChartOfCalculationTypes`,
  accounting register record set, register standard columns, `ValueList`,
  `GanttChart` и другие платформенные случаи.
- `formIndex.ts` знает платформенные источники формы вроде
  `КомпоновщикНастроекКомпоновкиДанных.Settings`.
- `formTraversal.ts` импортирует формы и обход элементов напрямую.

Почему это важно:

Валидация `DataPath` фактически является предметным резолвером платформы 1С,
а не нейтральным validation-ядром. Это мешает расширять rules-объекты без
изменения общего validation-кода.

Направление выноса:

- Ввести единый подключаемый договор `DataPathResolverRegistry`.
- Оставить в `validation/dataPath` нейтральное ядро:
  - разбор `ПутьКДанным` на сегменты;
  - нормализацию сегментов с индексами;
  - обход от корня к следующему сегменту;
  - накопление `DataPathTypeInfo`;
  - диагностики, кэш YAML и формат сообщений;
  - проверку policy из `DataPathPropertyRule.allowedKinds`.
- Убрать из нейтрального ядра знание конкретных платформенных объектов. Оно
  должно приходить через регистрации рядом с common/applied rules-объектами.
- `OwnerTypeRef.kind` оставить строковым ключом, без центрального union всех
  `Справочник`/`Документ`/`ПланСчетов` в `validation`.
- Регистрировать owner kinds отдельно от обхода:
  - `kind`: строковый ключ владельца, например `Справочник`;
  - `projectDir`: папка проекта, например `Справочник`;
  - `rule`: rules-объект для импорта владельца;
  - `typeDescriptionBases`: платформенные base-типы, которые дают этот owner,
    например `CatalogRef`, `CatalogObject`;
  - `metadataLinkPrefixes`: префиксы ссылок в model-полях, например `Catalog`;
  - опционально `aliases`, если один project dir или metadata type имеет
    несколько видимых имён.
- Регистрировать типы `TypeDescription` отдельно от `typeDescription.ts`.
  Нейтральная функция должна только разобрать строку вида
  `<BaseType>.<Name>` и спросить registry, что означает `BaseType`.
  Примеры:
  - `CatalogRef.Номенклатура` -> `{ kind: "object", nextTypes:
    [{ kind: "Справочник", name: "Номенклатура" }] }`;
  - `InformationRegisterRecordSet.Остатки` -> table source
    `RegisterRecordSet` с owner `{ kind: "РегистрСведений", name:
    "Остатки" }`;
  - `DefinedType.ДоговорКонтрагента` остаётся нейтральным указателем на
    зарегистрированный owner kind `ОпределяемыйТип`.
- Регистрировать построение индекса полей объекта через capabilities объекта,
  а не через центральный список коллекций. Примеры:
  - `MetadataCatalog` регистрирует коллекции `attributes`,
    `tabularSections`, `standardAttributes`;
  - `MetadataInformationRegister` регистрирует `dimensions`, `resources`,
    `attributes`, `standardAttributes`;
  - `MetadataTask` регистрирует `addressingAttributes`.
- Регистрировать типы стандартных реквизитов рядом с их правилами. Общий
  `objectFields.ts` не должен знать, что `Ref` указывает на текущий объект,
  `Owner` вычисляется из `owners`, `Parent` возвращает тот же owner, а
  `BusinessProcess` и `RoutePoint` указывают на `БизнесПроцесс`.
- Регистрировать виртуальные поля владельца как операции resolver-а. Примеры:
  - `ПланОбмена` добавляет `ThisNode` и
    `ОбластьДанныхОсновныеДанные`;
  - `РегистрСведений` добавляет
    `ОбластьДанныхВспомогательныеДанные`;
  - `ПланСчетов` добавляет `ExtDimensionTypes`, `Order`, `Type`,
    `OffBalance` и поля признаков учёта;
  - `ПланВидовРасчета` добавляет `ActionPeriodIsBasic`,
    `BaseCalculationTypes`, `LeadingCalculationTypes`,
    `DisplacingCalculationTypes`.
- Регистрировать table-source колонки как операции table kind или owner kind:
  `ValueList`, `GanttChart`, `RowsCount`, `Total*`, стандартные колонки
  `RegisterRecordSet`, специальные debit/credit колонки регистра бухгалтерии.
- Регистрировать особые переходы обхода отдельно:
  - `Документ` разрешает сегмент `RegisterRecords`/`НаборЗаписей` через
    `registerRecords`;
  - `ОтчетОбъект` разрешает `SettingsComposer`/`КомпоновщикНастроек` как
    пока непроверяемый платформенный источник;
  - `ConstantsSet` разрешает следующий сегмент через owner kind `Константа`;
  - `DefinedType` разворачивается через owner kind `ОпределяемыйТип`;
  - `ОбщийРеквизит` добавляет поле только если его `content` применим к
    текущему owner.
- `formIndex.ts` должен строить индекс формы нейтрально из зарегистрированных
  form rules. Платформенные источники вроде
  `КомпоновщикНастроекКомпоновкиДанных.Settings` регистрируются как
  form/dataPath source operation, а не хранятся списком в validation.
- `resolveDataPath` после выноса должен работать как проходчик:
  берёт root из form index, на каждом сегменте спрашивает registry о
  следующем поле/колонке/особом переходе, а сам не содержит проверок вида
  `isChartOfAccountsOwner`, `isDocumentOwner`, `registerKindByLinkPrefix`.

Категория зависимости: in-process.

### 6. `ProjectMetadataResolver` как предметный resolver в `validation` - Приоритет 3

Файлы:

- `packages/core/metadata/validation/projectMetadataResolver.ts`
- `packages/core/metadata/validation/metadataTargetTraversal.ts`
- `packages/core/metadata/validation/validateProject.ts`

Признаки нарушения:

- `ProjectMetadataResolver` знает про `Form`, `Template`, `ExternalDataSource`,
  `StyleItem`, `CommonPicture`, `Enum`, `predefined`, `Формы`, `Шаблоны`,
  `Template.xml`, `Template.txt`, `Template.bin`.
- В нём есть отдельная логика inline functions внешнего источника данных и
  member collections: `Формы`, `Макеты`, `Команды`, `ПризнакиУчета`,
  `ПризнакиУчетаСубконто`, `Поля`.
- `validateProject.ts` строит путь формы через
  `<Вид>/<Имя>/Формы/<Форма>/Форма.yaml`, а также проверяет обязательный
  `ОсновнойЯзык` для `MetadataConfiguration`.

Почему это важно:

Проверка metadata-target должна быть общей операцией "разрешить ссылку по
заявленным правилам", но resolver сейчас содержит частный словарь объектов и
проектных путей.

Направление выноса:

- Разделить нейтральный `ProjectMetadataResolver` и набор registered resolvers.
- Описывать member collections, value collections, child file lookup и object
  path segments через metadata-target/project registrations.
- Проверку обязательных ключей конфигурации перенести в rule/schema-level
  договор, а не держать условие по `MetadataConfiguration`.

Категория зависимости: local-substitutable.

### 7. Form validation и dynamic list warnings в общем `validation` - Приоритет 3

Файлы:

- `packages/core/metadata/validation/validateForm.ts`
- `packages/core/metadata/validation/dataPath/formIndex.ts`
- `packages/core/metadata/validation/dataPath/formTraversal.ts`

Признаки нарушения:

- `validateForm.ts` импортирует `ClientApplicationForm` parser и формы.
- Предупреждение для dynamic list conditional appearance ходит по YAML-ключам
  `Реквизиты`, `ДинамическийСписок`, `УсловноеОформление`, `ПравоеЗначение`.
- Специальный допуск opaque multiple value data path знает про `InputField`,
  `ПутьКДанным` и формат значения.

Почему это важно:

Общая validation-команда становится владельцем частных правил форм. При
расширении форм или добавлении другой сложной YAML-структуры это будет
разрастаться в общий слой.

Направление выноса:

- Оставить `validateForm` как один зарегистрированный validator для
  `ClientApplicationForm`, но вынести его из нейтрального ядра validation или
  подключать через registry.
- Dynamic list warnings оформить как type-rule/form-rule validation operation.
- Допуск opaque multiple value описать в `DataPathPropertyRule` или
  form-element rule.

Категория зависимости: in-process.

## Рекомендуемый порядок работ текущей спеки

1. Закрепить и проверить договор `register.ts`: новые регистрации не добавлять
   в `types.ts`/`rules.ts`, а существующие переносить при касании объекта.
2. Обкатать удаление централизованной проверки property-rule на
   `MetadataLanguage`: добавить локальные строители для нужных property-типов,
   перевести весь `metadataLanguage/rules.ts` на строители без изменения
   поведения, перенести runtime-регистрацию объекта в `metadataLanguage/register.ts`.
3. Для объектов, необходимых `metadata/project`, перенести текущие побочные
   регистрации из `types.ts`/`rules.ts` в их `register.ts`.
4. `metadata/project` project spec registry и развитие `ruleResources.ts`.
5. `schemaRegistry` через registrations вместо ручного списка schemas/property
   refs.
6. `syncStateFiles`, `directoryStructure`, `resources` через единый описатель
   ресурсов проекта.
7. Удаление центральных TypeScript registry в `orchestration` после перевода
   достаточного набора объектов на локальные строители и вывод типов из rules.
8. Для `orchestration/appliedObject` ввести type-rule описатель
   `fileChildNamesDescriptor` и зарегистрировать его для `ChildFormNames` и
   `ChildTemplateNames`.
9. Перевести `syncToXML.ts` на описатель: сбор имён из папок, выбор
   `xmlDir`/`referenceDir`, `propertyValue`, `preserveReference...` и ветку
   file item collections с собственными директориями.
10. Перевести `convertFromXML.ts` на описатель и убрать дублирующий
    `isFileChildNameRule`.
11. Для metadata-target ввести нейтральный договор owner/root resolver: простые
    owners объявить в `rules.ts`, сложные nested owner paths зарегистрировать в
    `register.ts`, а property-rules с `metadataTarget` оставить без изменения
    смысла.
12. Для `validation/dataPath` выделить нейтральное validation-ядро и
    подключаемый `DataPathResolverRegistry`; перенести owner kinds,
    type-description mapping, стандартные реквизиты, виртуальные поля, table
    columns и особые переходы обхода в регистрации рядом с common/applied
    правилами.
13. Разделить `ProjectMetadataResolver` на нейтральный resolver и набор
    registered resolvers для member collections, value collections, child file
    lookup и object path segments.
14. Вынести form validation из общего validation-ядра в зарегистрированный
    validator для `ClientApplicationForm`; dynamic list warnings и opaque
    multiple value data path оформить как операции form/type/property rules.

## Проверка для каждого шага

- Не менять XML-фикстуры.
- Для изменения в `packages/core/metadata/**` читать
  `.agents/knowledge/metadata/INDEX.md` и профильные документы.
- Добавлять тесты на новый договор на границе общего слоя.
- Сохранять текущие поведенческие тесты соответствующего модуля.
- Перед закрытием серии изменений запускать `pnpm test` из корня.
