import { execSync } from "child_process"
import { resolve } from "path"

const typiaFiles = ["lib/metadata/appliedObjects/catalog/typia.ts"]

const outDir = resolve(process.cwd(), "lib/metadata/appliedObjects/catalog")

for (const file of typiaFiles) {
  const filePath = resolve(process.cwd(), file)
  console.log(`Compiling ${file}...`)
  execSync(
    `pnpm tsc ${filePath} --outDir ${outDir} --module esnext --target es2020 --moduleResolution bundler --skipLibCheck --declaration false`,
    { stdio: "inherit" }
  )
}

console.log("Typia files compiled successfully!")
