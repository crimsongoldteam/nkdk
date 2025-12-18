import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/lib/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/lib/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { InputField, InputFieldEnterprise } from "~/lib/metadata/forms/elements/inputField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportInputFieldToEnterprise = (
  data: InputField | undefined,
  configurationSettings: ConfigurationSettings
): InputFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоВыборНезаполненного: exportBooleanToEnterprise(data.autoChoiceIncomplete, configurationSettings),
    АвтоИзменениеРегистраПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.autoCapitalizationOnTextInput,
      SE.AutoCapitalizationOnTextInputToEnterprise,
      configurationSettings
    ),
    АвтоИсправлениеПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.autoCorrectionOnTextInput,
      SE.AutoCorrectionOnTextInputToEnterprise,
      configurationSettings
    ),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(data.autoMarkIncomplete, configurationSettings),
    АвтоОтображениеКнопкиОткрытия: exportSystemEnumerationToEnterprise(
      data.autoShowOpenButton,
      SE.AutoShowOpenButtonModeToEnterprise,
      configurationSettings
    ),
    АвтоОтображениеКнопкиОчистки: exportSystemEnumerationToEnterprise(
      data.autoShowClearButton,
      SE.AutoShowClearButtonModeToEnterprise,
      configurationSettings
    ),
    АвтоПереносСтрок: exportBooleanToEnterprise(data.wrap, configurationSettings),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice, configurationSettings),
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      data.heightControlVariant,
      SE.ItemHeightControlVariantToEnterprise,
      configurationSettings
    ),
    ВыбиратьТип: exportBooleanToEnterprise(data.chooseType, configurationSettings),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsToEnterprise,
      configurationSettings
    ),
    ВыделенныйТекст: data.selectedText,
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives, configurationSettings),
    Высота: data.height,
    ВысотаСпискаВыбора: data.choiceListHeight,
    ГиперссылкаМножественныхЗначений: exportBooleanToEnterprise(data.multipleValuesHyperlink, configurationSettings),
    ДоступныеТипы: exportTypeDescriptionToEnterprise(data.availableTypes, configurationSettings),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise,
      configurationSettings
    ),
    КартинкаКнопкиВыбора: exportPictureToEnterprise(data.choiceButtonPicture, configurationSettings),
    КартинкаМножественныхЗначений: exportPictureToEnterprise(data.multipleValuesPicture, configurationSettings),
    КнопкаВыбора: exportBooleanToEnterprise(data.choiceButton, configurationSettings),
    КнопкаВыпадающегоСписка: exportBooleanToEnterprise(data.dropListButton, configurationSettings),
    КнопкаОткрытия: exportBooleanToEnterprise(data.openButton, configurationSettings),
    КнопкаОчистки: exportBooleanToEnterprise(data.clearButton, configurationSettings),
    КнопкаРегулирования: exportBooleanToEnterprise(data.spinButton, configurationSettings),
    КнопкаСоздания: exportBooleanToEnterprise(data.createButton, configurationSettings),
    КнопкаСпискаВыбора: exportBooleanToEnterprise(data.choiceListButton, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    МаксимальноеЗначение: data.maxValue,
    Маска: data.mask,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine, configurationSettings),
    ОбновлениеТекстаРедактирования: exportSystemEnumerationToEnterprise(
      data.editTextUpdate,
      SE.EditTextUpdateToEnterprise,
      configurationSettings
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(data.markIncomplete, configurationSettings),
    ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений: exportBooleanToEnterprise(
      data.showCheckBoxesInDropListWhenInputMultipleValues,
      configurationSettings
    ),
    ОтображениеКнопкиВыбора: exportSystemEnumerationToEnterprise(
      data.choiceButtonRepresentation,
      SE.ChoiceButtonRepresentationToEnterprise,
      configurationSettings
    ),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameters, configurationSettings),
    ПодсказкаАвтозаполнения: exportSystemEnumerationToEnterprise(
      data.autoFillHint,
      SE.InputFieldAutofillHintToEnterprise,
      configurationSettings
    ),
    ПодсказкаВвода: exportI8nTextToEnterprise(data.inputHint, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ПроверкаПравописанияПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.spellCheckingOnTextInput,
      SE.SpellCheckingOnTextInputToEnterprise,
      configurationSettings
    ),
    ПутьКДаннымЗначенияМножественногоЗначения: data.multipleValueValueDataPath,
    ПутьКДаннымКартинкиМножественногоЗначения: data.multipleValuePictureDataPath,
    ПутьКДаннымПредставленияМножественногоЗначения: data.multipleValuePresentationDataPath,
    РазмерКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      data.multipleValuePictureSize,
      SE.InputFieldMultipleValuePictureSizeToEnterprise,
      configurationSettings
    ),
    РазрешитьВводПустыхМножественныхЗначений: exportBooleanToEnterprise(
      data.allowInputEmptyMultipleValues,
      configurationSettings
    ),
    РазрешитьДублированиеМножественныхЗначений: exportBooleanToEnterprise(
      data.allowMultipleValuesDuplicates,
      configurationSettings
    ),
    РазрешитьСоставнойТип: exportBooleanToEnterprise(data.typeDomainEnabled, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РасширенноеРедактирование: exportBooleanToEnterprise(data.extendedEdit, configurationSettings),
    РасширенноеРедактированиеМножественныхЗначений: exportBooleanToEnterprise(
      data.multipleValuesExtendedEdit,
      configurationSettings
    ),
    РедактированиеТекста: exportBooleanToEnterprise(data.textEdit, configurationSettings),
    РежимВыбораИзСписка: exportBooleanToEnterprise(data.listChoiceMode, configurationSettings),
    РежимВыбораНезаполненного: exportSystemEnumerationToEnterprise(
      data.incompleteChoiceMode,
      SE.IncompleteChoiceModeToEnterprise,
      configurationSettings
    ),
    РежимПароля: exportBooleanToEnterprise(data.passwordMode, configurationSettings),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameterLinks, configurationSettings),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.typeLink, configurationSettings),
    СпециальныйРежимВводаТекста: exportSystemEnumerationToEnterprise(
      data.specialTextInputMode,
      SE.SpecialTextInputModeToEnterprise,
      configurationSettings
    ),
    СписокВыбора: exportChoiceListToEnterprise(data.choiceList, configurationSettings),
    ТекстКнопкиВводаЭкраннойКлавиатуры: exportSystemEnumerationToEnterprise(
      data.onScreenKeyboardReturnKeyText,
      SE.OnScreenKeyboardReturnKeyTextToEnterprise,
      configurationSettings
    ),
    ТекстРедактирования: data.editText,
    ФигураКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      data.multipleValuePictureShape,
      SE.InputFieldMultipleValuePictureShapeToEnterprise,
      configurationSettings
    ),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    ЦветТекстаМножественныхЗначений: exportColorToEnterprise(data.multipleValuesTextColor, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ЦветФонаМножественныхЗначений: exportColorToEnterprise(data.multipleValuesBackColor, configurationSettings),
    Ширина: data.width,
    ШиринаВыпадающегоСписка: data.dropListWidth,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    ШрифтМножественныхЗначений: exportFontToEnterprise(data.multipleValuesFont, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "InputField", exportInputFieldToEnterprise)
