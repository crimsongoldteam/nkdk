import { metadataItemLinkRule, ownerFormMetadataTarget } from "./types"

function formLink<const Name extends string>(yaml: Name) {
  const xmlParents = ["Properties"]
  return metadataItemLinkRule({
    yaml,
    xmlParents,
    metadataTarget: ownerFormMetadataTarget,
    defaultValueXMLRaw: "",
  })
}

/** Общие объявления; особенности конкретного объекта переопределяются у владельца. */
export const ownerFormLinks = {
  defaultObjectForm: formLink("ОсновнаяФормаОбъекта"),
  defaultListForm: formLink("ОсновнаяФормаСписка"),
  defaultChoiceForm: formLink("ОсновнаяФормаВыбора"),
  auxiliaryObjectForm: formLink("ДополнительнаяФормаОбъекта"),
  auxiliaryListForm: formLink("ДополнительнаяФормаСписка"),
  auxiliaryChoiceForm: formLink("ДополнительнаяФормаВыбора"),
  defaultForm: formLink("ОсновнаяФорма"),
  auxiliaryForm: formLink("ДополнительнаяФорма"),
  defaultRecordForm: formLink("ОсновнаяФормаЗаписи"),
  auxiliaryRecordForm: formLink("ДополнительнаяФормаЗаписи"),
  defaultFolderForm: formLink("ОсновнаяФормаГруппы"),
  defaultFolderChoiceForm: formLink("ОсновнаяФормаВыбораГруппы"),
  auxiliaryFolderForm: formLink("ДополнительнаяФормаГруппы"),
  auxiliaryFolderChoiceForm: formLink("ДополнительнаяФормаВыбораГруппы"),
  defaultSaveForm: formLink("ОсновнаяФормаСохранения"),
  defaultLoadForm: formLink("ОсновнаяФормаЗагрузки"),
  auxiliarySaveForm: formLink("ВспомогательнаяФормаСохранения"),
  auxiliaryLoadForm: formLink("ВспомогательнаяФормаЗагрузки"),
  defaultSettingsForm: formLink("ОсновнаяФормаНастроекОтчета"),
  auxiliarySettingsForm: formLink("ДополнительнаяФормаНастроекОтчета"),
  defaultVariantForm: formLink("ОсновнаяФормаВариантаОтчета"),
} as const

/** Те же ссылки для правил, объявляющих XML-имя явно. */
export const explicitOwnerFormLinks = {
  defaultObjectForm: { ...ownerFormLinks.defaultObjectForm, xml: "DefaultObjectForm" },
  defaultRecordForm: { ...ownerFormLinks.defaultRecordForm, xml: "DefaultRecordForm" },
  defaultListForm: { ...ownerFormLinks.defaultListForm, xml: "DefaultListForm" },
  defaultChoiceForm: { ...ownerFormLinks.defaultChoiceForm, xml: "DefaultChoiceForm" },
} as const
