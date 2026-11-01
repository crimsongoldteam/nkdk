use std::{env, fs, path::PathBuf};

fn main() {
    let operations = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").expect("package directory"))
        .join("../../operations");
    println!("cargo::rerun-if-changed={}", operations.display());
    let mut paths = fs::read_dir(&operations)
        .expect("operation declarations")
        .map(|entry| entry.expect("operation file").path())
        .filter(|path| {
            path.file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| {
                    name == "routes.yaml" || name.ends_with(".routes.generated.yaml")
                })
        })
        .collect::<Vec<_>>();
    paths.sort();
    assert!(
        !paths.is_empty(),
        "at least one operation route is required"
    );
    let mut output = String::from("const OPERATION_ROUTES: &[&str] = &[\n");
    for path in paths {
        println!("cargo::rerun-if-changed={}", path.display());
        output.push_str(&format!(
            "    include_str!({:?}),\n",
            path.display().to_string()
        ));
    }
    output.push_str("];\n");
    let destination =
        PathBuf::from(env::var_os("OUT_DIR").expect("build directory")).join("operation_routes.rs");
    fs::write(destination, output).expect("write compiled operation route list");
}
