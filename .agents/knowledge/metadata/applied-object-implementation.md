# Applied Object Implementation

Используй этот документ после исследования нового прикладного объекта и перед написанием `rules.ts`/`types.ts`.

## Обязательная форма результата

Для каждого нового applied object зафиксируй:

- `itemType` — имя типа модели, например `MetadataConstant`;
- `itemTypePrefix` — русский префикс YAML/metadata path, например `Константа`;
- `xmlDir` — каталог XML-выгрузки, например `Constants`;
- XML-контейнер под `<MetaDataObject>`, например `Constant`;
- состав `InternalInfo` и категории `GeneratedType`;
- свойства `Properties`;
- наличие или отсутствие `ChildObjects`;
- внешние файлы `Ext/*` и их nkdk-пути;
- дельту реестров;
- набор тестов.

## Типовые соответствия свойств

| XML-тег | Тип правила | Примечание |
|---|---|---|
| `Name` | `string` | Обычно `required: true`; YAML-имя можно не задавать, если имя объекта задаётся ключом. |
| `Synonym` | `I8nText` | Для пустого XML обычно `defaultValueXMLRaw: ""`. |
| `Comment` | `string` | Для пустого XML обычно `defaultValueXMLRaw: ""`. |
| `Type` | `TypeDescription` | Часто `useAsShortValueYAML: true`, если объект удобно задавать короткой YAML-формой. |
| `UseStandardCommands` | `boolean` | `defaultValueXML` и `defaultValueYAML` бери из `minimal.xml`. |
| `DefaultForm`, `ChoiceForm` | `string` | Добавляй `referenceScope`, если ссылка ограничена формами текущего объекта. |
| `ExtendedPresentation`, `Explanation`, `Format`, `EditFormat`, `ToolTip` | `I8nText` | Для пустых XML-тегов обычно `defaultValueXMLRaw: ""`. |
| `PasswordMode`, `MarkNegatives`, `MultiLine`, `ExtendedEdit` | `boolean` | `defaultValueXML` и `defaultValueYAML` бери из `minimal.xml`. |
| `MinValue`, `MaxValue` | `MinMaxValue` | Для `xsi:nil` используй `defaultValueXMLRaw: { "_xsi:nil": true }`; `defaultValueYAML` не задавай, если дефолт не число. |
| `FillChecking` | `SystemEnumeration` | `typeSE: "FillChecking"`. |
| `ChoiceFoldersAndItems` | `SystemEnumeration` | `typeSE: "FoldersAndItemsUse"`. |
| `ChoiceParameterLinks` | `ChoiceParameterLinks` | Используй существующий common object. |
| `ChoiceParameters` | `ChoiceParameters` | Используй существующий common object. |
| `QuickChoice` | `SystemEnumeration` | `typeSE: "UseQuickChoice"`. |
| `LinkByType` | `TypeLink` | Используй существующий common object. |
| `ChoiceHistoryOnInput` | `SystemEnumeration` | `typeSE: "ChoiceHistoryOnInput"`. |
| `DataLockControlMode` | `SystemEnumeration` | `typeSE: "DefaultDataLockControlMode"`. |
| `DataHistory` | `SystemEnumeration` | `typeSE: "DataHistoryUse"`. |
| `ObjectBelonging` | `SystemEnumeration` | Обычно `toYAML: false`, `fromYAML: false`, `defaultValueYAML: "Native"`. |
| `ExtendedConfigurationObject` | `string` | Обычно `runtimeOnly: true`. |
| `Ext/*Module.bsl` | `Module` | Используй `nkdkPath` и `xmlPath`; не пиши отдельную логику копирования. |

## Дефолты

- Для `boolean`, `number` и `SystemEnumeration` указывай `defaultValueYAML`, если нет зафиксированного исключения.
- Значение бери из `minimal.xml` текущего объекта, затем из XSD/XDTO `default`, затем из прямого соседа с тем же XML-тегом и типом.
- Для пустых тегов используй `defaultValueXMLRaw`, а не `defaultValueXML`.
- Для значений `xsi:nil` используй XML-сырой дефолт; не подставляй YAML-дефолт другого типа.

## Реестры

Для нового applied object проверь:

- `MetadataItemTypeRegistry`;
- `PropertyTypeRegistry`;
- `PropertyRuleTypeKeys`;
- runtime-регистрацию через `registerMetadataItemRule`;
- импорт в `packages/core/metadata/appliedObjects/index.ts`, если объект должен подключаться при старте metadata-пакета.

## Тесты

Минимальный набор для объекта верхнего уровня:

- `fromXML.test.ts`;
- `toXML.test.ts`;
- `fromYAML.test.ts`;
- `toYAML.test.ts`;
- `convertFromXML.test.ts`;
- `syncToXML.test.ts`.

Если у объекта есть внешние файлы, `convertFromXML.test.ts` и `syncToXML.test.ts` должны проверять их копирование в обе стороны.
