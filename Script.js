// =====================================================
// iSave - MAIN SCRIPT
// =====================================================
// This one file is used by every page:
// index.html (login), createaccount.html, and dashboard.html.
// Each "setup" function checks if its page is open,
// and quietly does nothing on the other pages.
//
// Contents:
//   1. Supabase setup
//   2. Message box (replaces alert)
//   3. Helper functions
//   4. Create account page
//   5. Login page
//   6. Dashboard page
//   7. Start the app
// =====================================================


// =====================================================
// 1. SUPABASE SETUP
// =====================================================
// The "publishable" key is safe to show in the browser.
// Your data is protected by RLS (Row Level Security)
// in the Supabase dashboard.

const SUPABASE_URL = "https://yvmaiuaitwyhkhsxvari.supabase.co";
const SUPABASE_KEY = "sb_publishable_O1BFpAxcpbB_Clh3ragvKQ_Az6Jvviy";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// =====================================================
// 2. MESSAGE BOX (replaces alert)
// =====================================================
// How to use:
//
//   await showMessage("error", "Title here", "Message here");
//
// Types: "success", "error", "warning", "info"
//
// Because of "await", the code waits until the user
// clicks OK before it continues.
// The message box styles are added by this script,
// so you don't need to change your HTML or CSS.

const MESSAGE_ICONS = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i"
};

// Adds the message box CSS to the page (only once)
function addMessageBoxStyles() {

    if (document.getElementById("messageBoxStyles")) return;

    const style = document.createElement("style");
    style.id = "messageBoxStyles";

    style.textContent = `
        .message-overlay {
            --mb-surface: #ffffff;
            --mb-text: #1f2937;
            --mb-muted: #4b5563;
            --mb-backdrop: rgba(15, 23, 42, 0.55);
            --mb-success: #15803d;
            --mb-error: #b91c1c;
            --mb-warning: #b45309;
            --mb-info: #1d4ed8;

            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: var(--mb-backdrop);
            font-family: inherit;
            animation: mb-fade 0.15s ease-out;
        }

        @media (prefers-color-scheme: dark) {
            .message-overlay {
                color-scheme: dark;
                --mb-surface: #1f2937;
                --mb-text: #f3f4f6;
                --mb-muted: #d1d5db;
                --mb-backdrop: rgba(0, 0, 0, 0.65);
                --mb-success: #4ade80;
                --mb-error: #f87171;
                --mb-warning: #fbbf24;
                --mb-info: #60a5fa;
            }
        }

        .message-box {
            --mb-accent: var(--mb-info);

            width: 100%;
            max-width: 380px;
            padding: 28px 24px 22px;
            border-top: 5px solid var(--mb-accent);
            border-radius: 14px;
            background: var(--mb-surface);
            color: var(--mb-text);
            text-align: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            animation: mb-pop 0.18s ease-out;
        }

        .message-success { --mb-accent: var(--mb-success); }
        .message-error   { --mb-accent: var(--mb-error); }
        .message-warning { --mb-accent: var(--mb-warning); }
        .message-info    { --mb-accent: var(--mb-info); }

        .message-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 52px;
            height: 52px;
            margin: 0 auto 14px;
            border: 3px solid var(--mb-accent);
            border-radius: 50%;
            color: var(--mb-accent);
            font-size: 26px;
            font-weight: 700;
        }

        .message-title {
            margin: 0 0 8px;
            font-size: 20px;
        }

        .message-text {
            margin: 0 0 22px;
            color: var(--mb-muted);
            line-height: 1.5;
            white-space: pre-line;
        }

        .message-ok {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: var(--mb-accent);
            color: var(--mb-surface);
            font: inherit;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }

        .message-ok:hover {
            filter: brightness(1.1);
        }

        .message-ok:focus-visible {
            outline: 3px solid var(--mb-accent);
            outline-offset: 3px;
        }

        @keyframes mb-fade {
            from { opacity: 0; }
        }

        @keyframes mb-pop {
            from { opacity: 0; transform: scale(0.95); }
        }

        @media (prefers-reduced-motion: reduce) {
            .message-overlay,
            .message-box {
                animation: none;
            }
        }
    `;

    document.head.appendChild(style);

}

// Shows the message box
function showMessage(type, title, message) {

    addMessageBoxStyles();

    return new Promise(function (resolve) {

        // Build the dark background (overlay) and the box
        const overlay = document.createElement("div");
        overlay.className = "message-overlay";

        overlay.innerHTML = `
            <div class="message-box message-${type}"
                 role="alertdialog"
                 aria-modal="true"
                 aria-labelledby="messageTitle"
                 aria-describedby="messageText">
                <div class="message-icon" aria-hidden="true">${MESSAGE_ICONS[type]}</div>
                <h2 class="message-title" id="messageTitle"></h2>
                <p class="message-text" id="messageText"></p>
                <button type="button" class="message-ok">OK</button>
            </div>
        `;

        // textContent is safe: the text is never read as HTML
        overlay.querySelector(".message-title").textContent = title;
        overlay.querySelector(".message-text").textContent = message;

        const okButton = overlay.querySelector(".message-ok");

        function closeMessage() {
            document.removeEventListener("keydown", closeOnEscape);
            overlay.remove();
            resolve();
        }

        function closeOnEscape(event) {
            if (event.key === "Escape") closeMessage();
        }

        okButton.addEventListener("click", closeMessage);
        document.addEventListener("keydown", closeOnEscape);

        // Clicking the dark background also closes it
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) closeMessage();
        });

        document.body.appendChild(overlay);
        okButton.focus();

    });

}

// True while a message box is on screen
function isMessageOpen() {
    return document.querySelector(".message-overlay") !== null;
}


// =====================================================
// 3. HELPER FUNCTIONS
// =====================================================

// Prints full error details in the Console (F12)
function logError(context, error) {

    console.group(`ERROR: ${context}`);
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Status:", error?.status);
    console.error("Full error:", error);
    console.groupEnd();

}

// Gets an input's value without extra spaces
function getValue(inputId) {
    return document.getElementById(inputId).value.trim();
}

// Puts the cursor in an input
function focusField(inputId) {

    const input = document.getElementById(inputId);

    if (input) input.focus();

}

// Shows a problem, then puts the cursor in the field that caused it
// problem = { fieldId, title, message }
async function showFormProblem(problem, type = "error") {

    await showMessage(type, problem.title, problem.message);

    if (problem.fieldId) focusField(problem.fieldId);

}

// Turns a button's loading state on or off
// (it remembers the button's original content, so the HTML
//  of the button never has to be repeated in this file)
function setButtonLoading(button, isLoading, loadingText) {

    if (isLoading) {

        button.dataset.originalHtml = button.innerHTML;
        button.textContent = loadingText;
        button.disabled = true;

    } else {

        button.innerHTML = button.dataset.originalHtml;
        button.disabled = false;

    }

}

// Show / hide password button
function setupPasswordToggle(inputId, buttonId) {

    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (!input || !button) return;

    // Keep the same letter case as the HTML ("Show" or "SHOW")
    const originalText = button.textContent.trim();
    const isUpperCase = originalText === originalText.toUpperCase();

    button.addEventListener("click", function () {

        const isHidden = input.type === "password";
        const newText = isHidden ? "Hide" : "Show";

        input.type = isHidden ? "text" : "password";
        button.textContent = isUpperCase ? newText.toUpperCase() : newText;
        button.setAttribute("aria-label", `${newText} password`);

    });

}

// Friendly message for "no internet" and "too many attempts" errors.
// Returns null if the error is something else.
function getCommonProblem(error) {

    const code = error?.code ?? "";
    const message = (error?.message ?? "").toLowerCase();

    if (error?.status === 429 || code.includes("rate_limit")) {

        return {
            fieldId: null,
            title: "Too many attempts",
            message: "Wait a few minutes, then try again."
        };

    }

    if (message.includes("failed to fetch")) {

        return {
            fieldId: null,
            title: "No connection",
            message: "Check your internet connection, then try again."
        };

    }

    return null;

}


// =====================================================
// 4. CREATE ACCOUNT PAGE
// =====================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// -----------------------------------------------------
// 4A. Check the form before sending it
// -----------------------------------------------------
// Returns { fieldId, title, message } if something is wrong,
// or null if everything is fine.

