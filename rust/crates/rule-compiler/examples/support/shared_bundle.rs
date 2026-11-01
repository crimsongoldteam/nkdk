use nkdk_rule_compiler::GeneratedSharedCatalog;
use std::{fs, path::Path};

pub fn write(
    generated: GeneratedSharedCatalog,
    staging: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    if staging.exists() {
        return Err("Staging directory must be new".into());
    }
    fs::create_dir_all(staging)?;
    let mut owned = Vec::new();
    let mut write = |path: String, contents: &[u8]| -> std::io::Result<()> {
        let output = staging.join(&path);
        fs::create_dir_all(output.parent().unwrap())?;
        fs::write(output, contents)?;
        owned.push(path);
        Ok(())
    };
    for package in generated.packages {
        for file in package.generated.files {
            write(
                format!("packages/{}/src/{}", package.name, file.path),
                &file.contents,
            )?;
        }
    }
    for file in generated.facade.files {
        write(format!("src/{}", file.path), &file.contents)?;
    }
    write("layout.json".into(), &generated.layout_manifest)?;
    owned.sort();
    fs::write(
        staging.join("bundle.json"),
        serde_json::to_vec_pretty(
            &serde_json::json!({"format":"nkdk-aot-bundle/1","files":owned}),
        )?,
    )?;
    Ok(())
}
