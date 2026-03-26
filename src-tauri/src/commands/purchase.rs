use crate::services::license_client;

#[tauri::command]
pub async fn purchase_create_checkout(
    email: String,
) -> Result<crate::models::license::CheckoutResponse, String> {
    let mut response = license_client::create_checkout(&email).await?;
    if response.checkout_url.is_none() {
        response.checkout_url = response.url.clone();
    }

    if response.checkout_url.is_some() {
        Ok(response)
    } else {
        Err(response
            .error
            .or(response.message)
            .unwrap_or_else(|| "No checkout URL returned".to_string()))
    }
}
