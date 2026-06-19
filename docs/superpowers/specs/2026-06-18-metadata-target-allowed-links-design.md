# Точные metadataTarget-ссылки для BasedOn, функциональных опций и подсистем

Дата: 2026-06-18

## Цель

Убрать падение `nkdk import` на полном YAML round-trip для `/home/nikita/git/round-trip/all`, не расширяя допустимые ссылки шире, чем показывают контрольные XML-файлы.

Источники допустимых ссылок:

- `/home/nikita/git/round-trip/all/Catalogs/СправочникПолный.xml`
- `/home/nikita/git/round-trip/all/FunctionalOptions/ФункциональнаяОпцияВсеСвойства.xml`
- `/home/nikita/git/round-trip/all/Subsystems/ПодсистемаВсеСвойства.xml`

Внешние XML-файлы остаются источником истины для анализа, но в репозиторий нужно добавить собственные тестовые фикстуры на основании:

- `/home/nikita/git/round-trip/all/FunctionalOptions/ФункциональнаяОпцияВсеСвойства.xml`
- `/home/nikita/git/round-trip/all/Subsystems/ПодсистемаВсеСвойства.xml`

## Текущая проблема

Сейчас `metadataTargets` умеет разбирать корневые объекты, metadata-члены и часть вложенных объектов, но язык ограничений недостаточно точен для трех свойств:

- `MetadataCatalogRules.properties.basedOn`
- `MetadataFunctionalOptionRules.properties.content`
- `MetadataSubsystemRules.properties.content`

Падения импорта:

- `MetadataCatalog "СправочникПолный": Корень "ExternalDataSource" не разрешён для цели метаданных`
- `MetadataFunctionalOption "ФункциональнаяОпцияБулево": Корень "ExternalDataSource" не разрешён для цели метаданных`
- `MetadataSubsystem "ПодсистемаИспользуетсяВПримерах": Неизвестный сегмент "Table"`

Проблема не только в `ExternalDataSource`. Контрольный `Subsystem.content` содержит корни `EventSubscription`, `XDTOPackage`, `WSReference`, `FunctionalOptionsParameter`, которых сейчас нет в `MetadataRootName`/`rootToYAML`, хотя соответствующие applied objects уже есть в проекте.

## Архитектурное решение

Расширить модель `metadataTarget` так, чтобы она могла задавать точные закрытые списки:

- допустимые верхнеуровневые объекты;
- допустимые владельцы metadata-членов;
- допустимые вложенные объекты внешнего источника данных;
- допустимые члены вложенных объектов внешнего источника данных.

Текущие поля `roots`, `objectRoots`, `nestedObjectRoots`, `memberKinds` остаются для совместимости. Новые точные ограничения используются только там, где нужно выразить "все и только эти" из контрольных XML.

## Допустимые ссылки

### Catalog.basedOn

Источник: `СправочникПолный.xml`, блок `<BasedOn>`.

Разрешить только объектные ссылки:

- `ChartOfAccounts`
- `ExternalDataSource.Table`
- `ExchangePlan`
- `Catalog`
- `Document`
- `ChartOfCharacteristicTypes`
- `BusinessProcess`
- `ChartOfCalculationTypes`
- `Task`

Не разрешать остальные объекты `ExternalDataSource`, например `ExternalDataSource.Cube` или `ExternalDataSource.Cube.DimensionTable`, если они не перечислены в этом блоке.

### FunctionalOption.content

Источник: `ФункциональнаяОпцияВсеСвойства.xml`, блок `<Content>`.

Разрешить верхнеуровневые объектные ссылки:

- `Catalog`
- `Subsystem`
- `CommonAttribute`
- `ExchangePlan`
- `FilterCriterion`
- `CommonForm`
- `CommonCommand`
- `DocumentJournal`
- `Enum`
- `DataProcessor`
- `ChartOfCharacteristicTypes`
- `ChartOfAccounts`
- `ChartOfCalculationTypes`
- `InformationRegister`
- `AccountingRegister`
- `CalculationRegister`
- `BusinessProcess`
- `Task`
- `ExternalDataSource.Cube`
- `ExternalDataSource.Table`
- `ExternalDataSource.Cube.DimensionTable`
- `ExternalDataSource.Function`

Разрешить члены верхнеуровневых объектов:

