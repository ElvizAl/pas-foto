// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_photo])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn save_photo(bytes: Vec<u8>, filename: String) -> Result<bool, String> {
    if bytes.len() > 10 * 1024 * 1024 || !bytes.starts_with(&[0xff, 0xd8, 0xff]) {
        return Err("Data JPG tidak valid atau terlalu besar.".into());
    }
    if !["pas-foto-2x3.jpg", "pas-foto-3x4.jpg", "pas-foto-4x6.jpg"].contains(&filename.as_str()) {
        return Err("Nama file tidak valid.".into());
    }
    let Some(file) = rfd::AsyncFileDialog::new()
        .add_filter("Foto JPG", &["jpg"])
        .set_file_name(&filename)
        .save_file()
        .await
    else {
        return Ok(false);
    };
    file.write(&bytes)
        .await
        .map_err(|error| error.to_string())?;
    Ok(true)
}
