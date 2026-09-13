//! Stable identity derivation during operation preparation, never per-field state.
use super::FactState;
use sha2::{Digest, Sha256};
use std::borrow::Cow;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IdentityFormat {
    Uuid,
    Hex128,
    Hex160,
}

pub struct OperationIdentity {
    prefix: Sha256,
}

impl OperationIdentity {
    /// The operation boundary supplies one seed; the prepared prefix is reused.
    pub fn new(seed: [u8; 32]) -> Self {
        let mut prefix = Sha256::new();
        prefix.update(seed);
        prefix.update([0]);
        Self { prefix }
    }

    /// Unavailable or ambiguous indexes never authorize a replacement identity.
    pub fn resolve<'a>(
        &self,
        previous: FactState<&'a str>,
        domain: &str,
        format: IdentityFormat,
        address: &str,
    ) -> FactState<Cow<'a, str>> {
        match previous {
            FactState::Ready(value) => FactState::Ready(Cow::Borrowed(value)),
            FactState::Missing => {
                FactState::Ready(Cow::Owned(self.generate(domain, format, address)))
            }
            FactState::Ambiguous => FactState::Ambiguous,
            FactState::Cycle => FactState::Cycle,
            FactState::Unready => FactState::Unready,
        }
    }

    fn generate(&self, domain: &str, format: IdentityFormat, address: &str) -> String {
        let count = match format {
            IdentityFormat::Uuid | IdentityFormat::Hex128 => 16,
            IdentityFormat::Hex160 => 20,
        };
        let mut hash = self.prefix.clone();
        hash.update(domain.as_bytes());
        hash.update([0]);
        hash.update(address.as_bytes());
        let mut bytes = hash.finalize();
        let uuid = format == IdentityFormat::Uuid;
        if uuid {
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
        }
        const HEX: &[u8; 16] = b"0123456789abcdef";
        let mut value = String::with_capacity(count * 2 + if uuid { 4 } else { 0 });
        for (index, byte) in bytes[..count].iter().copied().enumerate() {
            if uuid && matches!(index, 4 | 6 | 8 | 10) {
                value.push('-');
            }
            value.push(HEX[(byte >> 4) as usize] as char);
            value.push(HEX[(byte & 0x0f) as usize] as char);
        }
        value
    }
}
