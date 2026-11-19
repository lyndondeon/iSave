<<<<<<< HEAD
// =====================================================
// iSave - MAIN SCRIPT
// =====================================================
// Laman ng file na ito (sunod-sunod):
//   1. Supabase Setup
//   2. Message Box (kapalit ng alert)
//   3. Helper Functions
//   4. Create Account Page
//   5. Login Page
//   6. Dashboard Page
//   7. Pagsisimula ng App
// =====================================================


// =====================================================
// 1. SUPABASE SETUP
// =====================================================
// Okay lang na makita ang "publishable" key sa browser.
// Ang totoong proteksyon ng data mo ay ang RLS
// (Row Level Security) sa Supabase dashboard.

const SUPABASE_URL = "https://yvmaiuaitwyhkhsxvari.supabase.co";
const SUPABASE_KEY = "sb_publishable_O1BFpAxcpbB_Clh3ragvKQ_Az6Jvviy";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// =====================================================
// 2. MESSAGE BOX (kapalit ng alert)
// =====================================================
// Paano gamitin:
//
//   await showMessage("error", "Title dito", "Message dito");
//
// Mga pwedeng type: "success", "error", "warning", "info"
//
// Dahil may "await", maghihintay muna ang code
// hanggang pindutin ng user ang OK bago tumuloy.
// Hindi mo na kailangang galawin ang HTML mo.
// Kusang idadagdag ng JS ang design ng message box.

const MESSAGE_ICONS = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i"
};

// Idinadagdag ang CSS ng message box sa page (isang beses lang)
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

// Ipinapakita ang message box
function showMessage(type, title, message) {

    addMessageBoxStyles();

    return new Promise(function (resolve) {

        // Gumawa ng background (overlay) at ng box
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

        // textContent ang gamit para ligtas (hindi mababasa bilang HTML)
        overlay.querySelector(".message-title").textContent = title;
        overlay.querySelector(".message-text").textContent = message;

        const okButton = overlay.querySelector(".message-ok");

        // Isasara ang message box
        function closeMessage() {
            document.removeEventListener("keydown", closeOnEscape);
            overlay.remove();
            resolve();
        }

        // Pwede ring isara gamit ang Escape key
        function closeOnEscape(event) {
            if (event.key === "Escape") closeMessage();
        }

        okButton.addEventListener("click", closeMessage);
        document.addEventListener("keydown", closeOnEscape);

        // Pwede ring isara kapag pinindot ang madilim na background
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) closeMessage();
        });

        document.body.appendChild(overlay);
        okButton.focus();

    });

}


// =====================================================
// 3. HELPER FUNCTIONS
// =====================================================

// Ipinapakita ang buong detalye ng error sa Console (F12)
function logError(context, error) {

    console.group(`ERROR: ${context}`);
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Status:", error?.status);
    console.error("Full Error:", error);
    console.groupEnd();

}

// Kinukuha ang value ng input at tinatanggal ang extra spaces
function getValue(inputId) {
    return document.getElementById(inputId).value.trim();
}

// Ilalagay ang cursor sa input na may problema
function focusField(inputId) {

    const input = document.getElementById(inputId);

    if (input) input.focus();

}

// Ipinapakita ang error, tapos ilalagay ang cursor sa tamang input
async function showFormProblem(problem, type = "error") {

    await showMessage(type, problem.title, problem.message);

    if (problem.fieldId) focusField(problem.fieldId);

}

// Nilo-loading / binabalik sa dati ang button
// (sine-save nito ang dating laman ng button para hindi na
//  kailangang ulitin ang HTML ng button sa code)
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

