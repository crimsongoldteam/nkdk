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
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportInputFieldToEnterprise = (
  data: InputField | undefined,
  configurationSettings: ConfigurationSettings
): InputFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    РазрешитьВводПустыхМножественныхЗначений: exportBooleanToEnterprise(
      data.allowInputEmptyMultipleValues,
      configurationSettings
    ),
    РазрешитьДублированиеМножественныхЗначений: exportBooleanToEnterprise(
      data.allowMultipleValuesDuplicates,
      configurationSettings
    ),
    АвтоИзменениеРегистраПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.autoCapitalizationOnTextInput,
      SE.AutoCapitalizationOnTextInputToEnterprise,
      configurationSettings
    ),
    АвтоВыборНезаполненного: exportBooleanToEnterprise(data.autoChoiceIncomplete, configurationSettings),
    АвтоИсправлениеПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.autoCorrectionOnTextInput,
      SE.AutoCorrectionOnTextInputToEnterprise,
      configurationSettings
    ),
    ПодсказкаАвтозаполнения: exportSystemEnumerationToEnterprise(
      data.autoFillHint,
      SE.InputFieldAutofillHintToEnterprise,
      configurationSettings
    ),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(data.autoMarkIncomplete, configurationSettings),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    АвтоОтображениеКнопкиОчистки: exportSystemEnumerationToEnterprise(
      data.autoShowClearButton,
      SE.AutoShowClearButtonModeToEnterprise,
      configurationSettings
    ),
    АвтоОтображениеКнопкиОткрытия: exportSystemEnumerationToEnterprise(
      data.autoShowOpenButton,
      SE.AutoShowOpenButtonModeToEnterprise,
      configurationSettings
    ),
    ДоступныеТипы: exportTypeDescriptionToEnterprise(data.availableTypes, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    КнопкаВыбора: exportBooleanToEnterprise(data.choiceButton, configurationSettings),
    КартинкаКнопкиВыбора: exportPictureToEnterprise(data.choiceButtonPicture, configurationSettings),
    ОтображениеКнопкиВыбора: exportSystemEnumerationToEnterprise(
      data.choiceButtonRepresentation,
      SE.ChoiceButtonRepresentationToEnterprise,
      configurationSettings
    ),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsToEnterprise,
      configurationSettings
    ),
    ФормаВыбора: data.choiceForm,
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise,
      configurationSettings
    ),
    СписокВыбора: exportChoiceListToEnterprise(data.choiceList, configurationSettings),
    КнопкаСпискаВыбора: exportBooleanToEnterprise(data.choiceListButton, configurationSettings),
    ВысотаСпискаВыбора: data.choiceListHeight,
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameterLinks, configurationSettings),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameters, configurationSettings),
    ВыбиратьТип: exportBooleanToEnterprise(data.chooseType, configurationSettings),
    КнопкаОчистки: exportBooleanToEnterprise(data.clearButton, configurationSettings),
    КнопкаСоздания: exportBooleanToEnterprise(data.createButton, configurationSettings),
    КнопкаВыпадающегоСписка: exportBooleanToEnterprise(data.dropListButton, configurationSettings),
    ШиринаВыпадающегоСписка: data.dropListWidth,
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat, configurationSettings),
    ТекстРедактирования: data.editText,
    ОбновлениеТекстаРедактирования: exportSystemEnumerationToEnterprise(
      data.editTextUpdate,
      SE.EditTextUpdateToEnterprise,
      configurationSettings
    ),
    РасширенноеРедактирование: exportBooleanToEnterprise(data.extendedEdit, configurationSettings),
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    Высота: data.height,
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      data.heightControlVariant,
      SE.ItemHeightControlVariantToEnterprise,
      configurationSettings
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РежимВыбораНезаполненного: exportSystemEnumerationToEnterprise(
      data.incompleteChoiceMode,
      SE.IncompleteChoiceModeToEnterprise,
      configurationSettings
    ),
    ПодсказкаВвода: exportI8nTextToEnterprise(data.inputHint, configurationSettings),
    РежимВыбораИзСписка: exportBooleanToEnterprise(data.listChoiceMode, configurationSettings),
    ОтметкаНезаполненного: exportBooleanToEnterprise(data.markIncomplete, configurationSettings),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives, configurationSettings),
    Маска: data.mask,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальноеЗначение: data.maxValue,
    МаксимальнаяШирина: data.maxWidth,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine, configurationSettings),
    ПутьКДаннымКартинкиМножественногоЗначения: data.multipleValuePictureDataPath,
    ФигураКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      data.multipleValuePictureShape,
      SE.InputFieldMultipleValuePictureShapeToEnterprise,
      configurationSettings
    ),
    РазмерКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      data.multipleValuePictureSize,
      SE.InputFieldMultipleValuePictureSizeToEnterprise,
      configurationSettings
    ),
    ПутьКДаннымПредставленияМножественногоЗначения: data.multipleValuePresentationDataPath,
    ЦветФонаМножественныхЗначений: exportColorToEnterprise(data.multipleValuesBackColor, configurationSettings),
    РасширенноеРедактированиеМножественныхЗначений: exportBooleanToEnterprise(
      data.multipleValuesExtendedEdit,
      configurationSettings
    ),
    ШрифтМножественныхЗначений: exportFontToEnterprise(data.multipleValuesFont, configurationSettings),
    ГиперссылкаМножественныхЗначений: exportBooleanToEnterprise(data.multipleValuesHyperlink, configurationSettings),
    КартинкаМножественныхЗначений: exportPictureToEnterprise(data.multipleValuesPicture, configurationSettings),
    ЦветТекстаМножественныхЗначений: exportColorToEnterprise(data.multipleValuesTextColor, configurationSettings),
    ПутьКДаннымЗначенияМножественногоЗначения: data.multipleValueValueDataPath,
    ТекстКнопкиВводаЭкраннойКлавиатуры: exportSystemEnumerationToEnterprise(
      data.onScreenKeyboardReturnKeyText,
      SE.OnScreenKeyboardReturnKeyTextToEnterprise,
      configurationSettings
    ),
    КнопкаОткрытия: exportBooleanToEnterprise(data.openButton, configurationSettings),
    РежимПароля: exportBooleanToEnterprise(data.passwordMode, configurationSettings),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice, configurationSettings),
    ВыделенныйТекст: data.selectedText,
    ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений: exportBooleanToEnterprise(
      data.showCheckBoxesInDropListWhenInputMultipleValues,
      configurationSettings
    ),
    СпециальныйРежимВводаТекста: exportSystemEnumerationToEnterprise(
      data.specialTextInputMode,
      SE.SpecialTextInputModeToEnterprise,
      configurationSettings
    ),
    ПроверкаПравописанияПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.spellCheckingOnTextInput,
      SE.SpellCheckingOnTextInputToEnterprise,
      configurationSettings
    ),
    КнопкаРегулирования: exportBooleanToEnterprise(data.spinButton, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    РедактированиеТекста: exportBooleanToEnterprise(data.textEdit, configurationSettings),
    РазрешитьСоставнойТип: exportBooleanToEnterprise(data.typeDomainEnabled, configurationSettings),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.typeLink, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    Ширина: data.width,
    АвтоПереносСтрок: exportBooleanToEnterprise(data.wrap, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerMetadata("ExportToEnterprise", "InputField", exportInputFieldToEnterprise)
