# ── Stage 1: Build Expo web app ──────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .


# Export static web build via Expo
RUN npx expo export --platform web

# Also copy dist to public for static host compatibility
RUN cp -r /app/dist /app/public
RUN cp /app/dist/index.html /app/public/index.html

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
