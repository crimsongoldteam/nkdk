import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/pictures/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { InputField, InputFieldEnterprise } from "~/metadata/forms/elements/inputField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportInputFieldToEnterprise = (
  context: Context,
  data: InputField | undefined
): InputFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоВыборНезаполненного: exportBooleanToEnterprise(context, data.autoChoiceIncomplete),
    АвтоИзменениеРегистраПриВводеТекста: exportSystemEnumerationToEnterprise(
      context,
      data.autoCapitalizationOnTextInput,
      SE.AutoCapitalizationOnTextInputToEnterprise
    ),
    АвтоИсправлениеПриВводеТекста: exportSystemEnumerationToEnterprise(
      context,
      data.autoCorrectionOnTextInput,
      SE.AutoCorrectionOnTextInputToEnterprise
    ),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(context, data.autoMarkIncomplete),
    АвтоОтображениеКнопкиОткрытия: exportSystemEnumerationToEnterprise(
      context,
      data.autoShowOpenButton,
      SE.AutoShowOpenButtonModeToEnterprise
    ),
    АвтоОтображениеКнопкиОчистки: exportSystemEnumerationToEnterprise(
      context,
      data.autoShowClearButton,
      SE.AutoShowClearButtonModeToEnterprise
    ),
    АвтоПереносСтрок: exportBooleanToEnterprise(context, data.wrap),
    БыстрыйВыбор: exportBooleanToEnterprise(context, data.quickChoice),
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      context,
      data.heightControlVariant,
      SE.ItemHeightControlVariantToEnterprise
    ),
    ВыбиратьТип: exportBooleanToEnterprise(context, data.chooseType),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      context,
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsToEnterprise
    ),
    ВыделенныйТекст: data.selectedText,
    ВыделятьОтрицательные: exportBooleanToEnterprise(context, data.markNegatives),
    Высота: data.height,
    ВысотаСпискаВыбора: data.choiceListHeight,
    ГиперссылкаМножественныхЗначений: exportBooleanToEnterprise(context, data.multipleValuesHyperlink),
    ДоступныеТипы: exportTypeDescriptionToEnterprise(context, data.availableTypes),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      context,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    КартинкаКнопкиВыбора: exportPictureToEnterprise(context, data.choiceButtonPicture),
    КартинкаМножественныхЗначений: exportPictureToEnterprise(context, data.multipleValuesPicture),
    КнопкаВыбора: exportBooleanToEnterprise(context, data.choiceButton),
    КнопкаВыпадающегоСписка: exportBooleanToEnterprise(context, data.dropListButton),
    КнопкаОткрытия: exportBooleanToEnterprise(context, data.openButton),
    КнопкаОчистки: exportBooleanToEnterprise(context, data.clearButton),
    КнопкаРегулирования: exportBooleanToEnterprise(context, data.spinButton),
    КнопкаСоздания: exportBooleanToEnterprise(context, data.createButton),
    КнопкаСпискаВыбора: exportBooleanToEnterprise(context, data.choiceListButton),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    МаксимальноеЗначение: data.maxValue,
    Маска: data.mask,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(context, data.multiLine),
    ОбновлениеТекстаРедактирования: exportSystemEnumerationToEnterprise(
      context,
      data.editTextUpdate,
      SE.EditTextUpdateToEnterprise
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(context, data.markIncomplete),
    ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений: exportBooleanToEnterprise(
      context,
      data.showCheckBoxesInDropListWhenInputMultipleValues
    ),
    ОтображениеКнопкиВыбора: exportSystemEnumerationToEnterprise(
      context,
      data.choiceButtonRepresentation,
      SE.ChoiceButtonRepresentationToEnterprise
    ),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(context, data.choiceParameters),
    ПодсказкаАвтозаполнения: exportSystemEnumerationToEnterprise(
      context,
      data.autoFillHint,
      SE.InputFieldAutofillHintToEnterprise
    ),
    ПодсказкаВвода: exportI8nTextToEnterprise(context, data.inputHint),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПроверкаПравописанияПриВводеТекста: exportSystemEnumerationToEnterprise(
      context,
      data.spellCheckingOnTextInput,
      SE.SpellCheckingOnTextInputToEnterprise
    ),
    ПутьКДаннымЗначенияМножественногоЗначения: data.multipleValueValueDataPath,
    ПутьКДаннымКартинкиМножественногоЗначения: data.multipleValuePictureDataPath,
    ПутьКДаннымПредставленияМножественногоЗначения: data.multipleValuePresentationDataPath,
    РазмерКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      context,
      data.multipleValuePictureSize,
      SE.InputFieldMultipleValuePictureSizeToEnterprise
    ),
    РазрешитьВводПустыхМножественныхЗначений: exportBooleanToEnterprise(context, data.allowInputEmptyMultipleValues),
    РазрешитьДублированиеМножественныхЗначений: exportBooleanToEnterprise(context, data.allowMultipleValuesDuplicates),
    РазрешитьСоставнойТип: exportBooleanToEnterprise(context, data.typeDomainEnabled),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РасширенноеРедактирование: exportBooleanToEnterprise(context, data.extendedEdit),
    РасширенноеРедактированиеМножественныхЗначений: exportBooleanToEnterprise(context, data.multipleValuesExtendedEdit),
    РедактированиеТекста: exportBooleanToEnterprise(context, data.textEdit),
    РежимВыбораИзСписка: exportBooleanToEnterprise(context, data.listChoiceMode),
    РежимВыбораНезаполненного: exportSystemEnumerationToEnterprise(
      context,
      data.incompleteChoiceMode,
      SE.IncompleteChoiceModeToEnterprise
    ),
    РежимПароля: exportBooleanToEnterprise(context, data.passwordMode),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(context, data.choiceParameterLinks),
    СвязьПоТипу: exportTypeLinkToEnterprise(context, data.typeLink),
    СпециальныйРежимВводаТекста: exportSystemEnumerationToEnterprise(
      context,
      data.specialTextInputMode,
      SE.SpecialTextInputModeToEnterprise
    ),
    СписокВыбора: exportChoiceListToEnterprise(context, data.choiceList),
    ТекстКнопкиВводаЭкраннойКлавиатуры: exportSystemEnumerationToEnterprise(
      context,
      data.onScreenKeyboardReturnKeyText,
      SE.OnScreenKeyboardReturnKeyTextToEnterprise
    ),
    ТекстРедактирования: data.editText,
    ФигураКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      context,
      data.multipleValuePictureShape,
      SE.InputFieldMultipleValuePictureShapeToEnterprise
    ),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(context, data.format),
    ФорматРедактирования: exportI8nTextToEnterprise(context, data.editFormat),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветТекстаМножественныхЗначений: exportColorToEnterprise(context, data.multipleValuesTextColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    ЦветФонаМножественныхЗначений: exportColorToEnterprise(context, data.multipleValuesBackColor),
    Ширина: data.width,
    ШиринаВыпадающегоСписка: data.dropListWidth,
    Шрифт: exportFontToEnterprise(context, data.font),
    ШрифтМножественныхЗначений: exportFontToEnterprise(context, data.multipleValuesFont),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "InputField", exportInputFieldToEnterprise)