function validateAccount(account) {

    // Find the first empty field
    for (const fieldId in account) {

        if (account[fieldId] === "") {

            return {
                fieldId: fieldId,
                title: "Missing information",
                message: "Please complete all required fields."
            };

        }

    }

    const age = Number(account.age);

    if (!Number.isInteger(age) || age <= 0 || age > 120) {

        return {
            fieldId: "age",
            title: "Invalid age",
            message: "Enter your age as a whole number, like 25."
        };

    }

    if (new Date(account.birthday) > new Date()) {

        return {
            fieldId: "birthday",
            title: "Invalid birthday",
            message: "Your birthday can't be a future date."
        };

    }

    if (!EMAIL_PATTERN.test(account.email)) {

        return {
            fieldId: "email",
            title: "Invalid email",
            message: "Enter a valid email address, like juan@email.com."
        };

    }

    if (account.password.length < 8) {

        return {
            fieldId: "password",
            title: "Password too short",
            message: "Your password needs at least 8 characters."
        };

    }

    if (account.password !== account.confirmPassword) {

        return {
            fieldId: "confirmPassword",
            title: "Passwords don't match",
            message: "Re-type your password so both fields are the same."
        };

    }

    return null;

}

// -----------------------------------------------------
// 4B. Check if the username is already used
// -----------------------------------------------------

async function isUsernameTaken(username) {

    const { data, error } = await db
        .from("UsersTable")
        .select("Username")
        .eq("Username", username)
        .limit(1);

    if (error) throw error;

    // At least one row found = username is taken
    return data.length > 0;

}

// -----------------------------------------------------
// 4C. Turn a Supabase sign-up error into a clear message
// -----------------------------------------------------

function getSignUpProblem(error) {

    const code = error?.code ?? "";
    const message = (error?.message ?? "").toLowerCase();

    // DUPLICATE EMAIL
    if (
        code === "user_already_exists" ||
        code === "email_exists" ||
        message.includes("already registered")
    ) {

        return {
            fieldId: "email",
            title: "Email already registered",
            message:
                "An account with this email already exists.\n" +
                "Use a different email, or log in instead."
        };

    }

    // DUPLICATE USERNAME (from the database)
    // When saving to UsersTable fails (for example, because Username
    // must be unique), Supabase only says "Database error saving new user".
    if (
        message.includes("database error saving new user") ||
        message.includes("username_unique")
    ) {

        return {
            fieldId: "username",
            title: "Username not available",
            message:
                "This username is probably already taken.\n" +
                "Choose a different username and try again."
        };

    }

    // WEAK PASSWORD
    if (code === "weak_password") {

        return {
            fieldId: "password",
            title: "Weak password",
            message: "Choose a stronger password. Mix letters, numbers, and symbols."
        };

    }

    // INVALID EMAIL ADDRESS
    if (code === "email_address_invalid") {

        return {
            fieldId: "email",
            title: "Invalid email",
            message: "This email address can't be used. Try a different one."
        };

    }

    // NO INTERNET / TOO MANY ATTEMPTS / ANYTHING ELSE
    return getCommonProblem(error) ?? {
        fieldId: null,
        title: "Account not created",
        message: error?.message || "Something went wrong. Try again."
    };

}

// -----------------------------------------------------
// 4D. Connect everything to the create account form
// -----------------------------------------------------

function setupCreateAccount() {

    const form = document.getElementById("createAccountForm");
    const createAccountButton = document.getElementById("createAccountButton");

    // Not on the create account page
    if (!form || !createAccountButton) return;

    setupPasswordToggle("password", "togglePassword");
    setupPasswordToggle("confirmPassword", "toggleConfirmPassword");

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // STEP 1: Read the form
        // (each key has the same name as the input's id)
        const account = {
            firstName: getValue("firstName"),
            lastName: getValue("lastName"),
            age: getValue("age"),
            birthday: getValue("birthday"),
            company: getValue("company"),
            position: getValue("position"),
            username: getValue("username"),
            email: getValue("email"),
            // Passwords are not trimmed (spaces can be part of a password)
            password: document.getElementById("password").value,
            confirmPassword: document.getElementById("confirmPassword").value
        };

        // STEP 2: Check the form
        const formProblem = validateAccount(account);

        if (formProblem) {
            await showFormProblem(formProblem, "warning");
            return;
        }

        setButtonLoading(createAccountButton, true, "Creating account...");

        try {

            // STEP 3: Check if the username is taken
            if (await isUsernameTaken(account.username)) {

                await showFormProblem({
                    fieldId: "username",
                    title: "Username already taken",
                    message:
                        `"${account.username}" is already in use.\n` +
                        "Choose a different username."
                });

                return;

            }

            // STEP 4: Register the user in Supabase
            const { data, error } = await db.auth.signUp({
                email: account.email,
                password: account.password,
                options: {
                    data: {
                        firstName: account.firstName,
                        lastName: account.lastName,
                        age: Number(account.age),
                        birthday: account.birthday,
                        company: account.company,
                        position: account.position,
                        username: account.username
                    }
                }
            });

            if (error) throw error;

            // STEP 5: Check for a "hidden" duplicate email
            // When "Confirm email" is ON, Supabase does NOT return an error
            // for an existing email. Instead, "identities" comes back empty.
            if (data.user && data.user.identities?.length === 0) {

                await showFormProblem({
                    fieldId: "email",
                    title: "Email already registered",
                    message:
                        "An account with this email already exists.\n" +
                        "Use a different email, or log in instead."
                });

                return;

            }

            // STEP 6: Success
            if (data.session) {

                // Email confirmation is OFF: the user can log in right away.
                // Sign out so they log in on the login page themselves.
                await db.auth.signOut();

                await showMessage(
                    "success",
                    "Account created",
                    "Your iSave account is ready. You can now log in."
                );

                window.location.href = "index.html";

            } else {

                // Email confirmation is ON: they must confirm first
                await showMessage(
                    "success",
                    "Check your email",
                    `We sent a confirmation link to ${account.email}.\n` +
                    "Confirm your account before logging in."
                );

                form.reset();

            }

        } catch (error) {

            logError("CREATE ACCOUNT", error);
            await showFormProblem(getSignUpProblem(error));

        } finally {

            // Always bring the button back, success or error
            setButtonLoading(createAccountButton, false);

        }

    });

}


// =====================================================
// 5. LOGIN PAGE
// =====================================================

// -----------------------------------------------------
// 5A. Turn a login error into a clear message
// -----------------------------------------------------

function getLoginProblem(error) {

    const code = error?.code ?? "";
    const message = (error?.message ?? "").toLowerCase();

    // WRONG EMAIL OR PASSWORD
    // (Supabase never says which one is wrong, on purpose,
    //  so nobody can find out which emails have accounts.)
    if (code === "invalid_credentials" || message.includes("invalid login credentials")) {

        return {
            fieldId: "password",
            title: "Incorrect email or password",
            message:
                "The email or password you entered doesn't match any account.\n" +
                "Check both fields, then try again."
        };

    }

    // EMAIL NOT CONFIRMED YET
    if (code === "email_not_confirmed" || message.includes("email not confirmed")) {

        return {
            fieldId: "email",
            title: "Email not confirmed",
            message:
                "Open the confirmation link we sent to your email,\n" +
                "then log in again."
        };

    }

    // NO INTERNET / TOO MANY ATTEMPTS / ANYTHING ELSE
    return getCommonProblem(error) ?? {
        fieldId: null,
        title: "Login failed",
        message: error?.message || "Something went wrong. Try again."
    };

}

// -----------------------------------------------------
// 5B. Connect everything to the login form
// -----------------------------------------------------

function setupLogin() {

    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");

    // Not on the login page
    if (!loginForm || !loginButton) return;

    setupPasswordToggle("password", "togglePassword");

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // STEP 1: Read email and password
        const email = getValue("email");
        const password = document.getElementById("password").value;

        // STEP 2: Make sure both are filled in
        if (!email || !password) {

            await showFormProblem({
                fieldId: !email ? "email" : "password",
                title: "Missing information",
                message: "Enter your email and password to log in."
            }, "warning");

            return;

        }

        if (loginMessage) loginMessage.textContent = "";
        setButtonLoading(loginButton, true, "Logging in...");

        try {

            // STEP 3: Log in with Supabase
            const { error } = await db.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // STEP 4: Success, go to the dashboard
            if (loginMessage) loginMessage.textContent = "Login successful. Redirecting...";
            window.location.href = "dashboard.html";

        } catch (error) {

            logError("LOGIN", error);

            // Bring the button back first, then show the warning
            // (not needed on success, because the page changes)
            setButtonLoading(loginButton, false);

            await showFormProblem(getLoginProblem(error), "warning");

        }

    });

}


