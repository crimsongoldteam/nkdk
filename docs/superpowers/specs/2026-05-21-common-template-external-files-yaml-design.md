# CommonTemplate external files YAML round-trip

## Problem

Full XML -> YAML -> XML round-trip deletes external files for common templates.

Current diagnostics show 96 deleted files under `acc/CommonTemplates`:

- `Ext/Template.txt`
- `Ext/Template/ru.html`
- files under `Ext/Template/_files/*`

The files are source content of `CommonTemplate` objects and must be present in the YAML directory without conversion.

## Current Behavior

`MetadataCommonTemplateRules.properties.template` describes only:

- `Ext/Template.xml` as `Template.xml`
- `Ext/Template.bin` as `Template.bin`

That preserves binary spreadsheet-like templates, but text and HTML template resources are not copied into YAML. During sync back to XML they are absent from the expected XML manifest and are deleted.

Child templates already use the required pattern in `commonObjects/childTemplateNames/externalFiles.ts`:

- `Ext/Template.bin`
- `Ext/Template/*.html`
- `Ext/Template/_files/*`

## Decision

Use the existing declarative `externalFiles` rules for common templates.

Add explicit external file rules to `MetadataCommonTemplateRules.properties.template`:

- `Ext/Template.bin` -> `Template.bin`
- `Ext/Template.txt` -> `Template.txt`
- `Ext/Template/*.html` -> `Template/*.html`
- `Ext/Template/_files/*` -> `Template/_files/*`

The files are copied byte-for-byte. No HTML, TXT, image, or binary content is parsed or transformed.

## YAML Layout

For `CommonTemplates/<Name>/...`, imported YAML directory should contain:

```text
<Name>/
  Template.xml
  Template.bin        # if present
  Template.txt        # if present
  Template/
    ru.html           # if present
    _files/
      ...             # if present
```

Sync restores these files to:

```text
CommonTemplates/<Name>/Ext/Template.bin
CommonTemplates/<Name>/Ext/Template.txt
CommonTemplates/<Name>/Ext/Template/ru.html
CommonTemplates/<Name>/Ext/Template/_files/...
```

## Implementation Shape

Keep the change local to common template rules and existing external file sync machinery.

The preferred implementation is to reuse or mirror the rule set from `commonObjects/childTemplateNames/externalFiles.ts`, with the path form adjusted for top-level common templates:

- child templates include `{ name }` in XML paths because they are synced from parent object folders;
- common templates use paths relative to the common template object folder.

Do not add special-case copying logic to orchestration.
Do not parse or normalize external file contents.
Do not change XML fixtures.

## Tests

Add or extend unit coverage around `syncModuleFromXML` and `syncModuleToXML` for `MetadataCommonTemplateRules.properties.template`.

The test should create a temporary common template with:

- `Ext/Template.txt`
- `Ext/Template/ru.html`
- `Ext/Template/_files/1.png`

Then verify:

- XML -> YAML copies files to `Template.txt`, `Template/ru.html`, and `Template/_files/1.png`;
- YAML -> XML restores them to the original XML paths;
- `XmlSyncManifest.expectedFiles()` includes restored XML paths, so sync cleanup does not delete them.

Existing `Template.bin` coverage must continue to pass.

## Verification

Run focused tests for external file sync and common template sync behavior.

After implementation, run `round-trip-yaml --triage --batch-size 5` again. The common-template external file deletions should disappear from the first triage batches, reducing the total diff count.
