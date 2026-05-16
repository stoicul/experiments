FROM node:20

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Explicitly create the data directory inside the container
RUN mkdir -p data

# Use ENTRYPOINT so that command line arguments are appended to the script
ENTRYPOINT ["npm", "start", "--"]
