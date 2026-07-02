import fs from "fs"
import type { ConfigurationContext } from "../context/types"
import { exportClientApplicationFormToYAML } from "../forms/clientApplicationForm/toYAML"
import { exportMetadataItemToYAML } from "../orchestration"
import { exportToYAML } from "../../yaml/export"
import type { OperationSnapshotItem } from "./projectSnapshot"

export function exportOperationItemToYamlText(item: OperationSnapshotItem, context: ConfigurationContext): string {
  if (item.kind === "form") {
    return exportToYAML(exportClientApplicationFormToYAML(context, item.model as never).yaml)
  }

  const yaml = exportMetadataItemToYAML({
    context,
    data: item.model as never,
    rule: item.rule as never,
  })
  return exportToYAML(yaml)
}

export function writeOperationYamlFile(item: OperationSnapshotItem, context: ConfigurationContext): void {
  fs.writeFileSync(item.filePath, exportOperationItemToYamlText(item, context), "utf-8")
}
