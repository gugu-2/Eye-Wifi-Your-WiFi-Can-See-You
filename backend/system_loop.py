import asyncio
import random
from hardware_interface import CSIIngestionEngine
from ml_pipeline import SpatialLocatorModel, DensePoseWiFiModel, BiometricIdentifier

class OntologyEngine:
    def __init__(self):
        self.hardware = CSIIngestionEngine()
        self.locator = SpatialLocatorModel()
        self.pose_engine = DensePoseWiFiModel()
        self.bio_engine = BiometricIdentifier()

    def generate_simulated_state(self):
        """ Fallback simulator for when hardware is detached """
        # Simulate an occasional alert
        alerts = []
        is_intrusion = random.random() < 0.05
        is_panic = random.random() < 0.02

        if is_intrusion:
            alerts.append({"type": "INTRUSION", "message": "UNVERIFIED SIGNATURE DETECTED - SECTOR 4", "level": "CRITICAL"})
        if is_panic:
            alerts.append({"type": "VITAL_ANOMALY", "message": "ABNORMAL HEART RATE SPIKE (>120BPM) - NODE_ALPHA", "level": "WARNING"})

        return {
            "telemetry": {
                "csi_rate": random.randint(1350, 1420),
                "noise_floor": f"-{random.randint(91, 94)} dBm"
            },
            "alerts": alerts,
            "entities": [
                {
                    "id": "NODE_ALPHA", "name": "Authorized Personnel", "type": "KNOWN",
                    "conf": random.randint(95, 99), "bpm": random.randint(120, 135) if is_panic else random.randint(70, 75), "resp": 16,
                    "state": "STATIONARY" if random.random() > 0.1 else "TRANSITING",
                    "target_pos": {"x": random.uniform(0.2, 0.8), "y": random.uniform(0.2, 0.8)}
                },
                {
                    "id": "NODE_BETA", "name": "Contractor ID:491", "type": "KNOWN",
                    "conf": random.randint(85, 94), "bpm": random.randint(80, 88), "resp": 18,
                    "state": "TRANSITING" if random.random() > 0.2 else "STATIONARY",
                    "target_pos": {"x": random.uniform(0.2, 0.8), "y": random.uniform(0.2, 0.8)}
                },
                {
                    "id": "SIG_UNVERIFIED", "name": "Unknown Signature", "type": "ANOMALY",
                    "conf": random.randint(20, 45), "bpm": random.randint(100, 115), "resp": 24,
                    "state": "TRANSITING",
                    "target_pos": {"x": random.uniform(0.2, 0.8), "y": random.uniform(0.2, 0.8)}
                }
            ]
        }
