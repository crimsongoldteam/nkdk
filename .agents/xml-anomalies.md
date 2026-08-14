| Объект с аномалией | Свойство | Синтаксис `!xml` (значение после тега) | Текст в XML |
|---|---|---|---|
| `MetadataAttribute`, `StandardAttributeDescription` | `ЗначениеЗаполнения` | `!xml <исходное значение>` | `<FillValue …><исходное значение в XML-представлении типа></FillValue>` или `<xr:FillValue …>…</xr:FillValue>` |
| `MetadataAttribute`, `StandardAttributeDescription` | `ЗначениеЗаполнения` | `!xml DesignTimeRef` | `<FillValue xsi:type="xr:DesignTimeRef"/>` или `<xr:FillValue xsi:type="xr:DesignTimeRef"/>` |
| обычный `MetadataAttribute` с единственным строковым типом | `ЗначениеЗаполнения` | `!xml Nil` | `<FillValue xsi:nil="true"/>` |
| строковый `StandardAttributeDescription` (`Code`, `Description`, `Number`) | `ЗначениеЗаполнения` | `!xml String` | `<xr:FillValue xsi:type="xs:string"/>` |
| `StandardAttributeDescription` с именем `ValueType` | `ЗначениеЗаполнения` | `!xml TypeDescription` | `<xr:FillValue xsi:type="v8:TypeDescription"/>` |
| поле внешнего источника данных | `ЗначениеЗаполнения` | `!xml Null` | `<FillValue xsi:type="v8:Null"/>` |
| `CharacteristicsDescription` | `ЗначениеОтбораВидов` | `!xml DesignTimeRef` | `<xr:TypesFilterValue xsi:type="xr:DesignTimeRef"/>` |
| одиночный встроенный элемент формы (`ExtendedTooltip`, `ContextMenu`, `AutoCommandBar`, `SearchStringAddition`, `SearchControlAddition`, `ViewStatusAddition`, вложенная таблица `GanttChartField`) | `Имя` | `!xml <исходное имя>`; для пустого имени `!xml ""` | исходный атрибут `name`, например `<ExtendedTooltip name="СтароеИмяExtendedTooltip"/>` |
| свойство типа `MinMaxValue` | `МинимальноеЗначение`, `МаксимальноеЗначение` | `!xml "String <исходный текст>"` | `<MinValue xsi:type="xs:string"><исходный текст></MinValue>` или `<MaxValue xsi:type="xs:string"><исходный текст></MaxValue>` |
| свойство типа `MinMaxValue` | `МинимальноеЗначение`, `МаксимальноеЗначение` | `!xml "Decimal <исходный текст>"` | `<MinValue xsi:type="xs:decimal"><исходный текст></MinValue>` или `<MaxValue xsi:type="xs:decimal"><исходный текст></MaxValue>` |
| свойство типа `MinMaxValue` | `МинимальноеЗначение`, `МаксимальноеЗначение` | `!xml "Raw <QName или -> <исходный текст>"` | исходный неподдерживаемый `xsi:type` или его отсутствие и точный текст `MinValue` либо `MaxValue` |
| свойство типа `DcsLocalStringType` | соответствующая строка СКД | `!xml "String <текст>"` | элемент с `xsi:type="xs:string"` вместо канонического `v8:LocalStringType` |
| `IndexField` | `ДополнительныеПоля` | `!xml` | `<AdditionalFields/>` |
| `SettingsParameterValueCollection` | `Значение` | `!xml Nil` | `<dcscor:value xsi:nil="true"/>` |
| параметр схемы компоновки данных | `Значение` | `!xml Undefined` | `<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>` |
| управляемая форма | `Реквизиты` | `!xml` | `<Attributes/>` |
| `LabelDecoration`, `ExtendedTooltip` | `Заголовок` | `!xml` | `<Title formatted="true"/>` |
| предопределённый счёт | `ВидыСубконто` | `!xml` | `<ExtDimensionTypes/>` |
| реквизит формы с единственным типом `СписокЗначений` | `ТипЗначения` | `!xml` | элемент `<Settings>` отсутствует вопреки каноническому экспорту пустого `v8:TypeDescription` |
| свойство типа `TypeDescription` | `Тип` | `!xml <исходный префикс>:<русское имя типа>` | `v8:Type` с исходным namespace-префиксом, например `d7p1:Chart` |
| `StandardAttributeDescriptions` | `СтандартныеРеквизиты` | `!xml` | канонические элементы `<xr:StandardAttribute name="…">…</xr:StandardAttribute>` |
| `CharacteristicsDescription` | `ПолеПутиКДанным` | `!xml` | `<xr:DataPathField>` отсутствует |
| `CharacteristicsDescription` | `ПолеИспользованияМножественныхЗначений` | `!xml` | `<xr:MultipleValuesUseField>` отсутствует |
| `CharacteristicsDescription` | `ПолеКлючаМножественныхЗначений` | `!xml` | `<xr:MultipleValuesKeyField>` отсутствует |
| `CharacteristicsDescription` | `ПолеПорядкаМножественныхЗначений` | `!xml` | `<xr:MultipleValuesOrderField>` отсутствует |
| `TableInputField`, `TableCheckBoxField`, `TablePictureField`, `TableLabelField` | `ГоризонтальноеПоложениеВШапке` | `!xml` | `<HeaderHorizontalAlign>Auto</HeaderHorizontalAlign>` |
| `Table` с источником-коллекцией `КомпоновщикНастроекКомпоновкиДанных`, для которого вычислен профиль `none` ([проверка](../packages/rules/metadata/forms/elements/table/explicitRowFilter.test.ts)) | `ОтборСтрок` | `!xml` | явно присутствующий `<RowFilter xsi:nil="true"/>` |
| нестандартная панель `ClientApplicationInterface` с UUID | `ПустоеОпределение` | `!xml` | `<panelDef id="<UUID панели>"/>` |
| управляемая форма | `ПутьКДанным` | `!xml <исходный внутренний путь>` | `<DataPath><исходный внутренний путь></DataPath>` |
| `Catalog`, `Document`, `DataProcessor`, `InformationRegister` | битая ссылка типа `MetadataValue` в `FillValue`, `Value`, `app:value`, `v8:Value`, `xr:FillValue` или `xr:TypesFilterValue` | `!xml <UUID>.<UUID>` | `<… xsi:type="xr:DesignTimeRef"><UUID>.<UUID></…>` |
| `Subsystem` | битая ссылка в элементе состава подсистемы | `!xml <UUID>` | `<xr:Item xsi:type="xr:MDObjectRef"><UUID></xr:Item>` |
| корневой `CommandInterface` | битая ссылка в `ПорядокПодсистем` | `!xml <UUID>` | `<SubsystemsOrder><Subsystem><UUID></Subsystem></SubsystemsOrder>` |
| форма `Catalog`, `ChartOfAccounts`, `ChartOfCharacteristicTypes`, `CommonForm`, `DataProcessor`, `DocumentJournal`, `Document`, `ExchangePlan`, `InformationRegister`, `Report` или `Subsystem` | битая локальная ссылка `Command` | `!xml <исходная битая ссылка>` | `<Command><исходная битая ссылка></Command>` |
| форма `Catalog`, `CommonForm`, `DataProcessor`, `DocumentJournal`, `Document`, `ExchangePlan`, `InformationRegister` или `Report` | битая локальная ссылка `CommandName` | `!xml <исходная битая ссылка>` | `<CommandName><исходная битая ссылка></CommandName>` |
| форма `Catalog`, `DataProcessor`, `Document` или `Report` | битая локальная ссылка `Field` | `!xml <исходная битая ссылка>` | `<Field><исходная битая ссылка></Field>` |
| форма `Catalog`, `CommonForm`, `Document` или `InformationRegister` | битая локальная ссылка `DataPath` | `!xml <исходная битая ссылка>` | `<DataPath><исходная битая ссылка></DataPath>` |
| форма `AccumulationRegister`, `Catalog`, `DataProcessor`, `Document`, `InformationRegister`, `Report` или `SettingsStorage` | битая локальная ссылка `xr:DataPath` | `!xml <исходная битая ссылка>` | `<xr:DataPath><исходная битая ссылка></xr:DataPath>` |
| форма `Catalog`, `DataProcessor`, `Document`, `ExchangePlan` или `Subsystem` | битая локальная ссылка `CommandGroup` | `!xml <исходная битая ссылка>` | `<CommandGroup><исходная битая ссылка></CommandGroup>` |
| форма `Catalog` | битая локальная ссылка `GroupList` | `!xml <исходная битая ссылка>` | `<GroupList><исходная битая ссылка></GroupList>` |
| форма `Catalog`, `CommonForm`, `Document` или `InformationRegister` | битая локальная ссылка `UserSettingsGroup` | `!xml <исходная битая ссылка>` | `<UserSettingsGroup><исходная битая ссылка></UserSettingsGroup>` |