// =====================================================
// 6. DASHBOARD PAGE
// =====================================================

// -----------------------------------------------------
// 6A. Table columns
// -----------------------------------------------------
// key       = column name in the Supabase "Transactions" table
// label     = column name shown to the user (also used on phones)
// className = CSS class for the cell (see Style.css)
// format    = (optional) changes how the value looks

const TRANSACTION_COLUMNS = [
    { key: "Date",     label: "Date",               className: "cell-date",     format: formatDate },
    { key: "Payroll",  label: "Payroll",            className: "cell-payroll",  format: formatPayroll },
    { key: "Sender",   label: "Sender",             className: "cell-sender" },
    { key: "Amount",   label: "Amount",             className: "cell-amount",   format: formatPeso },
    { key: "Reciever", label: "Receiver",           className: "cell-receiver" }, // "Reciever" is how it's spelled in the database
    { key: "Purpose",  label: "Purpose/Definition", className: "cell-purpose" }
];

// -----------------------------------------------------
// 6B. Formatting helpers
// -----------------------------------------------------

// 1500 -> "₱1,500.00"
function formatPeso(value) {

    if (value === null || value === "" || isNaN(Number(value))) return "";

    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(Number(value));

}

// "2026-11-20" -> "Nov 20, 2026"
function formatDate(value) {

    if (!value) return "";

    // Adding "T00:00:00" reads the date in local time (not UTC)
    const date = new Date(`${value}T00:00:00`);

    if (isNaN(date)) return value;

    return new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);

}

// 1 -> "First cutoff", 2 -> "Second cutoff"
function formatPayroll(value) {

    const payrollNames = {
        "1": "First cutoff",
        "2": "Second cutoff"
    };

    return payrollNames[String(value)] ?? value;

}

// Dates 26–10 belong to the first cutoff; dates 11–25 belong to the second.
function getPayrollForDate(value) {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
    const day = date.getDate();
    return day >= 26 || day <= 10 ? 1 : 2;
}

// Today's date as "YYYY-MM-DD" in local time
// (toISOString() uses UTC, which can be a day behind in the Philippines)
function getTodayDate() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

// -----------------------------------------------------
// 6C. Load transactions into the table
// -----------------------------------------------------

// Shows one row with a message, like "No transactions yet."
function showTableMessage(tableBody, text) {

    tableBody.innerHTML = `
        <tr>
            <td colspan="${TRANSACTION_COLUMNS.length}" class="empty-state">${text}</td>
        </tr>
    `;

}

// Updates "Total records" and the text under "Recent transactions"
function updateRecordCount(count) {

    const totalRecords = document.getElementById("totalRecords");
    const recordSummary = document.getElementById("recordSummary");

    if (totalRecords) totalRecords.textContent = count;

    if (recordSummary) {
        recordSummary.textContent =
            count === 1 ? "1 transaction recorded" : `${count} transactions recorded`;
    }

}

// userId = the logged-in user's id (only their own records are shown)
async function loadTransactions(tableBody, userId) {

    // Newest first
    const { data, error } = await db
        .from("Transactions")
        .select("*")
        .eq("UserID", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    updateRecordCount(data.length);

    if (data.length === 0) {
        showTableMessage(tableBody, "No transactions yet. Click \"Add transaction\" to record your first one.");
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(function (transaction) {

        const row = document.createElement("tr");

        TRANSACTION_COLUMNS.forEach(function (column) {

            const cell = document.createElement("td");
            const value = transaction[column.key];

            cell.className = column.className;
            cell.setAttribute("data-label", column.label);
            cell.textContent = column.format ? column.format(value) : (value ?? "");

            row.appendChild(cell);

        });

        tableBody.appendChild(row);

    });

}

// -----------------------------------------------------
// 6D. User info (welcome message, avatar, today's date)
// -----------------------------------------------------

function showUserInfo(user) {

    const welcomeTitle = document.getElementById("welcomeTitle");
    const userAvatar = document.getElementById("userAvatar");
    const todayLabel = document.getElementById("todayLabel");

    // Saved during sign up (see section 4D, STEP 4)
    const firstName = user.user_metadata?.firstName;

    if (welcomeTitle && firstName) {
        welcomeTitle.textContent = `Welcome back, ${firstName}!`;
    }

    if (userAvatar) {
        userAvatar.textContent = (firstName || user.email || "U").charAt(0).toUpperCase();
    }

    if (todayLabel) {
        todayLabel.textContent = new Intl.DateTimeFormat("en-PH", {
            weekday: "long",
            month: "long",
            day: "numeric"
        }).format(new Date());
    }

}

// -----------------------------------------------------
// 6E. Sidebar (slide-in menu on tablets and phones)
// -----------------------------------------------------

function setupSidebar() {

    const sidebar = document.getElementById("sidebar");
    const openButton = document.getElementById("openSidebar");
    const closeButton = document.getElementById("closeSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    if (!sidebar || !openButton || !closeButton || !backdrop) return;

    // Must match the 960px breakpoint in Style.css
    const desktopScreen = window.matchMedia("(min-width: 961px)");

    function openSidebar() {
        sidebar.classList.add("open");
        backdrop.classList.add("visible");
        document.body.classList.add("no-scroll");
        openButton.setAttribute("aria-expanded", "true");
        closeButton.focus();
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        backdrop.classList.remove("visible");
        document.body.classList.remove("no-scroll");
        openButton.setAttribute("aria-expanded", "false");
    }

    openButton.addEventListener("click", openSidebar);
    backdrop.addEventListener("click", closeSidebar);

    closeButton.addEventListener("click", function () {
        closeSidebar();
        openButton.focus();
    });

    // Close the menu after picking a link
    sidebar.querySelectorAll(".nav-link").forEach(function (link) {
        link.addEventListener("click", closeSidebar);
    });

    // Escape key closes the menu
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && sidebar.classList.contains("open") && !isMessageOpen()) {
            closeSidebar();
            openButton.focus();
        }
    });

    // Reset the menu when the screen becomes desktop size
    desktopScreen.addEventListener("change", function (event) {
        if (event.matches) closeSidebar();
    });

}

// -----------------------------------------------------
// 6F. Log out
// -----------------------------------------------------

function setupLogout() {

    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", async function () {

        const { error } = await db.auth.signOut();

        if (error) {
            logError("LOGOUT", error);
            await showMessage("error", "Log out failed", "Refresh the page, then try again.");
            return;
        }

        window.location.replace("index.html");

    });

}

// -----------------------------------------------------
// 6G. Add transaction modal
// -----------------------------------------------------

// Checks the transaction form.
// Returns { fieldId, title, message } or null.
function validateTransaction(transaction) {

    const requiredFields = [
        { fieldId: "transactionDate", value: transaction.date,     name: "date" },
        { fieldId: "sender",          value: transaction.sender,   name: "sender" },
        { fieldId: "receiver",        value: transaction.receiver, name: "receiver" },
        { fieldId: "amount",          value: transaction.amount,   name: "amount" },
        { fieldId: "transactionType", value: transaction.type,     name: "transaction type" },
        { fieldId: "purpose",         value: transaction.purpose,  name: "purpose" }
    ];

    for (const field of requiredFields) {

        if (!field.value) {

            return {
                fieldId: field.fieldId,
                title: "Missing information",
                message: `Please enter the ${field.name}.`
            };

        }

    }

    if (Number(transaction.amount) <= 0) {

        return {
            fieldId: "amount",
            title: "Invalid amount",
            message: "Enter an amount greater than ₱0.00."
        };

    }

    return null;

}

// Turns a database error into a clear message
function getSaveProblem(error) {

    // 42501 = blocked by Row Level Security
    if (error?.code === "42501") {

        return {
            fieldId: null,
            title: "Not allowed to save",
            message:
                "Your account can't add transactions yet.\n" +
                "Add an INSERT policy to the Transactions table in Supabase."
        };

    }

    return getCommonProblem(error) ?? {
        fieldId: null,
        title: "Transaction not saved",
        message: error?.message || "Something went wrong. Try again."
    };

}

