# 1. Chọn base image Node.js
FROM node:18

# 2. Set working directory trong container
WORKDIR /app

# 3. Copy package.json & package-lock.json để cài dependencies
COPY package*.json ./

# 4. Cài dependencies
RUN npm install --production

# 5. Copy toàn bộ source code
COPY . .

# 6. Expose port
EXPOSE 5000

# 7. Lệnh chạy app
CMD ["node", "index.js"]
