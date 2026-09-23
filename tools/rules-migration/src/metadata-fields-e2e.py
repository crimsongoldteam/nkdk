"""Extract existing DataLockFields XML/YAML pairs without changing source fixtures."""

import json
import re
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[3]
XML = ROOT / "e2e/fixtures/xml"
YAML = ROOT / "e2e/fixtures/nkdk"
XR = "http://v8.1c.ru/8.3/xcf/readable"


def yaml_fields(path: Path) -> list[str]:
    lines = path.read_text().splitlines()
    positions = [index for index, line in enumerate(lines) if line == "ПоляБлокировкиДанных:"]
    if len(positions) != 1:
        raise ValueError(f"Expected one DataLockFields property in {path}")
    result = []
    for line in lines[positions[0] + 1 :]:
        if not line.startswith("  - "):
            break
        result.append(line.removeprefix("  - "))
    return result


def main() -> None:
    cases = []
    for source in sorted(XML.rglob("*.xml")):
        if "ExternalDataSources" in source.parts:
            continue
        root = ElementTree.parse(source).getroot()
        for element in root.iter():
            if element.tag.split("}")[-1] != "DataLockFields":
                continue
            fields = [child.text or "" for child in element if child.tag.split("}")[-1] == "Field"]
            if not fields:
                continue
            branch = source.relative_to(XML).parts[0]
            candidates = list((YAML / branch).rglob(f"{source.stem}/Свойства.yaml"))
            if len(candidates) != 1:
                raise ValueError(f"Expected one YAML partner for {source}: {candidates}")
            expected = yaml_fields(candidates[0])
            if len(expected) != len(fields):
                raise ValueError(f"Different field counts: {source}, {candidates[0]}")
            owner = len(expected[0].split(".")) == 2
            root_name, owner_name, *_ = fields[0].split(".")
            if any(not field.startswith(f"{root_name}.{owner_name}.") for field in fields):
                raise ValueError(f"Mixed owner paths: {source}")
            source_text = source.read_text()
            original = re.search(r"<DataLockFields>.*?</DataLockFields>", source_text, re.S)
            if original is None:
                raise ValueError(f"Missing original XML fragment: {source}")
            xml = f'<Root xmlns:xr="{XR}"><DataLockFields>' + "".join(
                f"<xr:Field>{field}</xr:Field>" for field in fields
            ) + "</DataLockFields></Root>"
            cases.append({
                "source": str(source.relative_to(ROOT)),
                "yamlSource": str(candidates[0].relative_to(ROOT)),
                "start": len(source_text[: original.start()].encode()),
                "original": original.group(),
                "entry": "migration.owner-metadata-fields" if owner else "migration.metadata-fields",
                "ownerRoot": root_name,
                "ownerName": owner_name,
                "xml": xml,
                "yaml": "ПоляБлокировкиДанных:\n" + "\n".join(f"  - {field}" for field in expected),
            })
    if len(cases) != 16:
        raise ValueError(f"Expected 16 nonempty applied-object examples, got {len(cases)}")
    print(json.dumps({"cases": cases}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
