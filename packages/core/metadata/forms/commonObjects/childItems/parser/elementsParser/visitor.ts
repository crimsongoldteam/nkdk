// import type { CstChildrenDictionary, CstNode, IToken } from "chevrotain"
// import type { ChoiceList } from "~/metadata/commonObjects/choiceList/types"
// import type { I8nText } from "~/metadata/commonObjects/i8nText/types"
// import { importPictureFromYAML } from "~/metadata/commonObjects/picture/fromYAML"
// import type { ConfigurationContext } from "~/metadata/context/types"
// import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"
// import type { Button } from "~/metadata/forms/elements/button/types"
// import { ButtonGroup } from "~/metadata/forms/elements/buttonGroup/types"
// import type { CheckBoxField } from "~/metadata/forms/elements/checkBoxField/types"
// import { ColumnGroup } from "~/metadata/forms/elements/columnGroup/types"
// import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
// import type { InputField } from "~/metadata/forms/elements/inputField/types"
// import type { LabelDecoration } from "~/metadata/forms/elements/labelDecoration/types"
// import { LabelField } from "~/metadata/forms/elements/labelField/types"
// import { Page } from "~/metadata/forms/elements/page/types"
// import { Pages } from "~/metadata/forms/elements/pages/types"
// import type { PictureDecoration } from "~/metadata/forms/elements/pictureDecoration/types"
// import type { PictureField } from "~/metadata/forms/elements/pictureField/types"
// import { Popup } from "~/metadata/forms/elements/popup/types"
// import type { RadioButtonField } from "~/metadata/forms/elements/radioButtonField/types"
// import { SearchControlAddition } from "~/metadata/forms/elements/searchControlAddition/types"
// import { SearchStringAddition } from "~/metadata/forms/elements/searchStringAddition/types"
// import { Table } from "~/metadata/forms/elements/table/types"
// import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
// import { importFormElementTypeFromYAML } from "~/metadata/metadataFactory/metadataType/fromYAML"
// import {
//   CollectionFormElementType,
//   FormElementTypeYAML,
//   SingleFormElementType,
// } from "~/metadata/metadataFactory/metadataType/types"
// import { NamedElement } from "../../../../elements/baseElement/types"
// import { joinTokens, visitAll } from "../visitorUtils"
// import { Parser } from "./parser"

// const BaseVisitor = new Parser().getBaseCstVisitorConstructor()

// export class Visitor extends BaseVisitor {
//   // #region labelField

//   public labelField(ctx: CstChildrenDictionary, context: ConfigurationContext): LabelField {
//     const titleText = joinTokens(ctx.LabelHeader as IToken[])

//     const titleName = joinTokens(ctx.LabelHeaderName as IToken[]) || titleText

