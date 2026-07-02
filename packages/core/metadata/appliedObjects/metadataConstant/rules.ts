import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { minMaxValueRule } from "~/metadata/commonObjects/minMaxValue/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { typeLinkRule } from "~/metadata/commonObjects/typeLink/types"
import { choiceParameterLinksRule } from "~/metadata/commonObjects/\u0441hoiceParameterLinks/types"
import { choiceParametersRule } from "~/metadata/commonObjects/\u0441hoiceParameters/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const constantProperties = ["Properties"]
export const MetadataConstantRules = {
  itemType: "MetadataConstant",
  metadataTargetOwner: { kind: "self", root: "Constant" },
  itemTypePrefix: "Константа",
  xmlDir: "Constants",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Constant",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "ConstantManager", category: "Manager" },
        { name: "ConstantValueManager", category: "ValueManager" },
        { name: "ConstantValueKey", category: "ValueKey" },
      ],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: constantProperties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xmlParents: constantProperties,
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: constantProperties,
    }),
    defaultForm: stringRule({
      yaml: "ОсновнаяФорма",
      xmlParents: constantProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    extendedPresentation: i8nTextRule({
      yaml: "РасширенноеПредставление",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    passwordMode: booleanRule({
      yaml: "РежимПароля",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: constantProperties,
    }),
    format: i8nTextRule({
      yaml: "Формат",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    editFormat: i8nTextRule({
      yaml: "ФорматРедактирования",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    markNegatives: booleanRule({
      yaml: "ВыделятьОтрицательные",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: constantProperties,
    }),
    mask: stringRule({
      yaml: "Маска",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    multiLine: booleanRule({
      yaml: "МногострочныйРежим",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: constantProperties,
    }),
    extendedEdit: booleanRule({
      yaml: "РасширенноеРедактирование",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: constantProperties,
    }),
    minValue: minMaxValueRule({
      yaml: "МинимальноеЗначение",
      typedXML: "xs:string",
      xmlParents: constantProperties,
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    maxValue: minMaxValueRule({
      yaml: "МаксимальноеЗначение",
      typedXML: "xs:string",
      xmlParents: constantProperties,
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    fillChecking: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      typeSE: "FillChecking",
      defaultValueXML: "DontCheck",
      implicitValueYAML: "DontCheck",
      xmlParents: constantProperties,
    }),
    choiceFoldersAndItems: systemEnumerationRule({
      yaml: "ВыборГруппИЭлементов",
      typeSE: "FoldersAndItemsUse",
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
      xmlParents: constantProperties,
    }),
    choiceParameterLinks: choiceParameterLinksRule({
      yaml: "СвязиПараметровВыбора",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    choiceParameters: choiceParametersRule({
      yaml: "ПараметрыВыбора",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    quickChoice: systemEnumerationRule({
      yaml: "БыстрыйВыбор",
      typeSE: "UseQuickChoice",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: constantProperties,
    }),
    choiceForm: stringRule({
      yaml: "ФормаВыбора",
      xmlParents: constantProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    linkByType: typeLinkRule({
      yaml: "СвязьПоТипу",
      xmlParents: constantProperties,
      defaultValueXMLRaw: "",
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: constantProperties,
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: constantProperties,
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      typeSE: "DataHistoryUse",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: constantProperties,
    }),
    updateDataHistoryImmediatelyAfterWrite: booleanRule({
      yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: constantProperties,
    }),
    executeAfterWriteDataHistoryVersionProcessing: booleanRule({
      yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: constantProperties,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: constantProperties,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
    managerModule: moduleRule({
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
    }),
    valueManagerModule: moduleRule({
      nkdkPath: "МодульМенеджераЗначения.bsl",
      xmlPath: "Ext/ValueManagerModule.bsl",
    }),
  },
} as const satisfies MetadataItemRule
