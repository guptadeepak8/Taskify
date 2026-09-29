import { z } from 'zod';

export const indianPhoneRegex = /^(?:\+91|91)?[-.\s]?[6-9]\d{9}$/;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Must be a valid 10-digit Indian mobile number (+91XXXXXXXXXX)')
    .transform((val) => {
      const digitsOnly = val.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);
      return `+91${last10}`;
    }),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  business_name: z
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
