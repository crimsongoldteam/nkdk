import { ADD_ACTION, DELETE_ACTION, buildRenameTargetPath, writeMigrationFile } from "@nakidka/core"

export function renameMigration(yamlDir: string, path: string, newName: string, now = new Date()): void {
  if (path.length === 0) throw new Error("Путь не должен быть пустым")
  if (newName.length === 0) throw new Error("Новое имя не должно быть пустым")
  buildRenameTargetPath(path, newName)
  const filePath = writeMigrationFile({ yamlDir, now, entries: [{ path, value: newName }] })
  process.stdout.write(filePath + "\n")
}

export function deleteMigration(yamlDir: string, path: string, now = new Date()): void {
  if (path.length === 0) throw new Error("Путь не должен быть пустым")
  const filePath = writeMigrationFile({ yamlDir, now, entries: [{ path, value: DELETE_ACTION }] })
  process.stdout.write(filePath + "\n")
}

export { ADD_ACTION }
