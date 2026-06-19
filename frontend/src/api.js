const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('mrphotographer_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Authentication
  login: async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('mrphotographer_token', data.token);
    return data;
  },

  register: async (registerData) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
    localStorage.setItem('mrphotographer_token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('mrphotographer_token');
  },

  getMe: async () => {
    return apiFetch('/auth/me');
  },

  // Photographers
  getPhotographers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParams.append(key, val);
      }
    });
    const queryString = queryParams.toString();
    return apiFetch(`/photographers?${queryString}`);
  },

  getPhotographerDetails: async (id) => {
    return apiFetch(`/photographers/${id}`);
  },

  updateProfile: async (profileData) => {
    return apiFetch('/photographers/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Bookings & Availability
  getBookings: async () => {
    return apiFetch('/bookings');
  },

  createBooking: async (bookingData) => {
    return apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  updateBookingStatus: async (bookingId, status) => {
    return apiFetch(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getAvailability: async () => {
    return apiFetch('/bookings/availability');
  },

  updateAvailability: async (date, slots) => {
    return apiFetch('/bookings/availability', {
      method: 'POST',
      body: JSON.stringify({ date, slots }),
    });
  },

  // Reviews
  postReview: async (reviewData) => {
    return apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Admin
  getPendingPhotographers: async () => {
    return apiFetch('/admin/photographers/pending');
  },

  approvePhotographer: async (id) => {
    return apiFetch(`/admin/photographers/${id}/approve`, {
      method: 'PATCH',
    });
  },

  rejectPhotographer: async (id) => {
    return apiFetch(`/admin/photographers/${id}/reject`, {
      method: 'DELETE',
    });
  },
};
