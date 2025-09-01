'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, X, TrendingUp, TrendingDown, Volume2, VolumeX, AlertTriangle, Clock, Target } from 'lucide-react';

export default function AlertsPanel({ alerts, setAlerts, onCreateAlert, soundEnabled, setSoundEnabled }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    ticker: '',
    condition: 'above',
    price: '',
    type: 'price'
  });

  const alertTypes = [
    { id: 'price', name: 'Price Alert', icon: TrendingUp },
    { id: 'volume', name: 'Volume Surge', icon: Volume2 },
    { id: 'short_squeeze', name: 'Short Squeeze', icon: Target }
  ];

  const handleCreateAlert = () => {
    if (!newAlert.ticker || !newAlert.price) return;
    
    const alert = {
      id: Date.now(),
      ticker: newAlert.ticker.toUpperCase(),
      condition: newAlert.condition,
      price: parseFloat(newAlert.price),
      type: newAlert.type,
      created: new Date().toLocaleString(),
      active: true,
      triggered: false
    };
    
    onCreateAlert(alert);
    setNewAlert({ ticker: '', condition: 'above', price: '', type: 'price' });
    setShowCreateForm(false);
  };

  const deleteAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const toggleAlert = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, active: !alert.active } : alert
    ));
  };

  const getAlertIcon = (type) => {
    const alertType = alertTypes.find(t => t.id === type);
    return alertType ? alertType.icon : Bell;
  };

  const getAlertColor = (alert) => {
    if (!alert.active) return 'text-gray-400';
    if (alert.triggered) return 'text-red-400';
    return alert.condition === 'above' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-yellow-500/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-yellow-400 font-bold flex items-center gap-2">
          <Bell size={20} />
          Price Alerts
          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
            {alerts.filter(a => a.active).length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-all ${soundEnabled ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            title="Create Alert"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-yellow-500/20">
          <h4 className="font-medium mb-3 text-yellow-300">Create New Alert</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Ticker</label>
              <input
                type="text"
                value={newAlert.ticker}
                onChange={(e) => setNewAlert({...newAlert, ticker: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-white"
                placeholder="AAPL"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Alert Type</label>
              <select
                value={newAlert.type}
                onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-white"
              >
                {alertTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}\n              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Condition</label>
              <select
                value={newAlert.condition}
                onChange={(e) => setNewAlert({...newAlert, condition: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-white"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={newAlert.price}
                onChange={(e) => setNewAlert({...newAlert, price: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-white"
                placeholder="150.00"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button 
              onClick={handleCreateAlert}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-white font-medium"
            >
              Create Alert
            </button>
            <button 
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p>No alerts set</p>
            <p className="text-sm">Click + to create your first alert</p>
          </div>
        ) : (
          alerts.map((alert, i) => {
            const IconComponent = getAlertIcon(alert.type);
            return (
              <div key={i} className={`flex justify-between items-center p-3 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-all group ${alert.triggered ? 'border-l-4 border-red-500' : ''}`}>
                <div className="flex items-center gap-3">
                  <IconComponent size={16} className={getAlertColor(alert)} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{alert.ticker}</span>
                      <span className={`text-sm ${getAlertColor(alert)}`}>
                        {alert.condition} ${alert.price}
                      </span>
                      {alert.triggered && (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold">
                          TRIGGERED
                        </span>
                      )}
                      {!alert.active && (
                        <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">
                          PAUSED
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {alert.created}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => toggleAlert(alert.id)}
                    className={`p-1 rounded transition-colors ${
                      alert.active 
                        ? 'text-yellow-400 hover:bg-yellow-400/20' 
                        : 'text-gray-400 hover:bg-gray-400/20'
                    }`}
                    title={alert.active ? 'Pause Alert' : 'Activate Alert'}
                  >
                    <Bell size={14} />
                  </button>
                  <button 
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                    title="Delete Alert"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{alerts.filter(a => a.active && !a.triggered).length} active alerts</span>
            <span>{alerts.filter(a => a.triggered).length} triggered today</span>
          </div>
        </div>
      )}
    </div>
  );
}