// SHOW / HIDE ng password
function setupPasswordToggle(inputId, buttonId) {

    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (!input || !button) return;

    // Sinusundan ang itsura ng text sa HTML ("Show" o "SHOW")
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


// =====================================================
// 4. CREATE ACCOUNT PAGE
// =====================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// -----------------------------------------------------
// 4A. I-check ang laman ng form bago i-send
// -----------------------------------------------------
// Kapag may mali: magbabalik ng { fieldId, title, message }
// Kapag walang mali: magbabalik ng null

function validateAccount(account) {

    // Hanapin ang unang input na walang laman
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
// 4B. Tingnan kung may gumagamit na ng username
// -----------------------------------------------------

async function isUsernameTaken(username) {

    const { data, error } = await db
        .from("UsersTable")
        .select("Username")
        .eq("Username", username)
        .limit(1);

    if (error) throw error;

    // Kapag may nakuhang kahit isang row, taken na ang username
    return data.length > 0;

}

// -----------------------------------------------------
// 4C. Gawing malinaw na message ang error ni Supabase
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

    // DUPLICATE USERNAME (galing sa database)
    // Kapag nag-fail ang pag-save sa UsersTable (halimbawa dahil
    // unique ang Username), ganito ang sinasabi ni Supabase.
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

    // MAHINANG PASSWORD
    if (code === "weak_password") {

        return {
            fieldId: "password",
            title: "Weak password",
            message:
                "Choose a stronger password. Mix letters, numbers, and symbols."
        };

    }

    // MALING EMAIL ADDRESS
    if (code === "email_address_invalid") {

        return {
            fieldId: "email",
            title: "Invalid email",
            message: "This email address can't be used. Try a different one."
        };

    }

    // SOBRANG DAMING SUBOK
    if (error?.status === 429 || code.includes("rate_limit")) {

        return {
            fieldId: null,
            title: "Too many attempts",
            message: "Wait a few minutes, then try creating your account again."
        };

    }

    // WALANG INTERNET
    if (message.includes("failed to fetch")) {

        return {
            fieldId: null,
            title: "No connection",
            message: "Check your internet connection, then try again."
        };

    }

    // IBA PANG ERROR
    return {
        fieldId: null,
        title: "Account not created",
        message: error?.message || "Something went wrong. Try again."
    };

}

// -----------------------------------------------------
// 4D. Ikabit ang lahat sa Create Account form
// -----------------------------------------------------

function setupCreateAccount() {

    const form = document.getElementById("createAccountForm");
    const createAccountButton = document.getElementById("createAccountButton");

    // Kung wala ang form, ibig sabihin hindi ito ang Create Account page
    if (!form || !createAccountButton) return;

    setupPasswordToggle("password", "togglePassword");
    setupPasswordToggle("confirmPassword", "toggleConfirmPassword");

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // STEP 1: Kunin ang lahat ng laman ng form
        // (ang pangalan ng bawat key ay kapareho ng id ng input)
        const account = {
            firstName: getValue("firstName"),
            lastName: getValue("lastName"),
            age: getValue("age"),
            birthday: getValue("birthday"),
            company: getValue("company"),
            position: getValue("position"),
            username: getValue("username"),
            email: getValue("email"),
            // Hindi tine-trim ang password (pwedeng may space talaga)
            password: document.getElementById("password").value,
            confirmPassword: document.getElementById("confirmPassword").value
        };

        // STEP 2: I-check kung tama ang laman ng form
        const formProblem = validateAccount(account);

        if (formProblem) {
            await showFormProblem(formProblem, "warning");
            return;
        }

        setButtonLoading(createAccountButton, true, "Creating account...");

        try {

            // STEP 3: I-check kung taken na ang username
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

            // STEP 4: I-register ang user sa Supabase
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

            // STEP 5: I-check ang "tagong" duplicate email
            // Kapag naka-ON ang "Confirm email" sa Supabase, HINDI ito
            // nagbibigay ng error kapag existing na ang email.
            // Sa halip, walang laman ang "identities" ng user.
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

            // STEP 6: Success!
            if (data.session) {

                // Naka-OFF ang email confirmation: pwede nang mag-login agad
                await showMessage(
                    "success",
                    "Account created",
                    "Your iSave account is ready. You can now log in."
                );

                window.location.href = "index.html";

            } else {

                // Naka-ON ang email confirmation: kailangan munang i-confirm
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

            // Laging ibabalik sa dati ang button, success man o error
            setButtonLoading(createAccountButton, false);

        }

    });

}


