# Chain District — TestFlight Setup Guide (No Mac Required)

This guide walks you through getting Chain District on TestFlight.
You need a browser, any terminal (Linux/Windows WSL/Replit shell), and ~30 minutes.

---

## Prerequisites

You need an **Apple Developer Account** ($99/year).
If you don't have one yet:
1. Go to https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with your Apple ID (or create one)
4. Pay the $99 fee
5. Wait for approval (usually instant, sometimes 24-48h)

You already have team ID `S3U8B8HH96` from dynasty-manager, so you should be good.

---

## Part 1: Create the App Store Connect API Key

This is how the GitHub Action authenticates with Apple to upload your app.
You get **3 secrets** from this step.

### Step by step:

1. Open your browser and go to: **https://appstoreconnect.apple.com**
2. Sign in with your Apple ID
3. In the top navigation bar, click **"Users and Access"**
4. You'll see tabs at the top. Click on **"Integrations"**
5. On the left sidebar, click **"App Store Connect API"**
6. You'll see a section called **"Team Keys"**. Click the **"+"** button to create a new key
7. It will ask you for:
   - **Name**: Type `Chain District CI`
   - **Access**: Select **Admin** from the dropdown
8. Click **"Generate"**
9. Now you'll see your key in the table. **Look carefully at this page:**

   **Where to find Issuer ID:**
   - At the very TOP of the page, above the table, you'll see text that says:
     ```
     Issuer ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     ```
   - That long string of letters and dashes is your **Issuer ID**
   - Copy it — this is your `ASC_API_ISSUER_ID` secret

   **Where to find Key ID:**
   - In the table, look at the row for "Chain District CI"
   - There's a column called **"Key ID"** — it's a short string like `ABC123DEF4`
   - Copy it — this is your `ASC_API_KEY_ID` secret

   **Where to download the API Key file:**
   - In the same row, you'll see a **"Download"** link/button
   - Click it to download a file called `AuthKey_XXXXXXXX.p8`
   - ⚠️ **YOU CAN ONLY DOWNLOAD THIS ONCE.** If you lose it, you have to create a new key
   - Save this file somewhere safe

10. Open the `.p8` file you just downloaded in any text editor (Notepad, VS Code, whatever)
    - It will look something like this:
      ```
      -----BEGIN PRIVATE KEY-----
      MIGTAgEAMBMGByqGSM49AgEGCC...
      bunch of random letters and numbers...
      -----END PRIVATE KEY-----
      ```
    - Copy the **ENTIRE content** including the BEGIN and END lines
    - This is your `ASC_API_KEY` secret

### What you have after Part 1:
| Secret | Example value | Where you got it |
|---|---|---|
| `ASC_API_ISSUER_ID` | `69a6de7e-5abc-47e3-1234-abcdef123456` | Top of the API keys page |
| `ASC_API_KEY_ID` | `ABC123DEF4` | Key ID column in the table |
| `ASC_API_KEY` | `-----BEGIN PRIVATE KEY-----\nMIGT...` | Contents of the downloaded .p8 file |

---

## Part 2: Create the Signing Certificate

Apple requires that every app is "signed" — this proves the app comes from you.
Think of it like a digital signature. You get **2 secrets** from this step.

### Step 2a: Generate a Certificate Signing Request (CSR)

