FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./

# Copy package files for all subprojects
COPY api/package.json ./api/
COPY app/package.json ./app/
COPY e2e/package.json e2e/yarn.lock ./e2e/

# Install root dependencies
RUN yarn install --frozen-lockfile

# Install dependencies for all subprojects
WORKDIR /app/api
RUN yarn install --frozen-lockfile

WORKDIR /app/app
RUN yarn install --frozen-lockfile

WORKDIR /app/e2e
RUN yarn install --frozen-lockfile --production=false

# Copy all source code
WORKDIR /app
COPY api/ ./api/
COPY app/ ./app/
COPY e2e/ ./e2e/

# Install Playwright browsers (already included in base image, but ensure chromium is available)
WORKDIR /app/e2e
RUN npx playwright install chromium --with-deps

# Verify Playwright installation
RUN npx playwright --version

# Default command
CMD ["yarn", "test:e2e"]
