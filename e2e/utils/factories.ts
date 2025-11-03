/**
 * Generate random ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Generate random email
 */
export function generateEmail(): string {
  return `test-${generateId()}@example.com`;
}

/**
 * Create user test data
 */
export function createUserData(overrides?: Partial<any>) {
  return {
    name: `Test User ${generateId()}`,
    email: generateEmail(),
    ...overrides,
  };
}

/**
 * Create team test data
 */
export function createTeamData(overrides?: Partial<any>) {
  return {
    name: `Test Team ${generateId()}`,
    slug: `team-${generateId()}`,
    ...overrides,
  };
}

/**
 * Create discussion test data
 */
export function createDiscussionData(overrides?: Partial<any>) {
  return {
    name: `Test Discussion ${generateId()}`,
    slug: `discussion-${generateId()}`,
    ...overrides,
  };
}

/**
 * Create post test data
 */
export function createPostData(overrides?: Partial<any>) {
  return {
    title: `Test Post ${generateId()}`,
    content: `This is a test post with some content`,
    ...overrides,
  };
}
