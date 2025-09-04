'use client';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Scanner Pro - Debug Mode</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">CSS Check</h2>
        <p className="text-green-400">If you see this in green with a dark background, CSS is loading!</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">Environment Variables</h2>
        <ul className="space-y-2">
          <li>POLYGON_API_KEY: {process.env.POLYGON_API_KEY ? '✅ Set' : '❌ Not set'}</li>
          <li>FMP_API_KEY: {process.env.FMP_API_KEY ? '✅ Set' : '❌ Not set'}</li>
          <li>ORTEX_API_KEY: {process.env.ORTEX_API_KEY ? '✅ Set' : '❌ Not set'}</li>
        </ul>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">Components Test</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Button 1</button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">Button 2</button>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">Button 3</button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">Button 4</button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Ready Status</h2>
        <p className="text-xl">✅ Debug page is rendering correctly!</p>
        <p className="mt-2 text-gray-400">If you see all the above with proper styling, the deployment is working.</p>
      </div>
    </div>
  );
}