- `Catalog.Attribute`
- `Catalog.TabularSection`
- `Catalog.TabularSection.Attribute`
- `Catalog.Command`
- `ExchangePlan.Attribute`
- `ExchangePlan.Command`
- `ExchangePlan.TabularSection`
- `ExchangePlan.TabularSection.Attribute`
- `FilterCriterion.Command`
- `Document.Attribute`
- `Document.TabularSection.Attribute`
- `Document.Command`
- `DocumentJournal.Command`
- `Enum.Command`
- `DataProcessor.Attribute`
- `DataProcessor.TabularSection`
- `DataProcessor.TabularSection.Attribute`
- `DataProcessor.Command`
- `ChartOfCharacteristicTypes.TabularSection`
- `ChartOfCharacteristicTypes.TabularSection.Attribute`
- `ChartOfCharacteristicTypes.Command`
- `ChartOfAccounts.Attribute`
- `ChartOfAccounts.AccountingFlag`
- `ChartOfAccounts.ExtDimensionAccountingFlag`
- `ChartOfAccounts.TabularSection`
- `ChartOfAccounts.TabularSection.Attribute`
- `ChartOfAccounts.Command`
- `ChartOfCalculationTypes.Attribute`
- `ChartOfCalculationTypes.TabularSection`
- `ChartOfCalculationTypes.TabularSection.Attribute`
- `ChartOfCalculationTypes.Command`
- `InformationRegister.Dimension`
- `InformationRegister.Resource`
- `InformationRegister.Attribute`
- `InformationRegister.Command`
- `AccumulationRegister.Dimension`
- `AccumulationRegister.Resource`
- `AccumulationRegister.Attribute`
- `AccumulationRegister.Command`
- `AccountingRegister.Dimension`
- `AccountingRegister.Resource`
- `AccountingRegister.Attribute`
- `AccountingRegister.Command`
- `CalculationRegister.Dimension`
- `CalculationRegister.Resource`
- `CalculationRegister.Attribute`
- `CalculationRegister.Command`
- `BusinessProcess.Attribute`
- `BusinessProcess.TabularSection`
- `BusinessProcess.TabularSection.Attribute`
- `BusinessProcess.Command`
- `Task.AddressingAttribute`
- `Task.Attribute`
- `Task.TabularSection`
- `Task.TabularSection.Attribute`
- `Task.Command`

Разрешить члены вложенных объектов внешнего источника данных:

- `ExternalDataSource.Table.Field`
- `ExternalDataSource.Table.Command`
- `ExternalDataSource.Cube.DimensionTable.Field`
- `ExternalDataSource.Cube.Dimension`
- `ExternalDataSource.Cube.Resource`
- `ExternalDataSource.Cube.Command`

Не выводить из этих списков более общие разрешения. Например, наличие `AccumulationRegister.Dimension` не должно автоматически разрешать верхнеуровневый `AccumulationRegister`, если он отсутствует в контрольном XML для functional option.

### Subsystem.content

Источник: `ПодсистемаВсеСвойства.xml`, блок `<Content>`.

Разрешить только объектные ссылки:

- `Document`
- `DocumentNumerator`
- `InformationRegister`
- `ChartOfCharacteristicTypes`
- `Catalog`
- `CommonModule`
- `SessionParameter`
- `Role`
- `CommonAttribute`
- `ExchangePlan`
- `FilterCriterion`
- `EventSubscription`
- `ScheduledJob`
- `Bot`
- `FunctionalOption`
- `FunctionalOptionParameter`
- `DefinedType`
- `SettingsStorage`
- `CommonCommand`
- `CommandGroup`
- `CommonForm`
- `CommonTemplate`
- `CommonPicture`
- `XDTOPackage`
- `WebService`
- `HTTPService`
- `WSReference`
- `WebSocketClient`
- `IntegrationService`
- `StyleItem`
- `Style`
- `Constant`
- `DocumentJournal`
- `Enum`
- `Report`
- `DataProcessor`
- `ChartOfAccounts`
- `ChartOfCalculationTypes`
- `AccumulationRegister`
- `AccountingRegister`
- `CalculationRegister`
- `BusinessProcess`
- `Task`
- `ExternalDataSource.Table`
- `ExternalDataSource.Cube.DimensionTable`
- `ExternalDataSource.Cube`

Не разрешать metadata-члены внутри `Subsystem.content`, потому что контрольный XML содержит только `MDObjectRef`.

## Изменения в metadataTargets

Добавить корни:

- `EventSubscription`
- `XDTOPackage`
- `WSReference`

