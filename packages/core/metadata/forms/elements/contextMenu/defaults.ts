import { ContextMenu } from "./types"

export const getDefaultContextMenu = (): ContextMenu => {
  return {
    elementType: "ContextMenu",
    childItems: [],
  }
}
