import { auth } from '@/lib/firebase/config';

const API_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/your-project-id/us-central1';

/**
 * Get authorization header with current user token
 */
async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get all users with their roles
 */
export async function getAllUsers() {
  const headers = await getAuthHeader();
  
  const response = await fetch(`${API_URL}/api/roles/users`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }

  return response.json();
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const headers = await getAuthHeader();
  
  const response = await fetch(`${API_URL}/api/roles/users/${userId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user');
  }

  return response.json();
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: string, reason: string) {
  const headers = await getAuthHeader();
  
  const response = await fetch(`${API_URL}/api/roles/users/${userId}/role`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ role: newRole, reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user role');
  }

  return response.json();
}

/**
 * Update user warehouse assignment
 */
export async function updateUserWarehouse(userId: string, warehouseId: string, reason: string) {
  const headers = await getAuthHeader();
  
  const response = await fetch(`${API_URL}/api/roles/users/${userId}/warehouse`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ warehouseId, reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user warehouse');
  }

  return response.json();
}

/**
 * Get role change history
 */
export async function getRoleChangeHistory(limit = 50, userId?: string) {
  const headers = await getAuthHeader();
  
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (userId) {
    params.append('userId', userId);
  }

  const response = await fetch(`${API_URL}/api/roles/role-changes?${params.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch role changes');
  }

  return response.json();
}

/**
 * Deactivate user
 */
export async function deactivateUser(userId: string, reason: string) {
  const headers = await getAuthHeader();
  
  const response = await fetch(`${API_URL}/api/roles/users/${userId}/deactivate`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to deactivate user');
  }

  return response.json();
}
