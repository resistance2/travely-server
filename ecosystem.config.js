module.exports = {
    apps: [{
      name: "travely-server",
      script: "./dist/app.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_file: ".env",
      wait_ready: true,
      listen_timeout: 50000,
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }]
  }