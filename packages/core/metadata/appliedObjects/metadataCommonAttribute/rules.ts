import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { metadataValueRule } from "~/metadata/commonObjects/metadataValue/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
export const MetadataCommonAttributeRules = {
  itemType: "MetadataCommonAttribute",
  metadataTargetOwner: { kind: "self", root: "CommonAttribute" },
  itemTypePrefix: "ОбщийРеквизит",
  xmlDir: "CommonAttributes",
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonAttribute",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: properties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xmlParents: properties,
    },
    passwordMode: booleanRule({
      yaml: "РежимПароля",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    format: i8nTextRule({
      yaml: "Формат",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    editFormat: i8nTextRule({
      yaml: "ФорматРедактирования",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    markNegatives: booleanRule({
      yaml: "ВыделятьОтрицательные",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    mask: stringRule({
      yaml: "Маска",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    multiLine: booleanRule({
      yaml: "МногострочныйРежим",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    extendedEdit: booleanRule({
      yaml: "РасширенноеРедактирование",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    minValue: {
      yaml: "МинимальноеЗначение",
      type: "MinMaxValue",
      typedXML: "xs:string",
      xmlParents: properties,
      defaultValueXMLRaw: { "_xsi:nil": true },
    },
    maxValue: {
      yaml: "МаксимальноеЗначение",
      type: "MinMaxValue",
      typedXML: "xs:string",
      xmlParents: properties,
      defaultValueXMLRaw: { "_xsi:nil": true },
    },
    fillFromFillingValue: booleanRule({
      yaml: "ЗаполнятьИзДанныхЗаполнения",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    fillValue: metadataValueRule({
      yaml: "ЗначениеЗаполнения",
      xml: "FillValue",
      xmlParents: properties,
      defaultValueXMLRaw: { "_xsi:type": "xs:string" },
    }),
    fillChecking: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      typeSE: "FillChecking",
      defaultValueXML: "DontCheck",
      implicitValueYAML: "DontCheck",
      xmlParents: properties,
    }),
    choiceFoldersAndItems: systemEnumerationRule({
      yaml: "ВыборГруппИЭлементов",
      typeSE: "FoldersAndItemsUse",
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
      xmlParents: properties,
    }),
    choiceParameterLinks: {
      yaml: "СвязиПараметровВыбора",
      type: "ChoiceParameterLinks",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    choiceParameters: {
      yaml: "ПараметрыВыбора",
      type: "ChoiceParameters",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    quickChoice: systemEnumerationRule({
      yaml: "БыстрыйВыбор",
      typeSE: "UseQuickChoice",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: properties,
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      typeSE: "CreateOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: properties,
    }),
    choiceForm: stringRule({
      yaml: "ФормаВыбора",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    linkByType: {
      yaml: "СвязьПоТипу",
      type: "TypeLink",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: properties,
    }),
    content: {
      yaml: "Состав",
      type: "CommonAttributeContent",
      xml: "Content",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    autoUse: systemEnumerationRule({
      yaml: "АвтоИспользование",
      typeSE: "CommonAttributeAutoUse",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    dataSeparation: systemEnumerationRule({
      yaml: "РазделениеДанных",
      typeSE: "CommonAttributeDataSeparation",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    separatedDataUse: systemEnumerationRule({
      yaml: "ИспользованиеРазделенныхДанных",
      typeSE: "CommonAttributeSeparatedDataUse",
      defaultValueXML: "Independently",
      implicitValueYAML: "Independently",
      xmlParents: properties,
    }),
    dataSeparationValue: stringRule({
      yaml: "ЗначениеРазделенияДанных",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    dataSeparationUse: stringRule({
      yaml: "ИспользованиеРазделенияДанных",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    conditionalSeparation: stringRule({
      yaml: "УсловноеРазделение",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    usersSeparation: systemEnumerationRule({
      yaml: "РазделениеПользователей",
      typeSE: "CommonAttributeUsersSeparation",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    authenticationSeparation: systemEnumerationRule({
      yaml: "РазделениеАутентификации",
      typeSE: "CommonAttributeAuthenticationSeparation",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    configurationExtensionsSeparation: systemEnumerationRule({
      yaml: "РазделениеРасширенийКонфигурации",
      typeSE: "CommonAttributeConfigurationExtensionsSeparation",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    indexing: systemEnumerationRule({
      yaml: "Индексирование",
      typeSE: "Indexing",
      defaultValueXML: "DontIndex",
      implicitValueYAML: "DontIndex",
      xmlParents: properties,
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      xmlParents: properties,
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      typeSE: "DataHistoryUse",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      xmlParents: properties,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
