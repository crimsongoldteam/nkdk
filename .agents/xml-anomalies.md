| Объект с аномалией | Свойство | Классифицированный YAML-тег | Текст в XML |
|---|---|---|---|
| обычное поле (`MetadataAttribute`, `MetadataCommonAttribute`, `MetadataTaskAddressingAttribute`, `MetadataRegisterAttribute`, `MetadataRegisterDimension`, `MetadataRegisterResource`, `AccountingFlag`, `ExtDimensionAccountingFlag`, `MetadataExternalDataSourceField`, `MetadataExternalDataSourceCubeDimension`, `MetadataExternalDataSourceCubeResource`) либо стандартный реквизит `StandardAttributeDescription` | `ЗначениеЗаполнения` | `!xml/value <исходное значение>` | `<FillValue …><исходное значение в XML-представлении типа></FillValue>` или `<xr:FillValue …>…</xr:FillValue>` |
| обычное поле (`MetadataAttribute`, `MetadataCommonAttribute`, `MetadataTaskAddressingAttribute`, `MetadataRegisterAttribute`, `MetadataRegisterDimension`, `MetadataRegisterResource`, `AccountingFlag`, `ExtDimensionAccountingFlag`, `MetadataExternalDataSourceField`, `MetadataExternalDataSourceCubeDimension`, `MetadataExternalDataSourceCubeResource`) либо стандартный реквизит `StandardAttributeDescription` | `ЗначениеЗаполнения` | `!xml/value DesignTimeRef` | `<FillValue xsi:type="xr:DesignTimeRef"/>` или `<xr:FillValue xsi:type="xr:DesignTimeRef"/>` |
| стандартный реквизит `Predefined`, для которого FillValue запрещён | `ЗначениеЗаполнения` | `!xml/value Ложь` | `<xr:FillValue xsi:type="xs:boolean">false</xr:FillValue>` |
| ссылочный стандартный реквизит `Parent` с ошибочным булевым значением | `ЗначениеЗаполнения` | `!xml/value Ложь` | `<xr:FillValue xsi:type="xs:boolean">false</xr:FillValue>` |
| обычное поле `MetadataAttribute`, `MetadataCommonAttribute`, `MetadataTaskAddressingAttribute`, `MetadataRegisterAttribute`, `MetadataRegisterDimension`, `MetadataRegisterResource`, `AccountingFlag`, `ExtDimensionAccountingFlag`, `MetadataExternalDataSourceField`, `MetadataExternalDataSourceCubeDimension` или `MetadataExternalDataSourceCubeResource` с единственным строковым типом | `ЗначениеЗаполнения` | `!xml/value Nil` | `<FillValue xsi:nil="true"/>` |
| строковый `StandardAttributeDescription` (`Code`, `Description`, `Number`) | `ЗначениеЗаполнения` | `!xml/value String` | `<xr:FillValue xsi:type="xs:string"/>` |
| `StandardAttributeDescription` с именем `ValueType` | `ЗначениеЗаполнения` | `!xml/value TypeDescription` | `<xr:FillValue xsi:type="v8:TypeDescription"/>` |
| поле внешнего источника данных | `ЗначениеЗаполнения` | `!xml/value Null` | `<FillValue xsi:type="v8:Null"/>` |
| `CharacteristicsDescription` | `ЗначениеОтбораВидов` | `!xml/value DesignTimeRef` | `<xr:TypesFilterValue xsi:type="xr:DesignTimeRef"/>` |
| одиночный встроенный элемент формы (`ExtendedTooltip`, `ContextMenu`, `AutoCommandBar`, `SearchStringAddition`, `SearchControlAddition`, `ViewStatusAddition`, вложенная таблица `GanttChartField`) | `Имя` | `!xml/name <исходное имя>`; для пустого имени `!xml/name ""` | исходный атрибут `name`, например `<ExtendedTooltip name="СтароеИмяExtendedTooltip"/>` |
| подменю `Popup` без `ExtendedTooltip` | `РасширеннаяПодсказка` | `!xml/absent` | элемент `<ExtendedTooltip>` отсутствует |
| подменю `Popup` с нестандартным именем пустой подсказки | `РасширеннаяПодсказка` | `!xml/name <исходное имя>` | `<ExtendedTooltip name="<исходное имя>"/>` |
| свойство типа `MinMaxValue` с каноническим `xsi:type` | `МинимальноеЗначение`, `МаксимальноеЗначение` | `!xml/value <исходный текст>` | `MinValue` либо `MaxValue` с точным исходным текстом |
| свойство типа `MinMaxValue` с иным или отсутствующим `xsi:type` | `МинимальноеЗначение`, `МаксимальноеЗначение` | `!xml/type <QName или -> <исходный текст>` | исходный `xsi:type` или его отсутствие и точный текст `MinValue` либо `MaxValue` |
| свойство типа `DcsLocalStringType` | соответствующая строка СКД | `!xml/type String <текст>` | элемент с `xsi:type="xs:string"` вместо канонического `v8:LocalStringType` |
| `IndexField` | `ДополнительныеПоля` | `!xml/present` | `<AdditionalFields/>` |
| `SettingsParameterValueCollection` | `Значение` | `!xml/value Nil` | `<dcscor:value xsi:nil="true"/>` |
| параметр схемы компоновки данных | `Значение` | `!xml/value Undefined` | `<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>` |
| управляемая форма | `Реквизиты` | `!xml/present` | `<Attributes/>` |
| `LabelDecoration`, `ExtendedTooltip` | `Заголовок` | `!xml/present` | `<Title formatted="true"/>` |
| предопределённый счёт | `ВидыСубконто` | `!xml/present` | `<ExtDimensionTypes/>` |
| реквизит формы с единственным типом `СписокЗначений` | `ТипЗначения` | `!xml/absent` | элемент `<Settings>` отсутствует вопреки каноническому экспорту пустого `v8:TypeDescription` |
| свойство типа `TypeDescription` | `Тип` | `!xml/type <исходный префикс>:<русское имя типа>` | `v8:Type` с исходным namespace-префиксом, например `d7p1:Chart` |
| `StandardAttributeDescriptions` | `СтандартныеРеквизиты` | `!xml/present` | канонические элементы `<xr:StandardAttribute name="…">…</xr:StandardAttribute>` |
| отсутствующий канонический элемент `StandardAttributeDescriptions` внутри присутствующей коллекции | ключ соответствующего стандартного реквизита | `!xml/absent` | соответствующий `<xr:StandardAttribute>` отсутствует |
| `CharacteristicsDescription` | `ПолеПутиКДанным` | `!xml/absent` | `<xr:DataPathField>` отсутствует |
| `CharacteristicsDescription` | `ПолеИспользованияМножественныхЗначений` | `!xml/absent` | `<xr:MultipleValuesUseField>` отсутствует |
| `CharacteristicsDescription` | `ПолеКлючаМножественныхЗначений` | `!xml/absent` | `<xr:MultipleValuesKeyField>` отсутствует |
| `CharacteristicsDescription` | `ПолеПорядкаМножественныхЗначений` | `!xml/absent` | `<xr:MultipleValuesOrderField>` отсутствует |
| `TableInputField`, `TableCheckBoxField`, `TablePictureField`, `TableLabelField` | `ГоризонтальноеПоложениеВШапке` | `!xml/present` | `<HeaderHorizontalAlign>Auto</HeaderHorizontalAlign>` |
| `Table` с источником-коллекцией `КомпоновщикНастроекКомпоновкиДанных`, для которого вычислен профиль `none` ([проверка](../packages/rules/metadata/forms/elements/table/explicitRowFilter.test.ts)) | `ОтборСтрок` | `!xml/present` | явно присутствующий `<RowFilter xsi:nil="true"/>` |
| нестандартная панель `ClientApplicationInterface` с UUID | `ПустоеОпределение` | `!xml/present` | `<panelDef id="<UUID панели>"/>` |
| корневой `ClientApplicationInterface` без размещённых панелей | `ИнтерфейсКлиентскогоПриложения` | `!xml/present` | существующий `Ext/ClientApplicationInterface.xml` только с пятью стандартными `<panelDef>` и без `top`, `left`, `right`, `bottom` |
| управляемая форма | `ПутьКДанным` | `!xml/value <исходный внутренний путь>` | `<DataPath><исходный внутренний путь></DataPath>` |
| `Catalog`, `Document`, `DataProcessor`, `InformationRegister` | битая ссылка типа `MetadataValue` в `FillValue`, `Value`, `app:value`, `v8:Value`, `xr:FillValue` или `xr:TypesFilterValue` | `!xml/reference <ссылка>`; низкоуровневая битая ссылка — `<UUID>.<UUID>` | `<… xsi:type="xr:DesignTimeRef"><внутренняя ссылка></…>` |
| `Subsystem` | битая ссылка в элементе состава подсистемы | `!xml/reference <UUID>` | `<xr:Item xsi:type="xr:MDObjectRef"><UUID></xr:Item>` |
| корневой `CommandInterface` | битая ссылка в `ПорядокПодсистем` | `!xml/reference <UUID>` | `<SubsystemsOrder><Subsystem><UUID></Subsystem></SubsystemsOrder>` |
| `I8nText`, текстовая часть `FormattedI8nText` | значение незарегистрированного языка | scalar `!xml/language <исходный текст>` на значении кода языка | `<v8:item>` с непустым `v8:lang`, отсутствующим в реестре языков конфигурации, и исходным `v8:content` |
| `I8nText`, текстовая часть `FormattedI8nText` | порядок языков | mapping `!xml/order` без payload на всей локализованной строке | последовательность `v8:item`, в которой присутствующий основной язык не первый либо остальные коды не возрастают |
| `I8nText`, текстовая часть `FormattedI8nText` | повтор языка | scalar `!xml/duplicate <исходный текст>` на значении зарегистрированного языка | ровно два соседних `v8:item` с одинаковыми `v8:lang` и `v8:content` |
| форма `Catalog`, `ChartOfAccounts`, `ChartOfCharacteristicTypes`, `CommonForm`, `DataProcessor`, `DocumentJournal`, `Document`, `ExchangePlan`, `InformationRegister`, `Report` или `Subsystem` | битая локальная ссылка `Command` | `!xml/reference <исходная битая ссылка>` | `<Command><исходная битая ссылка></Command>` |
| форма `Catalog`, `CommonForm`, `DataProcessor`, `DocumentJournal`, `Document`, `ExchangePlan`, `InformationRegister` или `Report` | битая локальная ссылка `CommandName` | `!xml/reference <исходная битая ссылка>` | `<CommandName><исходная битая ссылка></CommandName>` |
| форма `Catalog`, `DataProcessor`, `Document` или `Report` | битая локальная ссылка `Field` | `!xml/reference <исходная битая ссылка>` | `<Field><исходная битая ссылка></Field>` |
| форма `Catalog`, `CommonForm`, `Document` или `InformationRegister` | битая локальная ссылка `DataPath` | `!xml/reference <исходная битая ссылка>` | `<DataPath><исходная битая ссылка></DataPath>` |
| форма `AccumulationRegister`, `Catalog`, `DataProcessor`, `Document`, `InformationRegister`, `Report` или `SettingsStorage` | битая локальная ссылка `xr:DataPath` | `!xml/reference <исходная битая ссылка>` | `<xr:DataPath><исходная битая ссылка></xr:DataPath>` |
| форма `Catalog`, `DataProcessor`, `Document`, `ExchangePlan` или `Subsystem` | битая локальная ссылка `CommandGroup` | `!xml/reference <исходная битая ссылка>` | `<CommandGroup><исходная битая ссылка></CommandGroup>` |
| форма `Catalog` | битая локальная ссылка `GroupList` | `!xml/reference <исходная битая ссылка>` | `<GroupList><исходная битая ссылка></GroupList>` |
| форма `Catalog`, `CommonForm`, `Document` или `InformationRegister` | битая локальная ссылка `UserSettingsGroup` | `!xml/reference <исходная битая ссылка>` | `<UserSettingsGroup><исходная битая ссылка></UserSettingsGroup>` |
