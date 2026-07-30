export function withKnownXMLDefaults(xml: string): string {
  return withExtendedPresentation(withAttributeFillValue(withTableDefaults(xml)))
}

function withAttributeFillValue(xml: string): string {
  return xml.replace(/<Attribute\b[\s\S]*?<\/Attribute>/g, (attribute) => {
    if (/<FillValue(?:[ />])/.test(attribute)) return attribute
    return insertBeforeClosingProperties(attribute, '<FillValue xsi:nil="true"/>')
  })
}

function withExtendedPresentation(xml: string): string {
  return xml.replace(/<Form\b[\s\S]*?<\/Form>/g, (form) => {
    if (!/<Form\b[^>]*\buuid=/.test(form) || /<ExtendedPresentation(?:[ />])/.test(form)) return form
    return insertBeforeClosingProperties(form, "<ExtendedPresentation/>")
  })
}

function insertBeforeClosingProperties(block: string, element: string): string {
  return block.replace(/\n([\t ]*)<\/Properties>/, `\n$1\t${element}\n$1</Properties>`)
}

function withTableDefaults(xml: string): string {
  return xml.replace(/<Table\b[\s\S]*?<\/Table>/g, (table) => {
    const closing = table.match(/\n([\t ]*)<\/Table>$/)
    if (closing === null) return table
    const tableIndent = closing[1] ?? ""
    const childIndent = `${tableIndent}\t`
    const escapedChildIndent = escapeRegExp(childIndent)

    const periodPattern = new RegExp(`\\n${escapedChildIndent}<Period>[\\s\\S]*?\\n${escapedChildIndent}</Period>`)
    const topLevelParentPattern = new RegExp(`\\n${escapedChildIndent}<TopLevelParent\\b[^>]*/>`)
    const rowFilterPattern = new RegExp(`\\n${escapedChildIndent}<RowFilter\\b[^>]*/>`)
    const period = table.match(periodPattern)?.[0] ?? canonicalPeriod(childIndent)
    const topLevelParent =
      table.match(topLevelParentPattern)?.[0] ?? `\n${childIndent}<TopLevelParent xsi:nil="true"/>`
    const rowFilter = table.match(rowFilterPattern)?.[0] ?? `\n${childIndent}<RowFilter xsi:nil="true"/>`
    const withoutDefaults = table
      .replace(periodPattern, "")
      .replace(topLevelParentPattern, "")
      .replace(rowFilterPattern, "")

    return withoutDefaults.replace(
      `\n${tableIndent}</Table>`,
      `${period}${topLevelParent}${rowFilter}\n${tableIndent}</Table>`
    )
  })
}

function canonicalPeriod(indent: string): string {
  return `
${indent}<Period>
${indent}\t<v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant>
${indent}\t<v8:startDate>0001-01-01T00:00:00</v8:startDate>
${indent}\t<v8:endDate>0001-01-01T00:00:00</v8:endDate>
${indent}</Period>`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
