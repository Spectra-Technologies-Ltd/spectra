# Spectra

A real-time operations and incident management system designed to unify alerts, workflows, and team coordination into a single, consistent source of truth.

---

## Why Spectra Exists

Operational systems today are fragmented.

Teams rely on:
- separate tools for incident tracking
- disconnected notification systems
- manual coordination across channels

This leads to:
- delayed response times  
- inconsistent state across systems  
- lack of accountability  

Spectra was built to eliminate that fragmentation.

---

## What Spectra Does

Spectra provides a centralized system to:

- manage incidents from creation to resolution  
- trigger and track notifications  
- coordinate actions across teams  
- maintain an auditable history of all operations  

---

## System Design

Spectra is designed as a distributed full-stack system with clear separation of concerns.

### High-Level Flow


Client (Frontend)
↓
API Layer (Backend)
↓
Core Services (Auth, Incidents, Notifications)
↓
Persistence Layer (Database)


### Components

- **Frontend**
  - Handles user interaction and state visualization
  - Deployed on Vercel

- **Backend API**
  - Handles business logic and request orchestration
  - Implements authentication, incident management, and notifications
  - Deployed on Render

- **Authentication System**
  - HTTP-only cookies
  - Refresh token rotation
  - Short-lived access tokens

- **Notification System**
  - Event-triggered alerts
  - Integrated with incident lifecycle
  - Supports audit logging

---

## Key Engineering Decisions

### 1. Token-Based Authentication with Rotation

Instead of static sessions:

- access tokens are short-lived  
- refresh tokens are rotated on each use  

This reduces the risk of token replay and session hijacking.

---

### 2. Separation of Concerns

- frontend handles UI only  
- backend handles logic and orchestration  
- services are modularized  

This allows independent scaling and easier maintenance.

---

### 3. Deployment Strategy

- frontend → Vercel  
- backend → Render  

Decoupled deployment ensures:
- faster frontend delivery  
- independent backend scaling  

---

## Features

- Incident lifecycle management  
- Event-driven notifications  
- Secure authentication system  
- Audit logging of system actions  
- Media upload integration  

---

