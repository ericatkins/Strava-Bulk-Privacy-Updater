// ==UserScript==
// @name         Strava Bulk Privacy Updater (Counter)
// @namespace    https://github.com/YOUR-GITHUB-USERNAME/YOUR-REPO-NAME
// @version      1.0
// @description  Bulk-updates Strava activities privacy (everyone/followers/only me) for selected weekdays/weekends/all, with a live update counter.
// @match        https://www.strava.com/athlete/training*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  /********************************************************************
   * 1) Insert the UI Elements at the top-right:
   *    - "Bulk Privacy Update" button
   *    - A counter ("Updated: 0") that we can update dynamically
   ********************************************************************/
  let updateCounterEl = null; // We'll store a reference to this element
  function insertUIElements() {
    // A container for both button + counter
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "80px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    container.style.padding = "8px";

    // The main button
    const btn = document.createElement("button");
    btn.id = "startPrivacyScript";
    btn.textContent = "Bulk Privacy Update";
    // Some styling (Strava orange)
    btn.style.backgroundColor = "#fc5200";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.padding = "8px 12px";
    btn.style.cursor = "pointer";
    btn.style.borderRadius = "4px";
    btn.style.marginBottom = "8px";
    btn.addEventListener("click", startScript);

    // The counter display (just text)
    updateCounterEl = document.createElement("div");
    updateCounterEl.textContent = "Activities Updated: 0";
    updateCounterEl.style.backgroundColor = "#fff";
    updateCounterEl.style.color = "#333";
    updateCounterEl.style.padding = "4px 8px";
    updateCounterEl.style.borderRadius = "4px";
    updateCounterEl.style.marginTop = "8px";
    updateCounterEl.style.fontWeight = "bold";

    container.appendChild(btn);
    container.appendChild(updateCounterEl);
    document.body.appendChild(container);
  }

  /********************************************************************
   * 2) The main script logic:
   *    - Prompt user for privacy setting & day-of-week filter
   *    - Loop over pages, calling setActivityPrivacy() for matched days
   *    - Stop gracefully when no more "Next" pages
   *    - Keep track of how many we’ve updated, displayed in updateCounterEl
   ********************************************************************/
  async function startScript() {
    // Keep a count of how many activities we've updated
    let updatedCount = 0;

    /************** A) Prompt for Privacy Setting **************/
    const validPrivacyOptions = ["everyone", "followers", "only me"];
    let userPrivacyChoice = prompt(
      "Which privacy setting?\nOptions: everyone / followers / only me",
      "followers"
    );
    if (!userPrivacyChoice) return; // user canceled
    userPrivacyChoice = userPrivacyChoice.trim().toLowerCase();
    if (!validPrivacyOptions.includes(userPrivacyChoice)) {
      alert("Invalid privacy option. Must be: everyone, followers, or only me.");
      return;
    }

    // Map user choice to Strava <select> values
    let privacyValue;
    switch (userPrivacyChoice) {
      case "everyone":
        privacyValue = "everyone";
        break;
      case "followers":
        privacyValue = "followers_only";
        break;
      case "only me":
        privacyValue = "only_me";
        break;
    }

    /************** B) Prompt for Day-of-Week Filter **************/
    const validDayOptions = ["weekends", "weekdays", "all"];
    let userDayChoice = prompt(
      "Which days?\nOptions: weekends / weekdays / all",
      "all"
    );
    if (!userDayChoice) return; // user canceled
    userDayChoice = userDayChoice.trim().toLowerCase();
    if (!validDayOptions.includes(userDayChoice)) {
      alert("Invalid day option. Must be: weekends, weekdays, or all.");
      return;
    }

    // Helper to check if a given Date is in the user’s chosen day filter
    function isDateInSelectedRange(d) {
      // getDay() => 0=Sun..6=Sat
      const day = d.getDay();
      const isWeekend = (day === 0 || day === 6); // Sunday or Saturday

      if (userDayChoice === "all") return true;
      if (userDayChoice === "weekends") return isWeekend;
      // else "weekdays"
      return !isWeekend;
    }

    /************** C) Loop Through All Pages **************/
    let currentPage = 1;
    while (true) {
      console.log(`Processing page ${currentPage}...`);

      // Wait a bit for the table to load
      await delay(1500);

      // Grab rows from #search-results
      const rows = document.querySelectorAll("#search-results tbody tr");
      if (!rows.length) {
        console.log("No activity rows found on this page.");
      } else {
        // Iterate over each row
        for (const row of rows) {
          // Find the date cell
          const dateCell = row.querySelector(".col-date");
          if (!dateCell) continue;

          const dateText = dateCell.textContent.trim();
          const activityDate = new Date(dateText);

          if (isNaN(activityDate.getTime())) {
            console.warn("Could not parse date:", dateText);
            continue;
          }

          // Check if it matches user’s chosen day filter
          if (isDateInSelectedRange(activityDate)) {
            // Update privacy, then increment the counter
            await setActivityPrivacy(row, privacyValue);
            updatedCount++;
            updateCounterEl.textContent = `Activities Updated: ${updatedCount}`;
          } else {
            console.log(`Skipping ${dateText} (not matching ${userDayChoice})`);
          }
        }
      }

      // Look for next-page or pagination link
      const nextBtn = document.querySelector(
        ".pagination .next_page, .pagination .pagination-next"
      );

      // Check if missing, disabled, aria-disabled, or replaced with <span>
      if (
        !nextBtn ||
        nextBtn.classList.contains("disabled") ||
        nextBtn.hasAttribute("disabled") ||
        nextBtn.getAttribute("aria-disabled") === "true" ||
        nextBtn.tagName.toLowerCase() === "span"
      ) {
        console.log("No next-page button found or it's disabled. Ending script gracefully.");
        break;
      }

      // Otherwise, go to the next page
      nextBtn.click();
      currentPage++;

      // Wait for next page to load
      await delay(3000);
    }

    /************** D) Final Alert on Completion **************/
    alert(
      `Done!\n` +
      `Privacy set to "${userPrivacyChoice}"\n` +
      `Days filtered: "${userDayChoice}"\n` +
      `Total updated: ${updatedCount}.`
    );
  }

  /********************************************************************
   * 3) setActivityPrivacy(row, privacyValue)
   *    For a single table row:
   *      - click ".quick-edit"
   *      - wait for #visibility <select>
   *      - set the value
   *      - click "Save"
   ********************************************************************/
  function setActivityPrivacy(row, privacyValue) {
    return new Promise((resolve) => {
      try {
        const editBtn = row.querySelector(".quick-edit");
        if (!editBtn) {
          console.warn("No quick-edit button in row. Skipping...");
          return resolve();
        }
        editBtn.click();

        // Wait for the edit form to appear
        setTimeout(() => {
          const select = row.querySelector("select#visibility");
          if (!select) {
            console.warn("No #visibility select found. Possibly a timing issue.");
            return resolve();
          }
          // e.g. "everyone", "followers_only", "only_me"
          select.value = privacyValue;

          // Find "Save" button
          const saveBtn = row.querySelector("button[type='submit'].btn.btn-default");
          if (!saveBtn) {
            console.warn("No Save button found in the edit form.");
            return resolve();
          }
          saveBtn.click();

          // Wait a second for finalization
          setTimeout(() => {
            resolve();
          }, 1000);
        }, 800);
      } catch (err) {
        console.error("Error setting privacy:", err);
        resolve();
      }
    });
  }

  /********************************************************************
   * 4) delay(ms): helper function to wait "ms" milliseconds
   ********************************************************************/
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /********************************************************************
   * 5) Insert the UI Elements (button + counter) on page load
   ********************************************************************/
  insertUIElements();
})();