function setupTransactionModal(tableBody, userId, openLoanPayment) {

    const modal = document.getElementById("transactionModal");
    const form = document.getElementById("transactionForm");
    const openButton = document.getElementById("addTransactionBtn");
    const closeButton = document.getElementById("closeTransactionModal");
    const cancelButton = document.getElementById("cancelTransaction");
    const saveButton = document.getElementById("saveTransactionBtn");
    const dateInput = document.getElementById("transactionDate");
    const todayToggle = document.getElementById("todayDateToggle");
    const dateHint = document.getElementById("dateHint");
    const typeModal = document.getElementById("transactionTypeModal");
    const typeForm = document.getElementById("transactionTypeForm");
    const typeChoice = document.getElementById("transactionTypeChoice");
    const transactionType = document.getElementById("transactionType");

    if (!modal || !form || !openButton || !closeButton || !cancelButton || !saveButton || !dateInput || !todayToggle || !dateHint
        || !typeModal || !typeForm || !typeChoice || !transactionType || typeof openLoanPayment !== "function") return;

    // "Today" switch: ON = today's date, OFF = pick a date
    function updateDateField() {

        if (todayToggle.checked) {

            dateInput.value = getTodayDate();
            dateInput.disabled = true;
            dateHint.textContent = "Using today's date.";

        } else {

            dateInput.disabled = false;
            dateHint.textContent = "Pick the date of the transaction.";
            dateInput.focus();

        }

    }

    function openBankTransfer() {
        form.reset();
        document.getElementById("transactionModalTitle").textContent = "Bank Transfer";
        transactionType.value = "Bank Transfer";
        transactionType.disabled = true;
        updateDateField();
        modal.hidden = false;
        document.body.classList.add("no-scroll");
        focusField("sender");
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("no-scroll");
        openButton.focus();
    }

    function closeTypeModal() {
        typeModal.hidden = true;
        document.body.classList.remove("no-scroll");
        openButton.focus();
    }

    openButton.addEventListener("click", function () {
        typeForm.reset();
        typeModal.hidden = false;
        document.body.classList.add("no-scroll");
        typeChoice.focus();
    });
    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);
    todayToggle.addEventListener("change", updateDateField);
    document.getElementById("closeTransactionTypeModal").addEventListener("click", closeTypeModal);
    document.getElementById("cancelTransactionType").addEventListener("click", closeTypeModal);
    typeForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (typeChoice.value === "Bank Transfer") {
            typeModal.hidden = true;
            openBankTransfer();
        } else if (typeChoice.value === "Loan") {
            typeModal.hidden = true;
            openLoanPayment();
        } else {
            typeChoice.focus();
        }
    });

    // Escape key closes the modal (but not while a message box is open)
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !modal.hidden && !isMessageOpen()) {
            closeModal();
        }
        if (event.key === "Escape" && !typeModal.hidden && !isMessageOpen()) {
            closeTypeModal();
        }
    });

    // Save the transaction
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // STEP 1: Read the form
        const transaction = {
            date: dateInput.value,
            payroll: getPayrollForDate(dateInput.value),
            sender: getValue("sender"),
            receiver: getValue("receiver"),
            amount: getValue("amount"),
            type: getValue("transactionType"),
            purpose: getValue("purpose")
        };

        // STEP 2: Check the form
        const problem = validateTransaction(transaction);

        if (problem) {
            await showFormProblem(problem, "warning");
            return;
        }

        setButtonLoading(saveButton, true, "Saving...");

        try {

            // STEP 3: Make sure the user is still logged in
            const { data: userData, error: userError } = await db.auth.getUser();

            if (userError || !userData.user) {

                await showMessage(
                    "warning",
                    "Session expired",
                    "Your login session has ended. Log in again to continue."
                );

                window.location.replace("index.html");
                return;

            }

            // STEP 4: Save to Supabase
            // (left side = column name in the database)
            const { error } = await db.from("Transactions").insert({
                Date: transaction.date,
                Payroll: transaction.payroll,
                Sender: transaction.sender,
                Amount: Number(transaction.amount),
                Reciever: transaction.receiver,
                Purpose: transaction.purpose,
                Transaction: transaction.type
                // UserID is not added here on purpose:
                // Supabase fills it in automatically with auth.uid().
            });

            if (error) throw error;

            // STEP 5: Close the modal and refresh the table
            setButtonLoading(saveButton, false);
            closeModal();

            loadTransactions(tableBody, userId).catch(function (loadError) {
                logError("RELOAD TRANSACTIONS", loadError);
            });

            await showMessage("success", "Transaction saved", "Your transaction was added to your records.");

        } catch (error) {

            logError("SAVE TRANSACTION", error);

            setButtonLoading(saveButton, false);
            await showFormProblem(getSaveProblem(error));

        }

    });

}

