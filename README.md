# Strava Bulk Privacy Updater 🚴🏃‍♂️

*A Tampermonkey userscript to bulk-update Strava activity privacy settings.*

## 📌 Overview

This **Tampermonkey** userscript automates the process of updating privacy settings (e.g., **Public, Followers, or Only Me**) for multiple Strava activities at once. It allows you to filter updates by **weekdays, weekends, or all days**, and it **gracefully handles pagination**, ensuring every page of activities is processed.

✅ **Features**
- **🔄 Bulk Updates** – Change multiple activity privacy settings with one click.
- **📆 Day Filtering** – Update only **weekends, weekdays, or all days**.
- **🔢 Live Counter** – See real-time progress as activities are updated.
- **📑 Smart Pagination** – Detects & processes multiple pages, stops gracefully at the last page.
- **⚡ One-Click Start** – Adds a **floating button** in the top-right corner of Strava.

🚀 *No more clicking into every activity just to update privacy!*

---

## 📥 Installation Instructions

### Step 1: Install Tampermonkey
First, install **Tampermonkey**, a browser extension that runs userscripts.

- **[Install Tampermonkey for Chrome/Edge](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)**
- **[Install Tampermonkey for Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/)**

---

### Step 2: Add the Userscript
1. **Open Tampermonkey** from your browser toolbar.
2. Click **“Dashboard”** → **“Create a New Script”**.
3. **Delete any placeholder code** in the editor.
4. **Copy & Paste** the full script from below.
5. **Save the script** (`File → Save`).
6. Done! The script will now run automatically when you visit **[Strava “My Activities”](https://www.strava.com/athlete/training)**.

---

## ▶️ How to Use
1. **Go to your Strava “My Activities” page**:  
   👉 **[Strava My Activities](https://www.strava.com/athlete/training)**
2. **Look for the floating “Bulk Privacy Update” button** (top-right corner).
3. **Click the button**, then select:
   - **Privacy Level:** `everyone`, `followers`, or `only me`.
   - **Day Filter:** `weekends`, `weekdays`, or `all days`.
4. **The script automatically updates** activities based on your choices, **tracking updates in real-time**.
5. **It will paginate automatically** until all pages are processed.
6. **Done!** 🎉 A final alert will show the **total activities updated**.

---

## 🖥️ Demo Screenshot
*(Insert an image here if you have one. Example placeholder below.)*

![Demo Screenshot](https://via.placeholder.com/800x400.png?text=Strava+Bulk+Privacy+Updater)

---

## 🛠️ Troubleshooting
### ❌ The script isn’t running!
- Ensure **Tampermonkey is enabled** and the script is active.
- Refresh the **Strava My Activities** page after installing.

### ⚠️ It stops or misses activities.
- If Strava’s UI updates, **element selectors may need adjustments**.
- Increase delay times in the script if **pages load too slowly**.

### 🛑 The script doesn’t stop at the last page!
- The script checks if the **“Next” button is disabled** before stopping.
- If Strava changes their pagination UI, update the script’s **pagination logic**.

---

## 📝 License
This project is licensed under the **MIT License**.  

---

## 📢 Contributing
💡 Have suggestions or improvements? Open a **pull request** or **issue** in this repository!  

🔗 **Repository:** [GitHub Repo Link Here](https://github.com/YOUR-USERNAME/YOUR-REPO)

---

### ⭐ Enjoyed this script? Give it a star on GitHub! ⭐
