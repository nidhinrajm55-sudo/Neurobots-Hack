import asyncio
import httpx
import time
import sys
import os

TARGET_GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8002")

attack_status = {
    "active": False,
    "mode": None,
    "start_time": None,
    "total_requests": 0,
    "errors": 0
}

async def run_load_flood(duration_sec: int = 30, concurrency: int = 15):
    """Generates high concurrency request storm targeting order-service."""
    attack_status["active"] = True
    attack_status["mode"] = "LOAD_FLOOD"
    attack_status["start_time"] = time.time()
    attack_status["total_requests"] = 0
    attack_status["errors"] = 0
    
    print(f"🔥 Starting Load Flood Attack on {TARGET_GATEWAY_URL}/api/order/create (Concurrency={concurrency}, Duration={duration_sec}s)")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        async def worker():
            while attack_status["active"] and (time.time() - attack_status["start_time"] < duration_sec):
                try:
                    res = await client.post(f"{TARGET_GATEWAY_URL}/api/order/create")
                    attack_status["total_requests"] += 1
                    if res.status_code != 200:
                        attack_status["errors"] += 1
                except Exception as e:
                    attack_status["errors"] += 1
                await asyncio.sleep(0.01)

        tasks = [asyncio.create_task(worker()) for _ in range(concurrency)]
        await asyncio.gather(*tasks)

    attack_status["active"] = False
    print(f"✅ Load Flood Attack completed. Sent {attack_status['total_requests']} requests with {attack_status['errors']} errors.")

async def run_memory_leak(duration_sec: int = 30, interval_sec: float = 0.5):
    """Hits auth-service memory leak endpoint repeatedly to exhaust RAM."""
    attack_status["active"] = True
    attack_status["mode"] = "MEMORY_LEAK"
    attack_status["start_time"] = time.time()
    attack_status["total_requests"] = 0
    attack_status["errors"] = 0

    print(f"💧 Starting Memory Leak Attack on {TARGET_GATEWAY_URL}/api/auth/leak (Interval={interval_sec}s)")

    async with httpx.AsyncClient(timeout=10.0) as client:
        while attack_status["active"] and (time.time() - attack_status["start_time"] < duration_sec):
            try:
                res = await client.post(f"{TARGET_GATEWAY_URL}/api/auth/leak")
                attack_status["total_requests"] += 1
            except Exception as e:
                attack_status["errors"] += 1
            await asyncio.sleep(interval_sec)

    attack_status["active"] = False
    print(f"✅ Memory Leak Attack completed. Triggered {attack_status['total_requests']} memory allocations.")

def stop_attack():
    attack_status["active"] = False
    print("🛑 Attack manually stopped.")
    return attack_status

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "load_flood"
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    if mode == "memory_leak":
        asyncio.run(run_memory_leak(duration_sec=duration))
    else:
        asyncio.run(run_load_flood(duration_sec=duration))
