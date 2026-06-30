import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const InputFieldRules = {
  itemType: "InputField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.InputField",
  properties: {
    allowInputEmptyMultipleValues: booleanRule({
      yaml: "РазрешитьВводПустыхМножественныхЗначений",
      noImplicitValueYAML: true,
    }),
    allowMultipleValuesDuplicates: booleanRule({
      yaml: "РазрешитьДублированиеМножественныхЗначений",
      noImplicitValueYAML: true,
    }),
    autoCapitalizationOnTextInput: systemEnumerationRule({
      yaml: "АвтоИзменениеРегистраПриВводеТекста",
      typeSE: "AutoCapitalizationOnTextInput",
      implicitValueYAML: "Auto",
    }),
    autoChoiceIncomplete: booleanRule({ yaml: "АвтоВыборНезаполненного", noImplicitValueYAML: true }),
    autoCorrectionOnTextInput: systemEnumerationRule({
      yaml: "АвтоИсправлениеПриВводеТекста",
      typeSE: "AutoCorrectionOnTextInput",
      implicitValueYAML: "Auto",
    }),
    autoFillHint: systemEnumerationRule({
      yaml: "ПодсказкаАвтозаполнения",
      typeSE: "InputFieldAutofillHint",
      xml: "AutofillHint",
      implicitValueYAML: "DontUse",
    }),
    autoMarkIncomplete: booleanRule({
      yaml: "АвтоОтметкаНезаполненного",
      noImplicitValueYAML: true,
    }),
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    autoShowClearButton: systemEnumerationRule({
      yaml: "АвтоОтображениеКнопкиОчистки",
      typeSE: "AutoShowClearButtonMode",
      xml: "AutoShowClearButtonMode",
      implicitValueYAML: "Auto",
    }),
    autoShowOpenButton: systemEnumerationRule({
      yaml: "АвтоОтображениеКнопкиОткрытия",
      typeSE: "AutoShowOpenButtonMode",
      xml: "AutoShowOpenButtonMode",
      implicitValueYAML: "Auto",
    }),
    availableTypes: {
      yaml: "ДоступныеТипы",
      type: "TypeDescription",
      toEnterprise: false,
    },
    backColor: {
      yaml: "ЦветФона",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    borderColor: {
      yaml: "ЦветРамки",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    choiceButton: booleanRule({ yaml: "КнопкаВыбора", noImplicitValueYAML: true }),
    choiceButtonPicture: {
      yaml: "КартинкаКнопкиВыбора",
      type: "Picture",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
    },
    choiceButtonRepresentation: systemEnumerationRule({
      yaml: "ОтображениеКнопкиВыбора",
      typeSE: "ChoiceButtonRepresentation",
      implicitValueYAML: "Auto",
    }),
    choiceFoldersAndItems: systemEnumerationRule({
      yaml: "ВыборГруппИЭлементов",
      typeSE: "FoldersAndItems",
      implicitValueYAML: "Auto",
    }),
    choiceForm: stringRule({
      yaml: "ФормаВыбора",
      toEnterprise: false,
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      implicitValueYAML: "Auto",
    }),
    choiceList: { yaml: "СписокВыбора", type: "ChoiceList", toEnterprise: false },
    choiceListButton: booleanRule({ yaml: "КнопкаСпискаВыбора", noImplicitValueYAML: true }),
    choiceListHeight: numberRule({ yaml: "ВысотаСпискаВыбора", implicitValueYAML: 0 }),
    choiceParameterLinks: { yaml: "СвязиПараметровВыбора", type: "ChoiceParameterLinks", toEnterprise: false },
    choiceParameters: { yaml: "ПараметрыВыбора", type: "ChoiceParameters", toEnterprise: false },
    chooseType: booleanRule({ yaml: "ВыбиратьТип", implicitValueYAML: true }),
    clearButton: booleanRule({ yaml: "КнопкаОчистки", noImplicitValueYAML: true }),
    createButton: booleanRule({ yaml: "КнопкаСоздания", noImplicitValueYAML: true }),
    dropListButton: booleanRule({ yaml: "КнопкаВыпадающегоСписка", noImplicitValueYAML: true }),
    dropListWidth: numberRule({ yaml: "ШиринаВыпадающегоСписка", implicitValueYAML: 0 }),
    editFormat: i8nTextRule({ yaml: "ФорматРедактирования" }),
    // editText: { yaml: "ТекстРедактирования", type: "string" },
    editTextUpdate: systemEnumerationRule({
      yaml: "ОбновлениеТекстаРедактирования",
      typeSE: "EditTextUpdate",
      implicitValueYAML: "Auto",
    }),
    extendedEdit: booleanRule({
      yaml: "РасширенноеРедактирование",
      noImplicitValueYAML: true,
    }),
    font: {
      yaml: "Шрифт",
      type: "Font",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    },
    format: i8nTextRule({ yaml: "Формат" }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 0 }),
    heightControlVariant: systemEnumerationRule({
      yaml: "ВариантУправленияВысотой",
      typeSE: "ItemHeightControlVariant",
      implicitValueYAML: "Auto",
    }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", noImplicitValueYAML: true }),
    incompleteChoiceMode: systemEnumerationRule({
      yaml: "РежимВыбораНезаполненного",
      typeSE: "IncompleteChoiceMode",
      implicitValueYAML: "OnEnterPressed",
    }),
    inputHint: i8nTextRule({ yaml: "ПодсказкаВвода" }),
    listChoiceMode: booleanRule({ yaml: "РежимВыбораИзСписка", implicitValueYAML: false }),
    typeDomainEnabled: booleanRule({
      yaml: "РазрешитьСоставнойТип",
      implicitValueYAML: true,
    }),
    // markIncomplete: { yaml: "ОтметкаНезаполненного", type: "boolean" },
    markNegatives: booleanRule({ yaml: "ВыделятьОтрицательные", noImplicitValueYAML: true }),
    mask: stringRule({ yaml: "Маска" }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxValue: { yaml: "МаксимальноеЗначение", type: "MinMaxValue", xml: "MaxValue" },
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    minValue: { yaml: "МинимальноеЗначение", type: "MinMaxValue", xml: "MinValue" },
    multiLine: booleanRule({ yaml: "МногострочныйРежим", noImplicitValueYAML: true }),
    multipleValuePictureDataPath: {
      yaml: "ПутьКДаннымКартинкиМножественногоЗначения",
      type: "DataPath",
      defaultType: "string",
      xml: "MultipleValuePictureDataPath",
    },
    multipleValuePictureShape: systemEnumerationRule({
      yaml: "ФигураКартинкиМножественногоЗначения",
      typeSE: "InputFieldMultipleValuePictureShape",
      implicitValueYAML: "Auto",
    }),
    multipleValuePictureSize: systemEnumerationRule({
      yaml: "РазмерКартинкиМножественногоЗначения",
      typeSE: "InputFieldMultipleValuePictureSize",
      implicitValueYAML: "Auto",
    }),
    multipleValuePresentationDataPath: {
      yaml: "ПутьКДаннымПредставленияМножественногоЗначения",
      type: "DataPath",
      defaultType: "string",
      xml: "MultipleValuePresentDataPath",
    },
    multipleValuesBackColor: {
      yaml: "ЦветФонаМножественныхЗначений",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    multipleValuesExtendedEdit: booleanRule({
      yaml: "РасширенноеРедактированиеМножественныхЗначений",
      xml: "ExtendedEditMultipleValues",
      noImplicitValueYAML: true,
    }),
    multipleValuesFont: {
      yaml: "ШрифтМножественныхЗначений",
      type: "Font",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    },
    multipleValuesHyperlink: booleanRule({ yaml: "ГиперссылкаМножественныхЗначений", noImplicitValueYAML: true }),
    multipleValuesPicture: {
      yaml: "КартинкаМножественныхЗначений",
      type: "Picture",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
    },
    multipleValuesTextColor: {
      yaml: "ЦветТекстаМножественныхЗначений",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    multipleValueValueDataPath: {
      yaml: "ПутьКДаннымЗначенияМножественногоЗначения",
      type: "DataPath",
      defaultType: "string",
      xml: "MultipleValueDataPath",
    },
    onScreenKeyboardReturnKeyText: systemEnumerationRule({
      yaml: "ТекстКнопкиВводаЭкраннойКлавиатуры",
      typeSE: "OnScreenKeyboardReturnKeyText",
      implicitValueYAML: "Auto",
    }),
    openButton: booleanRule({ yaml: "КнопкаОткрытия", noImplicitValueYAML: true }),
    passwordMode: booleanRule({ yaml: "РежимПароля", noImplicitValueYAML: true }),
    quickChoice: booleanRule({ yaml: "БыстрыйВыбор", noImplicitValueYAML: true }),
    showCheckBoxesInDropListWhenInputMultipleValues: booleanRule({
      yaml: "ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений",
      xml: "ShowCheckBoxesInDropList",
      noImplicitValueYAML: true,
    }),
    specialTextInputMode: systemEnumerationRule({
      yaml: "СпециальныйРежимВводаТекста",
      typeSE: "SpecialTextInputMode",
      implicitValueYAML: "Auto",
    }),
    spellCheckingOnTextInput: systemEnumerationRule({
      yaml: "ПроверкаПравописанияПриВводеТекста",
      typeSE: "SpellCheckingOnTextInput",
      implicitValueYAML: "Auto",
    }),
    spinButton: booleanRule({ yaml: "КнопкаРегулирования", noImplicitValueYAML: true }),
    textColor: {
      yaml: "ЦветТекста",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    textEdit: booleanRule({ yaml: "РедактированиеТекста", implicitValueYAML: true }),
    typeLink: { yaml: "СвязьПоТипу", type: "TypeLink", toEnterprise: false },
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", noImplicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 0 }),
    wrap: booleanRule({ yaml: "АвтоПереносСтрок", implicitValueYAML: true }),
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        autoComplete: "АвтоПодбор",
        multipleValuesAdd: "ДобавлениеМножественныхЗначений",
        editTextChange: "ИзменениеТекстаРедактирования",
        startChoice: "НачалоВыбора",
        startListChoice: "НачалоВыбораИзСписка",
        choiceProcessing: "ОбработкаВыбора",
        multipleValueURLProcessing: "ОбработкаНавигационнойСсылкиМножественногоЗначения",
        commandGenerateProcessing: "ОбработкаФормированияКоманд",
        textEditEnd: "ОкончаниеВводаТекста",
        opening: "Открытие",
        multipleValueOpening: "ОткрытиеМножественногоЗначения",
        clearing: "Очистка",
        tuning: "Регулирование",
        creating: "Создание",
        multipleValuesDelete: "УдалениеМножественныхЗначений",
      },
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      // fromYAML: false,
      defaultType: "string",
      allowOpaqueMultipleValue: true,
    },
    ...formFieldCommonProperties,
    skipOnInput: booleanRule({ yaml: "ПропускатьПриВводе", noImplicitValueYAML: true }),
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
  },
} as const satisfies ElementRule
export const TableInputFieldRules = {
  itemType: "TableInputField",
  xmlTag: "InputField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.InputField",
  properties: {
    ...InputFieldRules.properties,
    ...formFieldTableRelatedProperties,
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      defaultType: "string",
    },
    minValue: { yaml: "МинимальноеЗначение", type: "MinMaxValue", xml: "MinValue" },
    maxValue: { yaml: "МаксимальноеЗначение", type: "MinMaxValue", xml: "MaxValue" },
  },
} as const satisfies ElementRule
registerElementRule("InputField", InputFieldRules)
registerElementRule("TableInputField", TableInputFieldRules)
