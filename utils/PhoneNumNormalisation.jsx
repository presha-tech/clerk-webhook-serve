// PhoneNumNormalisation.jsx

import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalize a phone number to E.164 format.
 * @param {string} phone - The phone number to normalize.
 * @param {string} [defaultCountry='US'] - The default country code if not present.
 * @returns {string|null} The normalized phone number or null if invalid.
 */
export function normalizePhone(phone, defaultCountry = 'US') {
  if (!phone) return null;
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, defaultCountry);
    return phoneNumber ? phoneNumber.number : null;
  } catch {
    return null;
  }
}

export default normalizePhone;
