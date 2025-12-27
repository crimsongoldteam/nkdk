import type { CstChildrenDictionary, CstNode, IToken } from "chevrotain"
import type { ChoiceList } from "~/packages/core/metadata/commonObjects/choiceList/types"
import type { I8nText } from "~/packages/core/metadata/commonObjects/i8nText/types"
import type { Context } from "~/packages/core/metadata/context/types"
import type { Button } from "~/packages/core/metadata/forms/elements/button/types"
import type { CheckBoxField } from "~/packages/core/metadata/forms/elements/checkBoxField/types"
import { ChildItem } from "~/packages/core/metadata/forms/elements/childItems/types"
import { CommandBar } from "~/packages/core/metadata/forms/elements/commandBar/types"
import type { InputField } from "~/packages/core/metadata/forms/elements/inputField/types"
import type { LabelDecoration } from "~/packages/core/metadata/forms/elements/labelDecoration/types"
import { Page } from "~/packages/core/metadata/forms/elements/page/types"
import { Pages } from "~/packages/core/metadata/forms/elements/pages/types"
import type { RadioButtonField } from "~/packages/core/metadata/forms/elements/radioButtonField/types"
import { Table } from "~/packages/core/metadata/forms/elements/table/types"
import { UsualGroup } from "~/packages/core/metadata/forms/elements/usualGroup/types"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"
import { joinTokens, visitAll } from "../visitorUtils"
import { Parser } from "./parser"

const BaseVisitor = new Parser().getBaseCstVisitorConstructor()

export class Visitor extends BaseVisitor {
  // #region labelDecoration
  public labelDecoration(ctx: CstChildrenDictionary, context: Context): LabelDecoration {
    const labelContent = joinTokens(ctx.LabelContent as IToken[]) || ""

    const titleText = labelContent

    const name = this.visit(ctx.properties as CstNode[]) || titleText

    return {
      elementType: FormElementType.LabelDecoration,
      name: name || "",
      title: this.createTitle(titleText, context.defaultLanguage),
      id: undefined,
    } as LabelDecoration
  }
  // #endregion

  // #region inputField

  inputField(ctx: CstChildrenDictionary, context: Context): InputField {
    const titleText = joinTokens(ctx.InputHeader as IToken[])

    const name = this.visit(ctx.properties as CstNode[]) || titleText

    const modifiers = joinTokens(ctx.InputModifiers as IToken[])

    const title = this.createTitle(titleText, context.defaultLanguage)

    const modificators = this.addInputModifiers(modifiers)

    const result = {
      elementType: FormElementType.InputField,
      name: name,
      id: undefined,
      title: title,
      ...modificators,
    } as InputField
    return result
  }

  addInputModifiers(
    modifiers: string | undefined
  ): Partial<Pick<InputField, "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton">> {
    if (modifiers === undefined) {
      return {}
    }

    const propertyMap: {
      [key: string]: "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton"
    } = {
      с: "dropListButton",
      в: "choiceButton",
      х: "clearButton",
      x: "clearButton",
      д: "spinButton",
      о: "openButton",
      o: "openButton",
    }

    const result: Partial<
      Pick<InputField, "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton">
    > = {}

    for (const element of modifiers) {
      const key = element.toLowerCase()
      const value = propertyMap[key]
      if (value === undefined) continue

      result[value] = true
    }

    return result
  }

  // #endregion

  // #region button

  button(ctx: CstChildrenDictionary, context: Context): Button {
    const name = joinTokens(ctx.Button as IToken[]) || ""
    const titleText = joinTokens(ctx.Button as IToken[]) || ""

    const title = this.createTitle(titleText, context.defaultLanguage)

    return {
      elementType: FormElementType.Button,
      name: name || "",
      title: title,
      id: undefined,
    } as Button
  }
  // #endregion

