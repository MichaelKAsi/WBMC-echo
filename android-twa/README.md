# Echo — Android app (Trusted Web Activity)

The Play Store app is a thin Android wrapper that opens https://wbmc.netlify.app
full-screen in Chrome. Website updates deploy through Netlify and appear in the
app immediately. A new Play release is only needed when the icon, name, colours
or Android settings change.

## One-time setup
1. Install the Bubblewrap CLI:
   ```
   npm i -g @bubblewrap/cli
   ```
2. In this folder (`android-twa/`), run:
   ```
   bubblewrap init --manifest https://wbmc.netlify.app/manifest.webmanifest
   ```
   - Answer **Yes** when it offers to install the JDK and the Android SDK.
   - Use these answers:

     | Prompt | Answer |
     |---|---|
     | Domain | `wbmc.netlify.app` |
     | Application name / Short name | `Echo — Word Based Missional Church` / `Echo` |
     | Application ID | `za.org.wbmc.echo` (can never change after the first upload) |
     | Starting version code | `1` |
     | Display mode | `standalone` |
     | Orientation | `portrait` |
     | Theme / background / nav colour | `#24156e` |
     | Icon URL | `https://wbmc.netlify.app/icon-512.png` |
     | Maskable icon URL | `https://wbmc.netlify.app/icon-512.png` |
     | Monochrome icon | skip |
     | Include support for Play Billing | No |
     | Request geolocation permission | No |
     | Key store location | **outside the repo**, e.g. `C:\Users\Sound\keys\echo-upload.keystore` |
     | Key name | `echo` |

   - Back up the keystore file and its passwords. If they're lost, you can't
     publish updates without contacting Google support.

## Build
```
bubblewrap build
```
This produces `app-release-bundle.aab`, which you upload to Play, and
`app-release-signed.apk`, which you can install on a phone for testing:
`adb install app-release-signed.apk`.

## Remove the address bar (Digital Asset Links)
1. Upload the `.aab` to **Play Console → Testing → Internal testing**.
2. Open **Play Console → Test and release → App integrity → App signing** and copy the
   **SHA-256 certificate fingerprint** of the *App signing key*.
3. Paste it in place of `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` in
   `wbmc-mobile-app/public/.well-known/assetlinks.json`. Also add the upload key's
   fingerprint (`bubblewrap fingerprint list`) so local test builds verify too.
4. Deploy to Netlify, then check that
   https://wbmc.netlify.app/.well-known/assetlinks.json serves the file.
5. Reinstall the app from the Play internal testing link. The address bar should be gone.

## Release an update
- **Website-only changes:** deploy to Netlify. Nothing to do here.
- **App changes:** edit `twa-manifest.json`, which bumps `appVersionCode`, then run:
  ```
  bubblewrap update
  bubblewrap build
  ```
  Upload the new `.aab`.

## Never commit
`*.keystore`, `*.jks`, keystore passwords, `app-release-*.aab/apk`.
