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

export const getProfileImage = (photographer) =>
  photographer?.profile_photo ||
  photographer?.portfolio?.[0] ||
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=400';
