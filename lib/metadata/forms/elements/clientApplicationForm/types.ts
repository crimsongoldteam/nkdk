import { I8nText, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  TypeDescription,
  TypeDescriptionXML,
  TypeDescriptionXMLItem,
} from "~/lib/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { CommandSet, CommandSetXML } from "~/lib/metadata/forms/commandSet/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { EventsXML } from "../../events/types"
import { ChildItems, ChildItemsXML } from "../childItems/types"
import { CommandBar, CommandBarXML } from "../commandBar/types"
import { FormElementType } from "../types"

export interface FormAttribute {
  name: string
  id: string
  title?: I8nText
  type?: TypeDescription
  mainAttribute?: boolean
  storedData?: boolean
  use?: UserVisible
}

export interface ClientApplicationFormEvents {
  collaborationSystemUsersAutoComplete?: string
  externalEvent?: string
  activationProcessing?: string
  choiceProcessing?: string
  newWriteProcessing?: string
  uRLProcessing?: string
  notificationProcessing?: string
  navigationProcessing?: string
  uRLGetProcessing?: string
  uRLListGetProcessing?: string
  collaborationSystemUsersChoiceFormGetProcessing?: string
  fillCheckProcessingAtServer?: string
  addInDetachmentOnError?: string
  beforeLoadDataFromSettingsAtServer?: string
  beforeClose?: string
  beforeReopenFromOtherServer?: string
  onPasteFromClipboard?: string
  onLoadDataFromSettingsAtServer?: string
  onClose?: string
  onMainServerAvailabilityChange?: string
  onChangeDisplaySettings?: string
  onOpen?: string
  onReopenFromOtherServer?: string
  onReopen?: string
  onCreateAtServer?: string
  onSaveDataInSettingsAtServer?: string
  [key: string]: string | undefined
}

export interface ClientApplicationForm {
  commandSet?: CommandSet
  elementType: FormElementType
  attributes?: FormAttribute[]
  autoCommandBar?: CommandBar
  autoTitle?: boolean
  autoSaveDataInSettings?: SE.AutoSaveFormDataInSettings
  autoURL?: boolean
  verticalScroll?: SE.VerticalFormScroll
  childItemsVerticalAlign?: SE.ItemVerticalAlign
  verticalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  height?: number
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation
  horizontalSpacing?: SE.FormItemSpacing
  group?: SE.ChildFormItemsGroup
  enabled?: boolean
  title?: I8nText
  closeOnChoice?: boolean
  closeOnOwnerClose?: boolean
  formName?: string
  usedFormServer?: SE.UsedServer
  purposeUseKey?: string
  windowOptionsKey?: string
  commandBar?: CommandBar
  scale?: number
  modalMode?: boolean
  modified?: boolean
  uRL?: string
  showTitle?: boolean
  showCloseButton?: boolean
  conversationsRepresentation?: SE.FormConversationsRepresentation
  enterKeyBehavior?: SE.EnterKeyBehaviorType
  childItems?: ChildItems
  commandBarLocation?: SE.FormCommandBarLabelLocation
  autoFillCheck?: boolean
  formWindowOpeningMode?: SE.FormWindowOpeningMode
  collapseItemsByImportance?: SE.CollapseFormItemsByImportance
  saveDataInSettings?: SE.SaveFormDataInSettings
  savedInSettingsDataModified?: boolean
  readOnly?: boolean
  uUID?: string
  width?: number
  slaveItemsWidth?: SE.ChildFormItemsWidth
  useForFoldersAndItems?: SE.FoldersAndItemsUse
  events?: ClientApplicationFormEvents
}

export interface AutoCommandBarXML {
  _name: string
  _id: string
}

export interface ConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface AttributeXMLItem {
  _name: string
  _id: string
  Title?: I8nTextXML
  Type?: TypeDescriptionXML | TypeDescriptionXMLItem
  MainAttribute?: boolean
  StoredData?: boolean
  Use?: UserVisibleXML
}

export interface AttributeXML {
  Attribute: AttributeXMLItem
}

export type AttributesXML = (AttributeXML | ConditionalAppearanceXML)[]

export interface ClientApplicationFormXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:dcscor"?: string
  "_xmlns:dcssch"?: string
  "_xmlns:dcsset"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version?: string
  AutoFillCheck?: boolean
  AutoSaveDataInSettings?: SE.AutoSaveFormDataInSettings
  AutoTitle?: boolean
  AutoURL?: boolean
  ChildItemsVerticalAlign?: SE.ItemVerticalAlign
  CloseOnChoice?: boolean
  CloseOnOwnerClose?: boolean
  CollapseItemsByImportance?: SE.CollapseFormItemsByImportance
  CommandBar?: CommandBarXML
  CommandBarLocation?: SE.FormCommandBarLabelLocation
  // Commands: ZКомандыФормыXML.optional(),
  ConversationsRepresentation?: SE.FormConversationsRepresentation
  Enabled?: boolean
  EnterKeyBehavior?: SE.EnterKeyBehaviorType
  FormName?: string
  FormWindowOpeningMode?: SE.FormWindowOpeningMode
  Group?: SE.ChildFormItemsGroup
  Height?: number
  HorizontalSpacing?: SE.FormItemSpacing
  ItemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  ModalMode?: boolean
  Modified?: boolean
  PurposeUseKey?: string
  ReadOnly?: boolean
  SaveDataInSettings?: SE.SaveFormDataInSettings
  SavedInSettingsDataModified?: boolean
  Scale?: number
  ShowCloseButton?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.ChildFormItemsWidth
  Title?: I8nTextXML
  URL?: string
  UUID?: string
  UsedFormServer?: SE.UsedServer
  VerticalScroll?: SE.VerticalFormScroll
  VerticalSpacing?: SE.FormItemSpacing
  Width?: number
  WindowOptionsKey?: string
  // ConditionalAppearance: ZУсловноеОформлениеКомпоновкиДанныхXML.optional(),
  CommandSet?: CommandSetXML
  UseForFoldersAndItems?: SE.FoldersAndItemsUse
  AutoCommandBar?: CommandBarXML
  Events?: EventsXML
  ChildItems?: ChildItemsXML
  Attributes?: AttributesXML
}

// export type TAttributeEnterprise = z.infer<typeof ZAttributeEnterprise>
