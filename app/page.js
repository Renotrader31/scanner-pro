'use client';

import { useState, useEffect } from 'react';
import MassScanner from './components/MassScanner';
import AIRecommendations from './components/AIRecommendations';
import MLTradingSystemEnhanced from './components/MLTradingSystemEnhanced';

export default function Home() {
  const [activeTab, setActiveTab] = useState('mass');
  
  // Global trade storage that persists across tab switches
  const [globalTrades, setGlobalTrades] = useState({
    active: [],
    pending: [],
    closed: []
  });
  
  // Load trades from localStorage on mount
  useEffect(() => {
    const savedTrades = localStorage.getItem('scannerProTrades');
    if (savedTrades) {
      try {
        setGlobalTrades(JSON.parse(savedTrades));
      } catch (e) {
        console.log('Could not load saved trades');
      }
    }
  }, []);
  
  // Save trades to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('scannerProTrades', JSON.stringify(globalTrades));
  }, [globalTrades]);

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s',
    backgroundColor: isActive ? '#3B82F6' : '#374151',
    color: 'white',
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0E27',
      background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 50%, #0f1419 100%)',
      color: 'white', 
      padding: '32px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            background: 'linear-gradient(to right, #60A5FA, #A78BFA, #F472B6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Ultimate Scanner Pro 🚀
          </h1>
          <p style={{ color: '#9CA3AF' }}>Advanced Stock Scanner with ML Trading System</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          backgroundColor: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(10px)',
          padding: '8px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button onClick={() => setActiveTab('mass')} style={tabStyle(activeTab === 'mass')}>
            🔍 Mass Scanner
          </button>
          <button onClick={() => setActiveTab('ai')} style={tabStyle(activeTab === 'ai')}>
            ⭐ AI Picks
          </button>
          <button onClick={() => setActiveTab('ml')} style={tabStyle(activeTab === 'ml')}>
            🧠 ML Trading System
          </button>
          <button onClick={() => setActiveTab('options')} style={tabStyle(activeTab === 'options')}>
            🎯 Options Flow
          </button>
          <button onClick={() => setActiveTab('technicals')} style={tabStyle(activeTab === 'technicals')}>
            📊 Technicals
          </button>
          <button onClick={() => setActiveTab('institutional')} style={tabStyle(activeTab === 'institutional')}>
            🏛️ Institutional
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ 
          backgroundColor: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {activeTab === 'mass' && (
            <div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#60A5FA' }}>
                Mass Scanner - 4,500+ Stocks
              </h2>
              <MassScanner />
            </div>
          )}
          
          {activeTab === 'ai' && (
            <div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#F472B6' }}>
                AI-Powered Recommendations
              </h2>
              <AIRecommendations />
            </div>
          )}
          
          {activeTab === 'ml' && (
            <div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#A78BFA' }}>
                ML Trading System Enhanced
              </h2>
              <MLTradingSystemEnhanced 
                globalTrades={globalTrades}
                setGlobalTrades={setGlobalTrades}
              />
            </div>
          )}

          {activeTab === 'options' && (
            <div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#10B981' }}>
                Options Flow Scanner
              </h2>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <p>Options flow analysis with real-time data from Polygon API</p>
                <p style={{ marginTop: '10px', color: '#9CA3AF' }}>
                  • Live options chains<br/>
                  • Unusual activity detection<br/>
                  • Strike/expiry analysis<br/>
                  • Greeks calculation
                </p>
              </div>
            </div>
          )}

          {activeTab === 'technicals' && (
            <div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#F59E0B' }}>
                Technical Analysis Dashboard
              </h2>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <p>Real-time technical indicators and chart patterns</p>
                <p style={{ marginTop: '10px', color: '#9CA3AF' }}>
                  • RSI, MACD, Moving Averages<br/>
                  • Support/Resistance levels<br/>
                  • Volume analysis<br/>
                  • Pattern recognition
                </p>
              </div>
            </div>
          )}

          {activeTab === 'institutional' && (
            <div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#8B5CF6' }}>
                Institutional Flow Tracking
              </h2>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <p>Track smart money movements and institutional activity</p>
                <p style={{ marginTop: '10px', color: '#9CA3AF' }}>
                  • Dark pool activity<br/>
                  • Block trades<br/>
                  • Insider transactions<br/>
                  • Fund flow analysis
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div style={{ 
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ color: '#10B981', fontWeight: 'bold' }}>✅ System Status: </span>
            <span>All APIs connected • Real-time data active</span>
          </div>
          <div style={{ color: '#9CA3AF' }}>
            Powered by Polygon, FMP, and Ortex APIs
          </div>
        </div>
      </div>
    </div>
  );
}