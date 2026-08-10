import fs from "fs"
import { exportToYAML } from "@nkdk/runtime"
import type { OperationSnapshotItem } from "./projectSnapshot"

export function exportOperationItemToYamlText(item: OperationSnapshotItem): string {
  return exportToYAML(item.yaml)
}

export function writeOperationYamlFile(item: OperationSnapshotItem): void {
  fs.writeFileSync(item.filePath, exportOperationItemToYamlText(item), "utf-8")
}