// =====================================================
// 5. LOGIN PAGE
// =====================================================

// -----------------------------------------------------
// 5A. Gawing malinaw na message ang login error
// -----------------------------------------------------
// Magbabalik ng { fieldId, title, message } para sa message box

function getLoginProblem(error) {

    const code = error?.code ?? "";
    const message = (error?.message ?? "").toLowerCase();

    // MALING EMAIL O PASSWORD
    // (Sadyang hindi sinasabi ni Supabase kung alin sa dalawa ang mali,
    //  para hindi malaman ng iba kung may account ang isang email.)
    if (code === "invalid_credentials" || message.includes("invalid login credentials")) {

        return {
            fieldId: "password",
            title: "Incorrect email or password",
            message:
                "The email or password you entered doesn't match any account.\n" +
                "Check both fields, then try again."
        };

    }

    // HINDI PA NA-CONFIRM ANG EMAIL
    if (code === "email_not_confirmed" || message.includes("email not confirmed")) {

        return {
            fieldId: "email",
            title: "Email not confirmed",
            message:
                "Open the confirmation link we sent to your email,\n" +
                "then log in again."
        };

    }

    // SOBRANG DAMING SUBOK
    if (error?.status === 429 || code.includes("rate_limit")) {

        return {
            fieldId: null,
            title: "Too many attempts",
            message: "Wait a few minutes, then try logging in again."
        };

    }

    // WALANG INTERNET
    if (message.includes("failed to fetch")) {

        return {
            fieldId: null,
            title: "No connection",
            message: "Check your internet connection, then try again."
        };

    }

    // IBA PANG ERROR
    return {
        fieldId: null,
        title: "Login failed",
        message: error?.message || "Something went wrong. Try again."
    };

}

// -----------------------------------------------------
// 5B. Ikabit ang lahat sa Login form
// -----------------------------------------------------

function setupLogin() {

    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");

    // Kung wala ang form, ibig sabihin hindi ito ang Login page
    if (!loginForm || !loginButton) return;

    // SHOW / HIDE ng password sa Login page
    setupPasswordToggle("password", "togglePassword");

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // STEP 1: Kunin ang email at password
        const email = getValue("email");
        const password = document.getElementById("password").value;

        // STEP 2: I-check kung may laman
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

            // STEP 3: Mag-login sa Supabase
            const { error } = await db.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // STEP 4: Success, lipat sa Dashboard
            if (loginMessage) loginMessage.textContent = "Login successful. Redirecting...";
            window.location.href = "dashboard.html";

        } catch (error) {

            logError("LOGIN", error);

            // Ibalik muna ang button bago ipakita ang warning
            // (kapag success, hindi na kailangan dahil lilipat na ng page)
            setButtonLoading(loginButton, false);

            await showFormProblem(getLoginProblem(error), "warning");

        }

    });

}


// =====================================================
// 6. DASHBOARD PAGE
// =====================================================

// Mga column ng table.
// key   = pangalan ng column sa Supabase
// label = ipapakita sa user (gamit sa mobile view)
const TRANSACTION_COLUMNS = [
    { key: "id",         label: "ID" },
    { key: "created_at", label: "Logs" },
    { key: "Date",       label: "Date" },
    { key: "Payroll",    label: "Payroll" },
    { key: "Sender",     label: "Sender" },
    { key: "Amount",     label: "Amount" },
    { key: "Reciever",   label: "Receiver" }, // "Reciever" ang spelling sa database mo
    { key: "Purpose",    label: "Purpose/Definition" }
];

// Isang row lang na may message (halimbawa: "No transactions found.")
function showTableMessage(tableBody, text) {

    tableBody.innerHTML = `
        <tr>
            <td colspan="${TRANSACTION_COLUMNS.length}" class="empty-state">${text}</td>
        </tr>
    `;

}