function setupLoanPaymentModal(userId, afterPayment) {

    const modal = document.getElementById("loanPaymentModal");
    const form = document.getElementById("loanPaymentForm");
    if (!modal || !form) return { open: function () {} };

    const dateInput = document.getElementById("loanPaymentDate");
    const todayToggle = document.getElementById("loanPaymentTodayToggle");
    const dateHint = document.getElementById("loanPaymentDateHint");
    const accountSelect = document.getElementById("payInAccount");
    const loanSelect = document.getElementById("paymentLoanSelect");
    const monthGroup = document.getElementById("paymentMonthGroup");
    const monthSelect = document.getElementById("paymentMonthSelect");
    const amountInput = document.getElementById("loanPaymentAmount");
    const autoToggle = document.getElementById("autoPaymentToggle");
    const balanceInput = document.getElementById("paymentLoanBalance");
    const amountHint = document.getElementById("paymentAmountHint");
    const submitButton = document.getElementById("proceedLoanPayment");
    const adjustmentInput = document.getElementById("loanAdjustment");
    let loans = [];
    let schedules = [];
    let payments = [];
    let accounts = [];

    function cents(value) {
        return Math.round(Number(value) * 100);
    }

    function paymentTotal(loanId) {
        return payments.filter(payment => payment.LoanID === loanId)
            .reduce((sum, payment) => sum + cents(payment.Amount), 0);
    }

    function loanRemainingCents(loan) {
        return Math.max(0, cents(loan.OriginalAmount) - paymentTotal(loan.LoanID));
    }

    function schedulePaidCents(scheduleId) {
        return payments.filter(payment => payment.ScheduleID === scheduleId)
            .reduce((sum, payment) => sum + cents(payment.Amount), 0);
    }

    function scheduleRemainingCents(schedule) {
        return Math.max(0, cents(schedule.AmountDue) - schedulePaidCents(schedule.ScheduleID));
    }

    function hasMonthlySchedule(loan) {
        return loan.MonthlyRequired === true
            || (loan.MonthlyRequired == null && schedules.some(schedule => schedule.LoanID === loan.LoanID));
    }

    function selectedLoan() {
        return loans.find(loan => loan.LoanID === loanSelect.value) || null;
    }

    function selectedSchedule() {
        return schedules.find(schedule => schedule.ScheduleID === monthSelect.value) || null;
    }

    function updatePaymentDate() {
        if (todayToggle.checked) {
            dateInput.value = getTodayDate();
            dateInput.disabled = true;
            dateHint.textContent = "Using today's date.";
        } else {
            dateInput.disabled = false;
            dateHint.textContent = "Pick the actual date of this payment.";
            dateInput.focus();
        }
    }

    function populateAccounts() {
        accountSelect.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = accounts.length ? "Select an account" : "Add a bank or e-wallet first";
        accountSelect.appendChild(placeholder);
        accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.BankAccountID;
            option.textContent = `${account.Name} (${formatPeso(account.Balance)})`;
            accountSelect.appendChild(option);
        });
        accountSelect.disabled = accounts.length === 0;
    }

    function populateLoans(selectedId) {
        loanSelect.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = loans.length ? "Select a loan" : "No loans available";
        loanSelect.appendChild(placeholder);
        loans.forEach(loan => {
            const option = document.createElement("option");
            option.value = loan.LoanID;
            const monthlyAmount = Number(loan.MonthlyAmount);
            const monthlyText = Number.isFinite(monthlyAmount) && monthlyAmount > 0
                ? `${formatPeso(monthlyAmount)}/month`
                : "No fixed monthly amount";
            option.textContent = `${loan.Name} – ${monthlyText}`;
            option.disabled = loan.Status !== "active" || loanRemainingCents(loan) <= 0;
            loanSelect.appendChild(option);
        });
        loanSelect.disabled = loans.length === 0;
        if (selectedId && loans.some(loan => loan.LoanID === selectedId)) {
            loanSelect.value = selectedId;
        }
    }

    function populateMonths(loan, requestedScheduleId) {
        monthSelect.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select a month";
        monthSelect.appendChild(placeholder);
        const loanSchedules = schedules.filter(schedule => schedule.LoanID === loan.LoanID)
            .sort((a, b) => a.DueDate.localeCompare(b.DueDate));
        loanSchedules.forEach(schedule => {
            const remaining = scheduleRemainingCents(schedule);
            const option = document.createElement("option");
            option.value = schedule.ScheduleID;
            const dueDate = new Date(`${schedule.DueDate}T00:00:00`);
            const label = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(dueDate);
            option.textContent = `${label} – due ${formatDate(schedule.DueDate)} – remaining ${formatPeso(remaining / 100)}${remaining === 0 ? " (Paid)" : ""}`;
            option.disabled = remaining === 0;
            monthSelect.appendChild(option);
        });

        if (requestedScheduleId && loanSchedules.some(schedule => schedule.ScheduleID === requestedScheduleId
            && scheduleRemainingCents(schedule) > 0)) {
            monthSelect.value = requestedScheduleId;
        } else {
            const firstAvailable = loanSchedules.find(schedule => scheduleRemainingCents(schedule) > 0);
            if (firstAvailable) monthSelect.value = firstAvailable.ScheduleID;
        }
    }

    function updatePaymentFields() {
        const loan = selectedLoan();
        const remainingLoan = loan ? loanRemainingCents(loan) : 0;
        balanceInput.value = loan ? formatPeso(remainingLoan / 100) : "";
        adjustmentInput.value = formatPeso(0);

        if (!loan) {
            monthGroup.hidden = false;
            monthSelect.disabled = true;
            autoToggle.checked = false;
            autoToggle.disabled = true;
            amountInput.readOnly = false;
            amountInput.value = "";
            amountInput.removeAttribute("max");
            amountHint.textContent = "Select a loan to continue.";
            return;
        }

        const monthly = hasMonthlySchedule(loan);
        monthGroup.hidden = !monthly;
        monthSelect.disabled = !monthly;
        if (!monthly) {
            monthSelect.value = "";
            autoToggle.checked = false;
            autoToggle.disabled = true;
            amountInput.readOnly = false;
            amountInput.max = (remainingLoan / 100).toFixed(2);
            if (!amountInput.value || amountInput.readOnly) amountInput.value = "";
            amountHint.textContent = `Manual payment. Maximum available loan balance: ${formatPeso(remainingLoan / 100)}.`;
            return;
        }

        const schedule = selectedSchedule();
        const remainingInstallment = schedule ? scheduleRemainingCents(schedule) : 0;
        autoToggle.disabled = !schedule;
        amountInput.readOnly = autoToggle.checked;
        if (autoToggle.checked && schedule) {
            amountInput.value = (Math.min(remainingInstallment, remainingLoan) / 100).toFixed(2);
        } else if (!schedule) {
            amountInput.value = "";
        }
        const maxAmount = schedule ? Math.min(remainingInstallment, remainingLoan) : 0;
        if (schedule) amountInput.max = (maxAmount / 100).toFixed(2);
        else amountInput.removeAttribute("max");
        amountHint.textContent = schedule
            ? `Remaining installment: ${formatPeso(remainingInstallment / 100)}.`
            : "Select an unpaid payment month.";
    }

    async function loadPaymentData() {
        const results = await Promise.all([
            db.from("Loans").select("LoanID,Name,Vendor,OriginalAmount,MonthlyAmount,DateOfLoan,DueDay,DurationMonths,MonthlyRequired,Status").eq("UserID", userId),
            db.from("LoanPaymentSchedules").select("ScheduleID,LoanID,PeriodNumber,DueDate,AmountDue").eq("UserID", userId),
            db.from("LoanPayments").select("PaymentID,LoanID,ScheduleID,BankAccountID,Amount,PaymentDate,MonthOfPayment,Adjustment").eq("UserID", userId),
            db.from("BankAccounts").select("BankAccountID,Name,Balance").eq("UserID", userId).order("Name")
        ]);
        for (const result of results) if (result.error) throw result.error;
        loans = results[0].data || [];
        schedules = results[1].data || [];
        payments = results[2].data || [];
        accounts = results[3].data || [];
        populateAccounts();
        populateLoans(loanSelect.value);
        updatePaymentFields();
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("no-scroll");
        const focusTarget = document.getElementById("addTransactionBtn") || document.getElementById("addLoanButton");
        if (focusTarget) focusTarget.focus();
    }

    async function open(loanId, scheduleId) {
        form.reset();
        todayToggle.checked = true;
        autoToggle.checked = false;
        dateInput.disabled = true;
        updatePaymentDate();
        monthGroup.hidden = false;
        modal.hidden = false;
        document.body.classList.add("no-scroll");
        submitButton.disabled = true;
        try {
            await loadPaymentData();
            populateLoans(loanId || "");
            const loan = selectedLoan();
            autoToggle.checked = Boolean(loan && hasMonthlySchedule(loan));
            if (loan && hasMonthlySchedule(loan)) populateMonths(loan, scheduleId);
            updatePaymentFields();
            adjustmentInput.value = formatPeso(0);
            submitButton.disabled = false;
            loanSelect.focus();
        } catch (error) {
            logError("LOAD LOAN PAYMENT OPTIONS", error);
            close();
            await showMessage("error", "Unable to load payment options", error.message || "Refresh the page and try again.");
        }
    }

    document.getElementById("closeLoanPayment").addEventListener("click", close);
    document.getElementById("cancelLoanPayment").addEventListener("click", close);
    todayToggle.addEventListener("change", updatePaymentDate);
    loanSelect.addEventListener("change", function () {
        const loan = selectedLoan();
        autoToggle.checked = Boolean(loan && hasMonthlySchedule(loan));
        if (loan && hasMonthlySchedule(loan)) populateMonths(loan);
        else {
            monthSelect.replaceChildren();
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Not applicable";
            monthSelect.appendChild(option);
        }
        amountInput.value = "";
        updatePaymentFields();
    });
    monthSelect.addEventListener("change", updatePaymentFields);
    autoToggle.addEventListener("change", updatePaymentFields);
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !modal.hidden && !isMessageOpen()) close();
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const loan = selectedLoan();
        const schedule = loan && hasMonthlySchedule(loan) ? selectedSchedule() : null;
        const account = accounts.find(item => item.BankAccountID === accountSelect.value);
        const amount = Number(amountInput.value);
        const amountCents = Math.round(amount * 100);
        const paymentDate = dateInput.value;
        const dateParts = paymentDate.split("-").map(Number);
        const parsedDate = dateParts.length === 3 && dateParts.every(Number.isInteger)
            ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]))
            : null;
        const validDate = parsedDate && Number.isFinite(parsedDate.getTime())
            && parsedDate.toISOString().slice(0, 10) === paymentDate;

        if (!validDate || (todayToggle.checked && paymentDate !== getTodayDate())) {
            await showFormProblem({ fieldId: "loanPaymentDate", title: "Invalid payment date", message: "Choose a valid payment date." }, "warning");
            return;
        }
        if (!account) {
            await showFormProblem({ fieldId: "payInAccount", title: "Payment account required", message: "Select one of your bank or e-wallet accounts." }, "warning");
            return;
        }
        if (!loan || loan.Status !== "active" || loanRemainingCents(loan) <= 0) {
            await showFormProblem({ fieldId: "paymentLoanSelect", title: "Loan unavailable", message: "Select an active loan with a remaining balance." }, "warning");
            return;
        }
        if (hasMonthlySchedule(loan) && !schedule) {
            await showFormProblem({ fieldId: "paymentMonthSelect", title: "Payment month required", message: "Select an unpaid or partially paid installment." }, "warning");
            return;
        }
        if (!Number.isFinite(amount) || amountCents <= 0 || Math.abs(amount * 100 - amountCents) > 0.000001) {
            await showFormProblem({ fieldId: "loanPaymentAmount", title: "Invalid amount", message: "Enter an amount greater than zero with no more than two decimal places." }, "warning");
            return;
        }
        const limitCents = schedule
            ? Math.min(scheduleRemainingCents(schedule), loanRemainingCents(loan))
            : loanRemainingCents(loan);
        if (amountCents > limitCents) {
            await showFormProblem({ fieldId: "loanPaymentAmount", title: "Amount exceeds the balance", message: `The maximum payment for this selection is ${formatPeso(limitCents / 100)}.` }, "warning");
            return;
        }
        if (amountCents > cents(account.Balance)) {
            await showFormProblem({ fieldId: "payInAccount", title: "Insufficient account balance", message: "Choose an account with enough available funds." }, "warning");
            return;
        }

        setButtonLoading(submitButton, true, "Processing...");
        try {
            const { data: authData, error: authError } = await db.auth.getUser();
            if (authError || authData.user?.id !== userId) throw new Error("Your login session changed. Please sign in again.");
            const { error } = await db.rpc("record_loan_payment", {
                p_loan_id: loan.LoanID,
                p_schedule_id: schedule ? schedule.ScheduleID : null,
                p_bank_account_id: account.BankAccountID,
                p_amount: amountCents / 100,
                p_payment_date: paymentDate
            });
            if (error) throw error;

            setButtonLoading(submitButton, false);
            close();
            let refreshed = true;
            try {
                await loadPaymentData();
                if (typeof afterPayment === "function") await afterPayment();
            } catch (refreshError) {
                refreshed = false;
                logError("REFRESH AFTER LOAN PAYMENT", refreshError);
            }
            await showMessage("success", "Payment recorded", refreshed
                ? "Your loan payment, account balance, and transaction have been updated."
                : "The payment was saved, but some page data could not refresh. Refresh the page to reload it.");
        } catch (error) {
            logError("RECORD LOAN PAYMENT", error);
            setButtonLoading(submitButton, false);
            await showMessage("error", "Payment not recorded", error.message || "The payment could not be saved.");
        }
    });

    return { open: open };

}

