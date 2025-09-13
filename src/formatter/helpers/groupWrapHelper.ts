import { IFormatterParams } from "../interfaces"

export class GroupWrapHelper {
  public static wrap(lines: string[], params: IFormatterParams): string[] {
    const indent = this.getIndent(params)

    const result: string[] = [this.formatFirstLine(lines[0], params)]
    for (let i = 1; i < lines.length; i++) {
      result.push(indent + lines[i])
    }

    return this.addSpaces(result)
  }

  private static formatFirstLine(line: string, params: IFormatterParams): string {
    if (params.isFirst) {
      return line
    }
    // remove first symbol "#"
    return line.slice(1)
  }

  private static getIndent(params: IFormatterParams): string {
    return params.isFirst ? "  " : ""
  }

  private static addSpaces(textLines: string[]): string[] {
    const maxLength = this.getMaxLength(textLines)
    return textLines.map((line) => line.padEnd(maxLength, " "))
  }

  private static getMaxLength(textLines: string[]): number {
    return textLines.reduce((max, line) => Math.max(max, line.length), 0)
  }
}