// Kunin ang transactions at ilagay sa table
async function loadTransactions(tableBody) {

    const { data, error } = await db
        .from("Transactions")
        .select("*");

    if (error) throw error;

    if (data.length === 0) {
        showTableMessage(tableBody, "No transactions found.");
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(function (transaction) {

        const row = document.createElement("tr");

        TRANSACTION_COLUMNS.forEach(function (column) {

            const cell = document.createElement("td");

            cell.setAttribute("data-label", column.label);
            cell.textContent = transaction[column.key] ?? "";

            row.appendChild(cell);

        });

        tableBody.appendChild(row);

    });

}

function setupDashboard() {

    const tableBody = document.getElementById("transactionTableBody");

    // Kung wala ang table, ibig sabihin hindi ito ang Dashboard page
    if (!tableBody) return;

    (async function () {

        try {

            // Tingnan kung naka-login ang user
            const { data, error } = await db.auth.getSession();

            if (error) throw error;

            if (!data.session) {
                // Hindi naka-login, ibalik sa Login page
                window.location.replace("index.html");
                return;
            }

            await loadTransactions(tableBody);

        } catch (error) {

            logError("DASHBOARD", error);
            showTableMessage(tableBody, "Failed to load transactions. Refresh the page to try again.");

        }

    })();

}


// =====================================================
// 7. PAGSISIMULA NG APP
// =====================================================
// Pagka-load ng page, patatakbuhin ang lahat ng setup.
// Bawat setup ay kusang hihinto kung wala sa tamang page,
// kaya ligtas itong gamitin sa lahat ng HTML file mo.

document.addEventListener("DOMContentLoaded", function () {

    setupLogin();
    setupCreateAccount();
    setupDashboard();

});
=======
// =====================================================
// iSave - MAIN SCRIPT
// =====================================================
// Laman ng file na ito (sunod-sunod):
//   1. Supabase Setup
//   2. Message Box (kapalit ng alert)
//   3. Helper Functions
//   4. Create Account Page
//   5. Login Page
//   6. Dashboard Page
//   7. Pagsisimula ng App
// =====================================================


// =====================================================
// 1. SUPABASE SETUP
// =====================================================
// Okay lang na makita ang "publishable" key sa browser.
// Ang totoong proteksyon ng data mo ay ang RLS
// (Row Level Security) sa Supabase dashboard.

const SUPABASE_URL = "https://yvmaiuaitwyhkhsxvari.supabase.co";
const SUPABASE_KEY = "sb_publishable_O1BFpAxcpbB_Clh3ragvKQ_Az6Jvviy";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// =====================================================
// 2. MESSAGE BOX (kapalit ng alert)
// =====================================================
// Paano gamitin:
//
//   await showMessage("error", "Title dito", "Message dito");
//
// Mga pwedeng type: "success", "error", "warning", "info"
//
// Dahil may "await", maghihintay muna ang code
// hanggang pindutin ng user ang OK bago tumuloy.
// Hindi mo na kailangang galawin ang HTML mo.
// Kusang idadagdag ng JS ang design ng message box.

const MESSAGE_ICONS = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i"
};

// Idinadagdag ang CSS ng message box sa page (isang beses lang)
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

// Ipinapakita ang message box
function showMessage(type, title, message) {

    addMessageBoxStyles();

    return new Promise(function (resolve) {

        // Gumawa ng background (overlay) at ng box
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

        // textContent ang gamit para ligtas (hindi mababasa bilang HTML)
        overlay.querySelector(".message-title").textContent = title;
        overlay.querySelector(".message-text").textContent = message;

        const okButton = overlay.querySelector(".message-ok");

        // Isasara ang message box
        function closeMessage() {
            document.removeEventListener("keydown", closeOnEscape);
            overlay.remove();
            resolve();
        }

        // Pwede ring isara gamit ang Escape key
        function closeOnEscape(event) {
            if (event.key === "Escape") closeMessage();
        }

        okButton.addEventListener("click", closeMessage);
        document.addEventListener("keydown", closeOnEscape);

        // Pwede ring isara kapag pinindot ang madilim na background
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) closeMessage();
        });

        document.body.appendChild(overlay);
        okButton.focus();

    });

}


