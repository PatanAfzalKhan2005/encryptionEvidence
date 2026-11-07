-- Removes the seeded investigator/auditor demo accounts (known password, no longer part of the app).
-- Run once in the SQL editor. The admin@ demo account is intentionally NOT removed here because it may
-- own images you uploaded: sign up with your own email, re-upload what you need, then delete it:
--   DELETE FROM auth.users WHERE email = 'admin@forensivault.com';
DELETE FROM auth.users WHERE email IN ('investigator@forensivault.com', 'auditor@forensivault.com');
