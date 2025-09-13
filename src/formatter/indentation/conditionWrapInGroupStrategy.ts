import { IFormatterParams, IWrapInGroupStrategy, WrapInGroupStrategy } from "../interfaces"
import { GroupWrapHelper } from "../helpers/groupWrapHelper"

export class ConditionWrapInGroupStrategy implements IWrapInGroupStrategy {
  public format(lines: string[], params: IFormatterParams): string[] {
    if (params.wrapInGroup != WrapInGroupStrategy.Always) {
      return lines
    }

    const firstLine = params.isFirst ? "#" : ""
    return GroupWrapHelper.wrap([firstLine, ...lines], params)
  }
}