// =====================================================
// 3. HELPER FUNCTIONS
// =====================================================

// Ipinapakita ang buong detalye ng error sa Console (F12)
function logError(context, error) {

    console.group(`ERROR: ${context}`);
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Status:", error?.status);
    console.error("Full Error:", error);
    console.groupEnd();

}

// Kinukuha ang value ng input at tinatanggal ang extra spaces
function getValue(inputId) {
    return document.getElementById(inputId).value.trim();
}

// Ilalagay ang cursor sa input na may problema
function focusField(inputId) {

    const input = document.getElementById(inputId);

    if (input) input.focus();

}

// Ipinapakita ang error, tapos ilalagay ang cursor sa tamang input
async function showFormProblem(problem, type = "error") {

    await showMessage(type, problem.title, problem.message);

    if (problem.fieldId) focusField(problem.fieldId);

}

// Nilo-loading / binabalik sa dati ang button
// (sine-save nito ang dating laman ng button para hindi na
//  kailangang ulitin ang HTML ng button sa code)
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

// SHOW / HIDE ng password
function setupPasswordToggle(inputId, buttonId) {

    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (!input || !button) return;

    // Sinusundan ang itsura ng text sa HTML ("Show" o "SHOW")
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


// =====================================================
// 4. CREATE ACCOUNT PAGE
// =====================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// -----------------------------------------------------
// 4A. I-check ang laman ng form bago i-send
// -----------------------------------------------------
// Kapag may mali: magbabalik ng { fieldId, title, message }
// Kapag walang mali: magbabalik ng null

function validateAccount(account) {

    // Hanapin ang unang input na walang laman
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
// 4B. Tingnan kung may gumagamit na ng username
// -----------------------------------------------------

async function isUsernameTaken(username) {

    const { data, error } = await db
        .from("UsersTable")
        .select("Username")
        .eq("Username", username)
        .limit(1);

    if (error) throw error;

    // Kapag may nakuhang kahit isang row, taken na ang username
    return data.length > 0;

}

// -----------------------------------------------------
// 4C. Gawing malinaw na message ang error ni Supabase
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

    // DUPLICATE USERNAME (galing sa database)
    // Kapag nag-fail ang pag-save sa UsersTable (halimbawa dahil
    // unique ang Username), ganito ang sinasabi ni Supabase.
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

    // MAHINANG PASSWORD
    if (code === "weak_password") {

        return {
            fieldId: "password",
            title: "Weak password",
            message:
                "Choose a stronger password. Mix letters, numbers, and symbols."
        };

    }

    // MALING EMAIL ADDRESS
    if (code === "email_address_invalid") {

        return {
            fieldId: "email",
            title: "Invalid email",
            message: "This email address can't be used. Try a different one."
        };

    }

    // SOBRANG DAMING SUBOK
    if (error?.status === 429 || code.includes("rate_limit")) {

        return {
            fieldId: null,
            title: "Too many attempts",
            message: "Wait a few minutes, then try creating your account again."
        };

    }

    // WALANG INTERNET
    if (message.includes("failed to fetch")) {

        return {
            fieldId: null,
            title: "No connection",
            message: "Check your internet connection, then try again."
        };

    }

    // IBA PANG ERROR
    return {
        fieldId: null,
        title: "Account not created",
        message: error?.message || "Something went wrong. Try again."
    };

}

// -----------------------------------------------------
// 4D. Ikabit ang lahat sa Create Account form
// -----------------------------------------------------

function setupCreateAccount() {

    const form = document.getElementById("createAccountForm");
    const createAccountButton = document.getElementById("createAccountButton");

    // Kung wala ang form, ibig sabihin hindi ito ang Create Account page
    if (!form || !createAccountButton) return;

    setupPasswordToggle("password", "togglePassword");
    setupPasswordToggle("confirmPassword", "toggleConfirmPassword");

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // STEP 1: Kunin ang lahat ng laman ng form
        // (ang pangalan ng bawat key ay kapareho ng id ng input)
        const account = {
            firstName: getValue("firstName"),
            lastName: getValue("lastName"),
            age: getValue("age"),
            birthday: getValue("birthday"),
            company: getValue("company"),
            position: getValue("position"),
            username: getValue("username"),
            email: getValue("email"),
            // Hindi tine-trim ang password (pwedeng may space talaga)
            password: document.getElementById("password").value,
            confirmPassword: document.getElementById("confirmPassword").value
        };

        // STEP 2: I-check kung tama ang laman ng form
        const formProblem = validateAccount(account);

        if (formProblem) {
            await showFormProblem(formProblem, "warning");
            return;
        }

        setButtonLoading(createAccountButton, true, "Creating account...");

        try {

            // STEP 3: I-check kung taken na ang username
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

            // STEP 4: I-register ang user sa Supabase
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

            // STEP 5: I-check ang "tagong" duplicate email
            // Kapag naka-ON ang "Confirm email" sa Supabase, HINDI ito
            // nagbibigay ng error kapag existing na ang email.
            // Sa halip, walang laman ang "identities" ng user.
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

            // STEP 6: Success!
            if (data.session) {

                // Naka-OFF ang email confirmation: pwede nang mag-login agad
                await showMessage(
                    "success",
                    "Account created",
                    "Your iSave account is ready. You can now log in."
                );

                window.location.href = "index.html";

            } else {

                // Naka-ON ang email confirmation: kailangan munang i-confirm
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

            // Laging ibabalik sa dati ang button, success man o error
            setButtonLoading(createAccountButton, false);

        }

    });

}


