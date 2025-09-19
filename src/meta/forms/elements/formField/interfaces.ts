import { IFormAttributeableProperties } from "../../helpers/interfaces"
import {
  IFormElementProperties,
  IFormHorizontalAlignableProperties,
  IFormHorizontalStretchableProperties,
  IPicture,
  IColor,
  IFont,
  IShortcut,
} from "../../interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"
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
  footerTextColor: IColor | undefined
  titleBackColor: IColor | undefined
  footerBackColor: IColor | undefined
  titleFont: IFont | undefined
  footerFont: IFont | undefined
}
