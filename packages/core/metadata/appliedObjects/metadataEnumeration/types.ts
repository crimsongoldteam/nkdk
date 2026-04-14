import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface MetadataEnumeration {
  name: string
  auxiliaryChoiceForm?: string
  auxiliaryListForm?: string
  comment?: string
  defaultChoiceForm?: string
  defaultListForm?: string
  explanation?: I8nText
  extendedListPresentation?: I8nText
  extendedObjectPresentation?: I8nText
  fullTextSearch?: SE.UseFullTextSearch
  listPresentation?: I8nText
  objectPresentation?: I8nText
  standardAttributes?: StandardAttributeDescriptions
  synonym?: I8nText
  useStandardCommands?: boolean
}

export interface MetadataEnumerationYAML {
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаСписка?: string
  Комментарий?: string
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаСписка?: string
  Пояснение?: I8nTextYAML
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchYAML
  ПредставлениеОбъекта?: I8nTextYAML
  ПредставлениеСписка?: I8nTextYAML
  РасширенноеПредставлениеОбъекта?: I8nTextYAML
  РасширенноеПредставлениеСписка?: I8nTextYAML
  Синоним?: I8nTextYAML
  СтандартныеРеквизиты?: StandardAttributeDescriptionsYAML
  ИспользоватьСтандартныеКоманды?: StringboolYAML
}
