"""Check declared xs:string/xs:decimal leaf properties on immutable e2e XML."""
import argparse
import copy
import hashlib
import io
import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation
from datetime import datetime
from pathlib import Path
import yaml

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
binary = root / "rust/target/debug/nkdk"
xsi_type = "{http://www.w3.org/2001/XMLSchema-instance}type"
xs = "http://www.w3.org/2001/XMLSchema"

def shape(source):
    namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(source), events=("start-ns",)))
    def node(element):
        attributes = []
        for key, value in element.attrib.items():
            if key == xsi_type:
                prefix, local = value.split(":", 1)
                value = "{" + namespaces[prefix] + "}" + local
            attributes.append((key, value))
        return element.tag, sorted(attributes), (element.text or "") if not len(element) else "", [node(child) for child in element]
    return node(ET.fromstring(source))

rows = []
with tempfile.TemporaryDirectory(prefix="nkdk-typed-e2e-") as temporary:
    directory = Path(temporary)
    for source in sorted((root / "e2e/fixtures/xml").rglob("*.xml")):
        original = source.read_bytes()
        namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(original), events=("start-ns",)))
        for index, element in enumerate(ET.fromstring(original).iter()):
            kind = element.get(xsi_type, "")
            if len(element) or kind not in ("xs:decimal", "xs:string", "xs:dateTime"):
                continue
            assert namespaces.get("xs") == xs, source
            wrapper = ET.Element("Root", {"xmlns:xs": xs})
            value = copy.deepcopy(element)
            value.tag = "Amount"
            value.tail = None
            wrapper.append(value)
            input_xml = ET.tostring(wrapper, encoding="utf-8")
            (directory / "input.xml").write_bytes(input_xml)
            entry = {"xs:decimal":"migration.typed-number","xs:string":"migration.typed-string","xs:dateTime":"migration.typed-date-time"}[kind]
            commands = [
                ["convert-file", "--direction", "xml-to-yaml", "--input", str(directory / "input.xml"), "--output", str(directory / "value.yaml")],
                ["validate-file", "--input", str(directory / "value.yaml")],
                ["convert-file", "--direction", "yaml-to-xml", "--input", str(directory / "value.yaml"), "--output", str(directory / "restored.xml")],
            ]
            for command in commands:
                result = subprocess.run([str(binary), *command, "--entry", entry], capture_output=True, text=True)
                assert result.returncode == 0, f"{source}:{index}: {result.stderr}"
            assert shape(input_xml) == shape((directory / "restored.xml").read_bytes()), (source, index)
            document = yaml.compose((directory / "value.yaml").read_text())
            assert isinstance(document, yaml.MappingNode)
            semantic = next((v for k, v in document.value if k.value == "Сумма"), None)
            if semantic is not None and semantic.tag == "!xml/raw":
                semantic = next((v for k, v in semantic.value if k.value == "$значение"), None)
            expected = element.text or ""
            if kind == "xs:string":
                assert isinstance(semantic, yaml.ScalarNode) and semantic.tag == "tag:yaml.org,2002:str" and semantic.value == expected, (source, index)
            elif kind == "xs:dateTime":
                try:
                    date = datetime.fromisoformat(expected)
                except ValueError:
                    date = None
                if date is None:
                    assert semantic is None, (source,index)
                else:
                    clock = f"{date.day:02}.{date.month:02}.{date.year:04}"
                    if date.hour or date.minute or date.second:
                        clock += f" {date.hour:02}:{date.minute:02}"
                    assert isinstance(semantic,yaml.ScalarNode) and semantic.value==clock, (source,index)
            else:
                try:
                    number = Decimal(expected)
                except InvalidOperation:
                    number = None
                if number is not None and number.is_finite():
                    assert isinstance(semantic, yaml.ScalarNode) and semantic.tag in ("tag:yaml.org,2002:int", "tag:yaml.org,2002:float") and Decimal(semantic.value) == number, (source, index)
                else:
                    assert semantic is None, (source, index)
            rows.append({"source": str(source.relative_to(root)), "sha256": hashlib.sha256(original).hexdigest(), "occurrence": index, "type": kind, "verified": True})
        assert source.read_bytes() == original
assert rows, "An empty selection is not success"
args.output.write_text(json.dumps({"scope": "Typed scalar leaf properties; not whole-project conversion or performance", "verified": len(rows), "cases": rows}, ensure_ascii=False, indent=2) + "\n")
print(f"Verified {len(rows)} typed scalar properties")
