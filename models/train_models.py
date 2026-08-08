import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import classification_report, confusion_matrix

def generate_synthetic_dataset(num_samples: int = 600):
    """Generates synthetic dataset for 16-feature vector matching Sentinel-X spec."""
    np.random.seed(42)
    features = []
    labels = []
    
    # 1. Healthy windows (~300 samples)
    for _ in range(300):
        mean_cpu = np.random.uniform(5, 30)
        std_cpu = np.random.uniform(0.5, 3)
        min_cpu = max(0, mean_cpu - 2 * std_cpu)
        max_cpu = mean_cpu + 2 * std_cpu
        delta_cpu = np.random.uniform(-3, 3)
        cpu_trend = np.random.uniform(-0.1, 0.1)
        
        mean_mem = np.random.uniform(40, 70)
        std_mem = np.random.uniform(0.1, 1.5)
        mem_trend = np.random.uniform(-0.05, 0.05)
        
        mean_reqs = np.random.uniform(50, 150)
        request_spike_count = np.random.randint(0, 2)
        throughput_delta = np.random.uniform(-10, 10)
        
        mean_lat = np.random.uniform(15, 45)
        latency_trend = np.random.uniform(-0.5, 0.5)
        error_rate = np.random.uniform(0, 1)
        error_rate_trend = np.random.uniform(-0.01, 0.01)
        
        vec = [mean_cpu, std_cpu, min_cpu, max_cpu, delta_cpu, cpu_trend,
               mean_mem, std_mem, mem_trend, mean_reqs, request_spike_count,
               throughput_delta, mean_lat, latency_trend, error_rate, error_rate_trend]
        features.append(vec)
        labels.append("healthy")
        
    # 2. Degrading windows (~150 samples)
    for _ in range(150):
        mean_cpu = np.random.uniform(40, 75)
        std_cpu = np.random.uniform(4, 10)
        min_cpu = mean_cpu - 10
        max_cpu = mean_cpu + 15
        delta_cpu = np.random.uniform(10, 30)
        cpu_trend = np.random.uniform(0.5, 2.0)
        
        mean_mem = np.random.uniform(80, 150)
        std_mem = np.random.uniform(2, 6)
        mem_trend = np.random.uniform(0.2, 1.0)
        
        mean_reqs = np.random.uniform(200, 500)
        request_spike_count = np.random.randint(3, 7)
        throughput_delta = np.random.uniform(20, 100)
        
        mean_lat = np.random.uniform(150, 450)
        latency_trend = np.random.uniform(3.0, 15.0)
        error_rate = np.random.uniform(2, 10)
        error_rate_trend = np.random.uniform(0.1, 0.5)
        
        vec = [mean_cpu, std_cpu, min_cpu, max_cpu, delta_cpu, cpu_trend,
               mean_mem, std_mem, mem_trend, mean_reqs, request_spike_count,
               throughput_delta, mean_lat, latency_trend, error_rate, error_rate_trend]
        features.append(vec)
        labels.append("degrading")

    # 3. Critical windows (~150 samples)
    for _ in range(150):
        mean_cpu = np.random.uniform(75, 99)
        std_cpu = np.random.uniform(8, 20)
        min_cpu = mean_cpu - 15
        max_cpu = 99.0
        delta_cpu = np.random.uniform(25, 50)
        cpu_trend = np.random.uniform(2.0, 8.0)
        
        mean_mem = np.random.uniform(150, 400)
        std_mem = np.random.uniform(5, 20)
        mem_trend = np.random.uniform(1.5, 5.0)
        
        mean_reqs = np.random.uniform(500, 1200)
        request_spike_count = np.random.randint(7, 15)
        throughput_delta = np.random.uniform(100, 400)
        
        mean_lat = np.random.uniform(500, 2500)
        latency_trend = np.random.uniform(15.0, 60.0)
        error_rate = np.random.uniform(10, 50)
        error_rate_trend = np.random.uniform(0.5, 2.5)
        
        vec = [mean_cpu, std_cpu, min_cpu, max_cpu, delta_cpu, cpu_trend,
               mean_mem, std_mem, mem_trend, mean_reqs, request_spike_count,
               throughput_delta, mean_lat, latency_trend, error_rate, error_rate_trend]
        features.append(vec)
        labels.append("critical")
        
    X = np.array(features)
    y = np.array(labels)
    return X, y

def train_and_save_models():
    X, y = generate_synthetic_dataset()
    
    # Train Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X, y)
    
    y_pred = rf.predict(X)
    print("--- Random Forest Model Evaluation ---")
    print(classification_report(y, y_pred))
    
    # Train Isolation Forest on mostly normal data
    healthy_idx = np.where(y == "healthy")[0]
    degrading_sample_idx = np.where(y == "degrading")[0][:15]
    X_if = np.vstack([X[healthy_idx], X[degrading_sample_idx]])
    
    iso = IsolationForest(contamination=0.08, random_state=42)
    iso.fit(X_if)
    print("--- Isolation Forest Trained Successfully ---")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    rf_path = os.path.join(root_dir, "random_forest_model.pkl")
    iso_path = os.path.join(root_dir, "isolation_forest_model.pkl")
    
    joblib.dump(rf, rf_path)
    joblib.dump(iso, iso_path)
    print(f"✅ Saved Random Forest model to: {rf_path}")
    print(f"✅ Saved Isolation Forest model to: {iso_path}")

if __name__ == "__main__":
    train_and_save_models()
