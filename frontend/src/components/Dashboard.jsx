'use client';
import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { 
  Activity, Server, Zap, CheckCircle, AlertTriangle, ArrowUp, ArrowDown, 
  Layers, DollarSign, Brain, Loader2, Waves, Radio, ShieldCheck, Gauge,
  RefreshCcw, Settings, Terminal, LayoutGrid
} from 'lucide-react';
import Card from './Card';
import { apiClient } from '../utils/api';

const Dashboard = () => {
  const [nodes, setNodes] = useState([]);
  const [systemStatus, setSystemStatus] = useState('healthy');
  const [worstNode, setWorstNode] = useState(null);
  const [activeAttack, setActiveAttack] = useState(null);
  const [chartData, setChartData] = useState({});
  const [modelConfidence, setModelConfidence] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceForChart, setSelectedServiceForChart] = useState(null);
  const [activeMetricFilter, setActiveMetricFilter] = useState('all');

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const nodesData = await apiClient.getNodes();
        setNodes(nodesData.nodes || []);
        setSystemStatus(nodesData.system_status || 'healthy');
        setWorstNode(nodesData.worst_node || null);
        setActiveAttack(nodesData.active_attack || null);

        const problemsData = await apiClient.getProblems({ limit: 5 });
        setRecentActivity(problemsData.problems || []);

        const targetSvc = nodesData.worst_node ||
                          (nodesData.active_attack?.is_active ? 
                            (nodesData.active_attack.mode === 'memory_leak' ? 'auth-service' : 'order-service') : 
                            (selectedServiceForChart || nodesData.nodes?.[0]?.service || 'order-service'));

        if (!selectedServiceForChart || nodesData.active_attack?.is_active) {
          setSelectedServiceForChart(targetSvc);
        }

        const currentChartSvc = selectedServiceForChart || targetSvc;
        const timeseriesData = await apiClient.getMetricsTimeseries(currentChartSvc, '120s');
        setChartData(prev => ({
          ...prev,
          [currentChartSvc]: timeseriesData
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 2000);
    return () => clearInterval(interval);
  }, [selectedServiceForChart]);

  const handleServiceSelect = async (service) => {
    setSelectedServiceForChart(service);
    try {
      const timeseriesData = await apiClient.getMetricsTimeseries(service, '120s');
      setChartData(prev => ({
        ...prev,
        [service]: timeseriesData
      }));
    } catch (error) {
      console.error('Error fetching timeseries for service:', error);
    }
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-500">Loading dashboard telemetry...</p>
        </div>
      </div>
    );
  }

  const activePoints = chartData[selectedServiceForChart]?.points || [];

  return (
    <div className="p-6 space-y-6">
      {/* Live Attack Warning Banner */}
      {activeAttack?.is_active && (
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-yellow-300 animate-bounce" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider">
                🔥 ATTACK ACTIVE ON TARGET APP: {activeAttack.mode?.toUpperCase()}
              </h4>
              <p className="text-xs opacity-90 font-medium">
                High concurrency telemetry anomaly detected on <span className="font-bold underline">{selectedServiceForChart}</span>. Real-time metric graph spiking!
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-mono font-bold">
            SCANNER ACTIVE
          </span>
        </div>
      )}

      {/* Node Status Grid (Top Section) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const statusColor = node.status === 'critical' ? 'border-red-500' : 
                            node.status === 'degrading' ? 'border-amber-500' : 
                            'border-emerald-500';
          const bgColor = node.status === 'critical' ? 'bg-red-50/50' : 
                        node.status === 'degrading' ? 'bg-amber-50/50' : 
                        'bg-emerald-50/50';
          const isSelected = node.service === selectedServiceForChart;
          
          return (
            <div 
              key={node.service} 
              className={`cursor-pointer border-2 ${statusColor} ${bgColor} rounded-xl p-4 hover:border-[3px] transition-all ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
              onClick={() => handleServiceSelect(node.service)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Server size={16} className="text-slate-600" />
                  {node.service}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  node.status === 'critical' ? 'bg-red-100 text-red-800' : 
                  node.status === 'degrading' ? 'bg-amber-100 text-amber-800' : 
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {node.status}
                </span>
              </div>
              
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">CPU:</span>
                  <span className={`font-bold ${node.metrics.cpu_pct > 75 ? 'text-red-600' : 'text-slate-800'}`}>
                    {node.metrics.cpu_pct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Memory:</span>
                  <span className={`font-bold ${node.metrics.memory_mb > 350 ? 'text-red-600' : 'text-slate-800'}`}>
                    {node.metrics.memory_mb.toFixed(1)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Latency (p95):</span>
                  <span className={`font-bold ${node.metrics.p95_latency_ms > 200 ? 'text-red-600' : 'text-slate-800'}`}>
                    {node.metrics.p95_latency_ms.toFixed(0)} ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Errors/s:</span>
                  <span className="font-bold text-slate-800">{node.metrics.error_rate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Live Metric Charts and Model Confidence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Metric Charts (Large Section) */}
        <div className="col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Activity size={18} className="text-blue-600" />
                Telemetry Graph Spike Monitor — <span className="text-blue-600 font-mono">{selectedServiceForChart}</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Real-time metrics stream & anomaly detection waveform</p>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
              {[
                { id: 'all', label: 'ALL' },
                { id: 'cpu', label: 'CPU %' },
                { id: 'latency', label: 'LATENCY' },
                { id: 'memory', label: 'RAM' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveMetricFilter(f.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                    activeMetricFilter === f.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Chart Container */}
          <div className="h-72">
            {activePoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={activePoints}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                  />
                  <Legend verticalAlign="top" height={36} />
                  
                  {(activeMetricFilter === 'all' || activeMetricFilter === 'cpu') && (
                    <Line 
                      type="monotone" 
                      name="CPU Usage (%)"
                      dataKey="cpu_pct" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  
                  {(activeMetricFilter === 'all' || activeMetricFilter === 'memory') && (
                    <Line 
                      type="monotone" 
                      name="Memory (MB)"
                      dataKey="memory_mb" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  )}
                  
                  {(activeMetricFilter === 'all' || activeMetricFilter === 'latency') && (
                    <Line 
                      type="monotone" 
                      name="P95 Latency (ms)"
                      dataKey="p95_latency_ms" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2 text-blue-500" />
                <p className="text-xs">Streaming metrics for {selectedServiceForChart}...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column: Model Confidence Panel & Recent Activity */}
        <div className="col-span-1 space-y-6">
          {/* Model Confidence Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Model Confidence</h3>
              <div className="text-xs text-slate-500">Per-node ML analysis</div>
            </div>
            
            <div className="space-y-3">
              {nodes.map((node) => {
                const model = node.model || { rf_class: 'healthy', rf_confidence: 0.95, if_score: -0.1, if_anomaly: false };
                const rfColor = model.rf_class === 'critical' ? 'text-red-600' : 
                              model.rf_class === 'degrading' ? 'text-amber-600' : 
                              'text-emerald-600';
                const ifStatus = model.if_anomaly ? 'ANOMALY DETECTED' : 'NORMAL';
                const ifColor = model.if_anomaly ? 'text-red-600' : 'text-emerald-600';
                
                return (
                  <div key={node.service} className="border-l-2 pl-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{node.service}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        node.status === 'critical' ? 'bg-red-100 text-red-800' : 
                        node.status === 'degrading' ? 'bg-amber-100 text-amber-800' : 
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {node.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Random Forest:</span>
                        <span className={`${rfColor} font-medium`}>
                          {model.rf_class.toUpperCase()} 
                          <span className="text-slate-400">({(model.rf_confidence * 100).toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Isolation Forest:</span>
                        <span className={`${ifColor} font-medium`}>
                          {ifStatus} 
                          <span className="text-slate-400">({model.if_score.toFixed(3)})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Overall Assessment */}
              <div className="mt-4 pt-3 border-t border-slate-200/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">System Status:</span>
                  <span className={`font-semibold ${
                    systemStatus === 'critical' ? 'text-red-600' : 
                    systemStatus === 'degrading' ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`}>
                    {systemStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-600">Worst Node:</span>
                  <span className="font-mono">{worstNode || 'None'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Last 5 events</p>
            </div>
            
            <div className="space-y-2">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const time = new Date(activity.timestamp);
                  const timeAgo = `${Math.floor((Date.now() - time.getTime()) / 1000)}s ago`;
                  
                  const typeColors = {
                    anomaly_detected: 'bg-red-50/50 border-l-4 border-red-500',
                    threshold_breach: 'bg-amber-50/50 border-l-4 border-amber-500', 
                    remediation_triggered: 'bg-emerald-50/50 border-l-4 border-emerald-500',
                    recovered: 'bg-blue-50/50 border-l-4 border-blue-500'
                  };
                  
                  const typeLabels = {
                    anomaly_detected: 'ANOMALY DETECTED',
                    threshold_breach: 'THRESHOLD BREACH',
                    remediation_triggered: 'REMEDIATION TRIGGERED',
                    recovered: 'SYSTEM RECOVERED'
                  };
                  
                  const severityColors = {
                    critical: 'text-red-600',
                    high: 'text-orange-600', 
                    medium: 'text-amber-600',
                    low: 'text-emerald-600'
                  };
                  
                  return (
                    <div 
                      key={activity.id} 
                      className={`p-3 rounded-lg ${typeColors[activity.type] || 'bg-slate-50/50 border-l-4 border-slate-500'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            activity.severity === 'critical' ? 'bg-red-600' : 
                            activity.severity === 'high' ? 'bg-orange-600' : 
                            activity.severity === 'medium' ? 'bg-amber-600' : 
                            'bg-emerald-600'
                          }`} />
                          <span className="font-semibold text-slate-900">
                            {typeLabels[activity.type] || activity.type.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{timeAgo}</span>
                      </div>
                      
                      <div className="text-sm text-slate-700">
                        {activity.description || `Event on ${activity.service}`}
                      </div>
                      
                      {activity.detail && (
                        <div className="mt-2 pt-2 border-t border-slate-200/20 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Service:</span>
                            <span className="font-mono">{activity.service}</span>
                          </div>
                          {activity.detail.linked_action_id && (
                            <div className="flex justify-between text-slate-500 mt-1">
                              <span>Action:</span>
                              <span className="font-mono">#{activity.detail.linked_action_id}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-400">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
