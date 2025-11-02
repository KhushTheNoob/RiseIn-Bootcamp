#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Event {
    pub id: u64,
    pub creator: Address,
    pub title: String,
    pub event_type: Symbol,
    pub date: u64,
    pub description: String,
    pub created_at: u64,
}

const EVENTS: Symbol = symbol_short!("EVENTS");
const COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct AcademicTracker;

#[contractimpl]
impl AcademicTracker {
    pub fn initialize(env: Env) {
        env.storage().persistent().set(&COUNTER, &0u64);
    }
    
    pub fn create_event(
        env: Env,
        creator: Address,
        title: String,
        event_type: Symbol,
        date: u64,
        description: String,
    ) -> u64 {
        creator.require_auth();
        
        let mut counter: u64 = env.storage().persistent().get(&COUNTER).unwrap_or(0);
        counter += 1;
        
        let created_at = env.ledger().timestamp();
        
        let event = Event {
            id: counter,
            creator: creator.clone(),
            title,
            event_type,
            date,
            description,
            created_at,
        };
        
        let event_key = (EVENTS, counter);
        env.storage().persistent().set(&event_key, &event);
        env.storage().persistent().set(&COUNTER, &counter);
        
        env.storage().persistent().extend_ttl(&event_key, 100, 5184000);
        env.storage().persistent().extend_ttl(&COUNTER, 100, 5184000);
        
        counter
    }
    
    pub fn get_event(env: Env, event_id: u64) -> Option<Event> {
        let event_key = (EVENTS, event_id);
        env.storage().persistent().get(&event_key)
    }
    
    pub fn get_all_event_ids(env: Env) -> Vec<u64> {
        let counter: u64 = env.storage().persistent().get(&COUNTER).unwrap_or(0);
        let mut ids = Vec::new(&env);
        
        for i in 1..=counter {
            ids.push_back(i);
        }
        
        ids
    }
    
    pub fn delete_event(env: Env, event_id: u64, creator: Address) -> bool {
        creator.require_auth();
        
        let event_key = (EVENTS, event_id);
        
        let event: Event = match env.storage().persistent().get(&event_key) {
            Some(e) => e,
            None => return false,
        };
        
        if event.creator != creator {
            return false;
        }
        
        env.storage().persistent().remove(&event_key);
        true
    }
}