// -----------------------------------------------------
// 6H. Start the dashboard
// -----------------------------------------------------

async function setupDashboard() {

    const tableBody = document.getElementById("transactionTableBody");

    // Not on the dashboard page
    if (!tableBody) return;

    // These work even before the data loads
    setupSidebar();
    setupLogout();

    try {

        // Only logged-in users can see the dashboard
        const { data, error } = await db.auth.getSession();

        if (error) throw error;

        if (!data.session) {
            window.location.replace("index.html");
            return;
        }

        const user = data.session.user;

        showUserInfo(user);
        const loanPayment = setupLoanPaymentModal(user.id, function () {
            return loadTransactions(tableBody, user.id);
        });
        setupTransactionModal(tableBody, user.id, loanPayment.open);

        await loadTransactions(tableBody, user.id);

    } catch (error) {

        logError("DASHBOARD", error);
        showTableMessage(tableBody, "Failed to load transactions. Refresh the page to try again.");

    }

}

// -----------------------------------------------------
// 6I. Banks & e-wallets page
// -----------------------------------------------------

async function setupBanksPage() {

    const content = document.getElementById("banksContent");
    if (!content) return;

    setupSidebar();
    setupLogout();

    const { data, error } = await db.auth.getSession();
    if (error) {
        logError("BANKS SESSION", error);
        content.textContent = "Unable to load your accounts. Refresh the page to try again.";
        return;
    }

    if (!data.session) {
        window.location.replace("index.html");
        return;
    }

    const user = data.session.user;
    showUserInfo(user);

    const storageKey = `isave-bank-accounts:${user.id}`;
    const migratedKey = `${storageKey}:migrated`;
    const nameInput = document.getElementById("bankName");
    const balanceInput = document.getElementById("bankBalance");
    const modal = document.getElementById("bankModal");
    const form = document.getElementById("bankForm");
    const addButton = document.getElementById("addBankButton");
    const closeButton = document.getElementById("closeBankModal");
    const cancelButton = document.getElementById("cancelBank");
    const totalBalance = document.getElementById("totalBalance");

    async function renderAccounts() {
        const { data: accounts, error: accountError } = await db.from("BankAccounts")
            .select("BankAccountID,Name,Balance").eq("UserID", user.id).order("Name");
        if (accountError) throw accountError;
        const total = accounts.reduce(function (sum, account) { return sum + Number(account.Balance); }, 0);
        if (totalBalance) totalBalance.textContent = formatPeso(total);
        content.replaceChildren();

        if (accounts.length === 0) {
            const empty = document.createElement("div");
            empty.className = "banks-empty-state";
            empty.innerHTML = '<div class="banks-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18M5 10V7l7-4 7 4v3M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18"/></svg></div><h4>No E-Wallets Yet</h4><p>Add your banks and e-wallets to easily view and manage your available balances in one place.</p>';
            content.appendChild(empty);
            return;
        }

        const grid = document.createElement("div");
        grid.className = "banks-grid";
        accounts.forEach(function (account) {
            const card = document.createElement("article");
            card.className = "bank-card";
            const name = document.createElement("h4");
            name.className = "bank-name";
            name.textContent = account.Name;
            const label = document.createElement("p");
            label.className = "bank-balance-label";
            label.textContent = "Available balance";
            const balance = document.createElement("p");
            balance.className = "bank-balance";
            balance.textContent = formatPeso(Number(account.Balance));
            card.append(name, label, balance);
            grid.appendChild(card);
        });
        content.appendChild(grid);
    }

    function formatPeso(amount) {
        return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("no-scroll");
        addButton.focus();
    }

    addButton.addEventListener("click", function () {
        form.reset();
        modal.hidden = false;
        document.body.classList.add("no-scroll");
        nameInput.focus();
    });
    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !modal.hidden && !isMessageOpen()) closeModal();
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name = nameInput.value.trim();
        const balance = Number(balanceInput.value);
        if (!name || !Number.isFinite(balance) || balance < 0) {
            await showMessage("warning", "Check account details", "Enter an account name and a valid balance of zero or more.");
            return;
        }

        try {
            const { error: saveError } = await db.from("BankAccounts").insert({ Name: name, Balance: balance });
            if (saveError) throw saveError;
            closeModal();
            await renderAccounts();
        } catch (saveError) {
            logError("SAVE BANK ACCOUNT", saveError);
            await showMessage("error", "Account not saved", saveError.message || "The account could not be saved.");
        }
    });

    try {
        // Move this browser's legacy accounts once, preserving their balances.
        if (!localStorage.getItem(migratedKey)) {
            const legacy = JSON.parse(localStorage.getItem(storageKey) || "[]");
            if (Array.isArray(legacy) && legacy.length) {
                const { error: migrationError } = await db.from("BankAccounts").insert(legacy.filter(account => account && typeof account.name === "string" && Number.isFinite(Number(account.balance)) && Number(account.balance) >= 0).map(account => ({ Name: account.name.trim(), Balance: Number(account.balance) })));
                if (migrationError) throw migrationError;
            }
            localStorage.setItem(migratedKey, "true");
        }
        await renderAccounts();
    } catch (loadError) {
        logError("LOAD BANK ACCOUNTS", loadError);
        content.textContent = "Unable to load bank accounts. Apply Database/loans_migration.sql and try again.";
    }
}

