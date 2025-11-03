FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY api/package.json ./api/
COPY app/package.json ./app/

# Install all dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Install Playwright browsers
RUN npx playwright install chromium

# Set working directory for e2e
WORKDIR /app/e2e

# Default command
CMD ["yarn", "test:e2e"]
