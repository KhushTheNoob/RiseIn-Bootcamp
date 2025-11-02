use serde::{Deserialize, Serialize};
use reqwest;
use regex::Regex;

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedEvent {
    pub title: String,
    pub event_type: String,
    pub date: String,
    pub description: String,
}

pub struct LocalAI {
    client: reqwest::Client,
}

impl LocalAI {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }
    
    pub async fn parse_event_message(&self, message: &str) -> Result<ParsedEvent, Box<dyn std::error::Error>> {
        // Try simple regex first
        if let Some(event) = self.simple_parse(message) {
            return Ok(event);
        }
        
        // Use AI
        self.ai_parse(message).await
    }
    
    fn simple_parse(&self, message: &str) -> Option<ParsedEvent> {
        let re = Regex::new(
            r"(?i)add (workshop|test|bootcamp|seminar) on (\d{4}-\d{2}-\d{2})"
        ).ok()?;
        
        if let Some(caps) = re.captures(message) {
            return Some(ParsedEvent {
                title: format!("{} Event", &caps[1]),
                event_type: caps[1].to_lowercase(),
                date: caps[2].to_string(),
                description: "Created via chat".to_string(),
            });
        }
        
        None
    }
    
    async fn ai_parse(&self, message: &str) -> Result<ParsedEvent, Box<dyn std::error::Error>> {
        let prompt = format!(
            "Extract event details from: '{}'\n\nReturn ONLY JSON:\n{{\n  \"title\": \"name\",\n  \"event_type\": \"workshop\",\n  \"date\": \"2025-11-15\",\n  \"description\": \"desc\"\n}}",
            message
        );
        
        let request = OllamaRequest {
            model: "llama3.2".to_string(),
            prompt,
            stream: false,
        };
        
        let response = self.client
            .post("http://localhost:11434/api/generate")
            .json(&request)
            .send()
            .await?;
        
        let ollama_response: OllamaResponse = response.json().await?;
        let json_str = self.extract_json(&ollama_response.response)?;
        let parsed: ParsedEvent = serde_json::from_str(&json_str)?;
        
        Ok(parsed)
    }
    
    fn extract_json(&self, text: &str) -> Result<String, Box<dyn std::error::Error>> {
        if let Some(start) = text.find('{') {
            if let Some(end) = text.rfind('}') {
                return Ok(text[start..=end].to_string());
            }
        }
        Err("No JSON found".into())
    }
}