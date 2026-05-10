# Use the official Node 20 image (Debian based is generally safer for better-sqlite3 native bindings)
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Explicitly create the data directory inside the container (optional but good practice)
RUN mkdir -p data

# Run the start script defined in package.json (tsx index.ts)
CMD ["npm", "start"]
