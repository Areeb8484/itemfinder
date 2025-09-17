FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose the port that the application listens on
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]