Проверить текущий корень `FunctionalOptionParameter`: в XML используется `FunctionalOptionsParameter`, а в коде тип называется `FunctionalOptionParameter`. Нужно сохранить модельное имя проекта и корректно сопоставить XML/YAML-представление с существующим `MetadataFunctionalOptionsParameterRules`.

Добавить поддержку новых сегментов членов:

- `Field`
- `ExtDimensionAccountingFlag`
- `AddressingAttribute`

Для этих сегментов нужны русские YAML-имена в `memberKindToYAML`/`memberKindFromYAML`, если ссылки экспортируются в YAML через форматтер. Если русские имена в справке не проверяются на этом шаге, в тестах нужно зафиксировать текущий договор явно.

Добавить поддержку вложенных object-путей внешнего источника:

- `ExternalDataSource.<name>.Table.<name>`
- `ExternalDataSource.<name>.Cube.<name>`
- `ExternalDataSource.<name>.Cube.<name>.DimensionTable.<name>`
- `ExternalDataSource.<name>.Function.<name>`

Добавить поддержку вложенных member-путей внешнего источника:

- `ExternalDataSource.<name>.Table.<name>.Field.<name>`
- `ExternalDataSource.<name>.Table.<name>.Command.<name>`
- `ExternalDataSource.<name>.Cube.<name>.DimensionTable.<name>.Field.<name>`
- `ExternalDataSource.<name>.Cube.<name>.Dimension.<name>`
- `ExternalDataSource.<name>.Cube.<name>.Resource.<name>`
- `ExternalDataSource.<name>.Cube.<name>.Command.<name>`

## Изменения в правилах

В `metadataCatalog/rules.ts` заменить широкую или неполную настройку `basedOn` на точную настройку из раздела `Catalog.basedOn`.

В `metadataFunctionalOption/rules.ts` заменить текущие `contentObjectRoots`, `contentMemberRoots`, `nestedObjectRoots`, `memberKinds` на точное ограничение из раздела `FunctionalOption.content`.

В `metadataSubsystem/rules.ts` заменить `metadataTarget: { kind: "object", allowNested: true }` на точное ограничение из раздела `Subsystem.content`.

## Тесты

Добавить unit-тесты `metadataTargets`:

- разбирает и форматирует `ExternalDataSource.<name>.Table.<name>`;
- разбирает и форматирует `ExternalDataSource.<name>.Cube.<name>`;
- разбирает и форматирует `ExternalDataSource.<name>.Cube.<name>.DimensionTable.<name>`;
- разбирает и форматирует `ExternalDataSource.<name>.Table.<name>.Field.<name>`;
- разбирает и форматирует `ExternalDataSource.<name>.Cube.<name>.DimensionTable.<name>.Field.<name>`;
- отклоняет `ExternalDataSource.Cube.DimensionTable` в `Catalog.basedOn`;
- отклоняет верхнеуровневый `AccumulationRegister` в `FunctionalOption.content`, если разрешены только его члены;
- отклоняет metadata-члены в `Subsystem.content`.

Добавить прикладные тесты правил:

- `metadataCatalog` покрывает `BasedOn` из `СправочникПолный.xml`;
- `metadataFunctionalOption` получает fixture на основании `/home/nikita/git/round-trip/all/FunctionalOptions/ФункциональнаяОпцияВсеСвойства.xml` и проверяет все ссылки из `Content`;
- `metadataSubsystem` получает fixture на основании `/home/nikita/git/round-trip/all/Subsystems/ПодсистемаВсеСвойства.xml` и проверяет все ссылки из `Content`.

Новые фикстуры должны быть локальными тестовыми файлами проекта. Существующие XML-фикстуры и внешние XML из `/home/nikita/git/round-trip/all` не изменять.

## Проверка

Перед завершением реализации:

- запустить точечные тесты `metadataTargets`;
- запустить тесты трех измененных applied objects;
- запустить `round-trip-yaml` для `/home/nikita/git/round-trip/all` и убедиться, что `import` проходит дальше текущих трех ошибок;
- перед закрытием issue запустить `pnpm test` из корня проекта.

Полный `pnpm test` не относится к диагностическому skill, но обязателен перед закрытием issue по правилам репозитория.

## Не входит в задачу

- Исправление последующих XML/YAML round-trip diff после прохождения import.
- Изменение внешних XML-файлов `/home/nikita/git/round-trip/all`.
- Обобщение всех возможных metadata-ссылок платформы за пределами трех контрольных XML.
