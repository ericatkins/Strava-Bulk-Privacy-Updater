# Strava Bulk Privacy Updater 🚴‍♂️🏃‍♂️🏊‍♂️🏋️‍♂️🎿🚶‍♂️

*A Tampermonkey browser extension userscript to bulk-update Strava activity privacy settings.  Tampermonkey browser plug-in is required.*

## 📌 Overview

This **Tampermonkey** userscript automates the process of updating privacy settings (**Public, Followers, or Only Me**) for multiple Strava activities at once. It allows you to filter updates by **weekdays, weekends, or all days**, previews changes with a **dry-run mode** before touching anything, and **gracefully handles pagination**, ensuring every page of activities is processed.

✅ **Features**
- **🔄 Bulk Updates** – Change multiple activity privacy settings with one click.
- **🧪 Dry-Run Mode** – Preview how many activities *would* change before making any real updates (default).
- **📆 Day Filtering** – Update only **weekends, weekdays, or all days**.
- **🔢 Live Counters** – See **updated / already set / failed** counts in real time as it works.
- **⏭️ Skip Detection** – Activities already at the target privacy are counted but left untouched.
- **🛑 Stop Button** – Cancel a run mid-way; the script finishes the current activity and stops cleanly.
- **📑 Smart Pagination** – Waits until each page has *actually* loaded (no re-processing on slow pages), stops gracefully at the last page.
- **🐢 Gentle Pacing** – A short delay between updates plus one automatic retry per activity, to go easy on Strava.
- **✅ Confirmed Saves** – The counter only increments once Strava's edit form actually closes, so it counts real updates, not attempts.
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

**Option A — One-click install (recommended):**
👉 **[Click here to install](https://raw.githubusercontent.com/ericatkins/Strava-Bulk-Privacy-Updater/main/strava-bulk-privacy-updater.user.js)** — Tampermonkey will detect the `.user.js` file and offer to install it. Updates are picked up automatically.

**Option B — Manual install:**
1. **Open Tampermonkey** from your browser toolbar.
2. Click **“Dashboard”** → **“Create a New Script”**.
3. **Delete any placeholder code** in the editor.
4. **Copy & Paste** the full contents of [`strava-bulk-privacy-updater.user.js`](strava-bulk-privacy-updater.user.js).
5. **Save the script** (`File → Save`).

Done! The script will now run automatically when you visit **[Strava “My Activities”](https://www.strava.com/athlete/training)**.

---

## ▶️ How to Use
1. **Go to your Strava “My Activities” page**:  
   👉 **[Strava My Activities](https://www.strava.com/athlete/training)**
2. **Look for the floating “Bulk Privacy Update” button** (top-right corner).
3. **Click the button**, then answer the prompts:
   - **Privacy Level:** `everyone`, `followers`, or `only me`.
   - **Day Filter:** `weekends`, `weekdays`, or `all`.
   - **Mode:** `dry-run` (preview only, default) or `live` (apply changes).
4. **Live mode asks for a final confirmation** — Strava has no bulk undo, so run a dry-run first!
5. **Watch the live counters** as the script works through every page. Click **Stop** at any time to cancel cleanly.
6. **Done!** 🎉 A final alert summarizes everything: updated, already set, skipped, and any failures.

---

## 🔍 What the counters mean
| Counter | Meaning |
|---|---|
| **Updated** | Save clicked **and** Strava's edit form closed — a confirmed update. |
| **Already set** | Activity was already at the target privacy; left untouched. |
| **Unconfirmed** | Save was clicked but the form never closed — spot-check these activities. |
| **Failed** | The edit form couldn't be opened or completed, even after one retry. |
| **Skipped (day filter)** | Activity didn't match your weekday/weekend choice. |
| **Skipped (unparseable date)** | The date column couldn't be parsed — details in the browser console. |

---

## ⚙️ Tuning
Timing constants live at the top of the script if pages load slowly for you:
- `PAGE_LOAD_TIMEOUT` – max wait for a page of activities (default 15s).
- `EDIT_FORM_TIMEOUT` / `SAVE_TIMEOUT` – max wait for the quick-edit form to open/close (default 5s each).
- `UPDATE_DELAY` – pause between updates (default 0.5s).

These are *timeouts*, not fixed sleeps — the script moves on as soon as the page is actually ready, so raising them only affects slow pages.

---

## 🖥️ Demo Screenshot
Coming soon..

---

## 🚨 Feedback & Issues  
Have **questions, feature requests, or found a bug**?   
👉 **[Post an issue here](https://github.com/ericatkins/Strava-Bulk-Privacy-Updater/issues)**

---

## 🛠️ Troubleshooting
### ❌ The script isn’t running!
- Ensure **Tampermonkey is enabled** and the script is active.
- Refresh the **Strava My Activities** page after installing.

### ⚠️ It stops or misses activities.
- If Strava’s UI updates, **element selectors may need adjustments**. The script checks for quick-edit buttons before a live run and aborts with a clear message if it can't find any.
- If pages load very slowly, raise the **timeout constants** at the top of the script.

### 🌍 Dates aren't recognized.
- The script parses the date column's display text. If your Strava display language uses a date format the browser can't parse, those rows are skipped and counted in the final summary — check the browser console for the exact values.

### 🛑 The script doesn’t stop at the last page!
- The script checks whether the **“Next” button is missing or disabled** before continuing, and also stops if the next page never loads.
- If Strava changes their pagination UI, update the script’s **pagination logic**.

---

## 📝 License
This project is licensed under the **MIT License** — see [LICENSE](LICENSE).

---

## 📢 Contributing
💡 Have suggestions or improvements? Open a **pull request** or **issue** in this repository!  

🔗 **Repository:** [GitHub Repo](https://github.com/ericatkins/Strava-Bulk-Privacy-Updater)

---

### ⭐ Enjoyed this script? Give it a star on GitHub! ⭐
