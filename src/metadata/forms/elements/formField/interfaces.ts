import { IFormElementProperties, IPicture, IShortcut, ITypeDescription, IColor, IFont, I8nText } from "../../interfaces"
import * as SystemEnumeration from "@/metadata/systemEnumerations"

export interface IFormFieldProperties extends IFormElementProperties {
  autoCellHeight?: boolean
  defaultItem?: boolean
  displayImportance?: SystemEnumeration.DisplayImportance
  verticalAlign?: SystemEnumeration.VerticalAlign
  verticalAlignInGroup?: SystemEnumeration.VerticalAlign
  type?: SystemEnumeration.FormFieldType
  visible?: boolean
  titleHeight?: number
  cellHyperlink?: boolean
  horizontalAlign?: SystemEnumeration.HorizontalAlign
  horizontalAlignInGroup?: SystemEnumeration.HorizontalAlign
  footerHorizontalAlign?: SystemEnumeration.HorizontalAlign
  headerHorizontalAlign?: SystemEnumeration.HorizontalAlign
  enabled?: boolean
  title?: I8nText
  // name: string
  footerPicture?: IPicture
  headerPicture?: IPicture
  // contextMenu: boolean
  typeRestriction?: ITypeDescription
  showInFooter?: boolean
  showInHeader?: boolean
  toolTipRepresentation?: SystemEnumeration.ToolTipRepresentation
  warningOnEditRepresentation?: SystemEnumeration.WarningOnEditRepresentation
  onMainServerUnavalableBehavior?: SystemEnumeration.OnMainServerUnavalableBehavior
  toolTip?: string
  titleLocation?: SystemEnumeration.FormItemTitleLocation
  warningOnEdit?: boolean
  skipOnInput?: boolean
  // dataPath: boolean
  footerDataPath?: string
  // extendedTooltip: boolean
  editMode?: SystemEnumeration.ColumnEditMode
  // parent: boolean
  shortcut?: IShortcut
  // table: boolean
  footerText?: string
  readOnly?: boolean
  fixingInTable?: boolean
  titleTextColor?: IColor
  footerTextColor?: IColor
  titleBackColor?: IColor
  footerBackColor?: IColor
  titleFont?: IFont
  footerFont?: IFont
}
