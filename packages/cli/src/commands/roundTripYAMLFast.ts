import { roundTripYAMLFast } from "@nakidka/core"

export const roundTripYAMLFastCommand = async (xmlDir: string): Promise<void> => {
  const result = await roundTripYAMLFast({ inputDir: xmlDir })

  process.stdout.write("=== ROUND_TRIP_YAML_FAST ===\n")
  process.stdout.write(`checked: ${result.checked}\n`)
  process.stdout.write(`diffs: ${result.diffs.length}\n`)
  process.stdout.write(`errors: ${result.errors.length}\n`)
  process.stdout.write("=== DIFF_COUNT ===\n")
  process.stdout.write(`${result.diffs.length}\n`)

  for (const diff of result.diffs) {
    process.stdout.write("=== DIFF ===\n")
    process.stdout.write(`file: ${diff.file}\n`)
    process.stdout.write(`xmlFileAbs: ${diff.xmlFileAbs}\n`)
    process.stdout.write(`${diff.diffText}\n`)
  }

  if (result.errors.length > 0) {
    process.stdout.write("=== ERRORS ===\n")
    for (const error of result.errors) {
      process.stdout.write(`file: ${error.file}\n`)
      process.stdout.write(`xmlFileAbs: ${error.xmlFileAbs}\n`)
      process.stdout.write(`${error.message}\n`)
    }
    process.exitCode = 1
  }
}
