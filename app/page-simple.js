'use client';

import { useState } from 'react';

export default function SimpleHome() {
  const [activeTab, setActiveTab] = useState('mass');

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Scanner Pro
          </span>
        </h1>

        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg p-2 mb-6 flex gap-2">
          <button 
            onClick={() => setActiveTab('mass')}
            className={`px-4 py-2 rounded ${activeTab === 'mass' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Mass Scanner
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded ${activeTab === 'ai' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            AI Picks
          </button>
          <button 
            onClick={() => setActiveTab('ml')}
            className={`px-4 py-2 rounded ${activeTab === 'ml' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            ML Trading
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'mass' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Mass Scanner</h2>
              <p>This tab would show the Mass Scanner component.</p>
            </div>
          )}
          {activeTab === 'ai' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">AI Picks</h2>
              <p>This tab would show AI recommendations.</p>
            </div>
          )}
          {activeTab === 'ml' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">ML Trading System</h2>
              <p>This tab would show the ML Trading System.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}