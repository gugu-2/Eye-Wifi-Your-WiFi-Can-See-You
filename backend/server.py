from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from system_loop import OntologyEngine

app = FastAPI(title="OmniFi Spatial Ontology API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = OntologyEngine()

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to data plane.")
    try:
        while True:
            # We use the fallback simulator since physical hardware is not present.
            payload = engine.generate_simulated_state()
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1/30) # 30 FPS stream
    except WebSocketDisconnect:
        print("Frontend disconnected.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
