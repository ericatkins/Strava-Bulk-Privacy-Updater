// ==UserScript==
// @name         Strava Bulk Privacy Updater (Counter)
// @namespace    https://github.com/YOUR-GITHUB-USERNAME/YOUR-REPO-NAME
// @version      1.1
// @description  Bulk-updates Strava activities privacy (everyone/followers/only me) for selected weekdays/weekends/all, with a live update counter.
// @match        https://www.strava.com/athlete/training*
// @grant        none
// @license      MIT
// ==/UserScript==

/*
 * MIT License
 *
 * Copyright (c) 2024 YOUR NAME
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

  /***************** CONFIGURATION CONSTANTS *****************/
  // Define styles for the button
  const BUTTON_STYLES = `
    background-color: #fc5200;
    color: white;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 8px;
    font-weight: bold;
  `;
  
  // Delays for page load and next page actions
  const PAGE_LOAD_DELAY = 1500; // Time to wait for the activities to load
  const NEXT_PAGE_DELAY = 2000; // Time to wait before navigating to next page

  let updateCounterEl = null; // Element to display the number of activities updated
  let isProcessing = false; // Flag to prevent multiple clicks while script is running

  /***************** INSERT UI ELEMENTS *****************/
  function insertUIElements() {
    // Create a container for UI elements
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "80px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    container.style.padding = "8px";

    // Create the button to start the script
    const btn = document.createElement("button");
    btn.id = "startPrivacyScript";
    btn.textContent = "Bulk Privacy Update";
    btn.style = BUTTON_STYLES;
    btn.addEventListener("click", startScript);

    // Create a display to show the number of updated activities
    updateCounterEl = document.createElement("div");
    updateCounterEl.textContent = "Activities Updated: 0";
    updateCounterEl.style = "background-color: #fff; color: #333; padding: 4px 8px; border-radius: 4px; font-weight: bold;";

    // Add elements to the page
    container.appendChild(btn);
    container.appendChild(updateCounterEl);
    document.body.appendChild(container);
  }

  /***************** MAIN SCRIPT LOGIC *****************/
  async function startScript() {
    if (isProcessing) return; // Prevent multiple script executions
    isProcessing = true;
    document.getElementById("startPrivacyScript").disabled = true; // Disable button during execution

    let updatedCount = 0; // Tracks the number of activities updated
    const privacyMap = { "everyone": "everyone", "followers": "followers_only", "only me": "only_me" };
    const dayOptions = ["weekends", "weekdays", "all"];

    // Prompt the user for privacy setting
    let userPrivacyChoice = prompt("Privacy setting? (everyone/followers/only me)", "followers");
    if (!userPrivacyChoice || !privacyMap[userPrivacyChoice.toLowerCase()]) return;
    userPrivacyChoice = privacyMap[userPrivacyChoice.toLowerCase()];

    // Prompt the user for day filter
    let userDayChoice = prompt("Which days? (weekends/weekdays/all)", "all");
    if (!userDayChoice || !dayOptions.includes(userDayChoice.toLowerCase())) return;
    userDayChoice = userDayChoice.toLowerCase();

    // Function to check if an activity date matches the user’s selected filter
    function isDateInSelectedRange(d) {
      const day = d.getDay(); // Get day of the week (0=Sunday, 6=Saturday)
      const isWeekend = day === 0 || day === 6;
      return userDayChoice === "all" || (userDayChoice === "weekends" ? isWeekend : !isWeekend);
    }

    let currentPage = 1;
    while (true) {
      await delay(PAGE_LOAD_DELAY);
      const rows = document.querySelectorAll("#search-results tbody tr");
      if (!rows.length) break;

      for (const row of rows) {
        try {
          const dateCell = row.querySelector(".col-date");
          if (!dateCell) continue;
          const activityDate = new Date(dateCell.textContent.trim());

          if (!isNaN(activityDate.getTime()) && isDateInSelectedRange(activityDate)) {
            await setActivityPrivacy(row, userPrivacyChoice);
            updateCounterEl.textContent = `Activities Updated: ${++updatedCount}`;
          }
        } catch (err) {
          console.error("Error processing row:", err);
        }
      }

      const nextBtn = document.querySelector(".pagination .next_page, .pagination .pagination-next");
      if (!nextBtn || nextBtn.classList.contains("disabled")) break;
      nextBtn.click();
      await delay(NEXT_PAGE_DELAY);
      currentPage++;
    }

    alert(`Done! Privacy: ${userPrivacyChoice}, Days: ${userDayChoice}, Total Updated: ${updatedCount}`);
    document.getElementById("startPrivacyScript").disabled = false;
    isProcessing = false;
  }

  // Insert UI elements when the script loads
  insertUIElements();
})();
