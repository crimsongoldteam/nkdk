//! Internal retained-source framing, independent of user YAML and XML anomalies.
//! The caller supplies already prepared XML, not the original full document.

const XML_HEADER: &[u8] = b"NKDK-FACT-XML/1\n";

pub fn encode_xml(xml: Vec<u8>) -> Vec<u8> {
    let mut result = Vec::with_capacity(XML_HEADER.len() + xml.len());
    result.extend_from_slice(XML_HEADER);
    result.extend_from_slice(&xml);
    result
}

/// Borrow the payload; ordinary YAML snapshots remain unchanged.
pub fn xml_payload(snapshot: &[u8]) -> Option<&[u8]> {
    snapshot.strip_prefix(XML_HEADER)
}
