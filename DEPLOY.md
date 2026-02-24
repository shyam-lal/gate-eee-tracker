# Deployment Guide (Oracle Staging)

### 1. Environment Setup
Create a `.env` file in the `server` directory based on `.env.example`:
```bash
cp server/.env.example server/.env
# Edit server/.env with your Oracle DB details
```

### 2. Install Dependencies
Run this in the project root:
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 3. Build Frontend
```bash
npm run build
```
This will generate a `dist` folder in the root.

### 4. Database Migration
Ensure your database is reachable and run:
```bash
cd server
npm run migrate
cd ..
```

### 5. Start with PM2
```bash
pm2 start ecosystem.config.cjs --env staging
```

### 6. Nginx Configuration (Example)
To serve the frontend and proxy the API:
```nginx
server {
    listen 80;
    server_name your-staging-domain.com;
    root /path/to/gate-ee-tracker/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001; # Matches PORT in ecosystem.config.cjs
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
