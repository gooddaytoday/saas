/**
 * Make API request
 */
export async function makeApiRequest(
  baseUrl: string,
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {},
): Promise<Response> {
  const url = `${baseUrl}${endpoint}`;
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let cookieHeader = '';
  if (options.cookies) {
    cookieHeader = Object.entries(options.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Create user via API
 */
export async function createUserViaApi(baseUrl: string, userData: any): Promise<any> {
  const response = await makeApiRequest(baseUrl, '/api/v1/users', {
    method: 'POST',
    body: userData,
  });

  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.status}`);
  }

  return response.json();
}

/**
 * Create team via API
 */
export async function createTeamViaApi(baseUrl: string, teamData: any, cookies?: Record<string, string>): Promise<any> {
  const response = await makeApiRequest(baseUrl, '/api/v1/teams', {
    method: 'POST',
    body: teamData,
    cookies,
  });

  if (!response.ok) {
    throw new Error(`Failed to create team: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete user via API
 */
export async function deleteUserViaApi(
  baseUrl: string,
  userId: string,
  cookies?: Record<string, string>,
): Promise<void> {
  const response = await makeApiRequest(baseUrl, `/api/v1/users/${userId}`, {
    method: 'DELETE',
    cookies,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete user: ${response.status}`);
  }
}

/**
 * Get user via API
 */
export async function getUserViaApi(
  baseUrl: string,
  userId: string,
  cookies?: Record<string, string>,
): Promise<any> {
  const response = await makeApiRequest(baseUrl, `/api/v1/users/${userId}`, {
    cookies,
  });

  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.status}`);
  }

  return response.json();
}
