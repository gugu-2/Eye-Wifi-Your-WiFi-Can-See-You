# OMNIFI — Eye Wifi: "Your WiFi Can See You"

A demonstration and research prototype that visualizes a spatial ontology inferred from WiFi Channel State Information (CSI). This repository contains a browser-based frontend built with Vite and a Python backend (FastAPI + Uvicorn) that produces a realtime data plane (simulator fallback included) for the UI.

> IMPORTANT: This project is intended for research, education and experimentation. Respect privacy and local laws — do not deploy this code for unauthorized surveillance.

## Table of Contents
- **Overview**
- **Quick Start**
- **Requirements**
- **Installation**
- **Running**
- **Project Structure**
- **How it Works**
- **Hardware & Simulator**
- **Development Notes**
- **Troubleshooting**
- **Contributing**
- **License & Contact**

## Overview

This project demonstrates a realtime visualization of entities detected and tracked using WiFi RF telemetry. The frontend visualizes telemetry, entity poses, biometric estimates and alerts. The backend provides the data plane and contains a placeholder ML pipeline and a hardware ingestion interface.

The system is intentionally modular so you can replace the simulated components with real hardware or fuller ML models.

## Quick Start

1. Start the backend data plane (runs the ontology engine simulator by default).
2. Start the frontend dev server (Vite).
3. Open the UI in a browser and observe realtime updates from the backend.

### Windows (PowerShell)

```powershell
cd backend
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python server.py
```

In a separate terminal (project root):

```powershell
npm install
npm run dev
```

### macOS / Linux (bash)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

In a separate terminal (project root):

```bash
npm install
npm run dev
```

Once both servers are running, open the frontend URL printed by Vite (commonly `http://localhost:5173`) in your browser. The frontend connects to the backend websocket at `ws://localhost:8000/ws/stream` by default.

## Requirements

- Python 3.8+ (recommended 3.10+)
- Node.js 16+ / npm (Vite dev server)
- See `backend/requirements.txt` for Python dependencies

## Installation

- Backend: `pip install -r backend/requirements.txt`
- Frontend: `npm install` (run from the repository root)

## Running

- Backend entrypoint: `backend/server.py` — this starts a FastAPI app and exposes a websocket at `/ws/stream`.
- Frontend entrypoint: `index.html` with module `src/main.js` (served by Vite during development).

Notes:
- The backend runs a simulated ontology engine by default (`OntologyEngine.generate_simulated_state()`).
- The frontend expects the websocket at `ws://localhost:8000/ws/stream`. Update `src/main.js` if you host the backend on another host/port.

## Project Structure

- **index.html** — Main frontend HTML shell that mounts the Vite app.
- **package.json** — Vite dev scripts and project metadata.
- **backend/**
  - `server.py` — FastAPI websocket server that streams ontology data.
  - `system_loop.py` — `OntologyEngine` orchestration, uses the ingestion engine and ML pipeline.
  - `hardware_interface.py` — `CSIIngestionEngine` placeholder for CSI ingestion (mocked by default).
  - `ml_pipeline.py` — Placeholder ML components: `SpatialLocatorModel`, `DensePoseWiFiModel`, `BiometricIdentifier`.
  - `requirements.txt` — Python dependencies.
- **src/**
  - `main.js` — Frontend app; connects to backend websocket and renders UI.
  - `counter.js` — small UI helper used by the frontend.
  - `style.css` — app styles (note: also imported from `index.html`).

## How it Works (high level)

1. The `CSIIngestionEngine` would normally receive Channel State Information (CSI) from edge devices (ESP32, Nexmon-enabled radios) over UDP or a hardware SDK.
2. CSI frames are fed into models in `ml_pipeline.py`:
   - `SpatialLocatorModel` produces coarse XY locations from CSI features.
   - `DensePoseWiFiModel` attempts to reconstruct a pose representation.
   - `BiometricIdentifier` offers vitals estimation (BPM, respiration) and signature matching.
3. The `OntologyEngine` composes telemetry, entity descriptions and alerts into JSON payloads.
4. `server.py` exposes a websocket (`/ws/stream`) that the frontend consumes; when hardware is not attached, the engine falls back to `generate_simulated_state()`.

## Hardware & Simulator

- The codebase ships with a simulator in `system_loop.py` to make the UI functional without radios or sensors.
- To connect real hardware, implement the low-level parsing in `backend/hardware_interface.py` and ensure `CSIIngestionEngine.read_csi_frame()` returns a NumPy array compatible with `ml_pipeline` expectations.

## Development Notes

- The backend modules assume being launched from the `backend` directory (see `server.py`'s `uvicorn.run("server:app")` behavior). Use `cd backend` before running `python server.py`.
- Frontend dev server is Vite-based. Use `npm run dev` at the repository root.
- Models in `ml_pipeline.py` are simple placeholders. Replace or extend them with real model loading, and keep heavy weights out of the repo (store them separately and load at runtime).

## Troubleshooting

- WebSocket connection refused:
  - Ensure the backend is running (check `python backend/server.py` terminal).
  - Confirm backend is listening on port `8000` and firewall rules allow connections.
  - If the frontend cannot reach the backend from a different machine, update the websocket URL in `src/main.js`.
- Import errors when running `backend/server.py`:
  - Make sure you `cd backend` before running so relative imports work correctly.
- Vite not starting or port conflicts:
  - Vite may start on a different port if `5173` is busy; check the terminal for the actual URL.

## Security & Ethics

This repository contains concepts that can be used for surveillance. The authors strongly discourage misuse:

- Do not use this code to monitor individuals without express informed consent and proper legal authority.
- Follow institutional review board (IRB) procedures and local privacy laws before collecting or analyzing RF biometric data.

## Contributing

Contributions are welcome. Open issues or PRs for:
- Replacing simulator with real hardware ingestion (provide docs and safety checks).
- Integrating or demonstrating real ML model weights (do not add private weights to the repo).
- UX improvements, bug fixes, and additional telemetry.

When submitting changes, please include tests where appropriate and update this README with any new setup steps.

## License & Contact

No license is included in this repository. Contact the repository owner for licensing and reuse terms.

Repository owner: gugu-2

