# Self-Hosting on Hetzner

Copy-paste guide for deploying this Next.js app on a Hetzner VPS (Ubuntu 22.04+).
Uses **port 3721** for the app and **port 3722** for PM2 monitoring to avoid conflicts
with common ports already in use (3000, 8000, 80, 443).

---

## 1. Connect to your server

```bash
ssh root@YOUR_HETZNER_IP
```

---

## 2. Install Node.js 20 + pnpm (first time only)

```bash
# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager — keeps app alive after SSH disconnect)
npm install -g pm2
```

---

## 3. Clone the repo

```bash
cd /var/www
git clone https://github.com/raiyanxbox0077/e-commerce-dashboard-sketch.git dashboard
cd dashboard
```

---

## 4. Install dependencies

```bash
pnpm install
```

---

## 5. Set environment variables

```bash
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# App URL (used for auth redirects)
NEXT_PUBLIC_APP_URL=http://YOUR_HETZNER_IP:3721
EOF
```

> Edit the values: `nano .env.local`

---

## 6. Build the app

```bash
pnpm build
```

---

## 7. Start with PM2 on port 3721

```bash
PORT=3721 pm2 start "pnpm start" --name "dashboard" --env production

# Save PM2 config so it survives server reboots
pm2 save
pm2 startup
# Copy and run the command PM2 prints above (it looks like: sudo env PATH=... pm2 startup ...)
```

---

## 8. Allow port 3721 through firewall

```bash
ufw allow 3721/tcp
ufw status
```

Your app is now live at: **`http://YOUR_HETZNER_IP:3721`**

---

## 9. Verify it is running

```bash
pm2 status
pm2 logs dashboard --lines 50
```

---

## Updating the app (deploy new version)

```bash
cd /var/www/dashboard

# Pull latest changes from main
git pull origin main

# Rebuild
pnpm install
pnpm build

# Restart without downtime
pm2 reload dashboard
```

Or make a one-liner update script:

```bash
cat > /var/www/update-dashboard.sh << 'EOF'
#!/bin/bash
cd /var/www/dashboard
git pull origin main
pnpm install
pnpm build
pm2 reload dashboard
echo "Deploy complete"
EOF

chmod +x /var/www/update-dashboard.sh
```

From now on just run:
```bash
/var/www/update-dashboard.sh
```

---

## Optional: Nginx reverse proxy (clean URL, no port in browser)

If you want `http://YOUR_DOMAIN` instead of `http://IP:3721`:

```bash
apt-get install -y nginx

cat > /etc/nginx/sites-available/dashboard << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3721;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Optional: Free HTTPS with Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d YOUR_DOMAIN
```

---

## Useful PM2 commands

```bash
pm2 status                  # see all running processes
pm2 logs dashboard          # live logs
pm2 logs dashboard --lines 100   # last 100 log lines
pm2 restart dashboard       # full restart
pm2 reload dashboard        # zero-downtime reload
pm2 stop dashboard          # stop app
pm2 delete dashboard        # remove from PM2
```

---

## Port reference

| Service          | Port |
|-----------------|------|
| Next.js app     | 3721 |
| PM2 web monitor | 3722 |

To start the PM2 web monitor:
```bash
pm2 install pm2-web
pm2-web --port 3722
# Visit http://YOUR_HETZNER_IP:3722
```