// =====================================================
// 5. LOGIN PAGE
// =====================================================

// -----------------------------------------------------
// 5A. Gawing malinaw na message ang login error
// -----------------------------------------------------
// Magbabalik ng { fieldId, title, message } para sa message box

function getLoginProblem(error) {

    const code = error?.code ?? "";
    const message = (error?.message ?? "").toLowerCase();

    // MALING EMAIL O PASSWORD
    // (Sadyang hindi sinasabi ni Supabase kung alin sa dalawa ang mali,
    //  para hindi malaman ng iba kung may account ang isang email.)
    if (code === "invalid_credentials" || message.includes("invalid login credentials")) {

        return {
            fieldId: "password",
            title: "Incorrect email or password",
            message:
                "The email or password you entered doesn't match any account.\n" +
                "Check both fields, then try again."
        };

    }

    // HINDI PA NA-CONFIRM ANG EMAIL
    if (code === "email_not_confirmed" || message.includes("email not confirmed")) {

        return {
            fieldId: "email",
            title: "Email not confirmed",
            message:
                "Open the confirmation link we sent to your email,\n" +
                "then log in again."
        };

    }

    // SOBRANG DAMING SUBOK
    if (error?.status === 429 || code.includes("rate_limit")) {

        return {
            fieldId: null,
            title: "Too many attempts",
            message: "Wait a few minutes, then try logging in again."
        };

    }

    // WALANG INTERNET
    if (message.includes("failed to fetch")) {

        return {
            fieldId: null,
            title: "No connection",
            message: "Check your internet connection, then try again."
        };

    }

    // IBA PANG ERROR
    return {
        fieldId: null,
        title: "Login failed",
        message: error?.message || "Something went wrong. Try again."
    };

}

// -----------------------------------------------------
// 5B. Ikabit ang lahat sa Login form
// -----------------------------------------------------

