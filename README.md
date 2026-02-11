# Samsung Health AI Dashboard

A modern web application to visualize and analyze your Samsung Health data locally using AI. This project features a FastAPI backend and a React (Vite) frontend with a focus on data privacy (local AI analysis via Ollama).

## Features

- **Dashboard**: Visualize health metrics like sleep, steps, and activity.
- **AI Insights**: Automated data analysis using local LLMs (Mistral, Llama3, etc.).
- **Privacy First**: Your health data stays on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+**
- **Node.js (v18+) & npm**
- **Ollama**: For local AI analysis. [Download Ollama here](https://ollama.com/).
  - After installing Ollama, download and run the model using your terminal:
    ```bash
    ollama run mistral
    ```
    *(Note: This command will download the model if it's not already present and start an interactive session. You can exit the session with `/exit`, but the Ollama service must remain running in the background for the dashboard to work.)*

## Project Structure

- `backend/`: FastAPI application handling data processing and AI integration.
- `frontend/`: React components and dashboard UI.
- `cleaned/`: (Excluded from Git) Folder for processed health data.

---

## Getting Started

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   # Run from the project root
   cd ..
   uvicorn backend.app.main:app --reload
   ```
   The API will be available at [http://localhost:8000](http://localhost:8000).

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The dashboard will be available at [http://localhost:5173](http://localhost:5173).

---

## How to use

1. Ensure **Ollama** is running in the background.
2. Start both the Backend and Frontend.
3. Open the Dashboard in your browser and explore your health data insights.
