// ==UserScript==
// @name         Strava Bulk Privacy Updater
// @namespace    https://github.com/ericatkins/Strava-Bulk-Privacy-Updater
// @version      2.0
// @description  Bulk-update Strava activity privacy (everyone/followers/only me) from the My Activities page, filtered by weekdays/weekends/all. Dry-run preview, live progress counters, stop button, and safe pagination.
// @author       Eric Atkins
// @match        https://www.strava.com/athlete/training*
// @run-at       document-idle
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/ericatkins/Strava-Bulk-Privacy-Updater
// @supportURL   https://github.com/ericatkins/Strava-Bulk-Privacy-Updater/issues
// @downloadURL  https://raw.githubusercontent.com/ericatkins/Strava-Bulk-Privacy-Updater/main/strava-bulk-privacy-updater.user.js
// @updateURL    https://raw.githubusercontent.com/ericatkins/Strava-Bulk-Privacy-Updater/main/strava-bulk-privacy-updater.user.js
// ==/UserScript==

/*
 * MIT License
 *
 * Copyright (c) 2025 Eric Atkins
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function () {
  "use strict";

  /***************** CONFIGURATION *****************/
  const EDIT_FORM_TIMEOUT = 5000;  // max wait for the quick-edit form to open (ms)
  const SAVE_TIMEOUT      = 5000;  // max wait for the form to close after Save (ms)
  const PAGE_LOAD_TIMEOUT = 15000; // max wait for a new page of activities (ms)
  const UPDATE_DELAY      = 500;   // pause between updates, to go easy on Strava (ms)
  const RETRY_DELAY       = 2000;  // pause before retrying a failed update (ms)
  const POLL_INTERVAL     = 100;   // how often waitFor() re-checks its condition (ms)

  const BUTTON_STYLES = `
    background-color: #fc5200;
    color: white;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 8px;
    font-weight: bold;
    display: block;
    width: 100%;
  `;
  const STOP_BUTTON_STYLES = `
    background-color: #d9534f;
    color: white;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 8px;
    font-weight: bold;
    display: none;
    width: 100%;
  `;
  const PANEL_TEXT_STYLES = `
    background-color: #fff;
    color: #333;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    margin-bottom: 4px;
  `;

  /***************** STATE *****************/
  let isProcessing = false;
  let stopRequested = false;
  let startBtn = null;
  let stopBtn = null;
  let statusEl = null;
  let counterEl = null;

  /***************** SMALL HELPERS *****************/
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Poll `check` until it returns a truthy value or `timeoutMs` elapses.
  // Resolves with the truthy value, or null on timeout.
  async function waitFor(check, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const result = check();
      if (result) return result;
      await delay(POLL_INTERVAL);
    }
    return null;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  // Identifies the currently displayed page of results, so we can tell
  // when pagination has actually swapped the table contents.
  function firstRowSignature() {
    const row = document.querySelector("#search-results tbody tr");
    if (!row) return "";
    const link = row.querySelector("a[href*='/activities/']");
    return link ? link.href : row.textContent.trim();
  }

  /***************** UI *****************/
  function insertUIElements() {
    if (document.getElementById("startPrivacyScript")) return; // already inserted

    const container = document.createElement("div");
    container.style.cssText =
      "position: fixed; top: 80px; right: 20px; z-index: 9999; padding: 8px; width: 220px;";

    startBtn = document.createElement("button");
    startBtn.id = "startPrivacyScript";
    startBtn.textContent = "Bulk Privacy Update";
    startBtn.style.cssText = BUTTON_STYLES;
    startBtn.addEventListener("click", startScript);

    stopBtn = document.createElement("button");
    stopBtn.id = "stopPrivacyScript";
    stopBtn.textContent = "Stop";
    stopBtn.style.cssText = STOP_BUTTON_STYLES;
    stopBtn.addEventListener("click", () => {
      stopRequested = true;
      setStatus("Stopping after current activity…");
    });

    statusEl = document.createElement("div");
    statusEl.style.cssText = PANEL_TEXT_STYLES;
    setStatus("Idle");

    counterEl = document.createElement("div");
    counterEl.style.cssText = PANEL_TEXT_STYLES;
    counterEl.textContent = "";

    container.appendChild(startBtn);
    container.appendChild(stopBtn);
    container.appendChild(statusEl);
    container.appendChild(counterEl);
    document.body.appendChild(container);
  }

  function renderTally(tally, dryRun) {
    counterEl.textContent = dryRun
      ? `Would update: ${tally.wouldUpdate}`
      : `Updated: ${tally.updated} | Already set: ${tally.alreadySet} | Failed: ${
          tally.failed + tally.unconfirmed
        }`;
  }

  /***************** MAIN SCRIPT LOGIC *****************/
  async function startScript() {
    if (isProcessing) return;
    isProcessing = true;
    stopRequested = false;
    startBtn.disabled = true;
    stopBtn.style.display = "block";

    // Everything runs inside try/finally so the UI always recovers —
    // including when a prompt is cancelled or something throws mid-run.
    try {
      /************** A) Prompts **************/
      const privacyMap = {
        "everyone": "everyone",
        "followers": "followers_only",
        "only me": "only_me",
      };
      let userPrivacyChoice = prompt(
        "Which privacy setting?\nOptions: everyone / followers / only me",
        "followers"
      );
      if (!userPrivacyChoice) return; // user cancelled
      userPrivacyChoice = userPrivacyChoice.trim().toLowerCase();
      const privacyValue = privacyMap[userPrivacyChoice];
      if (!privacyValue) {
        alert("Invalid privacy option. Must be: everyone, followers, or only me.");
        return;
      }

      const validDayOptions = ["weekends", "weekdays", "all"];
      let userDayChoice = prompt(
        "Which days?\nOptions: weekends / weekdays / all",
        "all"
      );
      if (!userDayChoice) return;
      userDayChoice = userDayChoice.trim().toLowerCase();
      if (!validDayOptions.includes(userDayChoice)) {
        alert("Invalid day option. Must be: weekends, weekdays, or all.");
        return;
      }

      let mode = prompt(
        'Mode?\n"dry-run" previews without changing anything.\n"live" applies the changes.',
        "dry-run"
      );
      if (!mode) return;
      mode = mode.trim().toLowerCase();
      if (!["dry-run", "live"].includes(mode)) {
        alert('Invalid mode. Must be "dry-run" or "live".');
        return;
      }
      const dryRun = mode === "dry-run";

      if (!dryRun) {
        const confirmed = confirm(
          `This will set privacy to "${userPrivacyChoice}" on ${userDayChoice} activities across ALL pages.\n\n` +
            "Strava has no bulk undo. Continue?"
        );
        if (!confirmed) return;
      }

      function isDateInSelectedRange(d) {
        const day = d.getDay(); // 0=Sunday .. 6=Saturday
        const isWeekend = day === 0 || day === 6;
        if (userDayChoice === "all") return true;
        return userDayChoice === "weekends" ? isWeekend : !isWeekend;
      }

      /************** B) Page loop **************/
      const tally = {
        updated: 0,
        alreadySet: 0,
        wouldUpdate: 0,
        unconfirmed: 0,
        failed: 0,
        unparsedDates: 0,
        skippedDays: 0,
      };
      let currentPage = 1;
      let stoppedEarly = false;

      const firstRow = await waitFor(
        () => document.querySelector("#search-results tbody tr"),
        PAGE_LOAD_TIMEOUT
      );
      if (!firstRow) {
        alert("No activities found on this page. Nothing to do.");
        return;
      }

      // Preflight: if the table has no quick-edit buttons at all, Strava's
      // markup has probably changed — bail before touching anything.
      if (!dryRun && !document.querySelector("#search-results .quick-edit")) {
        alert(
          "No quick-edit buttons found in the activity table.\n" +
            "Strava's UI may have changed — aborting before making any changes."
        );
        return;
      }

      renderTally(tally, dryRun);

      while (!stopRequested) {
        setStatus(`${dryRun ? "Previewing" : "Processing"} page ${currentPage}…`);
        const rows = document.querySelectorAll("#search-results tbody tr");
        if (!rows.length) break;

        for (const row of rows) {
          if (stopRequested) break;

          const dateCell = row.querySelector(".col-date");
          if (!dateCell) continue;

          const dateText = dateCell.textContent.trim();
          const activityDate = new Date(dateText);
          if (isNaN(activityDate.getTime())) {
            console.warn("Could not parse date:", dateText);
            tally.unparsedDates++;
            continue;
          }
          if (!isDateInSelectedRange(activityDate)) {
            tally.skippedDays++;
            continue;
          }

          if (dryRun) {
            tally.wouldUpdate++;
          } else {
            let result;
            try {
              result = await setActivityPrivacy(row, privacyValue);
              if (result === "failed") {
                await delay(RETRY_DELAY);
                result = await setActivityPrivacy(row, privacyValue);
              }
            } catch (err) {
              console.error("Error processing row:", err);
              result = "failed";
            }
            if (result === "updated") tally.updated++;
            else if (result === "already_set") tally.alreadySet++;
            else if (result === "unconfirmed") tally.unconfirmed++;
            else tally.failed++;
            await delay(UPDATE_DELAY);
          }
          renderTally(tally, dryRun);
        }
        if (stopRequested) {
          stoppedEarly = true;
          break;
        }

        const nextBtn = document.querySelector(
          ".pagination .next_page, .pagination .pagination-next"
        );
        if (
          !nextBtn ||
          nextBtn.classList.contains("disabled") ||
          nextBtn.hasAttribute("disabled") ||
          nextBtn.getAttribute("aria-disabled") === "true" ||
          nextBtn.tagName.toLowerCase() === "span"
        ) {
          break; // last page
        }

        // Click Next, then wait for the table contents to actually change so
        // we never re-process the same page on a slow load.
        const previousSignature = firstRowSignature();
        nextBtn.click();
        const pageChanged = await waitFor(
          () => firstRowSignature() !== previousSignature,
          PAGE_LOAD_TIMEOUT
        );
        if (!pageChanged) {
          console.warn("Next page never loaded — stopping to avoid re-processing.");
          stoppedEarly = true;
          break;
        }
        currentPage++;
      }

      /************** C) Summary **************/
      setStatus(stoppedEarly ? "Stopped" : "Done");
      const lines = [
        stoppedEarly ? "Stopped early." : "Done!",
        `Privacy: "${userPrivacyChoice}", Days: "${userDayChoice}", Pages: ${currentPage}`,
      ];
      if (dryRun) {
        lines.push(`DRY RUN — no changes were made.`);
        lines.push(`Would update: ${tally.wouldUpdate}`);
      } else {
        lines.push(`Updated (confirmed): ${tally.updated}`);
        lines.push(`Already set: ${tally.alreadySet}`);
        if (tally.unconfirmed) lines.push(`Unconfirmed (Save clicked, form never closed): ${tally.unconfirmed}`);
        if (tally.failed) lines.push(`Failed: ${tally.failed}`);
      }
      if (tally.skippedDays) lines.push(`Skipped (day filter): ${tally.skippedDays}`);
      if (tally.unparsedDates) lines.push(`Skipped (unparseable date — see console): ${tally.unparsedDates}`);
      alert(lines.join("\n"));
    } finally {
      isProcessing = false;
      stopRequested = false;
      startBtn.disabled = false;
      stopBtn.style.display = "none";
    }
  }

  /***************** PER-ROW UPDATE *****************/
  // Opens the row's quick-edit form, sets the visibility, saves, and waits
  // for the form to close so the counter only counts confirmed updates.
  // Returns "updated" | "already_set" | "unconfirmed" | "failed".
  async function setActivityPrivacy(row, privacyValue) {
    const editBtn = row.querySelector(".quick-edit");
    if (!editBtn) {
      console.warn("No quick-edit button in row. Skipping…");
      return "failed";
    }
    editBtn.click();

    const select = await waitFor(
      () => row.querySelector("select#visibility"),
      EDIT_FORM_TIMEOUT
    );
    if (!select) {
      console.warn("No #visibility select appeared after quick-edit.");
      return "failed";
    }

    if (select.value === privacyValue) {
      closeQuickEdit(row, editBtn);
      await waitFor(() => !row.querySelector("select#visibility"), 2000);
      return "already_set";
    }

    select.value = privacyValue;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    const saveBtn = row.querySelector(
      "button[type='submit'].btn.btn-default, button[type='submit']"
    );
    if (!saveBtn) {
      console.warn("No Save button found in the edit form.");
      closeQuickEdit(row, editBtn);
      return "failed";
    }
    saveBtn.click();

    // Strava either closes the form in place or re-renders the row entirely;
    // both count as a confirmed save.
    const closed = await waitFor(
      () => !row.isConnected || !row.querySelector("select#visibility"),
      SAVE_TIMEOUT
    );
    return closed ? "updated" : "unconfirmed";
  }

  // Best-effort close of an open quick-edit form without saving.
  function closeQuickEdit(row, editBtn) {
    const cancel = row.querySelector(
      "button.btn-cancel, a.cancel, .cancel, [data-cancel]"
    );
    if (cancel) {
      cancel.click();
    } else if (editBtn) {
      editBtn.click(); // quick-edit button toggles the form
    }
  }

  /***************** BOOTSTRAP *****************/
  insertUIElements();
})();
