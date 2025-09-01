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
        PORT: 3000
      },
      error_file: '/home/user/webapp/logs/err.log',
      out_file: '/home/user/webapp/logs/out.log',
      log_file: '/home/user/webapp/logs/combined.log',
      time: true
    }
  ]
};