//     const name = this.visit(ctx.properties as CstNode[], context) || titleName

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     const result: LabelField = {
//       itemType: CollectionFormElementType.LabelField,
//       name: name,
//     }

//     if (title !== undefined) {
//       result.title = title
//     }

//     return result
//   }

//   public labelDecoration(ctx: CstChildrenDictionary, context: ConfigurationContext): LabelDecoration {
//     const labelContent = joinTokens(ctx.LabelContent as IToken[]) || ""

//     const titleText = labelContent

//     const name = this.visit(ctx.properties as CstNode[], context) || titleText

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     const result: LabelDecoration = {
//       itemType: "LabelDecoration",
//       name: name || "",
//       title: title ? { items: title.items, formatted: false } : undefined,
//     }

//     return result
//   }
//   // #endregion

//   // #region pictureDecoration
//   pictureDecoration(ctx: CstChildrenDictionary, context: ConfigurationContext): PictureDecoration {
//     // Извлекаем ссылку на картинку из токена Picture
//     const pictureToken = ctx.Picture?.[0] as IToken | undefined
//     const pictureRef = pictureToken?.image?.replace(/^@/, "").trim() || ""

//     const picture = importPictureFromYAML(context, undefined, pictureRef)

//     const titleText = joinTokens(ctx.LabelContent as IToken[])
//     const name = this.visit(ctx.properties as CstNode[], context)

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     const result = {
//       itemType: CollectionFormElementType.PictureDecoration,
//       name: name || "",
//       picture: picture,
//       title: title ? { items: title.items, formatted: false } : undefined,
//     } as PictureDecoration

//     return result
//   }
//   // #endregion

//   // #region inputField

//   inputField(ctx: CstChildrenDictionary, context: ConfigurationContext): InputField {
//     const titleText = joinTokens(ctx.InputHeader as IToken[])

//     const titleName = joinTokens(ctx.InputHeaderName as IToken[]) || titleText

//     const name = this.visit(ctx.properties as CstNode[], context) || titleName

//     const modifiers = joinTokens(ctx.InputModifiers as IToken[])

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     const modificators = this.addInputModifiers(modifiers)

//     const result: InputField = {
//       itemType: CollectionFormElementType.InputField,
//       name: name,
//       ...modificators,
//     }

//     if (title !== undefined) {
//       result.title = title
//     }

//     return result
//   }

//   addInputModifiers(
//     modifiers: string | undefined
//   ): Partial<Pick<InputField, "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton">> {
//     if (modifiers === undefined) {
//       return {}
//     }

//     const propertyMap: {
//       [key: string]: "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton"
//     } = {
//       с: "dropListButton",
//       в: "choiceButton",
//       х: "clearButton",
//       x: "clearButton",
//       д: "spinButton",
//       о: "openButton",
//       o: "openButton",
//     }

//     const result: Partial<
//       Pick<InputField, "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton">
//     > = {}

//     for (const element of modifiers) {
//       const key = element.toLowerCase()
//       const value = propertyMap[key]
//       if (value === undefined) continue

//       result[value] = true
//     }

//     return result
//   }

//   // #endregion

//   // #region button

//   button(ctx: CstChildrenDictionary, context: ConfigurationContext): Button {
//     const titleText = joinTokens(ctx.Button as IToken[])
//     const name = this.visit(ctx.properties as CstNode[], context) || titleText

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     const result: Button = {
//       itemType: CollectionFormElementType.Button,
//       name: name || "",
//     }

//     if (title !== undefined) {
//       result.title = title
//     }

//     return result
//   }
//   // #endregion

//   // #region checkboxField
//   rightTitledCheckboxField(ctx: CstChildrenDictionary, context: ConfigurationContext): CheckBoxField {
//     const titleText = joinTokens(ctx.CheckboxHeader as IToken[])
//     const propertiesNodes = (ctx.properties || []) as CstNode[]
//     const name = (propertiesNodes.length > 0 ? this.visit(propertiesNodes[0], context) : undefined) || titleText || ""

//     const checkBoxType = ctx.SwitchChecked || ctx.SwitchUnchecked ? "Switch" : undefined
//     const result: CheckBoxField = {
//       itemType: CollectionFormElementType.CheckBoxField,
//       name,
//       headerHorizontalAlign: "Right",
//     }

//     if (titleText !== undefined) {
//       result.title = this.createTitle(titleText, context.defaultLanguage)
//     }

//     if (checkBoxType !== undefined) {
//       result.checkBoxType = checkBoxType
//     }

//     return result
//   }

//   leftTitledCheckboxField(ctx: CstChildrenDictionary, context: ConfigurationContext): CheckBoxField {
//     const titleText = joinTokens(ctx.CheckboxHeader as IToken[])
//     const propertiesNodes = (ctx.properties || []) as CstNode[]
//     const name = (propertiesNodes.length > 0 ? this.visit(propertiesNodes[0], context) : undefined) || titleText || ""

//     const checkBoxType = ctx.SwitchChecked || ctx.SwitchUnchecked ? "Switch" : undefined

//     const result: any = {
//       itemType: CollectionFormElementType.CheckBoxField,
//       name,
//     }

//     if (titleText !== undefined) {
//       result.title = this.createTitle(titleText, context.defaultLanguage)
//     }

//     if (checkBoxType !== undefined) {
//       result.checkBoxType = checkBoxType
//     }

//     return result
//   }

//   //#endregion

//   //  #region radioButtonField

//   radioButtonField(ctx: CstChildrenDictionary, context: ConfigurationContext): RadioButtonField {
//     const titleText = joinTokens(ctx.RadioButtonHeader as IToken[]) || ""

//     const name = this.visit(ctx.properties as CstNode[], context) || titleText

//     const items = visitAll(this, ctx.radioButtonItem, context) as unknown as {
//       checked: boolean
//       description: string
//     }[]

//     const choiceList: ChoiceList = items.map((item) => ({
//       type: "formChoiceListDesTimeValue",
//       value: {
//         type: "string",
//         value: item.description,
//       },
//       presentation: {
//         items: { [context.defaultLanguage]: item.description },
//       },
//     }))

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     return {
//       itemType: CollectionFormElementType.RadioButtonField,
//       name: name || "",
//       id: undefined,
//       choiceList: choiceList,
//       title: title,
//     } as RadioButtonField
//   }

//   radioButtonItem(ctx: CstChildrenDictionary): any {
//     const checked = !!ctx.RadioButtonChecked
//     const description = joinTokens(ctx.RadioButtonValueDescription as IToken[]) ?? ""
//     return { checked: checked, description: description }
//   }

//   // #endregion

//   // #region commandBar

//   commandBar(ctx: CstChildrenDictionary, context: ConfigurationContext): CommandBar {
//     const childItems = visitAll(this, ctx.commandBarItem, context) as unknown as CommandBar["childItems"]
//     const filteredChildItems = childItems.filter((item) => {
//       if (item.name !== "") return true
//       if (item.title === undefined) return false
//       return Object.values(item.title.items).some((value) => value !== "")
//     })

//     const name = this.visit(ctx.properties as CstNode[], context) || "CommandBar"

//     const result: CommandBar = {
//       itemType: CollectionFormElementType.CommandBar,
//       name: name,
//       childItems: filteredChildItems,
//     }

//     return result
//   }

//   autoCommandBar(ctx: CstChildrenDictionary, context: ConfigurationContext): AutoCommandBar {
//     const childItems = visitAll(this, ctx.commandBarItem, context) as unknown as AutoCommandBar["childItems"]
//     const filteredChildItems = childItems.filter((item) => {
//       if (item.name !== "") return true
//       if (item.title === undefined) return false
//       return Object.values(item.title.items).some((value) => value !== "")
//     })
//     const autofill = ctx.Dots !== undefined && ctx.Dots.length > 0

//     const result: AutoCommandBar = {
//       itemType: SingleFormElementType.AutoCommandBar,
//       autofill: autofill,
//       childItems: filteredChildItems,
//     }
//     return result
//   }

//   commandBarItem(
//     ctx: CstChildrenDictionary,
//     context: ConfigurationContext
//   ): Button | ButtonGroup | Popup | SearchControlAddition | SearchStringAddition {
//     if (ctx.commandBarButtonGroup) {
//       return this.visit(ctx.commandBarButtonGroup as CstNode[], context)
//     }
//     if (ctx.commandBarPopup) {
//       return this.visit(ctx.commandBarPopup as CstNode[], context)
//     }
//     if (ctx.commandBarSearchAddition) {
//       return this.visit(ctx.commandBarSearchAddition as CstNode[], context)
//     }
//     return this.visit(ctx.commandBarButton as CstNode[], context)
//   }

//   commandBarButton(ctx: CstChildrenDictionary, context: ConfigurationContext): Button | ButtonGroup {
//     const titleText = joinTokens(ctx.Button as IToken[]) || ""
//     const name = this.visit(ctx.properties as CstNode[], context) || titleText

//     const hashToken = ctx.Hash ? (ctx.Hash as IToken[]).length > 0 : false

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     if (hashToken) {
//       return {
//         itemType: CollectionFormElementType.ButtonGroup,
//         name: name || "",
//         title: title,
//         childItems: [],
//       }
//     }

//     const result: Button = {
//       itemType: CollectionFormElementType.Button,
//       name: name || "",
//       title: title,
//     }

//     return result
//   }

//   commandBarButtonGroup(ctx: CstChildrenDictionary, context: ConfigurationContext): ButtonGroup {
//     const titleText = joinTokens(ctx.Button as IToken[]) || ""
//     const name = this.visit(ctx.properties as CstNode[], context) || titleText

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     const result: ButtonGroup = {
//       itemType: CollectionFormElementType.ButtonGroup,
//       name: name || "",
//       title: title,
//       childItems: [],
//     }

//     return result
//   }

//   commandBarPopup(ctx: CstChildrenDictionary, context: ConfigurationContext): Popup {
//     const titleText = joinTokens(ctx.Button as IToken[]) || ""
//     const name = this.visit(ctx.properties as CstNode[], context) || titleText

//     const title = this.createTitle(titleText, context.defaultLanguage)

//     const result: Popup = {
//       itemType: CollectionFormElementType.Popup,
//       name: name || "",
//       title: title,
//       childItems: [],
//     }

//     return result
//   }

//   commandBarSearchAddition(
//     ctx: CstChildrenDictionary,
//     context: ConfigurationContext
//   ): SearchControlAddition | SearchStringAddition {
//     const titleText = joinTokens(ctx.Button as IToken[]) || ""
//     const name = this.visit(ctx.properties as CstNode[], context) || titleText

//     // Определяем тип по тексту: "УправлениеПоиском" -> SearchControlAddition, "ОтображениеСтрокиПоиска" -> SearchStringAddition
//     const isSearchControl = titleText.includes("УправлениеПоиском")
//     const isSearchString = titleText.includes("ОтображениеСтрокиПоиска")

//     if (isSearchControl) {
//       const result: SearchControlAddition = {
//         itemType: CollectionFormElementType.SearchControlAddition,
//         name: name || "",
//         childItems: [],
//       }
//       return result
//     }

//     if (isSearchString) {
//       const result: SearchStringAddition = {
//         itemType: CollectionFormElementType.SearchStringAddition,
//         name: name || "",
//       }
//       return result
//     }

//     // По умолчанию возвращаем SearchControlAddition
//     const result: SearchControlAddition = {
//       itemType: CollectionFormElementType.SearchControlAddition,
//       name: name || "",
//       childItems: [],
//     }
//     return result
//   }

//   // #endregion

//   // #region table
//   table(ctx: CstChildrenDictionary, context: ConfigurationContext): Table {
//     const cells = visitAll(this, ctx.tableCell as CstNode[], context) as unknown as Array<{
//       type?: "checkbox" | "label" | "columnGroup" | "input" | "picture"
//       name: string
//       title?: string
//       properties?: string
//       checkBoxType?: "Switch" | undefined
//     }>

//     const childItems: Array<CheckBoxField | ColumnGroup | InputField | LabelField | PictureField> = []
//     let tableName: string | undefined

//     // Обрабатываем ячейки таблицы
//     // Последняя ячейка с только properties (без name или с пустым name) - это имя таблицы
//     // Остальные ячейки - это колонки
//     for (let i = 0; i < cells.length; i++) {
//       const cell = cells[i]
//       const isLast = i === cells.length - 1

//       // Если это последняя ячейка и в ней только properties без текста и без специального типа, это имя таблицы
//       if (
//         isLast &&
//         cell.properties &&
//         (!cell.name || !cell.name.trim()) &&
//         cell.type !== "checkbox" &&
//         cell.type !== "label" &&
//         cell.type !== "columnGroup" &&
//         cell.type !== "picture"
//       ) {
//         tableName = cell.properties
//         continue
//       }

//       // Обрабатываем разные типы элементов
//       if (cell.type === "checkbox") {
//         // Checkbox field: [ ] title {name}
//         if (cell.properties) {
//           childItems.push({
//             itemType: CollectionFormElementType.CheckBoxField,
//             name: cell.properties,
//             title: cell.title ? this.createTitle(cell.title, context.defaultLanguage) : undefined,
//             checkBoxType: cell.checkBoxType,
//           } as CheckBoxField)
//         }
//       } else if (cell.type === "label") {
//         // Label field: ~{name}
//         if (cell.properties) {
//           childItems.push({
//             itemType: CollectionFormElementType.LabelField,
//             name: cell.properties,
//           } as LabelField)
//         }
//       } else if (cell.type === "columnGroup") {
//         // Column group: #{name}
//         if (cell.properties) {
//           childItems.push({
//             itemType: CollectionFormElementType.ColumnGroup,
//             name: cell.properties,
//             childItems: [],
//           } as ColumnGroup)
//         }
//       } else if (cell.type === "picture") {
//         // Picture field: @{name}
//         if (cell.properties) {
//           childItems.push({
//             itemType: CollectionFormElementType.PictureField,
//             name: cell.properties,
//           } as PictureField)
//         }
//       } else {
//         // Regular input field: text {name} or just text
//         if (cell.properties) {
//           if (cell.name && cell.name.trim()) {
//             // Если в ячейке есть и name, и properties, это колонка
//             // properties - это имя колонки, name - это заголовок
//             childItems.push({
//               itemType: CollectionFormElementType.InputField,
//               name: cell.properties,
//               title: this.createTitle(cell.name, context.defaultLanguage),
//             } as InputField)
//           } else if (isLast) {
//             // Если в последней ячейке есть только properties (без name), это имя таблицы
//             tableName = cell.properties
//           } else {
//             // Если в не последней ячейке есть только properties (без name), это колонка без заголовка
//             childItems.push({
//               itemType: CollectionFormElementType.InputField,
//               name: cell.properties,
//             } as InputField)
//           }
//         } else if (cell.name && cell.name.trim()) {
//           // Если в ячейке есть только name (без properties), это колонка с именем = name
//           if (!isLast) {
//             childItems.push({
//               itemType: CollectionFormElementType.InputField,
//               name: cell.name,
//             } as InputField)
//           }
//         }
//       }
//     }

//     return {
//       name: tableName || "",
//       itemType: CollectionFormElementType.Table,
//       childItems: childItems,
//     } as Table
//   }

//   tableCell(
//     ctx: CstChildrenDictionary,
//     context: ConfigurationContext
//   ): {
//     type?: "checkbox" | "label" | "columnGroup" | "input" | "picture"
//     name: string
//     title?: string
//     properties?: string
//     checkBoxType?: "Switch" | undefined
//   } {
//     const tableDataCellNodes = ctx.tableDataCell
//       ? (Array.isArray(ctx.tableDataCell) ? ctx.tableDataCell : [ctx.tableDataCell]).filter(
//           (item) => "children" in item
//         )
//       : []

//     if (tableDataCellNodes.length === 0) {
//       return { name: "", properties: undefined }
//     }

//     const tableDataCell = this.visit(tableDataCellNodes[0] as CstNode, context) as {
//       type?: "checkbox" | "label" | "columnGroup" | "input" | "picture"
//       name: string
//       title?: string
//       properties?: string
//       checkBoxType?: "Switch" | undefined
//     }

//     return tableDataCell
//   }

//   tableDataCell(
//     ctx: CstChildrenDictionary,
//     context: ConfigurationContext
//   ): {
//     type?: "checkbox" | "label" | "columnGroup" | "input" | "picture"
//     name: string
//     title?: string
//     properties?: string
//     checkBoxType?: "Switch" | undefined
//   } {
//     // Checkbox field: [ ] title {name} or [X] title {name}
//     if (ctx.CheckboxChecked || ctx.CheckboxUnchecked || ctx.SwitchChecked || ctx.SwitchUnchecked) {
//       const titleText = joinTokens(ctx.CheckboxHeader as IToken[]) || ""
//       const properties = ctx.properties
//         ? (this.visit(ctx.properties as CstNode[], context) as string | undefined)
//         : undefined
//       const checkBoxType = ctx.SwitchChecked || ctx.SwitchUnchecked ? ("Switch" as const) : undefined

//       return {
//         type: "checkbox",
//         name: properties || "",
//         title: titleText || undefined,
//         properties: properties,
//         checkBoxType,
//       }
//     }

//     // Label field: ~{name}
//     if (ctx.Tilde) {
//       const properties = ctx.properties
//         ? (this.visit(ctx.properties as CstNode[], context) as string | undefined)
//         : undefined

//       return {
//         type: "label",
//         name: properties || "",
//         properties: properties,
//       }
//     }

//     // Column group: #{name}
//     if (ctx.Hash) {
//       const properties = ctx.properties
//         ? (this.visit(ctx.properties as CstNode[], context) as string | undefined)
//         : undefined

//       return {
//         type: "columnGroup",
//         name: properties || "",
//         properties: properties,
//       }
//     }

//     // Picture field: @{name}
//     if (ctx.Picture) {
//       const properties = ctx.properties
//         ? (this.visit(ctx.properties as CstNode[], context) as string | undefined)
//         : undefined

//       return {
//         type: "picture",
//         name: properties || "",
//         properties: properties,
//       }
//     }

//     // Regular input field: text {name} or just text
//     const cellText = joinTokens(ctx.TableCell as IToken[]) || ""
//     const properties = ctx.properties
//       ? (this.visit(ctx.properties as CstNode[], context) as string | undefined)
//       : undefined

//     return {
//       type: "input",
//       name: cellText || "",
//       properties: properties,
//     }
//   }
//   // #endregion

//   // #region pages
//   pages(ctx: CstChildrenDictionary, context: ConfigurationContext): Pages {
//     const titleText = joinTokens(ctx.PageHeaderText as IToken[]) || ""
//     const name = this.visit(ctx.properties as CstNode[], context) || titleText
//     return {
//       itemType: CollectionFormElementType.Pages,
//       name: name || titleText,
//       title: this.createTitle(titleText, context.defaultLanguage),
//       id: undefined,
//       childItems: [],
//     } as Pages
//   }

//   page(ctx: CstChildrenDictionary, context: ConfigurationContext): Page {
//     const titleText = joinTokens(ctx.PageHeaderText as IToken[]) || ""
//     const name = this.visit(ctx.properties as CstNode[], context) || titleText
//     return {
//       itemType: CollectionFormElementType.Page,
//       name: name || titleText,
//       title: this.createTitle(titleText, context.defaultLanguage),
//       id: undefined,
//       childItems: [],
//     } as Page
//   }

//   // #endregion

//   // #region verticalGroup
//   verticalGroup(ctx: CstChildrenDictionary, context: ConfigurationContext): UsualGroup {
//     const title = joinTokens(ctx.GroupHeaderText as IToken[])

//     const name = this.visit(ctx.properties as CstNode[], context)

//     const result: UsualGroup = {
//       name: name,
//       itemType: CollectionFormElementType.UsualGroup,
//       group: "Vertical",
//       childItems: [],
//     }

//     if (title !== undefined) {
//       // Always create title if title token exists (even if empty string)
//       result.title = this.createTitle(title, context.defaultLanguage)
//     }
//     // Don't set showTitle or title if title is undefined

//     return result
//   }

//   horizontalGroup(ctx: CstChildrenDictionary, context: ConfigurationContext): UsualGroup {
//     const title = joinTokens(ctx.GroupHeaderText as IToken[])
//     const hasHash = !!ctx.Hash

//     const name = this.visit(ctx.properties as CstNode[], context)

//     const result: UsualGroup = {
//       name: name,
//       itemType: CollectionFormElementType.UsualGroup,
//       childItems: [],
//     }

//     if (!hasHash) {
//       result.group = "Horizontal"
//     }

//     if (title !== undefined) {
//       // Always create title if title token exists (even if empty string)
//       result.title = this.createTitle(title, context.defaultLanguage)
//     }
//     // Don't set showTitle or title if title is undefined

//     return result
//   }

//   oneLineGroup(ctx: CstChildrenDictionary, context: ConfigurationContext): UsualGroup {
//     const title = joinTokens(ctx.GroupHeaderText as IToken[])
//     const hasHash = !!ctx.Hash

//     const name = this.visit(ctx.properties as CstNode[], context)

//     const result: UsualGroup = {
//       name: name,
//       itemType: CollectionFormElementType.UsualGroup,
//       childItems: [],
//     }

//     if (!hasHash) {
//       result.group = "Horizontal"
//     }

//     if (title !== undefined) {
//       result.title = this.createTitle(title, context.defaultLanguage)
//     } else {
//       result.showTitle = false
//     }

//     return result
//   }

//   // #endregion

//   // #region oneLineGroupElements
//   oneLineGroupElements(
//     ctx: { oneLineGroupElementsHeader: CstNode; oneLineGroupElementsContent: CstNode[] },
//     context: ConfigurationContext
//   ): { group: IToken[]; elements: IToken[][] } {
//     const group: IToken[] = this.visit(ctx.oneLineGroupElementsHeader, context)
//     const elements: IToken[][] = visitAll(this, ctx.oneLineGroupElementsContent, context) as unknown as IToken[][]
//     return { group, elements }
//   }

//   oneLineGroupElementsHeader(
//     ctx: { OneLineGroupElementsHeaderLabel: IToken[] },
//     _context: ConfigurationContext
//   ): IToken[] {
//     return ctx.OneLineGroupElementsHeaderLabel
//   }

//   oneLineGroupElementsContent(
//     ctx: { OneLineGroupElementsContentLabel: IToken[] },
//     _context: ConfigurationContext
//   ): IToken[] {
//     return ctx.OneLineGroupElementsContentLabel
//   }
//   // #endregion

//   // #region otherField
//   otherField(ctx: CstChildrenDictionary, context: ConfigurationContext): NamedElement {
//     const name = this.visit(ctx.properties as CstNode[], context)
//     const otherFieldType = joinTokens(ctx.OtherFieldType as IToken[]) as FormElementTypeYAML

//     const itemType = importFormElementTypeFromYAML(context, otherFieldType)
//     return {
//       itemType: itemType,
//       name: name,
//     }
//   }
//   // #endregion

//   // #region properties
//   properties(ctx: CstChildrenDictionary): string | undefined {
//     const properties = joinTokens(ctx.PropertiesNameText as IToken[])
//     return properties
//   }

//   createTitle(titleText: string | undefined, defaultLanguage: string): I8nText | undefined {
//     return titleText !== undefined
//       ? {
//           items: {
//             [defaultLanguage]: titleText,
//           },
//         }
//       : undefined
//   }
// }
// export const visitor = new Visitor()
// //   // #region form

// //   form(ctx: CstChildrenDictionary): ClientApplicationForm {
// //     return clientApplicationFormVisit(this, ctx)
// //   }

// //   formHeader(ctx: CstChildrenDictionary): IClientApplicationFormHeaderVisit {
// //     return clientApplicationFormHeaderVisit(this, ctx)
// //   }

// //   // #endregion

// //   // #region field

// //   field(ctx: CstChildrenDictionary): any {
// //     const firstKey = Object.keys(ctx)[0]
// //     const firstValue = ctx[firstKey as keyof typeof ctx]
// //     return this.visit(firstValue as CstNode[])
// //   }

// //   // #endregion

// //   inputField(ctx: CstChildrenDictionary): InputField {
// //     return inputFieldVisit(this, ctx)
// //   }
// // }
