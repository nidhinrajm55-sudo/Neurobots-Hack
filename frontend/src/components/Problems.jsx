'use client';
import React, { useState, useEffect } from 'react';
import { 
  Filter, RefreshCcw, Activity, AlertOctagon, Monitor, Clock, ChevronDown, 
  Download, EyeOff, LayoutGrid, List, Search, Check, X, ChevronRight, Loader2,
  Wrench, AlertTriangle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '../utils/api';
import ProblemDetail from './ProblemDetail';

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Filter options
  const statusOptions = ['All', 'Ongoing', 'Resolved', 'Auto-remediated', 'Dismissed'];
  const typeOptions = ['All', 'Anomaly Detected', 'Threshold Breach', 'Remediation Triggered', 'Recovered'];
  const severityOptions = ['All', 'Critical', 'High', 'Medium', 'Low'];

  // Fetch problems data
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeFilter !== 'All') params.severity = activeFilter.toLowerCase();
        if (selectedCategory.length > 0) params.type = selectedCategory.map(t => t.toLowerCase().replace(' ', '_')).join(',');
        if (searchQuery) params.q = searchQuery;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
        
        const problemsData = await apiClient.getProblems(params);
        setProblems(problemsData.problems || []);
        setFilteredProblems(problemsData.problems || []);
      } catch (error) {
        console.error('Error fetching problems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
    
    // Set up polling interval
    const interval = setInterval(fetchProblems, 3000);
    return () => clearInterval(interval);
  }, [activeFilter, selectedCategory, searchQuery, fromDate, toDate]);

  // Update filtered problems when search changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredProblems(problems);
    } else {
      const filtered = problems.filter(problem => 
        problem.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (problem.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProblems(filtered);
    }
  }, [searchQuery, problems]);

  const handleSeverityFilter = (severity) => {
    setActiveFilter(severity);
  };

  const handleTypeFilter = (type) => {
    if (selectedCategory.includes(type)) {
      setSelectedCategory(selectedCategory.filter(t => t !== type));
    } else {
      setSelectedCategory([...selectedCategory, type]);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDateChange = (type, date) => {
    if (type === 'from') setFromDate(date);
    else setToDate(date);
  };

  const handleClearFilters = () => {
    setActiveFilter('All');
    setSelectedCategory([]);
    setSearchQuery('');
    setFromDate('');
    setToDate('');
  };

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem);
  };

  const handleProblemClose = () => {
    setSelectedProblem(null);
  };

  const severityColors = {
    critical: 'text-red-700 bg-red-100 border-red-200',
    high: 'text-orange-700 bg-orange-100 border-orange-200',
    medium: 'text-amber-700 bg-amber-100 border-amber-200',
    low: 'text-emerald-700 bg-emerald-100 border-emerald-200'
  };

  const typeColors = {
    anomaly_detected: 'border-l-4 border-red-500 bg-red-50/50',
    threshold_breach: 'border-l-4 border-amber-500 bg-amber-50/50',
    remediation_triggered: 'border-l-4 border-emerald-500 bg-emerald-50/50',
    recovered: 'border-l-4 border-blue-500 bg-blue-50/50'
  };

  const statusColors = {
    ongoing: 'text-red-600',
    resolved: 'text-emerald-600',
    auto_remediated: 'text-blue-600',
    dismissed: 'text-slate-500'
  };

  if (loading && problems.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-500">Loading problems...</p>
        </div>
      </div>
    );
  }

  // If a problem is selected, render the dedicated ProblemDetail component
  if (selectedProblem) {
    return (
      <div className="p-6">
        <ProblemDetail 
          problem={selectedProblem} 
          onBack={handleProblemClose} 
          onRemediate={async (id) => {
            await apiClient.remediateProblem(id);
          }}
          onDismiss={async (id) => {
            await apiClient.dismissProblem(id);
          }}
        />
      </div>
    );
  }

  const hasLiveAttack = problems.some(p => p.id === 'prob_attack_live');

  return (
    <div className="p-6 space-y-6">
      {/* Live Attack Warning Banner */}
      {hasLiveAttack ? (
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-300 animate-bounce" />
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider">
                🔥 LIVE ATTACK IN PROGRESS DETECTED IN PROBLEMS LOG
              </h4>
              <p className="text-[11px] opacity-90 font-medium">
                Isolation Forest & Random Forest models flagged critical anomaly on target app. Click below for details.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
            CRITICAL ONGOING
          </span>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>SYSTEM NOMINAL — All Microservices Operating within Nominal Thresholds</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
            0 ACTIVE BREACHES
          </span>
        </div>
      )}

      {/* Problems Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Problems Log
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
              {filteredProblems.length} Total Issues
            </span>
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            Real-time telemetry breaches & predictive anomaly detections
          </p>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-600">Severity:</span>
            <div className="flex gap-1">
              {severityOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSeverityFilter(option)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    activeFilter === option 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-600">Type:</span>
            <div className="flex gap-1">
              {typeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleTypeFilter(option)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedCategory.includes(option)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={handleSearch}
              className="bg-transparent focus:outline-none text-xs text-slate-800 placeholder-slate-400 w-36"
            />
          </div>
          
          {/* Clear Filters Button */}
          {(activeFilter !== 'All' || selectedCategory.length > 0 || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Problems List Grid */}
      <div className="space-y-3">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 text-slate-400">
            <Check className="h-10 w-10 mx-auto mb-3 text-emerald-500 bg-emerald-50 p-2 rounded-full border border-emerald-200" />
            <h3 className="text-base font-bold text-slate-800">No Problems Detected</h3>
            <p className="text-xs text-slate-500 mt-1">All microservices are operating normally.</p>
          </div>
        ) : (
          filteredProblems.map((problem) => {
            const time = new Date(problem.timestamp);
            const timeAgo = `${Math.floor((Date.now() - time.getTime()) / 1000)}s ago`;
            
            return (
              <div 
                key={problem.id} 
                className={`cursor-pointer rounded-2xl p-4 border transition-all hover:shadow-md bg-white ${
                  typeColors[problem.type] || 'border-slate-200 border-l-4 border-l-slate-400'
                }`}
                onClick={() => handleProblemSelect(problem)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${
                      problem.severity === 'critical' ? 'bg-red-600 animate-ping' : 
                      problem.severity === 'high' ? 'bg-orange-600' : 
                      problem.severity === 'medium' ? 'bg-amber-600' : 
                      'bg-emerald-600'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{problem.service}</h4>
                        <span className="font-mono text-xs text-slate-400">#{problem.id}</span>
                      </div>
                      <p className="text-xs text-slate-500">{timeAgo} ({time.toLocaleTimeString()})</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${severityColors[problem.severity] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {problem.severity ? problem.severity.toUpperCase() : 'UNKNOWN'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {problem.type ? problem.type.replace('_', ' ').toUpperCase() : 'EVENT'}
                    </span>
                    <ChevronRight size={18} className="text-slate-400" />
                  </div>
                </div>
                
                <div className="text-sm text-slate-700 font-medium mt-1">
                  {problem.description || `Anomalous metric deviation detected on ${problem.service}`}
                </div>
                
                {problem.status && (
                  <div className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Status: <strong className={statusColors[problem.status] || 'text-slate-700'}>{problem.status.toUpperCase()}</strong></span>
                    <span className="text-blue-600 font-bold text-[11px] hover:underline flex items-center gap-1">
                      Click to view detailed impact & root cause &rarr;
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Problems;
