use actix_web::{web, App, HttpServer, HttpResponse, Responder, middleware};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};

mod ai;
mod stellar;
mod handlers;

#[derive(Debug, Serialize, Deserialize)]
struct Event {
    id: u64,
    title: String,
    event_type: String,
    date: String,
    description: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateEventRequest {
    title: String,
    event_type: String,
    date: String,
    description: String,
}


#[derive(Debug, Deserialize)]
struct ChatRequest {
    message: String,
}

#[derive(Debug, Serialize)]
struct ChatResponse {
    reply: String,
    extracted_event: Option<CreateEventRequest>,
}

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "blockchain": "Stellar Testnet",
        "ai": "Ollama (Local)"
    }))
}

async fn create_event_handler(event: web::Json<CreateEventRequest>) -> impl Responder {
    // Here you would call Stellar contract
    // For now, return success
    HttpResponse::Created().json(serde_json::json!({
        "id": 1,
        "message": "Event created on blockchain",
        "event": event.into_inner()
    }))
}

async fn get_events_handler() -> impl Responder {
    // Here you would query Stellar contract
    // For now, return mock data
    HttpResponse::Ok().json(vec![
        Event {
            id: 1,
            title: "Web Dev Workshop".to_string(),
            event_type: "workshop".to_string(),
            date: "2025-11-15".to_string(),
            description: "Learn React and Rust".to_string(),
        }
    ])
}

async fn chat_handler(msg: web::Json<ChatRequest>) -> impl Responder {
    let ai = ai::LocalAI::new();
    
    match ai.parse_event_message(&msg.message).await {
        Ok(parsed) => {
            HttpResponse::Ok().json(ChatResponse {
                reply: format!("✓ Got it! Creating: {}", parsed.title),
                extracted_event: Some(CreateEventRequest {
                    title: parsed.title,
                    event_type: parsed.event_type,
                    date: parsed.date,
                    description: parsed.description,
                }),
            })
        }
        Err(_) => {
            HttpResponse::Ok().json(ChatResponse {
                reply: "I couldn't understand that. Try: 'Add workshop on 2025-11-15'".to_string(),
                extracted_event: None,
            })
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    dotenv::dotenv().ok();
    
    println!("🚀 Academic Tracker Backend Starting...");
    println!("📦 Blockchain: Stellar (Soroban)");
    println!("🤖 AI: Ollama (Free & Local)");
    println!("🌐 Server: http://localhost:8080");
    
    HttpServer::new(|| {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://localhost:5173")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::CONTENT_TYPE,
                actix_web::http::header::AUTHORIZATION,
            ])
            .max_age(3600);
        
        App::new()
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .route("/health", web::get().to(health_check))
            .route("/api/events", web::post().to(create_event_handler))
            .route("/api/events", web::get().to(get_events_handler))
            .route("/api/chat", web::post().to(chat_handler))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}