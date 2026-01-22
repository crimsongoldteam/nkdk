import { TypeDescription, TypeDescriptionEnterprise } from "../../../metadata/commonObjects/typeDescription/types"

export interface TypeFixture {
  internal: TypeDescription
  enterprise: TypeDescriptionEnterprise
  xml: string
}

export const typeFixturesTable: TypeFixture[] = [
  //#region Primitive Types
  //#region String Types
  {
    internal: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    enterprise: "Строка(10)",
    xml: `<TypeDescription>
	<v8:Type>xs:string</v8:Type>
	<v8:StringQualifiers>
		<v8:Length>10</v8:Length>
		<v8:AllowedLength>Variable</v8:AllowedLength>
	</v8:StringQualifiers>
</TypeDescription>`,
  },
  {
    internal: { type: ["string"] },
    enterprise: "Строка",
    xml: `<TypeDescription>
	<v8:Type>xs:string</v8:Type>
	<v8:StringQualifiers>
		<v8:Length>0</v8:Length>
		<v8:AllowedLength>Variable</v8:AllowedLength>
	</v8:StringQualifiers>
</TypeDescription>`,
  },
  {
    internal: { type: ["string"], stringQualifiers: { length: 100, allowedLength: "Fixed" } },
    enterprise: "ФиксированнаяСтрока(100)",
    xml: `<TypeDescription>
	<v8:Type>xs:string</v8:Type>
	<v8:StringQualifiers>
		<v8:Length>100</v8:Length>
		<v8:AllowedLength>Fixed</v8:AllowedLength>
	</v8:StringQualifiers>
</TypeDescription>`,
  },
  //#endregion

  //#region Number Types
  {
    internal: { type: ["decimal"], numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Any" } },
    enterprise: "Число(10, 2)",
    xml: `<TypeDescription>
	<v8:Type>xs:decimal</v8:Type>
	<v8:NumberQualifiers>
		<v8:Digits>10</v8:Digits>
		<v8:FractionDigits>2</v8:FractionDigits>
		<v8:AllowedSign>Any</v8:AllowedSign>
	</v8:NumberQualifiers>
</TypeDescription>`,
  },
  {
    internal: { type: ["decimal"], numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" } },
    enterprise: "ПоложительноеЧисло(10, 2)",
    xml: `<TypeDescription>
	<v8:Type>xs:decimal</v8:Type>
	<v8:NumberQualifiers>
		<v8:Digits>10</v8:Digits>
		<v8:FractionDigits>2</v8:FractionDigits>
		<v8:AllowedSign>Nonnegative</v8:AllowedSign>
	</v8:NumberQualifiers>
</TypeDescription>`,
  },
  {
    internal: { type: ["decimal"] },
    enterprise: "Число",
    xml: `<TypeDescription>
	<v8:Type>xs:decimal</v8:Type>
	<v8:NumberQualifiers>
		<v8:Digits>0</v8:Digits>
		<v8:FractionDigits>0</v8:FractionDigits>
		<v8:AllowedSign>Any</v8:AllowedSign>
	</v8:NumberQualifiers>
</TypeDescription>`,
  },
  //#endregion

  //#region Date and Time Types
  {
    internal: { type: ["dateTime"], dateQualifiers: { dateFractions: "Date" } },
    enterprise: "Дата",
    xml: "<TypeDescription>\n\t<v8:Type>xs:dateTime</v8:Type>\n\t<v8:DateQualifiers>\n\t\t<v8:DateFractions>Date</v8:DateFractions>\n\t</v8:DateQualifiers>\n</TypeDescription>",
  },
  {
    internal: { type: ["dateTime"], dateQualifiers: { dateFractions: "Time" } },
    enterprise: "Время",
    xml: "<TypeDescription>\n\t<v8:Type>xs:dateTime</v8:Type>\n\t<v8:DateQualifiers>\n\t\t<v8:DateFractions>Time</v8:DateFractions>\n\t</v8:DateQualifiers>\n</TypeDescription>",
  },
  {
    internal: { type: ["dateTime"], dateQualifiers: { dateFractions: "DateTime" } },
    enterprise: "ДатаВремя",
    xml: "<TypeDescription>\n\t<v8:Type>xs:dateTime</v8:Type>\n\t<v8:DateQualifiers>\n\t\t<v8:DateFractions>DateTime</v8:DateFractions>\n\t</v8:DateQualifiers>\n</TypeDescription>",
  },
  //#endregion

  //#region Boolean
  {
    internal: { type: ["boolean"] },
    enterprise: "Булево",
    xml: "<TypeDescription>\n\t<v8:Type>xs:boolean</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Other Primitive Types
  {
    internal: { type: ["ValueStorage"] },
    enterprise: "ХранилищеЗначения",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueStorage</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Null"] },
    enterprise: "Null",
    xml: "<TypeDescription>\n\t<v8:Type>v8:Null</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["UUID"] },
    enterprise: "УникальныйИдентификатор",
    xml: "<TypeDescription>\n\t<v8:Type>v8:UUID</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["TypeDescription"] },
    enterprise: "ОписаниеТипов",
    xml: "<TypeDescription>\n\t<v8:Type>v8:TypeDescription</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["StandardPeriod"] },
    enterprise: "СтандартныйПериод",
    xml: "<TypeDescription>\n\t<v8:Type>v8:StandardPeriod</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["StandardBeginningDate"] },
    enterprise: "СтандартнаяДатаНачала",
    xml: "<TypeDescription>\n\t<v8:Type>v8:StandardBeginningDate</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["date"] },
    enterprise: "Дата",
    xml: "<TypeDescription>\n\t<v8:Type>xs:date</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ValueTable"] },
    enterprise: "ТаблицаЗначений",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueTable</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ValueTree"] },
    enterprise: "ДеревоЗначений",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueTree</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ValueListType"] },
    enterprise: "СписокЗначений",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueListType</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DynamicList"] },
    enterprise: "ДинамическийСписок",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DynamicList</v8:Type>\n</TypeDescription>",
  },

  //#endregion
  //#endregion

  //#region Composite Types
  {
    internal: {
      type: ["string", "decimal", "dateTime"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
      numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Any" },
      dateQualifiers: { dateFractions: "DateTime" },
    },
    enterprise: ["Строка(10)", "Число(10, 2)", "ДатаВремя"],
    xml: `<TypeDescription>
	<v8:Type>xs:string</v8:Type>
	<v8:Type>xs:decimal</v8:Type>
	<v8:Type>xs:dateTime</v8:Type>
	<v8:NumberQualifiers>
		<v8:Digits>10</v8:Digits>
		<v8:FractionDigits>2</v8:FractionDigits>
		<v8:AllowedSign>Any</v8:AllowedSign>
	</v8:NumberQualifiers>
	<v8:StringQualifiers>
		<v8:Length>10</v8:Length>
		<v8:AllowedLength>Variable</v8:AllowedLength>
	</v8:StringQualifiers>
	<v8:DateQualifiers>
		<v8:DateFractions>DateTime</v8:DateFractions>
	</v8:DateQualifiers>
</TypeDescription>`,
  },
  {
    internal: { type: ["EnumRef.ТипыДокументов", "AnyIBRef"] },
    enterprise: ["Перечисление.ТипыДокументов", "ЛюбаяСсылка"],
    xml: `<TypeDescription>
	<v8:Type>cfg:EnumRef.ТипыДокументов</v8:Type>
	<v8:TypeSet>cfg:AnyIBRef</v8:TypeSet>
</TypeDescription>`,
  },
  //#endregion

  //#region Applied Types
  {
    internal: { type: ["CatalogRef.Контрагенты"] },
    enterprise: "Справочник.Контрагенты",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:CatalogRef.Контрагенты</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentRef.ПоступлениеТоваровНаСклад"] },
    enterprise: "Документ.ПоступлениеТоваровНаСклад",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DocumentRef.ПоступлениеТоваровНаСклад</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["EnumRef.ТипыДокументов"] },
    enterprise: "Перечисление.ТипыДокументов",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:EnumRef.ТипыДокументов</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogObject.ПрофессииРабочих"] },
    enterprise: "СправочникОбъект.ПрофессииРабочих",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:CatalogObject.ПрофессииРабочих</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentObject.КорректировкаИзлишковНедостачПоТоварнымМестам"] },
    enterprise: "ДокументОбъект.КорректировкаИзлишковНедостачПоТоварнымМестам",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DocumentObject.КорректировкаИзлишковНедостачПоТоварнымМестам</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessObject.ОбработкаЗаказов"] },
    enterprise: "БизнесПроцессОбъект.ОбработкаЗаказов",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:BusinessProcessObject.ОбработкаЗаказов</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCharacteristicTypesObject.ДополнительныеРеквизитыИСведения"] },
    enterprise: "ПланВидовХарактеристикОбъект.ДополнительныеРеквизитыИСведения",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ChartOfCharacteristicTypesObject.ДополнительныеРеквизитыИСведения</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ExchangePlanObject.ОбменСФилиалами"] },
    enterprise: "ПланОбменаОбъект.ОбменСФилиалами",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ExchangePlanObject.ОбменСФилиалами</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfAccountObject.Основной"] },
    enterprise: "ПланСчетовОбъект.Основной",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ChartOfAccountObject.Основной</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DefinedType.GTIN"] },
    enterprise: "ОпределяемыйТип.GTIN",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DefinedType.GTIN</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogRef.Сотрудники", "CatalogRef.Контрагенты", "CatalogRef.Пользователи"] },
    enterprise: ["Справочник.Сотрудники", "Справочник.Контрагенты", "Справочник.Пользователи"],
    xml: "<TypeDescription>\n\t<v8:Type>cfg:CatalogRef.Сотрудники</v8:Type>\n\t<v8:Type>cfg:CatalogRef.Контрагенты</v8:Type>\n\t<v8:Type>cfg:CatalogRef.Пользователи</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Characteristic.ДополнительныеРеквизитыИСведения"] },
    enterprise: "Характеристика.ДополнительныеРеквизитыИСведения",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:Characteristic.ДополнительныеРеквизитыИСведения</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["SpreadsheetDocument"] },
    enterprise: "ТабличныйДокумент",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet">mxl:SpreadsheetDocument</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DefinedType"] },
    enterprise: "ОпределяемыйТип",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DefinedType</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["Characteristic"] },
    enterprise: "Характеристика",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:Characteristic</v8:TypeSet>\n</TypeDescription>",
  },

  {
    internal: { type: ["DataProcessorObject"] },
    enterprise: "ОбработкаОбъект",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DataProcessorObject</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DataProcessorObject.КакаяТоОбработка"] },
    enterprise: "ОбработкаОбъект.КакаяТоОбработка",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DataProcessorObject.КакаяТоОбработка</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ConstantsSet"] },
    enterprise: "КонстантыНабор",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ConstantsSet</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ReportObject"] },
    enterprise: "ОтчетОбъект",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ReportObject</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ReportObject.КакойТоОтчет"] },
    enterprise: "ОтчетОбъект.КакойТоОтчет",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ReportObject.КакойТоОтчет</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["InformationRegisterRecordSet"] },
    enterprise: "РегистрСведенийНаборЗаписей",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:InformationRegisterRecordSet</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["InformationRegisterRecordManager"] },
    enterprise: "РегистрСведенийМенеджерЗаписи",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:InformationRegisterRecordManager</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["AccountingRegisterRecordSet"] },
    enterprise: "РегистрБухгалтерииНаборЗаписей",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:AccountingRegisterRecordSet</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Namespace Types
  //#region Data Analysis Namespace
  {
    internal: { type: ["AssociationRulesDataSourceType"] },
    enterprise: "AssociationRulesDataSourceType",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:AssociationRulesDataSourceType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["AnalysisDataType"] },
    enterprise: "ТипИсточникаДанныхПоискаАссоциаций",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:AnalysisDataType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisDistanceMetricType"] },
    enterprise: "ТипМерыРасстоянияАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisDistanceMetricType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeAssociationRules"] },
    enterprise: "ТипКолонкиАнализаДанныхПоискАссоциаций",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeAssociationRules</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisResultTableFillType"] },
    enterprise: "ТипЗаполненияТаблицыРезультатаАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisResultTableFillType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisNumericValueUseType"] },
    enterprise: "ТипИспользованияЧисловыхЗначенийАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisNumericValueUseType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DecisionTreeSimplificationType"] },
    enterprise: "ТипУпрощенияДереваРешений",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DecisionTreeSimplificationType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeDecisionTree"] },
    enterprise: "ТипКолонкиАнализаДанныхДеревоРешений",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeDecisionTree</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisSequentialPatternsOrderType"] },
    enterprise: "ТипУпорядочиванияШаблоновПоследовательностейАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisSequentialPatternsOrderType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisTimeIntervalUnitType"] },
    enterprise: "ТипЕдиницыИнтервалаВремениАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisTimeIntervalUnitType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeSequentialPatterns"] },
    enterprise: "ТипКолонкиАнализаДанныхПоискПоследовательностей",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeSequentialPatterns</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisStandardizationType"] },
    enterprise: "ТипСтандартизацииАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisStandardizationType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["PredictionModelColumnType"] },
    enterprise: "ТипКолонкиМоделиПрогноза",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:PredictionModelColumnType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["ClusterizationMethod"] },
    enterprise: "МетодКластеризации",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:ClusterizationMethod</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisAssociationRulesOrderType"] },
    enterprise: "ТипУпорядочиванияПравилАссоциацииАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisAssociationRulesOrderType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeSummaryStatistics"] },
    enterprise: "ТипКолонкиАнализаДанныхОбщаяСтатистика",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeSummaryStatistics</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["AssociationRulesPruneType"] },
    enterprise: "ТипОтсеченияПравилАссоциации",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:AssociationRulesPruneType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeClusterization"] },
    enterprise: "ТипКолонкиАнализаДанныхКластеризация",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeClusterization</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region UI Namespace
  {
    internal: { type: ["FormattedString"] },
    enterprise: "ФорматированнаяСтрока",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:FormattedString</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["HorizontalAlign"] },
    enterprise: "ГоризонтальноеПоложение",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:HorizontalAlign</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["VerticalAlign"] },
    enterprise: "ВертикальноеПоложение",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:VerticalAlign</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["SizeChangeMode"] },
    enterprise: "РежимИзмененияРазмера",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:SizeChangeMode</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Color"] },
    enterprise: "Цвет",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:Color</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Font"] },
    enterprise: "Шрифт",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:Font</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Picture"] },
    enterprise: "Картинка",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:Picture</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Formatted Document Namespace
  {
    internal: { type: ["FormattedDocument"] },
    enterprise: "ФорматированныйДокумент",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:fd="http://v8.1c.ru/8.2/data/formatted-document">fd:FormattedDocument</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Chart Namespace
  {
    internal: { type: ["Dendrogram"] },
    enterprise: "Дендрограмма",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Dendrogram</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["Chart"] },
    enterprise: "Диаграмма",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["GanttChart"] },
    enterprise: "ДиаграммаГанта",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:GanttChart</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Planner Namespace
  {
    internal: { type: ["Planner"] },
    enterprise: "Планировщик",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:pl="http://v8.1c.ru/8.3/data/planner">pl:Planner</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region PDF Namespace
  {
    internal: { type: ["PDFDocument"] },
    enterprise: "ДокументPDF",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:pdfdoc="http://v8.1c.ru/8.3/data/pdf">pdfdoc:PDFDocument</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Graph Scheme Namespace
  {
    internal: { type: ["FlowchartContextType"] },
    enterprise: "ГрафическаяСхема",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/graphscheme">d5p1:FlowchartContextType</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Text Editor Namespace
  {
    internal: { type: ["TextDocument"] },
    enterprise: "ТекстовыйДокумент",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.1/data/txtedt">d5p1:TextDocument</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Geographic Namespace
  {
    internal: { type: ["GeographicalSchema"] },
    enterprise: "ГеографическаяСхема",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/geo">d5p1:GeographicalSchema</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Enterprise Namespace
  {
    internal: { type: ["AccumulationRecordType"] },
    enterprise: "ВидДвиженияНакопления",
    xml: "<TypeDescription>\n\t<v8:Type>ent:AccumulationRecordType</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["AccountingRecordType"] },
    enterprise: "ВидДвиженияБухгалтерии",
    xml: "<TypeDescription>\n\t<v8:Type>ent:AccountingRecordType</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["AccountType"] },
    enterprise: "ВидСчета",
    xml: "<TypeDescription>\n\t<v8:Type>ent:AccountType</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Settings Composer Namespace
  {
    internal: { type: ["SettingsComposer"] },
    enterprise: "КомпоновщикНастроекКомпоновкиДанных",
    xml: "<TypeDescription>\n\t<v8:Type>dcsset:SettingsComposer</v8:Type>\n</TypeDescription>",
  },
  //#endregion
  //#endregion

  //#region TypeSet Types
  {
    internal: { type: ["ExchangePlanRef"] },
    enterprise: "ПланОбмена",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ExchangePlanRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessRoutePointRef"] },
    enterprise: "ТочкаМаршрутаБизнесПроцесса",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessRoutePointRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessRef"] },
    enterprise: "БизнесПроцесс",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["AnyIBRef"] },
    enterprise: "ЛюбаяСсылка",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:AnyIBRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentRef"] },
    enterprise: "Документ",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DocumentRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["EnumRef"] },
    enterprise: "Перечисление",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:EnumRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCalculationTypesRef"] },
    enterprise: "ПланВидовРасчета",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCalculationTypesRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["TaskRef"] },
    enterprise: "Задача",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:TaskRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCharacteristicTypesRef"] },
    enterprise: "ПланВидовХарактеристик",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCharacteristicTypesRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfAccountsRef"] },
    enterprise: "ПланСчетов",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfAccountsRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogRef"] },
    enterprise: "Справочник",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:CatalogRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogObject"] },
    enterprise: "СправочникОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:CatalogObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentObject"] },
    enterprise: "ДокументОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DocumentObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ExchangePlanObject"] },
    enterprise: "ПланОбменаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ExchangePlanObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessRoutePointObject"] },
    enterprise: "ТочкаМаршрутаБизнесПроцессаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessRoutePointObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessObject"] },
    enterprise: "БизнесПроцессОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCalculationTypesObject"] },
    enterprise: "ПланВидовРасчетаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCalculationTypesObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["TaskObject"] },
    enterprise: "ЗадачаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:TaskObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCharacteristicTypesObject"] },
    enterprise: "ПланВидовХарактеристикОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCharacteristicTypesObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfAccountObject"] },
    enterprise: "ПланСчетовОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfAccountObject</v8:TypeSet>\n</TypeDescription>",
  },
  //#endregion
] as const
