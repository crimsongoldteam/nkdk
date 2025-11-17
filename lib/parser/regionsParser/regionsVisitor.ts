import { CstChildrenDictionary, IToken } from "chevrotain"
import { RegionsParser } from "./regionsParser"
import { ISection, ICSTLine } from "./types"
import { joinTokens, visitAll } from "../visitorUtils"

const BaseVisitor: new () => any =
  new RegionsParser().getBaseCstVisitorConstructor()

interface IRegionsVisitor {
  title: string | undefined
  content: string | undefined
  isHeader: boolean
}

export class RegionsVisitor extends BaseVisitor {
  public lines(ctx: ICSTLine[]): ISection[] {
    const result: ISection[] = []
    let currentRegion: ISection | null = null

    for (const line of ctx) {
      const data = this.visit(line) as unknown as IRegionsVisitor

      if (data.isHeader) {
        currentRegion = { title: data.title || "", content: "" }
        result.push(currentRegion)
      } else if (data.content) {
        if (!currentRegion) {
          currentRegion = { title: "", content: "" }
          result.push(currentRegion)
        }
        currentRegion.content +=
          (currentRegion.content ? "\n" : "") + data.content
      }
    }

    return result.length > 0 ? result : [{ title: "", content: "" }]
  }

  line(ctx: CstChildrenDictionary): IRegionsVisitor {
    let result: IRegionsVisitor = {
      title: undefined,
      content: undefined,
      isHeader: false,
    }

    if (ctx.sectionHeader) {
      result.isHeader = true
      const header = visitAll(this, ctx.sectionHeader) as unknown as string[]
      result.title = header.join("")
    }
    if (ctx.text) {
      const text = visitAll(this, ctx.text) as unknown as string[]
      result.content = text.join("")
    }
    return result
  }

  header(ctx: CstChildrenDictionary): string {
    const text = joinTokens(ctx.Text as IToken[])
    return text || ""
  }

  text(ctx: CstChildrenDictionary): string | undefined {
    const text = joinTokens(ctx.Text as IToken[])
    return text || ""
  }
}
