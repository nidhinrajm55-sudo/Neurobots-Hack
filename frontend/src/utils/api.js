const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse(response, defaultErrorMsg) {
  if (!response.ok) {
    let errorDetail = defaultErrorMsg;
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || defaultErrorMsg;
    } catch {}
    throw new Error(errorDetail);
  }
  return response.json();
}

export const apiClient = {
  async scanAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/scan`);
      return await handleResponse(response, 'Failed to run full system scan');
    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    }
  },

  async getActions() {
    try {
      const response = await fetch(`${API_BASE_URL}/actions`);
      return await handleResponse(response, 'Failed to fetch action logs');
    } catch (error) {
      console.error('Get actions error:', error);
      return { actions: [] };
    }
  },

  async startAttack(mode = 'load_flood', duration_sec = 30) {
    try {
      const response = await fetch(`${API_BASE_URL}/attack/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, duration_sec })
      });
      return await handleResponse(response, 'Failed to start attack scenario');
    } catch (error) {
      console.error('Start attack error:', error);
      throw error;
    }
  },

  async stopAttack() {
    try {
      const response = await fetch(`${API_BASE_URL}/attack/stop`, {
        method: 'POST'
      });
      return await handleResponse(response, 'Failed to stop attack');
    } catch (error) {
      console.error('Stop attack error:', error);
      throw error;
    }
  },

  async triggerManualRemediation(service, risk_level = 'degrading') {
    try {
      const response = await fetch(`${API_BASE_URL}/actions/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, risk_level, reason: 'Manual demo override' })
      });
      return await handleResponse(response, 'Failed to trigger manual remediation');
    } catch (error) {
      console.error('Manual remediation error:', error);
      throw error;
    }
  },

  async getBlastRadius(service = 'order-service') {
    try {
      const response = await fetch(`${API_BASE_URL}/blast-radius/${encodeURIComponent(service)}`);
      return await handleResponse(response, `Failed to fetch blast radius for ${service}`);
    } catch (error) {
      console.error('Blast radius error:', error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await handleResponse(response, 'Health check failed');
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },

  async triggerMLScan(service = 'payment-service') {
    try {
      const response = await fetch(`${API_BASE_URL}/scan/${encodeURIComponent(service)}`);
      return await handleResponse(response, `Failed to scan ${service}`);
    } catch (error) {
      console.error('Trigger ML Scan error:', error);
      throw error;
    }
  },

  async autoFix(service = 'payment-service') {
    return this.triggerManualRemediation(service, 'degrading');
  },

  async getStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      return await handleResponse(response, 'Failed to fetch status');
    } catch (error) {
      return { system_status: 'healthy', worst_node: null };
    }
  },

  async getNodes() {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes`);
      return await handleResponse(response, 'Failed to fetch nodes');
    } catch (error) {
      return { nodes: [], system_status: 'healthy' };
    }
  },

  async getMetricsTimeseries(service = 'payment-service', window = '120s') {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/timeseries?service=${encodeURIComponent(service)}&window=${window}`);
      return await handleResponse(response, 'Failed to fetch timeseries metrics');
    } catch (error) {
      return { service, points: [], markers: [] };
    }
  },

  async getProblems(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/problems?${query}`);
      return await handleResponse(response, 'Failed to fetch problems');
    } catch (error) {
      return { problems: [], total: 0 };
    }
  },

  async getProblemDetail(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/problems/${id}`);
      return await handleResponse(response, 'Failed to fetch problem detail');
    } catch (error) {
      throw error;
    }
  },

  async getPrioritization() {
    try {
      const response = await fetch(`${API_BASE_URL}/prioritization`);
      return await handleResponse(response, 'Failed to fetch prioritization');
    } catch (error) {
      return { ranked: [], mode: 'auto_remediate' };
    }
  },

  async setPrioritizationMode(mode) {
    try {
      const response = await fetch(`${API_BASE_URL}/prioritization/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      return await handleResponse(response, 'Failed to update mode');
    } catch (error) {
      throw error;
    }
  },

  async remediateProblem(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/problems/${id}/remediate`, {
        method: 'POST'
      });
      return await handleResponse(response, 'Failed to remediate problem');
    } catch (error) {
      throw error;
    }
  },

  async dismissProblem(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/problems/${id}/dismiss`, {
        method: 'POST'
      });
      return await handleResponse(response, 'Failed to dismiss problem');
    } catch (error) {
      throw error;
    }
  },

  async getRolloutPhase() {
    try {
      const response = await fetch(`${API_BASE_URL}/rollout/phase`);
      return await handleResponse(response, 'Failed to fetch rollout phase');
    } catch (error) {
      return { phase: 'phase_4_full_autonomy', phase_name: 'Phase 4: Full Autonomy', description: 'Closed-loop operational' };
    }
  },

  async setRolloutPhase(phase) {
    try {
      const response = await fetch(`${API_BASE_URL}/rollout/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase })
      });
      return await handleResponse(response, 'Failed to update rollout phase');
    } catch (error) {
      throw error;
    }
  },

  async trigger2AMScenario() {
    try {
      const response = await fetch(`${API_BASE_URL}/attack/nightly_db_degrade`, {
        method: 'POST'
      });
      return await handleResponse(response, 'Failed to trigger 2:00 AM scenario');
    } catch (error) {
      throw error;
    }
  },

  async getGraph() {
    try {
      const response = await fetch(`${API_BASE_URL}/graph`);
      return await handleResponse(response, 'Failed to fetch topology graph');
    } catch (error) {
      return { nodes: [], edges: [] };
    }
  },

  async login({ email, password }) {
    return {
      email,
      full_name: email && email.includes('@') ? email.split('@')[0] : (email || 'User')
    };
  },

  async register({ full_name, email, password }) {
    return {
      email,
      full_name: full_name || (email && email.includes('@') ? email.split('@')[0] : 'User')
    };
  },

  async googleAuth(googleData) {
    return {
      email: googleData?.email || 'user@gmail.com',
      full_name: googleData?.full_name || 'Google User'
    };
  }
};