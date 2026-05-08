import { TypeDescription, TypeDescriptionYAML } from "../types"

export interface TypeFixture {
  internal: TypeDescription
  YAML: TypeDescriptionYAML
  xml: string
}

export const typeFixturesTable: TypeFixture[] = [
  //#region Primitive Types
  //#region String Types
  {
    internal: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    YAML: "Строка(10)",
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
    YAML: "Строка",
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
    YAML: "ФиксированнаяСтрока(100)",
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
    YAML: "Число(10, 2)",
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
    YAML: "ПоложительноеЧисло(10, 2)",
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
    YAML: "Число",
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
    YAML: "Дата",
    xml: "<TypeDescription>\n\t<v8:Type>xs:dateTime</v8:Type>\n\t<v8:DateQualifiers>\n\t\t<v8:DateFractions>Date</v8:DateFractions>\n\t</v8:DateQualifiers>\n</TypeDescription>",
  },
  {
    internal: { type: ["dateTime"], dateQualifiers: { dateFractions: "Time" } },
    YAML: "Время",
    xml: "<TypeDescription>\n\t<v8:Type>xs:dateTime</v8:Type>\n\t<v8:DateQualifiers>\n\t\t<v8:DateFractions>Time</v8:DateFractions>\n\t</v8:DateQualifiers>\n</TypeDescription>",
  },
  {
    internal: { type: ["dateTime"], dateQualifiers: { dateFractions: "DateTime" } },
    YAML: "ДатаВремя",
    xml: "<TypeDescription>\n\t<v8:Type>xs:dateTime</v8:Type>\n\t<v8:DateQualifiers>\n\t\t<v8:DateFractions>DateTime</v8:DateFractions>\n\t</v8:DateQualifiers>\n</TypeDescription>",
  },
  //#endregion

  //#region Boolean
  {
    internal: { type: ["boolean"] },
    YAML: "Булево",
    xml: "<TypeDescription>\n\t<v8:Type>xs:boolean</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Other Primitive Types
  {
    internal: { type: ["ValueStorage"] },
    YAML: "ХранилищеЗначения",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueStorage</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Null"] },
    YAML: "Null",
    xml: "<TypeDescription>\n\t<v8:Type>v8:Null</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["UUID"] },
    YAML: "УникальныйИдентификатор",
    xml: "<TypeDescription>\n\t<v8:Type>v8:UUID</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["TypeDescription"] },
    YAML: "ОписаниеТипов",
    xml: "<TypeDescription>\n\t<v8:Type>v8:TypeDescription</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["StandardPeriod"] },
    YAML: "СтандартныйПериод",
    xml: "<TypeDescription>\n\t<v8:Type>v8:StandardPeriod</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["StandardBeginningDate"] },
    YAML: "СтандартнаяДатаНачала",
    xml: "<TypeDescription>\n\t<v8:Type>v8:StandardBeginningDate</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ValueTable"] },
    YAML: "ТаблицаЗначений",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueTable</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ValueTree"] },
    YAML: "ДеревоЗначений",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueTree</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ValueListType"] },
    YAML: "СписокЗначений",
    xml: "<TypeDescription>\n\t<v8:Type>v8:ValueListType</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DynamicList"] },
    YAML: "ДинамическийСписок",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DynamicList</v8:Type>\n</TypeDescription>",
  },
  {
    internal: {
      type: [],
      typeId: ["8c1e3694-da12-44d5-8b1f-d134b89a1282", "6b99868d-5f3a-44e2-bb6d-3ad3b5d3198c"],
    },
    YAML: {
      ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282", "6b99868d-5f3a-44e2-bb6d-3ad3b5d3198c"],
    },
    xml: `<TypeDescription>
	<v8:TypeId>8c1e3694-da12-44d5-8b1f-d134b89a1282</v8:TypeId>
	<v8:TypeId>6b99868d-5f3a-44e2-bb6d-3ad3b5d3198c</v8:TypeId>
</TypeDescription>`,
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
    YAML: ["Строка(10)", "Число(10, 2)", "ДатаВремя"],
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
    YAML: ["Перечисление.ТипыДокументов", "ЛюбаяСсылка"],
    xml: `<TypeDescription>
	<v8:Type>cfg:EnumRef.ТипыДокументов</v8:Type>
	<v8:TypeSet>cfg:AnyIBRef</v8:TypeSet>
</TypeDescription>`,
  },
  //#endregion

  //#region Applied Types
  {
    internal: { type: ["CatalogRef.Контрагенты"] },
    YAML: "Справочник.Контрагенты",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:CatalogRef.Контрагенты</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentRef.ПоступлениеТоваровНаСклад"] },
    YAML: "Документ.ПоступлениеТоваровНаСклад",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DocumentRef.ПоступлениеТоваровНаСклад</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["EnumRef.ТипыДокументов"] },
    YAML: "Перечисление.ТипыДокументов",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:EnumRef.ТипыДокументов</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogObject.ПрофессииРабочих"] },
    YAML: "СправочникОбъект.ПрофессииРабочих",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:CatalogObject.ПрофессииРабочих</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentObject.КорректировкаИзлишковНедостачПоТоварнымМестам"] },
    YAML: "ДокументОбъект.КорректировкаИзлишковНедостачПоТоварнымМестам",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DocumentObject.КорректировкаИзлишковНедостачПоТоварнымМестам</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessObject.ОбработкаЗаказов"] },
    YAML: "БизнесПроцессОбъект.ОбработкаЗаказов",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:BusinessProcessObject.ОбработкаЗаказов</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCharacteristicTypesObject.ДополнительныеРеквизитыИСведения"] },
    YAML: "ПланВидовХарактеристикОбъект.ДополнительныеРеквизитыИСведения",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ChartOfCharacteristicTypesObject.ДополнительныеРеквизитыИСведения</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ExchangePlanObject.ОбменСФилиалами"] },
    YAML: "ПланОбменаОбъект.ОбменСФилиалами",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ExchangePlanObject.ОбменСФилиалами</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfAccountObject.Основной"] },
    YAML: "ПланСчетовОбъект.Основной",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ChartOfAccountObject.Основной</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DefinedType.GTIN"] },
    YAML: "ОпределяемыйТип.GTIN",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DefinedType.GTIN</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogRef.Сотрудники", "CatalogRef.Контрагенты", "CatalogRef.Пользователи"] },
    YAML: ["Справочник.Сотрудники", "Справочник.Контрагенты", "Справочник.Пользователи"],
    xml: "<TypeDescription>\n\t<v8:Type>cfg:CatalogRef.Сотрудники</v8:Type>\n\t<v8:Type>cfg:CatalogRef.Контрагенты</v8:Type>\n\t<v8:Type>cfg:CatalogRef.Пользователи</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Characteristic.ДополнительныеРеквизитыИСведения"] },
    YAML: "Характеристика.ДополнительныеРеквизитыИСведения",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:Characteristic.ДополнительныеРеквизитыИСведения</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["SpreadsheetDocument"] },
    YAML: "ТабличныйДокумент",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet">mxl:SpreadsheetDocument</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DefinedType"] },
    YAML: "ОпределяемыйТип",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DefinedType</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["Characteristic"] },
    YAML: "Характеристика",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:Characteristic</v8:TypeSet>\n</TypeDescription>",
  },

  {
    internal: { type: ["DataProcessorObject"] },
    YAML: "ОбработкаОбъект",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DataProcessorObject</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["DataProcessorObject.КакаяТоОбработка"] },
    YAML: "ОбработкаОбъект.КакаяТоОбработка",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:DataProcessorObject.КакаяТоОбработка</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ConstantsSet"] },
    YAML: "КонстантыНабор",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ConstantsSet</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ReportObject"] },
    YAML: "ОтчетОбъект",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ReportObject</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["ReportObject.КакойТоОтчет"] },
    YAML: "ОтчетОбъект.КакойТоОтчет",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:ReportObject.КакойТоОтчет</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["InformationRegisterRecordSet"] },
    YAML: "РегистрСведенийНаборЗаписей",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:InformationRegisterRecordSet</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["InformationRegisterRecordManager"] },
    YAML: "РегистрСведенийМенеджерЗаписи",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:InformationRegisterRecordManager</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["AccountingRegisterRecordSet"] },
    YAML: "РегистрБухгалтерииНаборЗаписей",
    xml: "<TypeDescription>\n\t<v8:Type>cfg:AccountingRegisterRecordSet</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Namespace Types
  //#region Data Analysis Namespace
  {
    internal: { type: ["AssociationRulesDataSourceType"] },
    YAML: "AssociationRulesDataSourceType",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:AssociationRulesDataSourceType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["AnalysisDataType"] },
    YAML: "ТипИсточникаДанныхПоискаАссоциаций",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:AnalysisDataType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisDistanceMetricType"] },
    YAML: "ТипМерыРасстоянияАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisDistanceMetricType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeAssociationRules"] },
    YAML: "ТипКолонкиАнализаДанныхПоискАссоциаций",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeAssociationRules</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisResultTableFillType"] },
    YAML: "ТипЗаполненияТаблицыРезультатаАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisResultTableFillType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisNumericValueUseType"] },
    YAML: "ТипИспользованияЧисловыхЗначенийАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisNumericValueUseType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DecisionTreeSimplificationType"] },
    YAML: "ТипУпрощенияДереваРешений",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DecisionTreeSimplificationType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeDecisionTree"] },
    YAML: "ТипКолонкиАнализаДанныхДеревоРешений",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeDecisionTree</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisSequentialPatternsOrderType"] },
    YAML: "ТипУпорядочиванияШаблоновПоследовательностейАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisSequentialPatternsOrderType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisTimeIntervalUnitType"] },
    YAML: "ТипЕдиницыИнтервалаВремениАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisTimeIntervalUnitType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeSequentialPatterns"] },
    YAML: "ТипКолонкиАнализаДанныхПоискПоследовательностей",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeSequentialPatterns</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisStandardizationType"] },
    YAML: "ТипСтандартизацииАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisStandardizationType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["PredictionModelColumnType"] },
    YAML: "ТипКолонкиМоделиПрогноза",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:PredictionModelColumnType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["ClusterizationMethod"] },
    YAML: "МетодКластеризации",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:ClusterizationMethod</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisAssociationRulesOrderType"] },
    YAML: "ТипУпорядочиванияПравилАссоциацииАнализаДанных",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisAssociationRulesOrderType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeSummaryStatistics"] },
    YAML: "ТипКолонкиАнализаДанныхОбщаяСтатистика",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeSummaryStatistics</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["AssociationRulesPruneType"] },
    YAML: "ТипОтсеченияПравилАссоциации",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:AssociationRulesPruneType</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["DataAnalysisColumnTypeClusterization"] },
    YAML: "ТипКолонкиАнализаДанныхКластеризация",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/data-analysis">d5p1:DataAnalysisColumnTypeClusterization</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region UI Namespace
  {
    internal: { type: ["FormattedString"] },
    YAML: "ФорматированнаяСтрока",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:FormattedString</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["HorizontalAlign"] },
    YAML: "ГоризонтальноеПоложение",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:HorizontalAlign</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["VerticalAlign"] },
    YAML: "ВертикальноеПоложение",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:VerticalAlign</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["SizeChangeMode"] },
    YAML: "РежимИзмененияРазмера",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:SizeChangeMode</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Color"] },
    YAML: "Цвет",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:Color</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Font"] },
    YAML: "Шрифт",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:Font</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Picture"] },
    YAML: "Картинка",
    xml: "<TypeDescription>\n\t<v8:Type>v8ui:Picture</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Formatted Document Namespace
  {
    internal: { type: ["FormattedDocument"] },
    YAML: "ФорматированныйДокумент",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:fd="http://v8.1c.ru/8.2/data/formatted-document">fd:FormattedDocument</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Chart Namespace
  {
    internal: { type: ["Dendrogram"] },
    YAML: "Дендрограмма",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Dendrogram</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["Chart"] },
    YAML: "Диаграмма",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>\n</TypeDescription>',
  },
  {
    internal: { type: ["GanttChart"] },
    YAML: "ДиаграммаГанта",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:GanttChart</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Planner Namespace
  {
    internal: { type: ["Planner"] },
    YAML: "Планировщик",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:pl="http://v8.1c.ru/8.3/data/planner">pl:Planner</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region PDF Namespace
  {
    internal: { type: ["PDFDocument"] },
    YAML: "ДокументPDF",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:pdfdoc="http://v8.1c.ru/8.3/data/pdf">pdfdoc:PDFDocument</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Graph Scheme Namespace
  {
    internal: { type: ["FlowchartContextType"] },
    YAML: "ГрафическаяСхема",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/graphscheme">d5p1:FlowchartContextType</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Text Editor Namespace
  {
    internal: { type: ["TextDocument"] },
    YAML: "ТекстовыйДокумент",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.1/data/txtedt">d5p1:TextDocument</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region Geographic Namespace
  {
    internal: { type: ["GeographicalSchema"] },
    YAML: "ГеографическаяСхема",
    xml: '<TypeDescription>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/geo">d5p1:GeographicalSchema</v8:Type>\n</TypeDescription>',
  },
  //#endregion

  //#region YAML Namespace
  {
    internal: { type: ["AccumulationRecordType"] },
    YAML: "ВидДвиженияНакопления",
    xml: "<TypeDescription>\n\t<v8:Type>ent:AccumulationRecordType</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["AccountingRecordType"] },
    YAML: "ВидДвиженияБухгалтерии",
    xml: "<TypeDescription>\n\t<v8:Type>ent:AccountingRecordType</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["AccountType"] },
    YAML: "ВидСчета",
    xml: "<TypeDescription>\n\t<v8:Type>ent:AccountType</v8:Type>\n</TypeDescription>",
  },
  //#endregion

  //#region Settings Composer Namespace
  {
    internal: { type: ["SettingsComposer"] },
    YAML: "КомпоновщикНастроекКомпоновкиДанных",
    xml: "<TypeDescription>\n\t<v8:Type>dcsset:SettingsComposer</v8:Type>\n</TypeDescription>",
  },
  {
    internal: { type: ["Filter"] },
    YAML: "Отбор",
    xml: "<TypeDescription>\n\t<v8:Type>dcsset:Filter</v8:Type>\n</TypeDescription>",
  },
  //#endregion
  //#endregion

  //#region TypeSet Types
  {
    internal: { type: ["ExchangePlanRef"] },
    YAML: "ПланОбмена",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ExchangePlanRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessRoutePointRef"] },
    YAML: "ТочкаМаршрутаБизнесПроцесса",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessRoutePointRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessRef"] },
    YAML: "БизнесПроцесс",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["AnyIBRef"] },
    YAML: "ЛюбаяСсылка",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:AnyIBRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentRef"] },
    YAML: "Документ",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DocumentRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["EnumRef"] },
    YAML: "Перечисление",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:EnumRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCalculationTypesRef"] },
    YAML: "ПланВидовРасчета",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCalculationTypesRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["TaskRef"] },
    YAML: "Задача",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:TaskRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCharacteristicTypesRef"] },
    YAML: "ПланВидовХарактеристик",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCharacteristicTypesRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfAccountsRef"] },
    YAML: "ПланСчетов",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfAccountsRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogRef"] },
    YAML: "Справочник",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:CatalogRef</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["CatalogObject"] },
    YAML: "СправочникОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:CatalogObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["DocumentObject"] },
    YAML: "ДокументОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:DocumentObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ExchangePlanObject"] },
    YAML: "ПланОбменаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ExchangePlanObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessRoutePointObject"] },
    YAML: "ТочкаМаршрутаБизнесПроцессаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessRoutePointObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["BusinessProcessObject"] },
    YAML: "БизнесПроцессОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:BusinessProcessObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCalculationTypesObject"] },
    YAML: "ПланВидовРасчетаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCalculationTypesObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["TaskObject"] },
    YAML: "ЗадачаОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:TaskObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfCharacteristicTypesObject"] },
    YAML: "ПланВидовХарактеристикОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfCharacteristicTypesObject</v8:TypeSet>\n</TypeDescription>",
  },
  {
    internal: { type: ["ChartOfAccountObject"] },
    YAML: "ПланСчетовОбъект",
    xml: "<TypeDescription>\n\t<v8:TypeSet>cfg:ChartOfAccountObject</v8:TypeSet>\n</TypeDescription>",
  },
  //#endregion
] as const
