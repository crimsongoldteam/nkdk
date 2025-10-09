import { CstChildrenDictionary, IToken } from "chevrotain"
import { SectionParser } from "./sectionParser"
import { ISection, ICSTLine } from "./types"
import { joinTokens, visitAll } from "../visitorUtils"

const BaseVisitor: new () => any = new SectionParser().getBaseCstVisitorConstructor()

interface ISectionVisitor {
  title: string | undefined
  content: string | undefined
  isHeader: boolean
}

export class SectionVisitor extends BaseVisitor {
  public lines(ctx: ICSTLine[]): ISection[] {
    const result: ISection[] = []
    let currentSection: ISection | null = null

    for (const line of ctx) {
      const data = this.visit(line) as unknown as ISectionVisitor

      if (data.isHeader) {
        currentSection = { title: data.title || "", content: "" }
        result.push(currentSection)
      } else if (data.content) {
        if (!currentSection) {
          currentSection = { title: "", content: "" }
          result.push(currentSection)
        }
        currentSection.content += (currentSection.content ? "\n" : "") + data.content
      }
    }

    return result.length > 0 ? result : [{ title: "", content: "" }]
  }

  line(ctx: CstChildrenDictionary): ISectionVisitor {
    let result: ISectionVisitor = {
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

  sectionHeader(ctx: CstChildrenDictionary): string {
    const text = joinTokens(ctx.Text as IToken[])
    return text || ""
  }

  text(ctx: CstChildrenDictionary): string | undefined {
    const text = joinTokens(ctx.Text as IToken[])
    return text || ""
  }
}
