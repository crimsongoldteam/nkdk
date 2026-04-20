import { addCatalogs, close, connect, resetGraph } from "@nakidka/graph"
import chalk from "chalk"
import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { performance } from "perf_hooks"

export const updateGraph = async (projectPath: string): Promise<void> => {
  if (!existsSync(projectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const tStart = performance.now()

  const tReadStart = performance.now()
  const catalogsPath = join(projectPath, "Справочник")
  const names = existsSync(catalogsPath)
    ? readdirSync(catalogsPath, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : []
  const tRead = performance.now() - tReadStart

  const tConnectStart = performance.now()
  const conn = await connect()
  const tConnect = performance.now() - tConnectStart

  try {
    const tResetStart = performance.now()
    await resetGraph(conn)
    const tReset = performance.now() - tResetStart

    const tInsertStart = performance.now()
    await addCatalogs(conn, names)
    const tInsert = performance.now() - tInsertStart

    const tTotal = performance.now() - tStart

    console.log(`чтение директории — ${tRead.toFixed(1)} мс — ${names.length} шт.`)
    console.log(`connect         — ${tConnect.toFixed(1)} мс`)
    console.log(`reset           — ${tReset.toFixed(1)} мс`)
    console.log(`insert          — ${tInsert.toFixed(1)} мс — ${names.length} узлов`)
    console.log(`итого           — ${tTotal.toFixed(1)} мс`)
  } finally {
    await close(conn)
  }
}