  // #region checkboxField
  rightTitledCheckboxField(ctx: CstChildrenDictionary, context: Context): CheckBoxField {
    const titleText = joinTokens(ctx.CheckboxHeader as IToken[]) || ""

    const name = this.visit(ctx.properties as CstNode[]) || titleText

    const checkBoxType = ctx.SwitchChecked || ctx.SwitchUnchecked ? "Switch" : undefined
    return {
      elementType: FormElementType.CheckBoxField,
      name: name || "",
      title: this.createTitle(titleText, context.defaultLanguage),
      headerHorizontalAlign: "Right",
      id: undefined,
      checkBoxType: checkBoxType || undefined,
    } as CheckBoxField
  }

  leftTitledCheckboxField(ctx: CstChildrenDictionary, context: Context): CheckBoxField {
    const titleText = joinTokens(ctx.CheckboxHeader as IToken[]) || ""
    const name = this.visit(ctx.properties as CstNode[]) || titleText

    const checkBoxType = ctx.SwitchChecked || ctx.SwitchUnchecked ? "Switch" : undefined

    return {
      elementType: FormElementType.CheckBoxField,
      name: name || "",
      title: this.createTitle(titleText, context.defaultLanguage),
      id: undefined,
      checkBoxType: checkBoxType || undefined,
    } as CheckBoxField
  }

  //#endregion

  //  #region radioButtonField

  radioButtonField(ctx: CstChildrenDictionary, context: Context): RadioButtonField {
    const titleText = joinTokens(ctx.RadioButtonHeader as IToken[]) || ""

    const name = this.visit(ctx.properties as CstNode[]) || titleText

    const items = visitAll(this, ctx.radioButtonItem) as unknown as {
      checked: boolean
      description: string
    }[]

    const choiceList: ChoiceList = {
      items: items.map((item) => ({
        value: item.description,
        presentation: {
          items: { [context.defaultLanguage]: item.description },
        },
        checkState: item.checked ? 1 : 2,
      })),
    }

    const title = this.createTitle(titleText, context.defaultLanguage)

    return {
      elementType: FormElementType.RadioButtonField,
      name: name || "",
      id: undefined,
      choiceList: choiceList,
      title: title,
    } as RadioButtonField
  }

  radioButtonItem(ctx: CstChildrenDictionary): any {
    const checked = !!ctx.RadioButtonChecked
    const description = joinTokens(ctx.RadioButtonValueDescription as IToken[]) ?? ""
    return { checked: checked, description: description }
  }

  // #endregion

  // #region commandBar

  commandBar(ctx: CstChildrenDictionary, context: Context): CommandBar {
    const childItems = visitAll(this, ctx.commandBarButton, context) as unknown as CommandBar["childItems"]

    // Добавляем id для кнопок
    const childItemsWithId = childItems?.map(
      (item: ChildItem, index: number): Button =>
        ({
          ...(item as Button),
          id: String(index + 1),
        }) as Button
    )

    const name = joinTokens(ctx.properties as IToken[]) || "CommandBar"

    return {
      elementType: FormElementType.CommandBar,
      name: name,
      id: "1",
      childItems: childItemsWithId,
    } as CommandBar
  }

  commandBarButton(ctx: CstChildrenDictionary, context: Context): Button {
    const name = joinTokens(ctx.Button as IToken[]) || ""
    const titleText = joinTokens(ctx.Button as IToken[]) || ""

    const title = this.createTitle(titleText, context.defaultLanguage)

    return {
      elementType: FormElementType.Button,
      name: name || "",
      title: title,
      id: undefined,
    } as Button
  }

  // #endregion

  //   buttonGroup(ctx: CstChildrenDictionary): any
  //   if (ctx.button && Array.isArray(ctx.button)
  //   ) {
  //       return
  //   ctx;
  //   .
  //   button;
  //   .
  //   filter((btn): btn is CstNode
  //   => "children" in
  //   btn;
  //   )
  //         .
  //   map((btn)
  //   => this.
  //   visit(btn)
  //   )
  // }
  // return []

  // pageHeader(ctx: CstChildrenDictionary)
  // : Page
  // {
  //   const name = joinTokens(ctx.PageHeaderText as IToken[]) || ""