// -----------------------------------------------------
// 6J. Add loan modal
// -----------------------------------------------------
function setupAddLoanModal(userId, afterSave) {

    const modal = document.getElementById("addLoanModal");
    const form = document.getElementById("addLoanForm");
    const openButton = document.getElementById("addLoanButton");
    if (!modal || !form || !openButton) return;

    const nameInput = document.getElementById("newLoanName");
    const vendorInput = document.getElementById("newLoanVendor");
    const amountInput = document.getElementById("newLoanAmount");
    const interestRateInput = document.getElementById("newLoanInterestRate");
    const monthlyAmountInput = document.getElementById("newLoanMonthlyAmount");
    const loanDateInput = document.getElementById("newLoanDate");
    const durationInput = document.getElementById("newLoanDuration");
    const monthlyRequiredInput = document.getElementById("newLoanMonthlyRequired");
    const saveButton = document.getElementById("saveLoanButton");

    function updateMonthlyAmount() {
        const amount = Number(amountInput.value);
        const rate = Number(interestRateInput.value);
        const months = Number(durationInput.value);
        if (!amountInput.value || !interestRateInput.value || !durationInput.value
            || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate < 0
            || !Number.isInteger(months) || months <= 0) {
            monthlyAmountInput.value = "";
            return;
        }
        const monthlyInterest = amount * (rate / 100);
        const totalLoan = amount + monthlyInterest * months;
        monthlyAmountInput.value = (Math.round((totalLoan / months) * 100) / 100).toFixed(2);
    }

    function updateMonthlyRequirement() {
        monthlyAmountInput.required = monthlyRequiredInput.value === "yes";
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("no-scroll");
        openButton.focus();
    }

    openButton.addEventListener("click", function () {
        form.reset();
        monthlyRequiredInput.value = "yes";
        interestRateInput.value = "0";
        updateMonthlyAmount();
        updateMonthlyRequirement();
        modal.hidden = false;
        document.body.classList.add("no-scroll");
        nameInput.focus();
    });
    document.getElementById("closeAddLoan").addEventListener("click", closeModal);
    document.getElementById("cancelAddLoan").addEventListener("click", closeModal);
    monthlyRequiredInput.addEventListener("change", updateMonthlyRequirement);
    [amountInput, interestRateInput, durationInput].forEach(input => input.addEventListener("input", updateMonthlyAmount));
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !modal.hidden && !isMessageOpen()) closeModal();
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name = nameInput.value.trim();
        const vendor = vendorInput.value.trim();
        const originalAmount = Number(amountInput.value);
        const interestRate = Number(interestRateInput.value);
        const monthlyRequired = monthlyRequiredInput.value === "yes";
        updateMonthlyAmount();
        const monthlyAmountValue = monthlyAmountInput.value.trim();
        const monthlyAmount = monthlyAmountValue ? Number(monthlyAmountValue) : null;
        const duration = Number(durationInput.value);
        const dateParts = loanDateInput.value.split("-").map(Number);
        const parsedDate = dateParts.length === 3 && dateParts.every(Number.isInteger)
            ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]))
            : null;
        const dateIsValid = parsedDate && Number.isFinite(parsedDate.getTime())
            && parsedDate.toISOString().slice(0, 10) === loanDateInput.value;

        if (!name || !vendor) {
            await showFormProblem({ fieldId: !name ? "newLoanName" : "newLoanVendor", title: "Missing information", message: "Enter the loan name and lender/vendor." }, "warning");
            return;
        }
        if (!Number.isFinite(originalAmount) || originalAmount <= 0 || Math.abs(originalAmount * 100 - Math.round(originalAmount * 100)) > 0.000001) {
            await showFormProblem({ fieldId: "newLoanAmount", title: "Invalid loan amount", message: "Enter an amount greater than zero with no more than two decimal places." }, "warning");
            return;
        }
        if (!interestRateInput.value || !Number.isFinite(interestRate) || interestRate < 0) {
            await showFormProblem({ fieldId: "newLoanInterestRate", title: "Invalid interest rate", message: "Enter an interest rate of zero or greater." }, "warning");
            return;
        }
        if (monthlyRequired && (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0
            || Math.abs(monthlyAmount * 100 - Math.round(monthlyAmount * 100)) > 0.000001)) {
            await showFormProblem({ fieldId: "newLoanMonthlyAmount", title: "Invalid monthly amount", message: "Enter a monthly amount greater than zero with no more than two decimal places." }, "warning");
            return;
        }
        if (!monthlyRequired && monthlyAmount !== null && (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0
            || Math.abs(monthlyAmount * 100 - Math.round(monthlyAmount * 100)) > 0.000001)) {
            await showFormProblem({ fieldId: "newLoanMonthlyAmount", title: "Invalid monthly amount", message: "Leave this blank or enter a positive amount with no more than two decimal places." }, "warning");
            return;
        }
        if (!Number.isInteger(duration) || duration <= 0) {
            await showFormProblem({ fieldId: "newLoanDuration", title: "Invalid loan duration", message: "Enter a positive whole number of months." }, "warning");
            return;
        }
        if (!dateIsValid || loanDateInput.value > getTodayDate()) {
            await showFormProblem({ fieldId: "newLoanDate", title: "Invalid loan date", message: "Enter a valid date of loan that is today or earlier." }, "warning");
            return;
        }

        setButtonLoading(saveButton, true, "Saving...");
        try {
            const { data: authData, error: authError } = await db.auth.getUser();
            if (authError || authData.user?.id !== userId) throw new Error("Your login session changed. Please sign in again.");
            const { error } = await db.rpc("create_loan_with_schedule", {
                p_name: name,
                p_original_amount: Math.round(originalAmount * 100) / 100,
                p_monthly_amount: monthlyRequired ? Math.round(monthlyAmount * 100) / 100 : monthlyAmount,
                p_vendor: vendor,
                p_date_of_loan: loanDateInput.value,
                p_duration_months: duration,
                p_monthly_required: monthlyRequired
            });
            if (error) throw error;

            setButtonLoading(saveButton, false);
            closeModal();
            form.reset();
            monthlyRequiredInput.value = "yes";
            updateMonthlyRequirement();
            let refreshed = true;
            try {
                if (typeof afterSave === "function") await afterSave();
            } catch (refreshError) {
                refreshed = false;
                logError("REFRESH AFTER LOAN SAVE", refreshError);
            }
            await showMessage("success", "Loan saved", refreshed
                ? "Your loan and applicable payment schedule have been saved."
                : "Your loan was saved, but the list could not refresh. Refresh the page to reload it.");
        } catch (error) {
            logError("SAVE LOAN", error);
            setButtonLoading(saveButton, false);
            await showMessage("error", "Loan not saved", error.message || "The loan could not be saved.");
        }
    });

}

