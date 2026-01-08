import { exportColorToEnterprise  } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise  } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise  } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise  } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportBaseElementToEnterprise  } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportFontToEnterprise  } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportTypeDescriptionToEnterprise  } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportBorderToEnterprise  } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportChoiceListToEnterprise  } from "~/lib/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportTypeLinkToEnterprise  } from "~/lib/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise  } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { exportCommandSetToEnterprise  } from "~/lib/metadata/forms/commandSet/exportToEnterprise"
import { exportEventsToEnterprise  } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportChildItemsToEnterprise  } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportMetadataValueToEnterprise  } from "~/lib/metadata/commonObjects/metadataValue/exportToEnterprise"
import { exportMetadataCommandGroupToEnterprise  } from "~/lib/metadata/commonObjects/metadataCommandGroup/exportToEnterprise"
import { exportFieldListToEnterprise  } from "~/lib/metadata/commonObjects/field/exportToEnterprise"
import { exportPredefinedToEnterprise , exportPredefinedItemsToEnterprise } from "~/lib/metadata/commonObjects/predifined/exportToEnterprise"
import { exportMetadataFieldToEnterprise , exportMetadataFieldsToEnterprise } from "~/lib/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinkToEnterprise , exportMetadataItemLinksToEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/exportToEnterprise"
import { exportIndexFieldToEnterprise , exportIndexFieldsToEnterprise } from "~/lib/metadata/commonObjects/indexField/exportToEnterprise"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportFormToEnterprise } from "../form/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorXML, ColorEnterprise  } from "~/lib/metadata/commonObjects/color/types";
import { I8nText, I8nTextXML, I8nTextEnterprise  } from "~/lib/metadata/commonObjects/i8nText/types";
import { Picture, PictureXML, PictureEnterprise  } from "~/lib/metadata/commonObjects/pictures/types";
import { UserVisible, UserVisibleXML, UserVisibleEnterprise } from "~/lib/metadata/commonObjects/userVisible/types";
import { BaseElement, BaseElementXML, BaseElementEnterprise  } from "~/lib/metadata/forms/elements/baseElement/types";
import { Font, FontXML, FontEnterprise  } from "~/lib/metadata/commonObjects/font/types";
import { TypeDescription, TypeDescriptionXML, TypeDescriptionEnterprise  } from "~/lib/metadata/commonObjects/typeDescription/types";
import { Border, BorderXML, BorderEnterprise  } from "~/lib/metadata/commonObjects/border/types";
import { ChoiceList, ChoiceListXML, ChoiceListEnterprise  } from "~/lib/metadata/commonObjects/choiceList/types";
import { TypeLink, TypeLinkXML, TypeLinkEnterprise  } from "~/lib/metadata/commonObjects/typeLink/types";
import { ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinksEnterprise  } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types";
import { CommandSet, CommandSetXML, CommandSetEnterprise  } from "~/lib/metadata/forms/commandSet/types";
import { Events, EventsXML, EventsEnterprise  } from "~/lib/metadata/forms/events/types";
import { ChildItems, ChildItemsXML, ChildItemsEnterprise  } from "~/lib/metadata/forms/elements/childItems/types";
import { MetadataValue, MetadataValueXML, MetadataValueEnterprise  } from "~/lib/metadata/commonObjects/metadataValue/types";
import { MetadataCommandGroup, MetadataCommandGroupXML, MetadataCommandGroupEnterprise  } from "~/lib/metadata/commonObjects/metadataCommandGroup/types";
import { FieldList, FieldListXML, FieldListEnterprise  } from "~/lib/metadata/commonObjects/field/types";
import { Predefined, PredefinedXML, PredefinedEnterprise , PredefinedItems, PredefinedItemsXML, PredefinedItemsEnterprise } from "~/lib/metadata/commonObjects/predifined/types";
import { MetadataField, MetadataFieldXML, MetadataFieldEnterprise , MetadataFields, MetadataFieldsXML, MetadataFieldsEnterprise } from "~/lib/metadata/commonObjects/metadataField/types";
import { MetadataItemLink, MetadataItemLinkXML, MetadataItemLinkEnterprise , MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinksEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/types";
import { IndexField, IndexFieldXML, IndexFieldEnterprise , IndexFields, IndexFieldsXML, IndexFieldsEnterprise } from "~/lib/metadata/commonObjects/indexField/types";
import { ClientApplicationForm, ClientApplicationFormXML, ClientApplicationFormEnterprise  } from "~/lib/metadata/forms/elements/clientApplicationForm/types";

export const exportClientApplicationFormToEnterprise = (data: ClientApplicationForm | undefined, configurationSettings: ConfigurationSettings): ClientApplicationFormEnterprise | undefined => {
  if (!data) return undefined
     
    return compactObject({
...exportFormToEnterprise(data, configurationSettings)!,

    <Имя реквизита>: exportПроизвольныйToEnterprise(data.<Attribute name>, configurationSettings),
    АвтоЗаголовок: exportBooleanToEnterprise(data.autoTitle, configurationSettings),
    АвтоматическоеСохранениеДанныхВНастройках: exportSystemEnumerationToEnterprise(data.autoSaveDataInSettings, SE.AutoSaveFormDataInSettingsToEnterprise, configurationSettings),
    АвтоНавигационнаяСсылка: exportBooleanToEnterprise(data.autoURL, configurationSettings),
    ВертикальнаяПрокрутка: exportSystemEnumerationToEnterprise(data.verticalScroll, SE.VerticalFormScrollToEnterprise, configurationSettings),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(data.childItemsVerticalAlign, SE.ItemVerticalAlignToEnterprise, configurationSettings),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(data.verticalSpacing, SE.FormItemSpacingToEnterprise, configurationSettings),
    ВладелецФормы: exportТабличноеПолеToEnterprise(data.formOwner, configurationSettings),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(data.itemsAndTitlesAlign, SE.ItemsAndTitlesAlignVariantToEnterprise, configurationSettings),
    Высота: data.height,
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(data.childItemsHorizontalAlign, SE.ItemHorizontalLocationToEnterprise, configurationSettings),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(data.horizontalSpacing, SE.FormItemSpacingToEnterprise, configurationSettings),
    Группировка: exportSystemEnumerationToEnterprise(data.group, SE.ChildFormItemsGroupToEnterprise, configurationSettings),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    ЗакрыватьПриВыборе: exportBooleanToEnterprise(data.closeOnChoice, configurationSettings),
    ЗакрыватьПриЗакрытииВладельца: exportBooleanToEnterprise(data.closeOnOwnerClose, configurationSettings),
    ИмяФормы: data.formName,
    ИспользуемыйСерверФормы: exportSystemEnumerationToEnterprise(data.usedFormServer, SE.UsedServerToEnterprise, configurationSettings),
    КлючНазначенияИспользования: data.purposeUseKey,
    КлючСохраненияПоложенияОкна: data.windowOptionsKey,
    КлючУникальности: exportПроизвольныйToEnterprise(data.uniqueKey, configurationSettings),
    КоманднаяПанель: exportCommandBarToEnterprise(data.commandBar, configurationSettings),
    Команды: exportКомандыФормыToEnterprise(data.commands, configurationSettings),
    Масштаб: data.scale,
    МодальныйРежим: exportBooleanToEnterprise(data.modalMode, configurationSettings),
    Модифицированность: exportBooleanToEnterprise(data.modified, configurationSettings),
    НавигационнаяСсылка: data.uRL,
    Окно: exportОкноКлиентскогоПриложенияToEnterprise(data.window, configurationSettings),
    ОписаниеОповещенияОЗакрытии: exportНеопределеноToEnterprise(data.callbackDescriptionOnClose, configurationSettings),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle, configurationSettings),
    ОтображатьКнопкуЗакрытия: exportBooleanToEnterprise(data.showCloseButton, configurationSettings),
    ОтображениеОбсуждений: exportSystemEnumerationToEnterprise(data.conversationsRepresentation, SE.FormConversationsRepresentationToEnterprise, configurationSettings),
    Параметры: exportДанныеФормыСтруктураToEnterprise(data.parameters, configurationSettings),
    ПоведениеКлавишиEnter: exportSystemEnumerationToEnterprise(data.enterKeyBehavior, SE.EnterKeyBehaviorTypeToEnterprise, configurationSettings),
    ПодчиненныеЭлементы: exportЭлементыФормыToEnterprise(data.childItems, configurationSettings),
    ПоложениеКоманднойПанели: exportSystemEnumerationToEnterprise(data.commandBarLocation, SE.FormCommandBarLabelLocationToEnterprise, configurationSettings),
    ПроверятьЗаполнениеАвтоматически: exportBooleanToEnterprise(data.autoFillCheck, configurationSettings),
    РежимОткрытияОкнаФормы: exportSystemEnumerationToEnterprise(data.formWindowOpeningMode, SE.FormWindowOpeningModeToEnterprise, configurationSettings),
    СворачиваниеЭлементовПоВажности: exportSystemEnumerationToEnterprise(data.collapseItemsByImportance, SE.CollapseFormItemsByImportanceToEnterprise, configurationSettings),
    СоставКоманднойПанелиНаМобильномУстройстве: data.mobileDeviceCommandBarContent,
    СохранениеДанныхВНастройках: exportSystemEnumerationToEnterprise(data.saveDataInSettings, SE.SaveFormDataInSettingsToEnterprise, configurationSettings),
    СохраняемыеВНастройкахДанныеМодифицированы: exportBooleanToEnterprise(data.savedInSettingsDataModified, configurationSettings),
    ТекущийЭлемент: exportНеопределеноToEnterprise(data.currentItem, configurationSettings),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly, configurationSettings),
    УникальныйИдентификатор: exportУникальныйИдентификаторToEnterprise(data.uUID, configurationSettings),
    УсловноеОформление: exportУсловноеОформлениеКомпоновкиДанныхToEnterprise(data.conditionalAppearance, configurationSettings),
    Ширина: data.width,
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(data.slaveItemsWidth, SE.ChildFormItemsWidthToEnterprise, configurationSettings),
    Элементы: exportВсеЭлементыФормыToEnterprise(data.items, configurationSettings),
    ЭтотОбъект: exportФормаКлиентскогоПриложенияToEnterprise(data.thisObject, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}