  //   return {
  //       elementType: FormElementType.Page,
  //       name: name || "",
  //       id: undefined,
  //     } as Page
  // }

  // pagesHeader(ctx: CstChildrenDictionary)
  // : Pages
  // {
  //   const name = joinTokens(ctx.PageHeaderText as IToken[]) || ""

  //   return {
  //       elementType: FormElementType.Pages,
  //       name: name || "",
  //       id: undefined,
  //     } as Pages
  // }

  // verticalGroupHeader(ctx: CstChildrenDictionary)
  // : UsualGroup
  // {
  //   const name = joinTokens(ctx.GroupHeaderText as IToken[]) || ""

  //   return {
  //       elementType: FormElementType.UsualGroup,
  //       name: name || "",
  //       id: undefined,
  //     } as UsualGroup
  // }

  // horizontalGroup(ctx: CstChildrenDictionary)
  // : UsualGroup
  // {
  //   // Для горизонтальной группы берем имя из первого заголовка
  //   const verticalGroupHeaders = ctx.verticalGroupHeader
  //   let name = ""
  //   if (
  //     verticalGroupHeaders &&
  //     Array.isArray(verticalGroupHeaders) &&
  //     verticalGroupHeaders.length > 0
  //   ) {
  //     const firstHeader = verticalGroupHeaders[0]
  //     if (firstHeader && "children" in firstHeader && firstHeader.children?.GroupHeaderText) {
  //       name = joinTokens(firstHeader.children.GroupHeaderText as IToken[]) || ""
  //     }
  //   }

  //   return {
  //       elementType: FormElementType.UsualGroup,
  //       name: name || "",
  //       id: undefined,
  //     } as UsualGroup
  // }

  // #region table
  table(ctx: CstChildrenDictionary, context: Context): Table {
    // Обрабатываем tableLine - это массив из AT_LEAST_ONE
    // В Chevrotain AT_LEAST_ONE создает массив с именем правила
    const tableLineValue = ctx.tableLine
    const tableLineArray = tableLineValue ? (Array.isArray(tableLineValue) ? tableLineValue : [tableLineValue]) : []

    const tableLines = visitAll(this, tableLineArray as CstNode[], context) as unknown as Array<{
      cells: Array<{ name: string; properties?: string }>
    }>

    const childItems: InputField[] = []
    let tableName: string | undefined

    // Обрабатываем первую строку таблицы (заголовки колонок)
    if (tableLines.length > 0) {
      const firstLine = tableLines[0]
      for (const cell of firstLine.cells) {
        if (cell.properties) {
          // Если в ячейке есть properties, это имя таблицы
          tableName = cell.properties
        }
        if (cell.name && cell.name.trim()) {
          // Если в ячейке есть имя (и оно не пустое), это колонка
          childItems.push({
            elementType: FormElementType.InputField,
            name: cell.name,
            id: undefined,
          } as InputField)
        }
      }
    }

    return {
      elementType: FormElementType.Table,
      name: tableName || "table",
      id: undefined,
      childItems: childItems,
    } as Table
  }

  tableLine(ctx: CstChildrenDictionary, context: Context): { cells: Array<{ name: string; properties?: string }> } {
    // Обрабатываем ячейки из AT_LEAST_ONE_SEP
    // В Chevrotain AT_LEAST_ONE_SEP создает массив с именем правила (tableCell)
    const cells = visitAll(this, ctx.tableCell as CstNode[], context) as unknown as Array<{
      name: string
      properties?: string
    }>

    return { cells }
  }

  tableCell(ctx: CstChildrenDictionary, context: Context): { name: string; properties?: string } {
    const tableDataCellNodes = ctx.tableDataCell
      ? (Array.isArray(ctx.tableDataCell) ? ctx.tableDataCell : [ctx.tableDataCell]).filter(
          (item) => "children" in item
        )
      : []

    if (tableDataCellNodes.length === 0) {
      return { name: "", properties: undefined }
    }

    const tableDataCell = this.visit(tableDataCellNodes[0] as CstNode, context) as {
      name: string
      properties?: string
    }

    return tableDataCell
  }

