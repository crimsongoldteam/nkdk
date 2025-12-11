import { I8nText, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  TypeDescription,
  TypeDescriptionXML,
  TypeDescriptionXMLItem,
} from "~/lib/metadata/commonObjects/typeDescription/types"
import {
  UserVisible,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import {
  TCommandSet,
  TCommandSetXML,
} from "~/lib/metadata/forms/commandSet/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { EventsXML } from "../../forms/events/types"
import {
  TChildItems,
  TChildItemsXML,
} from "../../forms/elements/childItems/types"
import {
  TCommandBar,
  TCommandBarXML,
} from "../../forms/elements/commandBar/types"
import { TElementType } from "../../forms/elements/types"

export interface IAttribute {
  name: string
  id: string
  title?: I8nText
  type?: TypeDescription
  mainAttribute?: boolean
  storedData?: boolean
  use?: UserVisible
}

// export interface IAttributeEnterprise = z.union([
//   z.object({
//     Заголовок: z.string().optional(),
//     Тип: z.string().optional(),
//     ОсновнойАтрибут: ZBoolEnterprise.optional(),
//     СохраняемыеДанные: ZBoolEnterprise.optional(),
//   }),
//   ZUseEnterprise,
// ])

export interface IClientApplicationFormEvents {
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
}

export interface IClientApplicationForm {
  commandSet?: TCommandSet
  elementType: TElementType
  attributes?: IAttribute[]
  autoCommandBar?: TCommandBar
  autoTitle?: boolean
  autoSaveDataInSettings?: SE.TAutoSaveFormDataInSettings
  autoURL?: boolean
  verticalScroll?: SE.TVerticalFormScroll
  childItemsVerticalAlign?: SE.TItemVerticalAlign
  verticalSpacing?: SE.TFormItemSpacing
  itemsAndTitlesAlign?: SE.TItemsAndTitlesAlignVariant
  height?: number
  childItemsHorizontalAlign?: SE.TItemHorizontalLocation
  horizontalSpacing?: SE.TFormItemSpacing
  group?: SE.TChildFormItemsGroup
  enabled?: boolean
  title?: I8nText
  closeOnChoice?: boolean
  closeOnOwnerClose?: boolean
  formName?: string
  usedFormServer?: SE.TUsedServer
  purposeUseKey?: string
  windowOptionsKey?: string
  commandBar?: TCommandBar
  scale?: number
  modalMode?: boolean
  modified?: boolean
  uRL?: string
  showTitle?: boolean
  showCloseButton?: boolean
  conversationsRepresentation?: SE.TFormConversationsRepresentation
  enterKeyBehavior?: SE.TEnterKeyBehaviorType
  childItems?: TChildItems
  commandBarLocation?: SE.TFormCommandBarLabelLocation
  autoFillCheck?: boolean
  formWindowOpeningMode?: SE.TFormWindowOpeningMode
  collapseItemsByImportance?: SE.TCollapseFormItemsByImportance
  saveDataInSettings?: SE.TSaveFormDataInSettings
  savedInSettingsDataModified?: boolean
  readOnly?: boolean
  uUID?: string
  width?: number
  slaveItemsWidth?: SE.TChildFormItemsWidth
  useForFoldersAndItems?: SE.TFoldersAndItemsUse
  events?: IClientApplicationFormEvents
}

export interface IAutoCommandBarXML {
  _name: string
  _id: string
}

export interface IConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface IAttributeXMLItem {
  _name: string
  _id: string
  Title?: I8nTextXML
  Type?: TypeDescriptionXML | TypeDescriptionXMLItem
  MainAttribute?: boolean
  StoredData?: boolean
  Use?: UserVisibleXML
}

export interface IAttributeXML {
  Attribute: IAttributeXMLItem
}

export type IAttributesXML = (IAttributeXML | IConditionalAppearanceXML)[]

export interface IClientApplicationFormXML {
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
  AutoSaveDataInSettings?: SE.TAutoSaveFormDataInSettings
  AutoTitle?: boolean
  AutoURL?: boolean
  ChildItemsVerticalAlign?: SE.TItemVerticalAlign
  CloseOnChoice?: boolean
  CloseOnOwnerClose?: boolean
  CollapseItemsByImportance?: SE.TCollapseFormItemsByImportance
  CommandBar?: TCommandBarXML
  CommandBarLocation?: SE.TFormCommandBarLabelLocation
  // Commands: ZКомандыФормыXML.optional(),
  ConversationsRepresentation?: SE.TFormConversationsRepresentation
  Enabled?: boolean
  EnterKeyBehavior?: SE.TEnterKeyBehaviorType
  FormName?: string
  FormWindowOpeningMode?: SE.TFormWindowOpeningMode
  Group?: SE.TChildFormItemsGroup
  Height?: number
  HorizontalSpacing?: SE.TFormItemSpacing
  ItemsAndTitlesAlign?: SE.TItemsAndTitlesAlignVariant
  ModalMode?: boolean
  Modified?: boolean
  PurposeUseKey?: string
  ReadOnly?: boolean
  SaveDataInSettings?: SE.TSaveFormDataInSettings
  SavedInSettingsDataModified?: boolean
  Scale?: number
  ShowCloseButton?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.TChildFormItemsWidth
  Title?: I8nTextXML
  URL?: string
  UUID?: string
  UsedFormServer?: SE.TUsedServer
  VerticalScroll?: SE.TVerticalFormScroll
  VerticalSpacing?: SE.TFormItemSpacing
  Width?: number
  WindowOptionsKey?: string
  // ConditionalAppearance: ZУсловноеОформлениеКомпоновкиДанныхXML.optional(),
  CommandSet?: TCommandSetXML
  UseForFoldersAndItems?: SE.TFoldersAndItemsUse
  AutoCommandBar?: TCommandBarXML
  Events?: EventsXML
  ChildItems?: TChildItemsXML
  Attributes?: IAttributesXML
}

export type TClientApplicationForm = IClientApplicationForm
export type TAttribute = IAttribute

export type TAttributeXML = IAttributeXML
export type TAttributesXML = IAttributesXML
export type TClientApplicationFormXML = IClientApplicationFormXML

// export type TAttributeEnterprise = z.infer<typeof ZAttributeEnterprise>
