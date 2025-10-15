# NODE CRM Suite

An Emotional Intelligence CRM platform that combines customer relationship management with advanced sentiment analysis capabilities.

## Quick Start

```bash
# Start the complete NODE CRM Suite
./start-bit.sh
```

## Architecture

### Backend Services
- **CRM Backend**: Node.js/Express server on port 3000
- **AI Service**: Python Flask API on port 5001
- **Database**: PostgreSQL for contacts, MongoDB for emotion logs (with in-memory fallback)

### Frontend
- **React Application**: Modern UI for contact management and sentiment analysis
- **Features**: Contact CRUD, message sentiment analysis, dashboard analytics

## API Endpoints

### Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Sentiment Analysis
- `POST /api/contacts/:id/analyze` - Analyze message sentiment for contact
- `GET /api/contacts/:id/emotions` - Get emotion history for contact

### Health Check
- `GET /health` - Service health status

## Features

✓ Contact management with full CRUD operations  
✓ Real-time sentiment analysis of customer messages  
✓ PostgreSQL database integration  
✓ MongoDB support for emotion logs with fallback  
✓ Python Flask AI service with transformers  
✓ Built-in sentiment analysis algorithm  
✓ Professional React frontend  
✓ Responsive design  

## Development

The application follows the exact structure specified in the NODE CRM MVP code overview:

- **server.cjs**: Node.js/Express CRM backend
- **emotion-api/app.py**: Python Flask sentiment analysis service  
- **client/src/**: React frontend application
- **Database**: PostgreSQL for structured data, MongoDB for logs

## Service Management

Start all services: `./start-bit.sh`

View logs:
- CRM Backend: `tail -f crm.log`
- AI Service: `tail -f emotion-api/ai.log`

## Technology Stack

- **Backend**: Node.js, Express.js, PostgreSQL, MongoDB
- **AI/ML**: Python, Flask, transformers (with built-in fallback)
- **Frontend**: React, TypeScript, Axios
- **Database**: PostgreSQL (via pg), MongoDB (via mongodb driver)