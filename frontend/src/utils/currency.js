export const formatINR = (amount) => {
  const value = Number(amount);
  if (Number.isNaN(value)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatIndianPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  const normalized = digits.startsWith('91') ? digits : `91${digits.replace(/^0/, '')}`;
  return `+${normalized}`;
};

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const getProfileImage = (photographer) => {
  const photo = photographer?.profile_photo;
  if (photo) {
    // If it's a relative /uploads/... path, prepend the backend URL
    return photo.startsWith('/uploads') ? `${BACKEND_URL}${photo}` : photo;
  }
  const port0 = photographer?.portfolio?.[0];
  if (port0) {
    return port0.startsWith('/uploads') ? `${BACKEND_URL}${port0}` : port0;
  }
  return 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=400';
};
