module.exports = {
    apps: [
        {
            name: "gate-vault-api",
            script: "./src/app.js",
            cwd: "./server",
            env: {
                NODE_ENV: "production",
                PORT: 5000
            },
            env_staging: {
                NODE_ENV: "staging",
                PORT: 5001
            },
            instances: 1,
            exec_mode: "fork",
            watch: false,
            max_memory_restart: "1G",
        }
    ]
};