// -----------------------------------------------------
// 6K. Loans page
// -----------------------------------------------------
async function setupLoansPage() {

    const loanCards = document.getElementById("loanCards");
    if (!loanCards) return;

    setupSidebar();
    setupLogout();

    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) {
        window.location.replace("index.html");
        return;
    }

    const user = sessionData.session.user;
    showUserInfo(user);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const monthLabel = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(monthStart);
    document.getElementById("loanMonthLabel").textContent = monthLabel;
    document.getElementById("scheduleTitle").textContent = `Due Date for the Month of ${monthLabel}`;

    let loans = [];
    let schedules = [];
    let payments = [];

    function cents(value) { return Math.round(Number(value) * 100); }
    function money(value) { return formatPeso(Math.max(0, Number(value) || 0)); }
    function schedulePaidCents(scheduleId) {
        return payments.filter(payment => payment.ScheduleID === scheduleId)
            .reduce((sum, payment) => sum + cents(payment.Amount), 0);
    }
    function loanPaidCents(loanId) {
        return payments.filter(payment => payment.LoanID === loanId)
            .reduce((sum, payment) => sum + cents(payment.Amount), 0);
    }
    function scheduleRemainingCents(schedule) {
        return Math.max(0, cents(schedule.AmountDue) - schedulePaidCents(schedule.ScheduleID));
    }
    function loanRemainingCents(loan) {
        return Math.max(0, cents(loan.OriginalAmount) - loanPaidCents(loan.LoanID));
    }
    function paymentStatus(schedule) {
        const remaining = scheduleRemainingCents(schedule);
        if (remaining === 0) return "Paid";
        return remaining < cents(schedule.AmountDue) ? "Partially paid" : "Unpaid";
    }

    function renderDueSchedules() {
        const holder = document.getElementById("dueSchedules");
        holder.replaceChildren();
        const monthSchedules = schedules.filter(schedule => {
            const loan = loans.find(item => item.LoanID === schedule.LoanID);
            return loan && loan.Status === "active" && loanRemainingCents(loan) > 0
                && schedule.DueDate >= dateKey(monthStart) && schedule.DueDate < dateKey(nextMonth);
        })
            .sort((a, b) => a.DueDate.localeCompare(b.DueDate));
        if (!monthSchedules.length) {
            const empty = document.createElement("p");
            empty.className = "loan-empty";
            empty.textContent = "No payment schedules are due this month.";
            holder.appendChild(empty);
            return;
        }
        monthSchedules.forEach(schedule => {
            const loan = loans.find(item => item.LoanID === schedule.LoanID);
            if (!loan) return;
            const remaining = scheduleRemainingCents(schedule);
            const row = document.createElement("article");
            row.className = "due-schedule-row";
            const details = document.createElement("div");
            details.className = "due-schedule-details";
            const due = document.createElement("strong");
            due.textContent = formatDate(schedule.DueDate);
            const name = document.createElement("span");
            name.className = "due-loan-name";
            name.textContent = loan.Name;
            const vendor = document.createElement("small");
            vendor.textContent = `Vendor: ${loan.Vendor}`;
            details.append(due, name, vendor);
            const amount = document.createElement("div");
            amount.className = "due-schedule-amount";
            const value = document.createElement("strong");
            value.textContent = money(remaining / 100);
            const status = document.createElement("small");
            status.textContent = paymentStatus(schedule);
            amount.append(value, status);
            row.append(details, amount);
            if (remaining > 0 && loan.Status === "active" && loanRemainingCents(loan) > 0) {
                const pay = document.createElement("button");
                pay.type = "button";
                pay.className = "button button-primary due-pay-button";
                pay.textContent = "Pay";
                pay.addEventListener("click", () => loanPayment.open(loan.LoanID, schedule.ScheduleID));
                row.appendChild(pay);
            }
            holder.appendChild(row);
        });
    }

    function renderLoanCards() {
        loanCards.replaceChildren();
        const orderedLoans = loans.slice().sort((a, b) => String(a.Name).localeCompare(String(b.Name)));
        const activeCount = orderedLoans.filter(loan => loan.Status === "active" && loanRemainingCents(loan) > 0).length;
        document.getElementById("loanListCount").textContent = `${orderedLoans.length} ${orderedLoans.length === 1 ? "loan" : "loans"}`;
        if (!orderedLoans.length) {
            const empty = document.createElement("div");
            empty.className = "loan-empty";
            empty.textContent = "You don't have any loans yet. Add a loan to get started.";
            loanCards.appendChild(empty);
            return;
        }
        orderedLoans.forEach(loan => {
            const originalCents = cents(loan.OriginalAmount);
            const paidCents = loanPaidCents(loan.LoanID);
            const remainingCents = loanRemainingCents(loan);
            const percent = originalCents > 0 ? Math.max(0, Math.min(100, paidCents / originalCents * 100)) : 0;
            const card = document.createElement("article");
            card.className = "loan-card";
            const header = document.createElement("div");
            header.className = "loan-card-heading";
            const title = document.createElement("h4");
            title.textContent = loan.Name;
            const status = document.createElement("span");
            status.className = "loan-type-pill";
            status.textContent = loan.Status === "active" && remainingCents > 0 ? "Active" : "Closed";
            header.append(title, status);
            const vendor = document.createElement("p");
            vendor.className = "loan-vendor";
            vendor.textContent = `Vendor: ${loan.Vendor}`;
            const label = document.createElement("small");
            label.className = "loan-balance-label";
            label.textContent = "Remaining balance";
            const balance = document.createElement("strong");
            balance.className = "loan-balance-value";
            balance.textContent = money(remainingCents / 100);
            const track = document.createElement("div");
            track.className = "progress-track";
            track.setAttribute("role", "progressbar");
            track.setAttribute("aria-label", `${loan.Name} payment progress`);
            track.setAttribute("aria-valuemin", "0");
            track.setAttribute("aria-valuemax", "100");
            track.setAttribute("aria-valuenow", percent.toFixed(1));
            const fill = document.createElement("div");
            fill.className = "progress-fill";
            fill.style.width = `${percent}%`;
            track.appendChild(fill);
            const percentLabel = document.createElement("p");
            percentLabel.className = "loan-percent-label";
            percentLabel.textContent = `${percent.toFixed(1)}% paid`;
            const amounts = document.createElement("div");
            amounts.className = "loan-card-amounts";
            const paidText = document.createElement("span");
            paidText.textContent = `Paid: ${money(paidCents / 100)}`;
            const originalText = document.createElement("span");
            originalText.textContent = `Original: ${money(originalCents / 100)}`;
            const monthlyAmount = Number(loan.MonthlyAmount);
            const monthlyText = document.createElement("span");
            monthlyText.textContent = monthlyAmount > 0 ? `Monthly: ${money(monthlyAmount)}` : "No fixed monthly amount";
            amounts.append(paidText, originalText, monthlyText);
            card.append(header, vendor, label, balance, track, percentLabel, amounts);
            if (loan.Status === "active" && remainingCents > 0) {
                const pay = document.createElement("button");
                pay.type = "button";
                pay.className = "button button-secondary loan-card-pay";
                pay.textContent = "Pay Loan";
                pay.addEventListener("click", () => loanPayment.open(loan.LoanID));
                card.appendChild(pay);
            }
            loanCards.appendChild(card);
        });
        document.getElementById("activeLoanCount").textContent = `${activeCount} active ${activeCount === 1 ? "loan" : "loans"}`;
    }

    function renderSummary() {
        const nowKey = dateKey(new Date());
        const activeSchedule = schedule => {
            const loan = loans.find(item => item.LoanID === schedule.LoanID);
            return loan && loan.Status === "active" && loanRemainingCents(loan) > 0;
        };
        const thisMonth = schedules.filter(schedule => activeSchedule(schedule)
            && schedule.DueDate >= dateKey(monthStart) && schedule.DueDate < dateKey(nextMonth));
        const totalDueCents = thisMonth.reduce((sum, schedule) => sum + cents(schedule.AmountDue), 0);
        const amountPaidCents = thisMonth.reduce((sum, schedule) => sum + Math.min(cents(schedule.AmountDue), schedulePaidCents(schedule.ScheduleID)), 0);
        const overdueCents = schedules.filter(schedule => activeSchedule(schedule) && schedule.DueDate < nowKey)
            .reduce((sum, schedule) => sum + scheduleRemainingCents(schedule), 0);
        const outstandingCents = loans.filter(loan => loan.Status === "active")
            .reduce((sum, loan) => sum + loanRemainingCents(loan), 0);
        const paidAllCents = payments.reduce((sum, payment) => sum + cents(payment.Amount), 0);
        const progress = totalDueCents > 0 ? Math.max(0, Math.min(100, amountPaidCents / totalDueCents * 100)) : 0;
        document.getElementById("loanOutstanding").textContent = money(outstandingCents / 100);
        document.getElementById("loanDueMonth").textContent = money(totalDueCents / 100);
        document.getElementById("loanDueCount").textContent = `${thisMonth.length} ${thisMonth.length === 1 ? "installment" : "installments"} due this month`;
        document.getElementById("loanTotalPaid").textContent = money(paidAllCents / 100);
        document.getElementById("loanOverdue").textContent = money(overdueCents / 100);
        document.getElementById("monthPaid").textContent = money(amountPaidCents / 100);
        document.getElementById("monthScheduled").textContent = money(totalDueCents / 100);
        document.getElementById("monthProgressBar").style.width = `${progress}%`;
        document.getElementById("monthProgressTrack").setAttribute("aria-valuenow", progress.toFixed(1));
        document.getElementById("monthProgressText").textContent = totalDueCents > 0 ? `${progress.toFixed(0)}% paid for this month` : "No payments due this month";
    }

    async function refreshLoans() {
        const [loanResult, scheduleResult, paymentResult] = await Promise.all([
            db.from("Loans").select("LoanID,Name,Type,Vendor,OriginalAmount,MonthlyAmount,DateOfLoan,DueDay,DurationMonths,MonthlyRequired,Status").eq("UserID", user.id),
            db.from("LoanPaymentSchedules").select("ScheduleID,LoanID,PeriodNumber,DueDate,AmountDue").eq("UserID", user.id),
            db.from("LoanPayments").select("PaymentID,LoanID,ScheduleID,Amount,PaymentDate,MonthOfPayment,Adjustment").eq("UserID", user.id)
        ]);
        for (const result of [loanResult, scheduleResult, paymentResult]) if (result.error) throw result.error;
        loans = loanResult.data || [];
        schedules = scheduleResult.data || [];
        payments = paymentResult.data || [];
        renderSummary();
        renderDueSchedules();
        renderLoanCards();
    }

    const loanPayment = setupLoanPaymentModal(user.id, refreshLoans);
    setupAddLoanModal(user.id, refreshLoans);
    document.getElementById("toggleDueSchedules").addEventListener("click", event => {
        const panel = document.getElementById("dueSchedules");
        panel.hidden = !panel.hidden;
        event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden));
        event.currentTarget.textContent = panel.hidden ? "View" : "Hide";
    });
    loanCards.textContent = "Loading your loans...";
    try {
        await refreshLoans();
    } catch (error) {
        logError("LOAD LOANS", error);
        loanCards.textContent = "Unable to load loan data. Apply Database/loans_migration.sql and check your Supabase policies.";
    }

}


// =====================================================
// 7. START THE APP
// =====================================================
// Runs every setup when the page loads.
// Each setup stops by itself if it's not on its page.

document.addEventListener("DOMContentLoaded", function () {

    setupLogin();
    setupCreateAccount();
    setupDashboard();
    setupBanksPage();
    setupLoansPage();

});
