fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("Missing CARGO_MANIFEST_DIR");
    let app_root = std::path::Path::new(&manifest_dir)
        .parent()
        .expect("Missing app root")
        .to_path_buf();

    for candidate in [app_root.join(".env.production.local"), app_root.join(".env.production")] {
        println!("cargo:rerun-if-changed={}", candidate.display());
        if candidate.exists() {
            let _ = dotenvy::from_path_override(candidate);
        }
    }

    for key in [
        "LOCALIOLIFTP_LICENSE_API_BASE",
        "LOCALIOLIFTP_STRIPE_PRICE_ID",
        "VITE_LOCALIOLIFTP_LICENSE_API_BASE",
        "VITE_LOCALIOLIFTP_STRIPE_PRICE_ID",
    ] {
        println!("cargo:rerun-if-env-changed={key}");
        if let Ok(value) = std::env::var(key) {
            println!("cargo:rustc-env={key}={value}");
        }
    }

    tauri_build::build()
}
