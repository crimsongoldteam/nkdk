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
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { InputField, InputFieldEnterprise } from "~/lib/metadata/forms/elements/inputField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportInputFieldToEnterprise = (data: InputField | undefined): InputFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    РазрешитьВводПустыхМножественныхЗначений: exportBooleanToEnterprise(data.allowInputEmptyMultipleValues),
    РазрешитьДублированиеМножественныхЗначений: exportBooleanToEnterprise(data.allowMultipleValuesDuplicates),
    АвтоИзменениеРегистраПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.autoCapitalizationOnTextInput,
      SE.AutoCapitalizationOnTextInputToEnterprise
    ),
    АвтоВыборНезаполненного: exportBooleanToEnterprise(data.autoChoiceIncomplete),
    АвтоИсправлениеПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.autoCorrectionOnTextInput,
      SE.AutoCorrectionOnTextInputToEnterprise
    ),
    ПодсказкаАвтозаполнения: exportSystemEnumerationToEnterprise(
      data.autoFillHint,
      SE.InputFieldAutofillHintToEnterprise
    ),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(data.autoMarkIncomplete),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    АвтоОтображениеКнопкиОчистки: exportSystemEnumerationToEnterprise(
      data.autoShowClearButton,
      SE.AutoShowClearButtonModeToEnterprise
    ),
    АвтоОтображениеКнопкиОткрытия: exportSystemEnumerationToEnterprise(
      data.autoShowOpenButton,
      SE.AutoShowOpenButtonModeToEnterprise
    ),
    ДоступныеТипы: exportTypeDescriptionToEnterprise(data.availableTypes),
    ЦветФона: exportColorToEnterprise(data.backColor),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    КнопкаВыбора: exportBooleanToEnterprise(data.choiceButton),
    КартинкаКнопкиВыбора: exportPictureToEnterprise(data.choiceButtonPicture),
    ОтображениеКнопкиВыбора: exportSystemEnumerationToEnterprise(
      data.choiceButtonRepresentation,
      SE.ChoiceButtonRepresentationToEnterprise
    ),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsToEnterprise
    ),
    ФормаВыбора: data.choiceForm,
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    СписокВыбора: exportChoiceListToEnterprise(data.choiceList),
    КнопкаСпискаВыбора: exportBooleanToEnterprise(data.choiceListButton),
    ВысотаСпискаВыбора: data.choiceListHeight,
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameterLinks),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameters),
    ВыбиратьТип: exportBooleanToEnterprise(data.chooseType),
    КнопкаОчистки: exportBooleanToEnterprise(data.clearButton),
    КнопкаСоздания: exportBooleanToEnterprise(data.createButton),
    КнопкаВыпадающегоСписка: exportBooleanToEnterprise(data.dropListButton),
    ШиринаВыпадающегоСписка: data.dropListWidth,
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat),
    ТекстРедактирования: data.editText,
    ОбновлениеТекстаРедактирования: exportSystemEnumerationToEnterprise(
      data.editTextUpdate,
      SE.EditTextUpdateToEnterprise
    ),
    РасширенноеРедактирование: exportBooleanToEnterprise(data.extendedEdit),
    Шрифт: exportFontToEnterprise(data.font),
    Формат: exportI8nTextToEnterprise(data.format),
    Высота: data.height,
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      data.heightControlVariant,
      SE.ItemHeightControlVariantToEnterprise
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    РежимВыбораНезаполненного: exportSystemEnumerationToEnterprise(
      data.incompleteChoiceMode,
      SE.IncompleteChoiceModeToEnterprise
    ),
    ПодсказкаВвода: exportI8nTextToEnterprise(data.inputHint),
    РежимВыбораИзСписка: exportBooleanToEnterprise(data.listChoiceMode),
    ОтметкаНезаполненного: exportBooleanToEnterprise(data.markIncomplete),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives),
    Маска: data.mask,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальноеЗначение: data.maxValue,
    МаксимальнаяШирина: data.maxWidth,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine),
    ПутьКДаннымКартинкиМножественногоЗначения: data.multipleValuePictureDataPath,
    ФигураКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      data.multipleValuePictureShape,
      SE.InputFieldMultipleValuePictureShapeToEnterprise
    ),
    РазмерКартинкиМножественногоЗначения: exportSystemEnumerationToEnterprise(
      data.multipleValuePictureSize,
      SE.InputFieldMultipleValuePictureSizeToEnterprise
    ),
    ПутьКДаннымПредставленияМножественногоЗначения: data.multipleValuePresentationDataPath,
    ЦветФонаМножественныхЗначений: exportColorToEnterprise(data.multipleValuesBackColor),
    РасширенноеРедактированиеМножественныхЗначений: exportBooleanToEnterprise(data.multipleValuesExtendedEdit),
    ШрифтМножественныхЗначений: exportFontToEnterprise(data.multipleValuesFont),
    ГиперссылкаМножественныхЗначений: exportBooleanToEnterprise(data.multipleValuesHyperlink),
    КартинкаМножественныхЗначений: exportPictureToEnterprise(data.multipleValuesPicture),
    ЦветТекстаМножественныхЗначений: exportColorToEnterprise(data.multipleValuesTextColor),
    ПутьКДаннымЗначенияМножественногоЗначения: data.multipleValueValueDataPath,
    ТекстКнопкиВводаЭкраннойКлавиатуры: exportSystemEnumerationToEnterprise(
      data.onScreenKeyboardReturnKeyText,
      SE.OnScreenKeyboardReturnKeyTextToEnterprise
    ),
    КнопкаОткрытия: exportBooleanToEnterprise(data.openButton),
    РежимПароля: exportBooleanToEnterprise(data.passwordMode),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice),
    ВыделенныйТекст: data.selectedText,
    ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений: exportBooleanToEnterprise(
      data.showCheckBoxesInDropListWhenInputMultipleValues
    ),
    СпециальныйРежимВводаТекста: exportSystemEnumerationToEnterprise(
      data.specialTextInputMode,
      SE.SpecialTextInputModeToEnterprise
    ),
    ПроверкаПравописанияПриВводеТекста: exportSystemEnumerationToEnterprise(
      data.spellCheckingOnTextInput,
      SE.SpellCheckingOnTextInputToEnterprise
    ),
    КнопкаРегулирования: exportBooleanToEnterprise(data.spinButton),
    ЦветТекста: exportColorToEnterprise(data.textColor),
    РедактированиеТекста: exportBooleanToEnterprise(data.textEdit),
    РазрешитьСоставнойТип: exportBooleanToEnterprise(data.typeDomainEnabled),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.typeLink),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    АвтоПереносСтрок: exportBooleanToEnterprise(data.wrap),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.InputField, exportInputFieldToEnterprise)
