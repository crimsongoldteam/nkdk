import { v4 } from "uuid"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"

export const receiveUUID = (params: {
  context: ConfigurationContextWithExportToXML
  parentPath: string
  path?: string
}): string => {
  const { context, parentPath, path } = params
  const configDumpInfo = context.exportToXML.configDumpInfo

  let parentInfo = configDumpInfo.get(parentPath)

  if (!parentInfo) {
    parentInfo = {
      children: new Map<string, string>(),
      id: v4(),
      configVersion: v4(),
    }
    configDumpInfo.set(parentPath, parentInfo)
  }

  let uuid: string = parentInfo.id
  if (path) {
    let childUuid = parentInfo.children.get(path)
    if (!childUuid) {
      childUuid = v4()
      parentInfo.children.set(path, childUuid)
    }
    uuid = childUuid
  }

  return uuid
}