  tableDataCell(ctx: CstChildrenDictionary, _context: Context): { name: string; properties?: string } {
    // TableCellContinue с LABEL: "TableCell" попадает в тот же массив
    const tableCellTokens = (ctx.TableCell as IToken[]) || []
    const cellName = joinTokens(tableCellTokens) || ""

    // Обрабатываем properties
    const propertiesNode = ctx.properties
      ? Array.isArray(ctx.properties)
        ? ctx.properties[0]
        : ctx.properties
      : undefined
    const properties =
      propertiesNode && "children" in propertiesNode ? this.visit([propertiesNode as CstNode]) : undefined

    return {
      name: cellName || "",
      properties: properties as string | undefined,
    }
  }
  // #endregion

  // #region pages
  pages(ctx: CstChildrenDictionary, context: Context): Pages {
    const titleText = joinTokens(ctx.PageHeaderText as IToken[]) || ""
    const name = this.visit(ctx.properties as CstNode[]) || titleText
    return {
      elementType: FormElementType.Pages,
      name: name || titleText,
      title: this.createTitle(titleText, context.defaultLanguage),
      id: undefined,
      childItems: [],
    } as Pages
  }

  page(ctx: CstChildrenDictionary, context: Context): Page {
    const titleText = joinTokens(ctx.PageHeaderText as IToken[]) || ""
    const name = this.visit(ctx.properties as CstNode[]) || titleText
    return {
      elementType: FormElementType.Page,
      name: name || titleText,
      title: this.createTitle(titleText, context.defaultLanguage),
      id: undefined,
      childItems: [],
    } as Page
  }

  // #endregion

  // #region verticalGroup
  verticalGroup(ctx: CstChildrenDictionary, context: Context): UsualGroup {
    const titleText = joinTokens(ctx.GroupHeaderText as IToken[]) || ""
    const name = this.visit(ctx.properties as CstNode[]) || titleText
    return {
      elementType: FormElementType.UsualGroup,
      group: "Vertical",
      name: name || titleText,
      title: this.createTitle(titleText, context.defaultLanguage),
      id: undefined,
      childItems: [],
    } as UsualGroup
  }

  horizontalGroup(ctx: CstChildrenDictionary, context: Context): UsualGroup {
    const titleText = joinTokens(ctx.GroupHeaderText as IToken[]) || ""
    const name = this.visit(ctx.properties as CstNode[]) || titleText
    return {
      elementType: FormElementType.UsualGroup,
      group: "Horizontal",
      name: name || titleText,
      title: this.createTitle(titleText, context.defaultLanguage),
      id: undefined,
      childItems: [],
    } as UsualGroup
  }

  // #endregion

  // #region properties
  properties(ctx: CstChildrenDictionary): string | undefined {
    const properties = joinTokens(ctx.PropertiesNameText as IToken[])
    return properties
  }

  createTitle(titleText: string | undefined, defaultLanguage: string): I8nText | undefined {
    return titleText
      ? {
          items: {
            [defaultLanguage]: titleText,
          },
        }
      : undefined
  }
}
export const visitor = new Visitor()
//   // #region form

//   form(ctx: CstChildrenDictionary): ClientApplicationForm {
//     return clientApplicationFormVisit(this, ctx)
//   }

//   formHeader(ctx: CstChildrenDictionary): IClientApplicationFormHeaderVisit {
//     return clientApplicationFormHeaderVisit(this, ctx)
//   }

//   // #endregion

//   // #region field

//   field(ctx: CstChildrenDictionary): any {
//     const firstKey = Object.keys(ctx)[0]
//     const firstValue = ctx[firstKey as keyof typeof ctx]
//     return this.visit(firstValue as CstNode[])
//   }

//   // #endregion

//   inputField(ctx: CstChildrenDictionary): InputField {
//     return inputFieldVisit(this, ctx)
//   }
// }
