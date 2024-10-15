module.exports = {
    apps: [{
      name: "travely-server",
      instances: "max",
      exec_mode: "cluster",
      script: "./app.js",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_file: ".env",
      listen_timeout: 20000,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      }
    }]
  }