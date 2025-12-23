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
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { InputField, InputFieldEnterprise } from "~/lib/metadata/forms/elements/inputField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportInputFieldToEnterprise = (
  configurationSettings: Context,
  data: InputField | undefined
): InputFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоВыборНезаполненного: exportBooleanToEnterprise(configurationSettings, data.autoChoiceIncomplete),
    АвтоИзменениеРегистраПриВводеТекста: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.autoCapitalizationOnTextInput,
      SE.AutoCapitalizationOnTextInputToEnterprise
    ),
    АвтоИсправлениеПриВводеТекста: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.autoCorrectionOnTextInput,
      SE.AutoCorrectionOnTextInputToEnterprise
    ),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(configurationSettings, data.autoMarkIncomplete),
    АвтоОтображениеКнопкиОткрытия: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.autoShowOpenButton,
      SE.AutoShowOpenButtonModeToEnterprise
    ),
    АвтоОтображениеКнопкиОчистки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.autoShowClearButton,
      SE.AutoShowClearButtonModeToEnterprise
    ),
    АвтоПереносСтрок: exportBooleanToEnterprise(configurationSettings, data.wrap),
    БыстрыйВыбор: exportBooleanToEnterprise(configurationSettings, data.quickChoice),
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.heightControlVariant,
      SE.ItemHeightControlVariantToEnterprise
    ),
    ВыбиратьТип: exportBooleanToEnterprise(configurationSettings, data.chooseType),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsToEnterprise
    ),
    ВыделенныйТекст: data.selectedText,
    ВыделятьОтрицательные: exportBooleanToEnterprise(configurationSettings, data.markNegatives),
    Высота: data.height,
    ВысотаСпискаВыбора: data.choiceListHeight,
    ГиперссылкаМножественныхЗначений: exportBooleanToEnterprise(configurationSettings, data.multipleValuesHyperlink),
    ДоступныеТипы: exportTypeDescriptionToEnterprise(configurationSettings, data.availableTypes),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    КартинкаКнопкиВыбора: exportPictureToEnterprise(configurationSettings, data.choiceButtonPicture),
    КартинкаМножественныхЗначений: exportPictureToEnterprise(configurationSettings, data.multipleValuesPicture),
    КнопкаВыбора: exportBooleanToEnterprise(configurationSettings, data.choiceButton),
    КнопкаВыпадающегоСписка: exportBooleanToEnterprise(configurationSettings, data.dropListButton),
    КнопкаОткрытия: exportBooleanToEnterprise(configurationSettings, data.openButton),
    КнопкаОчистки: exportBooleanToEnterprise(configurationSettings, data.clearButton),
    КнопкаРегулирования: exportBooleanToEnterprise(configurationSettings, data.spinButton),
    КнопкаСоздания: exportBooleanToEnterprise(configurationSettings, data.createButton),
    КнопкаСпискаВыбора: exportBooleanToEnterprise(configurationSettings, data.choiceListButton),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    МаксимальноеЗначение: data.maxValue,
    Маска: data.mask,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(configurationSettings, data.multiLine),
    ОбновлениеТекстаРедактирования: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.editTextUpdate,
      SE.EditTextUpdateToEnterprise
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(configurationSettings, data.markIncomplete),
    ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений: exportBooleanToEnterprise(
      configurationSettings,
      data.showCheckBoxesInDropListWhenInputMultipleValues
    ),
    ОтображениеКнопкиВыбора: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceButtonRepresentation,
      SE.ChoiceButtonRepresentationToEnterprise
    ),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(configurationSettings, data.choiceParameters),
    ПодсказкаАвтозаполнения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.autoFillHint,
      SE.InputFieldAutofillHintToEnterprise
    ),
    ПодсказкаВвода: exportI8nTextToEnterprise(configurationSettings, data.inputHint),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ПроверкаПравописанияПриВводеТекста: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.spellCheckingOnTextInput,
      SE.SpellCheckingOnTextInputToEnterprise
    ),
    ПутьКДаннымЗначенияМножественногоЗначения: data.multipleValueValueDataPath,
    ПутьКДаннымКартинкиМножественногоЗначения: data.multipleValuePictureDataPath,
    ПутьКДаннымПредставленияМножественногоЗначения: data.multipleValuePresentationDataPath,
    РазмерКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.multipleValuePictureSize,
      SE.InputFieldMultipleValuePictureSizeToEnterprise
    ),
    РазрешитьВводПустыхМножественныхЗначений: exportBooleanToEnterprise(
      configurationSettings,
      data.allowInputEmptyMultipleValues
    ),
    РазрешитьДублированиеМножественныхЗначений: exportBooleanToEnterprise(
      configurationSettings,
      data.allowMultipleValuesDuplicates
    ),
    РазрешитьСоставнойТип: exportBooleanToEnterprise(configurationSettings, data.typeDomainEnabled),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    РасширенноеРедактирование: exportBooleanToEnterprise(configurationSettings, data.extendedEdit),
    РасширенноеРедактированиеМножественныхЗначений: exportBooleanToEnterprise(
      configurationSettings,
      data.multipleValuesExtendedEdit
    ),
    РедактированиеТекста: exportBooleanToEnterprise(configurationSettings, data.textEdit),
    РежимВыбораИзСписка: exportBooleanToEnterprise(configurationSettings, data.listChoiceMode),
    РежимВыбораНезаполненного: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.incompleteChoiceMode,
      SE.IncompleteChoiceModeToEnterprise
    ),
    РежимПароля: exportBooleanToEnterprise(configurationSettings, data.passwordMode),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(configurationSettings, data.choiceParameterLinks),
    СвязьПоТипу: exportTypeLinkToEnterprise(configurationSettings, data.typeLink),
    СпециальныйРежимВводаТекста: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.specialTextInputMode,
      SE.SpecialTextInputModeToEnterprise
    ),
    СписокВыбора: exportChoiceListToEnterprise(configurationSettings, data.choiceList),
    ТекстКнопкиВводаЭкраннойКлавиатуры: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.onScreenKeyboardReturnKeyText,
      SE.OnScreenKeyboardReturnKeyTextToEnterprise
    ),
    ТекстРедактирования: data.editText,
    ФигураКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.multipleValuePictureShape,
      SE.InputFieldMultipleValuePictureShapeToEnterprise
    ),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(configurationSettings, data.format),
    ФорматРедактирования: exportI8nTextToEnterprise(configurationSettings, data.editFormat),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветТекстаМножественныхЗначений: exportColorToEnterprise(configurationSettings, data.multipleValuesTextColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    ЦветФонаМножественныхЗначений: exportColorToEnterprise(configurationSettings, data.multipleValuesBackColor),
    Ширина: data.width,
    ШиринаВыпадающегоСписка: data.dropListWidth,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    ШрифтМножественныхЗначений: exportFontToEnterprise(configurationSettings, data.multipleValuesFont),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "InputField", exportInputFieldToEnterprise)
