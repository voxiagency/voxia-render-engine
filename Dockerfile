FROM mcr.microsoft.com/playwright:v1.47.2-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