You need any terminal for this. You can use:
- The Replit shell (where you're working now)
- Windows: open WSL or Git Bash
- Linux: any terminal

Run these 2 commands (replace YOUR_EMAIL with your Apple ID email and YOUR_NAME with your real name):

```bash
openssl genrsa -out dist.key 2048
```

This creates a private key file called `dist.key`. Then:

```bash
openssl req -new -key dist.key -out CertificateSigningRequest.certSigningRequest \
  -subj "/emailAddress=YOUR_EMAIL@EXAMPLE.COM/CN=YOUR NAME/C=US"
```

Example with real values:
```bash
openssl req -new -key dist.key -out CertificateSigningRequest.certSigningRequest \
  -subj "/emailAddress=john@gmail.com/CN=John Smith/C=US"
```

This creates a file called `CertificateSigningRequest.certSigningRequest`.

**Don't delete the `dist.key` file!** You need it in step 2c.

### Step 2b: Upload the CSR to Apple

1. Open your browser and go to: **https://developer.apple.com/account/resources/certificates/list**
2. Sign in if needed
3. Click the **"+"** button (top left, next to "Certificates")
4. You'll see a list of certificate types. Scroll down to the **"Distribution"** section
5. Select **"Apple Distribution"**
6. Click **"Continue"**
7. It asks you to upload a Certificate Signing Request
8. Click **"Choose File"** and select the `CertificateSigningRequest.certSigningRequest` file you just made
9. Click **"Continue"**
10. Click **"Download"** — you'll get a file called `distribution.cer`

⚠️ **Important:** Apple only allows a limited number of distribution certificates (3). If you see an error, go back to the Certificates list and check if you already have one from dynasty-manager that you can reuse. If so, download that existing one instead.

### Step 2c: Convert the certificate to .p12 format

Back in your terminal, run these commands. Make sure you're in the same folder where `dist.key` and `distribution.cer` are:

```bash
openssl x509 -inform DER -in distribution.cer -out dist.pem
```

This converts the certificate format. Then:

```bash
openssl pkcs12 -export -out dist.p12 -inkey dist.key -in dist.pem -password pass:MyPassword123
```

**Replace `MyPassword123` with any password you choose.** Remember it — it's one of your secrets.

This creates `dist.p12` — your signing certificate packaged with your private key.

### Step 2d: Base64 encode the .p12 file

```bash
base64 -w 0 dist.p12
```

This will print a VERY long string of characters to your terminal. Something like:
```
MIIJqQIBAzCCCW8GCSqGSIb3DQEHAaCCCWAEggZcM... (goes on for many lines)
```

Copy that entire string. That is your `APPLE_CERTIFICATE_BASE64` secret.

**Tip:** If the output is too long to select, redirect it to a file:
```bash
base64 -w 0 dist.p12 > cert_base64.txt
```
Then open `cert_base64.txt` and copy the contents.

### What you have after Part 2:
| Secret | Example value | Where you got it |
|---|---|---|
| `APPLE_CERTIFICATE_BASE64` | `MIIJqQIBAzCCCW8GCS...` (very long) | The base64 output from step 2d |
| `APPLE_CERTIFICATE_PASSWORD` | `MyPassword123` | The password YOU chose in step 2c |

---

## Part 3: Create the Provisioning Profile

A provisioning profile links your certificate to your specific app.
You get **1 secret** from this step.

### Step 3a: Register the App ID

1. Go to: **https://developer.apple.com/account/resources/identifiers/list**
2. Click the **"+"** button
3. Select **"App IDs"** → click Continue
4. Select **"App"** → click Continue
5. Fill in:
   - **Description**: `Chain District`
   - **Bundle ID**: Select **"Explicit"** (not Wildcard)
   - **Bundle ID field**: Type exactly: `com.chaindistrict`
6. Scroll down — you don't need any special capabilities for now
7. Click **"Continue"**, then **"Register"**

### Step 3b: Create the provisioning profile

1. Go to: **https://developer.apple.com/account/resources/profiles/list**
2. Click the **"+"** button
3. Under **"Distribution"**, select **"App Store Connect"**
4. Click **"Continue"**
5. From the dropdown, select **"com.chaindistrict (Chain District)"**
6. Click **"Continue"**
7. Select your **Apple Distribution** certificate (the one you just created or your existing one)
8. Click **"Continue"**
9. For the profile name, type: `Chain District App Store`
10. Click **"Generate"**
11. Click **"Download"** — you'll get a file called something like `Chain_District_App_Store.mobileprovision`

### Step 3c: Base64 encode the provisioning profile

```bash
base64 -w 0 Chain_District_App_Store.mobileprovision
```

Copy that entire output. That is your `APPLE_PROVISIONING_PROFILE` secret.

Same tip as before — redirect to a file if it's too long:
```bash
base64 -w 0 Chain_District_App_Store.mobileprovision > profile_base64.txt
```

### What you have after Part 3:
| Secret | Example value | Where you got it |
|---|---|---|
| `APPLE_PROVISIONING_PROFILE` | `MIIabcDEFghi...` (very long) | The base64 output from step 3c |

---

## Part 4: Add All Secrets to GitHub

Now you have all 6 values. Time to add them to your repo.

1. Go to: **https://github.com/Wrexist/CryptoStartup/settings/secrets/actions**
2. For each secret below, click **"New repository secret"**, type the name, paste the value, and click **"Add secret"**

| # | Secret Name | What to paste |
|---|---|---|
| 1 | `ASC_API_KEY_ID` | The short Key ID from Part 1 (like `ABC123DEF4`) |
| 2 | `ASC_API_ISSUER_ID` | The Issuer ID from Part 1 (like `69a6de7e-5abc-...`) |
| 3 | `ASC_API_KEY` | The full text from the `.p8` file (including BEGIN/END lines) |
| 4 | `APPLE_CERTIFICATE_BASE64` | The huge base64 string from Part 2 |
| 5 | `APPLE_CERTIFICATE_PASSWORD` | The password you chose when creating the .p12 |
| 6 | `APPLE_PROVISIONING_PROFILE` | The huge base64 string from Part 3 |

---

## Part 5: Run It!

1. Go to: **https://github.com/Wrexist/CryptoStartup/actions**
2. On the left sidebar, click **"iOS TestFlight Deploy"**
3. Click the **"Run workflow"** dropdown button (right side)
4. Click the green **"Run workflow"** button
5. Wait ~15-25 minutes for the build
6. When it's done (green checkmark), the app is uploaded to TestFlight!

### After the first upload:

1. Go to **https://appstoreconnect.apple.com/apps**
2. Your app "Chain District" should appear automatically
3. Click on it → **TestFlight** tab
4. The build will show as **"Processing"** for a few minutes
5. Once processed, you may need to answer a compliance question:
   - "Does this app use encryption?" → **No** (we already set this in the config)
6. Go to **"Internal Testing"** → create a group → add testers by email
7. Testers get an email invite to download TestFlight and install your app!

---

## Troubleshooting

### "No matching provisioning profile found"
→ The profile name in the workflow must exactly match what you named it in Apple Developer portal. We used `Chain District App Store`.

### "Certificate not valid"
→ Make sure you used the same `dist.key` private key when creating the CSR AND when creating the .p12. If you generated a new key in between, they won't match.

### "The bundle identifier does not match"
→ Make sure the App ID is registered as exactly `com.chaindistrict` (no spaces, no caps).

### Build succeeds but TestFlight upload fails
→ Check that your API key has **Admin** access level, not just Developer.

### "You already have a current distribution certificate"
→ You can only have 3 distribution certificates. Go to Certificates page, revoke an old unused one, or download your existing one and use it instead.

---

## File cleanup

After you've added all secrets to GitHub, delete the sensitive files from your local machine:

```bash
rm -f dist.key dist.pem dist.p12 distribution.cer CertificateSigningRequest.certSigningRequest
rm -f cert_base64.txt profile_base64.txt
rm -f AuthKey_*.p8
```

Never commit these files to git!
