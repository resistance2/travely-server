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
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        script: "./dist/app.js",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        script: "./app.js",
      }
    }]
  }