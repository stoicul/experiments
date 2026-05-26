FROM php:8.3.31-cli-alpine

# Install build dependencies and extension build tools if needed
RUN docker-php-ext-install opcache

# Copy custom php.ini configurations for OPcache JIT enabling
COPY opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Set working directory
WORKDIR /app

# Copy application files
COPY . /app

# Default command
CMD [ "php", "scripts/run_all.php" ]
