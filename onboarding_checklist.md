# Onboarding Flow Test Checklist

This checklist covers the end‑to‑end manual test of the user onboarding experience after recent updates.

- [ ] **Start dev server**
  - Run `npm run dev` (or `yarn dev`). Verify the server starts without errors.
- [ ] **Create a test account**
  - Open `http://localhost:3000`.
  - Click **Start Free Trial** (header link).
  - Fill the registration form:
    - First Name: `Jane`
    - Last Name: `Doe`
    - Email: `jane.doe+test@example.com`
    - Phone (optional): `+91 9876543210`
    - Password: `Test@1234`
  - Submit and verify you are redirected to **/setup**.
- [ ] **Onboarding – Setup organization**
  - On `/setup` fill the organization form:
    - Business Display Name: `Acme Corp`
    - Legal Entity Name: `Acme Corporation Pvt. Ltd.`
    - GSTIN (optional): `29ABCDE1234F1Z5`
    - Business Phone: `+91 9876543210`
  - Click **Create Organization**.
  - Verify you are redirected to **/dashboard**.
- [ ] **Dashboard verification**
  - URL should be `http://localhost:3000/dashboard`.
  - Confirm the placeholder dashboard content loads.
- [ ] **Local storage checks**
  - Open dev tools → Application → Local Storage.
  - Ensure keys `token` and `active_org_id` are present.
- [ ] **Header navigation**
  - Open the site header and verify all `<Link>` components have `prefetch={false}` (no continuous GET requests).
- [ ] **Mega menu rendering**
  - Hover the **Product** menu in the header.
  - Confirm the new mega‑menu (600 px width, grid layout) appears without hydration warnings.
- [ ] **Hydration check**
  - Open the console and confirm no `Hydration failed` errors appear after the page reloads.
- [ ] **Accordion behavior**
  - On the Contact page, verify the FAQ accordion works (single item expansion) after the recent change.

**All checks passed** → onboarding flow is ready for production.
