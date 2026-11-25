# RG GAMER BOY FF — Login website

## Deploy
1. Upload the contents of this folder to the root of the GitHub Pages repository for `https://gamerboyff.github.io/`.
2. Firebase Console → Authentication → Sign-in method: enable Google.
3. Firebase Authentication → Settings → Authorized domains: confirm `gamerboyff.github.io` is present.
4. Realtime Database → Rules: review and publish `database.rules.json`.
5. Test Google sign-in on the deployed HTTPS URL, refresh persistence, and sign-out.

## Important limitations before production
- Google popup is used first; redirect fallback is used if the browser blocks popups. `getRedirectResult` is processed on page load to avoid getting stuck on the Google screen.
- Google and guest sessions use browser-local Firebase persistence.
- The guest 4-day renewal feature is intentionally not enabled in this starter. A quiz checked only in browser JavaScript is trivially bypassable. Implement renewal with a trusted backend (for example, a Firebase Cloud Function) before enforcing it.
- The Delete Account button appears only for Google-linked sign-ins and opens the supplied Google Form. The form submission is a request, not an automatic deletion.
- Add the real support email, confirm the Privacy Policy and Terms match actual practices, and set governing law before publishing.
- Username/password link is the separate site supplied by the owner and is not changed by this project.
- Do not put Firebase Admin SDK credentials in frontend files.
- Profile writes now use a field-level Realtime Database `update()` so legacy/extra profile fields are not rewritten by this page. The owner-only profile read/write rules remain in place. The rules still validate the fields written by this page; review them if the data model changes.
- Firebase Analytics is not initialized in this version; the measurement ID is retained in config only.

## Owner-supplied assets and destinations
- Logo image: `https://i.supaimg.com/cc740f2b-876c-4dd7-bbf2-16d636413b82/85320e1a-9a75-4178-90bb-a7f01267a661.png` (displayed upright with no CSS rotation).
- Account deletion request form: `https://docs.google.com/forms/d/e/1FAIpQLScPdr838eNtKeTrt40nIlzS9w-Sz7Hvsotf1-MZAlXI5JWXEw/viewform?usp=dialog`.
- Successful sign-in Continue destination: `https://rgsouravbasak-del.github.io/RG-GAMER-BOY-FF-APP/`.
- Existing username/password site: `https://rggamerboyff.github.io/RG-GAMER-BOY-FF-2022-APP/`.

## Region and country selection (added)
- After the existing Privacy Policy / Terms consent gate, visitors must choose a region and a country before the sign-in options appear.
- The selected region/country is remembered in this browser using Local Storage. The existing policy acceptance key and behavior are unchanged.
- Region choices: Asia (India, Pakistan, Bangladesh, Indonesia, Singapore, Vietnam, Nepal), North America (United States, Canada, Mexico, Central America and Caribbean countries), and South America (Brazil only). Europe is not included.
- Google Firebase sign-ins save `region` and `country` inside `users/{uid}/profile`. Existing profile fields are read and preserved before updating, rather than replacing the profile with a smaller object.
- `database.rules.json` allows and validates the new `region` and `country` fields while retaining the existing owner-only profile access rules.
- Users can use “Change Region / Country” on the sign-in screen to update their choice. A signed-in Firebase user’s profile is updated when the new choice is saved.
- Username & Password still opens the existing separate website. This project does not change that separate site's authentication or Firebase profile code.
- The region selector uses the existing system theme and simple CSS states; it does not add animation libraries, background video, or continuous effects. The region/country Local Storage key was bumped to v2 and the previous v1 choice is cleared, so everyone must select a region and country again once. Existing policy acceptance and Firebase sign-in sessions are not cleared.


## Country ping indicator (added)
- The top-right `Secure sign-in` label is replaced by a live ping/status label after a country is selected.
- Asia countries measure round-trip response time to this project's Firebase Realtime Database endpoint (`asia-southeast1`, Singapore). The label includes the selected country's flag/name, but the measured target is the same Singapore-hosted database for every Asia country; it is not a separate server in each country.
- All selected countries show the measured round-trip time to the same configured Firebase Realtime Database endpoint in Singapore. This is a real endpoint measurement, not a country-local server measurement; no North America-hosted Firebase endpoint is configured in this project.
- The measurement sends three small unauthenticated REST requests to the database root. If database rules deny the root read (expected with private rules), the HTTP permission response is still timed; no profile data is read. If the endpoint cannot be reached, the label shows `Connection Failed`.
- The measurement runs when a country is selected, when the page loads with a saved selection, every 10 seconds while the page is visible, when the device comes back online, and when the tab/app becomes visible again. It prevents overlapping ping tests and now correctly releases its in-flight lock when no country is selected.


## Authentication troubleshooting
- The frontend config uses the Web App values supplied for project `rg-gamer-boy-ff-online`. Keep all Firebase values together from this same Web App; do not mix values from another Firebase project.
- The page now displays actionable messages for an invalid/incomplete API key, disabled sign-in provider, and unauthorized domain.
- In Firebase Console, confirm Google are enabled under Authentication → Sign-in method, and `gamerboyff.github.io` is listed under Authentication → Settings → Authorized domains.
- If the page reports `auth/invalid-api-key`, copy the complete Web API Key again from this same project's Project settings → General → Your apps. A code change cannot repair an invalid key issued/configured in Firebase Console.
- If authentication succeeds but profile saving reports a database error, publish and test the supplied `database.rules.json` in Realtime Database → Rules. Do not make the database publicly readable or writable.


## Guest Login removed
- The Continue as Guest button and anonymous sign-in/logout handlers have been removed. Google sign-in remains enabled in the website code.
- Existing anonymous Firebase Authentication users are not deleted by this website-code change; they remain in Firebase Authentication until separately cleaned up by the project owner.