function setupLogin() {

    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");

    // Kung wala ang form, ibig sabihin hindi ito ang Login page
    if (!loginForm || !loginButton) return;

    // SHOW / HIDE ng password sa Login page
    setupPasswordToggle("password", "togglePassword");

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // STEP 1: Kunin ang email at password
        const email = getValue("email");
        const password = document.getElementById("password").value;

        // STEP 2: I-check kung may laman
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

            // STEP 3: Mag-login sa Supabase
            const { error } = await db.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // STEP 4: Success, lipat sa Dashboard
            if (loginMessage) loginMessage.textContent = "Login successful. Redirecting...";
            window.location.href = "dashboard.html";

        } catch (error) {

            logError("LOGIN", error);

            // Ibalik muna ang button bago ipakita ang warning
            // (kapag success, hindi na kailangan dahil lilipat na ng page)
            setButtonLoading(loginButton, false);

            await showFormProblem(getLoginProblem(error), "warning");

        }

    });

}


// =====================================================
// 6. DASHBOARD PAGE
// =====================================================

// Mga column ng table.
// key   = pangalan ng column sa Supabase
// label = ipapakita sa user (gamit sa mobile view)
const TRANSACTION_COLUMNS = [
    { key: "Date",       label: "Date" },
    { key: "Payroll",    label: "Payroll" },
    { key: "Sender",     label: "Sender" },
    { key: "Amount",     label: "Amount" },
    { key: "Reciever",   label: "Receiver" }, // "Reciever" ang spelling sa database mo
    { key: "Purpose",    label: "Purpose/Definition" }
];

// Isang row lang na may message (halimbawa: "No transactions found.")
function showTableMessage(tableBody, text) {

    tableBody.innerHTML = `
        <tr>
            <td colspan="${TRANSACTION_COLUMNS.length}" class="empty-state">${text}</td>
        </tr>
    `;

}


// =====================================
// LOAD USER'S OWN TRANSACTIONS
// =====================================

