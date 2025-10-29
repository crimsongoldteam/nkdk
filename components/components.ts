import { InputField } from "./inputField/inputField"
import { UsualGroup } from "./usualGroup/usualGroup"
import { ButtonComponent } from "./button/button"
import { PagesComponent } from "./pages/pages"
import { CheckBoxFieldComponent } from "./checkBoxField/checkBoxField"
import { LabelDecorationComponent } from "./labelDecoration/labelDecoration"
import { PictureDecorationComponent } from "./pictureDecoration/pictureDecoration"
import { TableComponent } from "./table/table"
import { TElementType, ZElementType } from "~/lib/metadata/systemEnumerations/types"

export const components: Partial<Record<TElementType, React.ComponentType<any>>> = {
  [ZElementType.enum.InputField]: InputField,
  [ZElementType.enum.UsualGroup]: UsualGroup,
  [ZElementType.enum.Button]: ButtonComponent,
  [ZElementType.enum.Pages]: PagesComponent,
  [ZElementType.enum.CheckBoxField]: CheckBoxFieldComponent,
  [ZElementType.enum.LabelDecoration]: LabelDecorationComponent,
  [ZElementType.enum.PictureDecoration]: PictureDecorationComponent,
  [ZElementType.enum.Table]: TableComponent,
}
