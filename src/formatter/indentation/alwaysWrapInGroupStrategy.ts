import { IFormatterParams, IWrapInGroupStrategy, WrapInGroupStrategy } from "../interfaces"
import { GroupWrapHelper } from "../helpers/groupWrapHelper"

export class AlwaysWrapInGroupStrategy implements IWrapInGroupStrategy {
  public format(lines: string[], params: IFormatterParams): string[] {
    if (params.wrapInGroup === WrapInGroupStrategy.None) {
      return lines
    }

    return GroupWrapHelper.wrap(lines, params)
  }
}