async function loadTransactions(tableBody, userId) {

    const { data, error } = await db
        .from("Transactions")
        .select("*")
        .eq("UserID", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
        showTableMessage(tableBody, "No transactions found.");
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(function (transaction) {

        const row = document.createElement("tr");

        TRANSACTION_COLUMNS.forEach(function (column) {

            const cell = document.createElement("td");

            cell.setAttribute("data-label", column.label);
            cell.textContent = transaction[column.key] ?? "";

            row.appendChild(cell);

        });

        tableBody.appendChild(row);

    });

}


function setupDashboard() {

    const tableBody = document.getElementById("transactionTableBody");

    // Kung wala ang table, ibig sabihin hindi ito ang Dashboard page
    if (!tableBody) return;

    (async function () {

        try {

            // Tingnan kung naka-login ang user
            const { data, error } = await db.auth.getSession();

            if (error) throw error;

            if (!data.session) {
                // Hindi naka-login, ibalik sa Login page
                window.location.replace("index.html");
                return;
            }

            await loadTransactions(tableBody, data.session.user.id);

        } catch (error) {

            logError("DASHBOARD", error);
            showTableMessage(tableBody, "Failed to load transactions. Refresh the page to try again.");

        }

    })();

}


// =====================================================
// 7. PAGSISIMULA NG APP
// =====================================================
// Pagka-load ng page, patatakbuhin ang lahat ng setup.
// Bawat setup ay kusang hihinto kung wala sa tamang page,
// kaya ligtas itong gamitin sa lahat ng HTML file mo.

document.addEventListener("DOMContentLoaded", function () {

    setupLogin();
    setupCreateAccount();
    setupDashboard();

});




// =====================================
// ADD TRANSACTION MODAL
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    const addTransactionBtn = document.getElementById("addTransactionBtn");
    const transactionModal = document.getElementById("transactionModal");

    const closeTransactionModal = document.getElementById("closeTransactionModal");
    const cancelTransaction = document.getElementById("cancelTransaction");

    const transactionForm = document.getElementById("transactionForm");

    const todayDateToggle = document.getElementById("todayDateToggle");
    const transactionDate = document.getElementById("transactionDate");
    const dateHint = document.getElementById("dateHint");


    // =====================================
    // GET TODAY'S DATE
    // =====================================

    function getTodayDate() {

        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    // =====================================
    // OPEN MODAL
    // =====================================

    function openTransactionModal() {

        transactionModal.classList.add("active");

        document.body.style.overflow = "hidden";

        // Default: Today's date
        todayDateToggle.checked = true;

        transactionDate.value = getTodayDate();
        transactionDate.disabled = true;

        dateHint.textContent = "Automatically using today's date.";
    }


    // =====================================
    // CLOSE MODAL
    // =====================================

    function closeModal() {

        transactionModal.classList.remove("active");

        document.body.style.overflow = "";

        transactionForm.reset();

        // Restore default date settings
        todayDateToggle.checked = true;
        transactionDate.value = getTodayDate();
        transactionDate.disabled = true;

        dateHint.textContent = "Automatically using today's date.";
    }


    // =====================================
    // BUTTON EVENTS
    // =====================================

    addTransactionBtn.addEventListener("click", openTransactionModal);

    closeTransactionModal.addEventListener("click", closeModal);

    cancelTransaction.addEventListener("click", closeModal);


    // =====================================
    // DATE TOGGLE
    // =====================================

    todayDateToggle.addEventListener("change", function () {

        if (this.checked) {

            // Automatic today's date
            transactionDate.value = getTodayDate();
            transactionDate.disabled = true;

            dateHint.textContent = "Automatically using today's date.";

        } else {

            // Allow manual date selection
            transactionDate.disabled = false;

            dateHint.textContent = "Select your preferred transaction date.";

        }

    });


    // =====================================
    // CLOSE WHEN CLICKING OUTSIDE
    // =====================================

    transactionModal.addEventListener("click", function (event) {

        if (event.target === transactionModal) {
            closeModal();
        }

    });


    // =====================================
    // CLOSE USING ESCAPE KEY
    // =====================================

    document.addEventListener("keydown", function (event) {

        if (
            event.key === "Escape" &&
            transactionModal.classList.contains("active")
        ) {
            closeModal();
        }

    });


    
    // =====================================
    // SAVE TRANSACTION TO SUPABASE
    // =====================================

    transactionForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const saveButton = transactionForm.querySelector(
            ".save-transaction-btn"
        );

        try {

            // =====================================
            // CHECK CURRENT USER
            // =====================================

            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

            const { data: userData, error: userError } =
                await db.auth.getUser();

            if (userError) {
                throw userError;
            }

            const user = userData.user;

            if (!user) {
                alert("Your session has expired. Please log in again.");
                window.location.href = "index.html";
                return;
            }


            // =====================================
            // GET FORM VALUES
            // =====================================

            const transactionData = {

                "Date": todayDateToggle.checked
                    ? getTodayDate()
                    : transactionDate.value,

                "Payroll": Number(
                    document.getElementById("payroll").value
                ),

                "Sender": document.getElementById("sender").value.trim(),

                "Amount": Number(
                    document.getElementById("amount").value
                ),

                "Reciever": document.getElementById("receiver").value.trim(),

                "Purpose": document.getElementById("purpose").value.trim(),

                "Transaction": document.getElementById("transactionType").value

                // Do not manually add UserID.
                // Supabase uses auth.uid() as the column default.
            };


            // =====================================
            // INSERT INTO SUPABASE
            // =====================================

            const { data, error } = await db
                .from("Transactions")
                .insert([transactionData])
                .select();

            if (error) {
                throw error;
            }


            // =====================================
            // SUCCESS
            // =====================================

            console.log("Transaction saved:", data);

            alert("Transaction successfully saved!");

            closeModal();

            // Reload dashboard to show the new record
            window.location.reload();


        } catch (error) {

            console.error("Save Transaction Error:", error);

            alert(
                "Unable to save transaction:\n\n" +
                error.message
            );

        } finally {

            saveButton.disabled = false;
            saveButton.textContent = "Save Transaction";

        }

    });
});
>>>>>>> v0.0.2
