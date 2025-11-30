import type { CstChildrenDictionary, CstNode, IToken } from "chevrotain"
import type { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import type { TButton } from "~/lib/metadata/forms/elements/button/types"
import type { TCheckBoxField } from "~/lib/metadata/forms/elements/checkBoxField/types"
import type { TCommandBar } from "~/lib/metadata/forms/elements/commandBar/types"
import type { TInputField } from "~/lib/metadata/forms/elements/inputField/types"
import type { TLabelDecoration } from "~/lib/metadata/forms/elements/labelDecoration/types"
import type { TPage } from "~/lib/metadata/forms/elements/page/types"
import type { TPages } from "~/lib/metadata/forms/elements/pages/types"
import type { TRadioButtonField } from "~/lib/metadata/forms/elements/radioButtonField/types"
import type { TTable } from "~/lib/metadata/forms/elements/table/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import type { TUsualGroup } from "~/lib/metadata/forms/elements/usualGroup/types"
import { joinTokens } from "../visitorUtils"
import { Parser } from "./parser"

const BaseVisitor = new Parser().getBaseCstVisitorConstructor()

export class Visitor extends BaseVisitor {
  public labelDecoration(
    ctx: CstChildrenDictionary,
    configurationSettings: TConfigurationSettings
  ): TLabelDecoration {
    const labelContent = joinTokens(ctx.LabelContent as IToken[]) || ""

    const titleText = labelContent

    const name = this.visit(ctx.properties as CstNode[]) || titleText

    return {
      elementType: ZElementType.enum.LabelDecoration,
      name: name || "",
      title: this.createTitle(titleText, configurationSettings.defaultLanguage),
      id: undefined,
    } as TLabelDecoration
  }

  // #region inputField

  inputField(
    ctx: CstChildrenDictionary,
    configurationSettings: TConfigurationSettings
  ): TInputField {
    const titleText = joinTokens(ctx.InputHeader as IToken[])

    const name = this.visit(ctx.properties as CstNode[]) || titleText

    const modifiers = joinTokens(ctx.InputModifiers as IToken[])

    const title = this.createTitle(titleText, configurationSettings.defaultLanguage)

    const modificators = this.addInputModifiers(modifiers)

    const result = {
      elementType: ZElementType.enum.InputField,
      name: name,
      id: undefined,
      title: title,
      ...modificators,
    } as TInputField
    return result
  }

  addInputModifiers(
    modifiers: string | undefined
  ): Partial<
    Pick<
      TInputField,
      "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton"
    >
  > {
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
      Pick<
        TInputField,
        "dropListButton" | "choiceButton" | "clearButton" | "spinButton" | "openButton"
      >
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

  button(ctx: CstChildrenDictionary): TButton {
    const name = joinTokens(ctx.Button as IToken[]) || ""

    return {
      elementType: ZElementType.enum.Button,
      name: name || "",
      id: undefined,
    } as TButton
  }

  checkboxLeftField(ctx: CstChildrenDictionary): TCheckBoxField {
    const name = joinTokens(ctx.CheckboxHeader as IToken[]) || ""

    return {
      elementType: ZElementType.enum.CheckBoxField,
      name: name || "",
      id: undefined,
    } as TCheckBoxField
  }

  checkboxRightField(ctx: CstChildrenDictionary): TCheckBoxField {
    const name = joinTokens(ctx.CheckboxHeader as IToken[]) || ""

    return {
      elementType: ZElementType.enum.CheckBoxField,
      name: name || "",
      id: undefined,
    } as TCheckBoxField
  }

  commandBar(ctx: CstChildrenDictionary): TCommandBar {
    // Для commandBar имя берем из первой кнопки в buttonGroup
    const buttonGroup = ctx.buttonGroup
    let name = ""
    if (buttonGroup && Array.isArray(buttonGroup) && buttonGroup.length > 0) {
      const firstButton = buttonGroup[0]
      if (firstButton && "children" in firstButton && firstButton.children?.button) {
        const buttonNodes = firstButton.children.button
        if (Array.isArray(buttonNodes) && buttonNodes.length > 0) {
          const firstButtonNode = buttonNodes[0]
          if (firstButtonNode && "children" in firstButtonNode) {
            const buttonCtx = firstButtonNode.children
            name = joinTokens(buttonCtx.Button as IToken[]) || ""
          }
        }
      }
    }
    if (!name) {
      name = joinTokens(ctx.Button as IToken[]) || ""
    }

    return {
      elementType: ZElementType.enum.CommandBar,
      name: name || "",
      id: undefined,
    } as TCommandBar
  }

  buttonGroup(ctx: CstChildrenDictionary): any {
    if (ctx.button && Array.isArray(ctx.button)) {
      return ctx.button
        .filter((btn): btn is CstNode => "children" in btn)
        .map((btn) => this.visit(btn))
    }
    return []
  }

  pageHeader(ctx: CstChildrenDictionary): TPage {
    const name = joinTokens(ctx.PageHeaderText as IToken[]) || ""

    return {
      elementType: ZElementType.enum.Page,
      name: name || "",
      id: undefined,
    } as TPage
  }

  pagesHeader(ctx: CstChildrenDictionary): TPages {
    const name = joinTokens(ctx.PageHeaderText as IToken[]) || ""

    return {
      elementType: ZElementType.enum.Pages,
      name: name || "",
      id: undefined,
    } as TPages
  }

  verticalGroupHeader(ctx: CstChildrenDictionary): TUsualGroup {
    const name = joinTokens(ctx.GroupHeaderText as IToken[]) || ""

    return {
      elementType: ZElementType.enum.UsualGroup,
      name: name || "",
      id: undefined,
    } as TUsualGroup
  }

  horizontalGroup(ctx: CstChildrenDictionary): TUsualGroup {
    // Для горизонтальной группы берем имя из первого заголовка
    const verticalGroupHeaders = ctx.verticalGroupHeader
    let name = ""
    if (
      verticalGroupHeaders &&
      Array.isArray(verticalGroupHeaders) &&
      verticalGroupHeaders.length > 0
    ) {
      const firstHeader = verticalGroupHeaders[0]
      if (firstHeader && "children" in firstHeader && firstHeader.children?.GroupHeaderText) {
        name = joinTokens(firstHeader.children.GroupHeaderText as IToken[]) || ""
      }
    }

    return {
      elementType: ZElementType.enum.UsualGroup,
      name: name || "",
      id: undefined,
    } as TUsualGroup
  }

  table(ctx: CstChildrenDictionary): TTable {
    // Для таблицы берем имя из первой строки
    const tableLines = ctx.tableLine
    let name = ""
    if (tableLines && Array.isArray(tableLines) && tableLines.length > 0) {
      const firstLine = tableLines[0]
      if (firstLine && "children" in firstLine && firstLine.children?.tableCell) {
        const tableCells = firstLine.children.tableCell
        if (Array.isArray(tableCells) && tableCells.length > 0) {
          const firstCell = tableCells[0]
          if (firstCell && "children" in firstCell && firstCell.children?.tableDataCell) {
            const dataCells = firstCell.children.tableDataCell
            if (Array.isArray(dataCells) && dataCells.length > 0) {
              const firstDataCell = dataCells[0]
              if (firstDataCell && "children" in firstDataCell) {
                const cellCtx = firstDataCell.children
                name = joinTokens(cellCtx.TableCell as IToken[]) || ""
              }
            }
          }
        }
      }
    }

    return {
      elementType: ZElementType.enum.Table,
      name: name || "",
      id: undefined,
    } as TTable
  }

  radioButtonField(ctx: CstChildrenDictionary): TRadioButtonField {
    const name = joinTokens(ctx.RadioButtonHeader as IToken[]) || ""

    return {
      elementType: ZElementType.enum.RadioButtonField,
      name: name || "",
      id: undefined,
    } as TRadioButtonField
  }

  properties(ctx: CstChildrenDictionary): string | undefined {
    const properties = joinTokens(ctx.PropertiesNameText as IToken[])
    return properties
  }

  createTitle(titleText: string | undefined, defaultLanguage: string): TI8nText | undefined {
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

//   form(ctx: CstChildrenDictionary): TClientApplicationForm {
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

//   inputField(ctx: CstChildrenDictionary): TInputField {
//     return inputFieldVisit(this, ctx)
//   }
// }
