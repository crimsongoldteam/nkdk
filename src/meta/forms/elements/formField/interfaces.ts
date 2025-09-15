import { IFormAttributeableProperties } from "../../helpers/interfaces"
import {
  IFormElementProperties,
  IFormHorizontalAlignableProperties,
  IFormHorizontalStretchableProperties,
} from "../../interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { IPicture } from "../../interfaces"
import { IColor } from "../../interfaces"
import { IFont } from "../../interfaces"
import { IShortcut } from "../../interfaces"
import { ITypeDescription } from "@/elements/interfaces"

export interface IFormFieldProperties
  extends IFormElementProperties,
    IFormAttributeableProperties,
    IFormHorizontalAlignableProperties,
    IFormHorizontalStretchableProperties {
  autoCellHeight: boolean
  defaultItem: boolean
  displayImportance: SystemEnumeration.DisplayImportance
  verticalAlign: SystemEnumeration.VerticalAlign
  verticalAlignInGroup: SystemEnumeration.VerticalAlign
  type: SystemEnumeration.FormFieldType
  visible: boolean
  titleHeight: number
  cellHyperlink: boolean
  horizontalAlign: SystemEnumeration.HorizontalAlign
  horizontalAlignInGroup: SystemEnumeration.HorizontalAlign
  footerHorizontalAlign: SystemEnumeration.HorizontalAlign
  headerHorizontalAlign: SystemEnumeration.HorizontalAlign
  enabled: boolean
  title: string
  name: string
  footerPicture: IPicture | undefined
  headerPicture: IPicture | undefined
  // public contextMenu: boolean = false
  typeRestriction: ITypeDescription | undefined
  showInFooter: boolean
  showInHeader: boolean
  toolTipRepresentation: SystemEnumeration.ToolTipRepresentation
  warningOnEditRepresentation: SystemEnumeration.WarningOnEditRepresentation
  onMainServerUnavalableBehavior: SystemEnumeration.OnMainServerUnavalableBehavior
  toolTip: string
  titleLocation: SystemEnumeration.FormItemTitleLocation
  warningOnEdit: boolean
  skipOnInput: boolean
  // public dataPath: boolean = false
  footerDataPath: string
  // public extendedTooltip: boolean = false
  editMode: SystemEnumeration.ColumnEditMode
  // public parent: boolean = false
  shortcut: IShortcut | undefined
  // public table: boolean = false
  footerText: string
  readOnly: boolean
  fixingInTable: boolean
  titleTextColor: IColor | undefined
  FooterTextColor: IColor | undefined
  TitleBackColor: IColor | undefined
  FooterBackColor: IColor | undefined
  TitleFont: IFont | undefined
  FooterFont: IFont | undefined
}
