| Объект с аномалией | Свойство | Синтаксис `!xml` (значение после тега) | Текст в XML |
|---|---|---|---|
| `MetadataAttribute`, `StandardAttributeDescription` | `ЗначениеЗаполнения` | `!xml <исходное значение>` | `<FillValue …><исходное значение в XML-представлении типа></FillValue>` или `<xr:FillValue …>…</xr:FillValue>` |
| `MetadataAttribute`, `StandardAttributeDescription` | `ЗначениеЗаполнения` | `!xml DesignTimeRef` | `<FillValue xsi:type="xr:DesignTimeRef"/>` или `<xr:FillValue xsi:type="xr:DesignTimeRef"/>` |
| `StandardAttributeDescriptions` | `СтандартныеРеквизиты` | `!xml` | канонические элементы `<xr:StandardAttribute name="…">…</xr:StandardAttribute>` |
| `CharacteristicsDescription` | `ПолеПутиКДанным` | `!xml` | `<xr:DataPathField>` отсутствует |
| `CharacteristicsDescription` | `ПолеИспользованияМножественныхЗначений` | `!xml` | `<xr:MultipleValuesUseField>` отсутствует |
| `CharacteristicsDescription` | `ПолеКлючаМножественныхЗначений` | `!xml` | `<xr:MultipleValuesKeyField>` отсутствует |
| `CharacteristicsDescription` | `ПолеПорядкаМножественныхЗначений` | `!xml` | `<xr:MultipleValuesOrderField>` отсутствует |
| `TableInputField`, `TableCheckBoxField`, `TablePictureField`, `TableLabelField` | `ГоризонтальноеПоложениеВШапке` | `!xml` | `<HeaderHorizontalAlign>Auto</HeaderHorizontalAlign>` |
| `Table` с источником-коллекцией `КомпоновщикНастроекКомпоновкиДанных`, для которого вычислен профиль `none` ([проверка](../packages/rules/metadata/forms/elements/table/explicitRowFilter.test.ts)) | `ОтборСтрок` | `!xml` | явно присутствующий `<RowFilter xsi:nil="true"/>` |
| нестандартная панель `ClientApplicationInterface` с UUID | `ПустоеОпределение` | `!xml` | `<panelDef id="<UUID панели>"/>` |
| управляемая форма | `ПутьКДанным` | `!xml <исходный внутренний путь>` | `<DataPath><исходный внутренний путь></DataPath>` |
| `Catalog`, `Document`, `DataProcessor`, `InformationRegister` | свойство типа `MetadataValue` в `FillValue`, `Value`, `app:value`, `v8:Value`, `xr:FillValue` или `xr:TypesFilterValue` | `!xml <UUID>.<UUID>` | `<… xsi:type="xr:DesignTimeRef"><UUID>.<UUID></…>` |
| `Subsystem` | элемент состава подсистемы | `!xml <UUID>` | `<xr:Item xsi:type="xr:MDObjectRef"><UUID></xr:Item>` |
| форма `Catalog`, `ChartOfAccounts`, `ChartOfCharacteristicTypes`, `CommonForm`, `DataProcessor`, `DocumentJournal`, `Document`, `ExchangePlan`, `InformationRegister`, `Report` или `Subsystem` | локальная ссылка `Command` | `!xml <исходная ссылка>` | `<Command><исходная ссылка></Command>` |
| форма `Catalog`, `CommonForm`, `DataProcessor`, `DocumentJournal`, `Document`, `ExchangePlan`, `InformationRegister` или `Report` | локальная ссылка `CommandName` | `!xml <исходная ссылка>` | `<CommandName><исходная ссылка></CommandName>` |
| форма `Catalog`, `DataProcessor`, `Document` или `Report` | локальная ссылка `Field` | `!xml <исходная ссылка>` | `<Field><исходная ссылка></Field>` |
| форма `Catalog`, `CommonForm`, `Document` или `InformationRegister` | локальная ссылка `DataPath` | `!xml <исходная ссылка>` | `<DataPath><исходная ссылка></DataPath>` |
| форма `AccumulationRegister`, `Catalog`, `DataProcessor`, `Document`, `InformationRegister`, `Report` или `SettingsStorage` | локальная ссылка `xr:DataPath` | `!xml <исходная ссылка>` | `<xr:DataPath><исходная ссылка></xr:DataPath>` |
| форма `Catalog`, `DataProcessor`, `Document`, `ExchangePlan` или `Subsystem` | локальная ссылка `CommandGroup` | `!xml <исходная ссылка>` | `<CommandGroup><исходная ссылка></CommandGroup>` |
| форма `Catalog` | локальная ссылка `GroupList` | `!xml <исходная ссылка>` | `<GroupList><исходная ссылка></GroupList>` |
| форма `Catalog`, `CommonForm`, `Document` или `InformationRegister` | локальная ссылка `UserSettingsGroup` | `!xml <исходная ссылка>` | `<UserSettingsGroup><исходная ссылка></UserSettingsGroup>` |
