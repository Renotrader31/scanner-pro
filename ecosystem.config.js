// Load environment variables from .env.local if it exists
const fs = require('fs');
const path = require('path');

// Function to load .env.local file
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value;
      }
    });
  }
  
  return envVars;
}

const customEnv = loadEnvFile();

module.exports = {
  apps: [
    {
      name: 'scanner-pro',
      script: 'npm',
      args: 'start',
      cwd: '/home/user/webapp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Load all environment variables from .env.local
        ...customEnv,
        // Fallback values if not in .env.local
        POLYGON_API_KEY: customEnv.POLYGON_API_KEY || '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT',
        FMP_API_KEY: customEnv.FMP_API_KEY || process.env.FMP_API_KEY || 'your_fmp_key_here',
        ORTEX_API_KEY: customEnv.ORTEX_API_KEY || process.env.ORTEX_API_KEY || 'your_ortex_key_here'
      },
      error_file: '/home/user/webapp/logs/err.log',
      out_file: '/home/user/webapp/logs/out.log',
      log_file: '/home/user/webapp/logs/combined.log',
      time: true
    }
  ]
};