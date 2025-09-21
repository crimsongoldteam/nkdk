import type { ExplicitUndefined, IColor, IFont, IPicture, IShortcut } from "../../interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ITypeDescription } from "@/elements/interfaces"
import { IFormFieldProperties } from "./interfaces"
import { Expose } from "class-transformer"

export class FormFieldProperties implements IFormFieldProperties {
  name: string = ""
  get dataPath(): string {
    throw new Error("Method not implemented.")
  }
  set dataPath(value: string) {
    throw new Error("Method not implemented.")
  }
  horizontalStretch: ExplicitUndefined<boolean>
  public autoCellHeight: boolean = false
  public defaultItem: boolean = false
  public displayImportance: SystemEnumeration.DisplayImportance = SystemEnumeration.DisplayImportance.Auto
  public verticalAlign: SystemEnumeration.VerticalAlign = SystemEnumeration.VerticalAlign.Auto
  public verticalAlignInGroup: SystemEnumeration.VerticalAlign = SystemEnumeration.VerticalAlign.Auto
  public type: SystemEnumeration.FormFieldType = SystemEnumeration.FormFieldType.InputField
  public visible: boolean = false
  public titleHeight: number = 0
  public cellHyperlink: boolean = false
  public horizontalAlign: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public footerHorizontalAlign: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public headerHorizontalAlign: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public enabled: boolean = false
  public title: string = ""
  // public name: string = ""
  public footerPicture: IPicture = undefined
  public headerPicture: IPicture = undefined
  // public contextMenu: boolean = false
  public typeRestriction: ITypeDescription = undefined
  public showInFooter: boolean = false
  public showInHeader: boolean = false
  public toolTipRepresentation: SystemEnumeration.ToolTipRepresentation = SystemEnumeration.ToolTipRepresentation.Auto
  public warningOnEditRepresentation: SystemEnumeration.WarningOnEditRepresentation =
    SystemEnumeration.WarningOnEditRepresentation.Auto
  public onMainServerUnavalableBehavior: SystemEnumeration.OnMainServerUnavalableBehavior =
    SystemEnumeration.OnMainServerUnavalableBehavior.Auto
  public toolTip: string = ""
  public titleLocation: SystemEnumeration.FormItemTitleLocation = SystemEnumeration.FormItemTitleLocation.Auto
  public warningOnEdit: boolean = false
  public skipOnInput: boolean = false
  // public dataPath: boolean = false
  public footerDataPath: string = ""
  // public extendedTooltip: boolean = false
  public editMode: SystemEnumeration.ColumnEditMode = SystemEnumeration.ColumnEditMode.Enter
  // public parent: boolean = false
  public shortcut: IShortcut = undefined
  // public table: boolean = false
  public footerText: string = ""
  public readOnly: boolean = false
  public fixingInTable: boolean = false
  public titleTextColor: IColor = undefined
  public FooterTextColor: IColor = undefined
  public TitleBackColor: IColor = undefined
  public FooterBackColor: IColor = undefined
  public TitleFont: IFont = undefined
  public FooterFont: IFont = undefined
}
