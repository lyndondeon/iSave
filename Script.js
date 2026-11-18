const SUPABASE_URL = "https://yvmaiuaitwyhkhsxvari.supabase.co";
const SUPABASE_KEY = "sb_publishable_O1BFpAxcpbB_Clh3ragvKQ_Az6Jvviy";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Elements
const transactionTableBody = document.getElementById("transactionTableBody");


// =====================================
// LOAD ALL TRANSACTIONS
// =====================================

async function loadTransactions() {

    const transactionTableBody =
        document.getElementById("transactionTableBody");

    // Do not run on pages without the transaction table
    if (!transactionTableBody) return;

    console.log("=== DATABASE DIAGNOSTIC ===");
    console.log("Loading transactions...");

    try {

        const { data, error, count, status } = await db
            .from("Transactions")
            .select("*", { count: "exact" });

        console.log("HTTP Status:", status);
        console.log("Database Error:", error);
        console.log("Total Records:", count);
        console.log("Retrieved Data:", data);

        if (error) throw error;

        if (!data || data.length === 0) {

            transactionTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        No transactions found.
                    </td>
                </tr>
            `;

            return;
        }

        transactionTableBody.innerHTML = "";

        data.forEach(transaction => {

            const row = document.createElement("tr");

            const values = [
                transaction.id,
                transaction.created_at,
                transaction.Date,
                transaction.Payroll,
                transaction.Sender,
                transaction.Amount,
                transaction.Reciever,
                transaction.Purpose
            ];

            const labels = [
                "ID",
                "Logs",
                "Date",
                "Payroll",
                "Sender",
                "Amount",
                "Receiver",
                "Purpose/Definition"
            ];

            values.forEach((value, index) => {

                const cell = document.createElement("td");

                cell.setAttribute("data-label", labels[index]);
                cell.textContent = value ?? "";

                row.appendChild(cell);

            });

            transactionTableBody.appendChild(row);

        });

    } catch (error) {

        console.error("DATABASE ERROR:", error);

        transactionTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    Failed to load transactions.
                </td>
            </tr>
        `;

        alert("Database Error: " + error.message);

    }
}


// =====================================
// PASSWORD VISIBILITY
// =====================================

function setupPasswordToggle(inputId, buttonId) {

    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (!input || !button) return;

    button.addEventListener("click", function () {

        const isPassword = input.type === "password";

        input.type = isPassword ? "text" : "password";

        button.textContent = isPassword ? "HIDE" : "SHOW";

    });

}


// =====================================
// CREATE ACCOUNT
// =====================================

function setupCreateAccount() {

    const form = document.getElementById("createAccountForm");

    if (!form) return;

    const createAccountButton =
        document.getElementById("createAccountButton");

    setupPasswordToggle("password", "togglePassword");

    setupPasswordToggle(
        "confirmPassword",
        "toggleConfirmPassword"
    );

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const firstName =
            document.getElementById("firstName").value.trim();

        const lastName =
            document.getElementById("lastName").value.trim();

        const age =
            document.getElementById("age").value;

        const birthday =
            document.getElementById("birthday").value;

        const company =
            document.getElementById("company").value.trim();

        const position =
            document.getElementById("position").value.trim();

        const username =
            document.getElementById("username").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // VALIDATION

        if (
            !firstName ||
            !lastName ||
            !age ||
            !birthday ||
            !company ||
            !position ||
            !username ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            alert("Please complete all required fields.");
            return;
        }

        if (!Number.isInteger(Number(age)) || Number(age) <= 0) {
            alert("Please enter a valid age.");
            return;
        }

        if (new Date(birthday) > new Date()) {
            alert("Birthday cannot be in the future.");
            return;
        }

        if (password.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }


        // DISABLE BUTTON

        createAccountButton.disabled = true;
        createAccountButton.innerHTML = "Creating Account...";


        try {

            console.log("Creating iSave account...");

            const { data, error } = await db.auth.signUp({

                email: email,
                password: password,

                options: {
                    data: {
                        firstName: firstName,
                        lastName: lastName,
                        age: Number(age),
                        birthday: birthday,
                        company: company,
                        position: position,
                        username: username
                    }
                }

            });

            if (error) {
                throw error;
            }

            console.log("Registration response:", data);

            if (data.session) {

                alert(
                    "Account created successfully!\n\n" +
                    "You can now log in to iSave."
                );

                window.location.href = "index.html";

            } else {

                alert(
                    "Registration successful!\n\n" +
                    "Please check your email and confirm your account " +
                    "before logging in."
                );

                form.reset();

            }

        } catch (error) {

            console.error("ACCOUNT CREATION ERROR:", error);

            alert(
                "Unable to create account:\n\n" + error.message
            );

        } finally {

            createAccountButton.disabled = false;

            createAccountButton.innerHTML = `
                <span>Create Account</span>
                <span class="button-right-arrow">→</span>
            `;

        }

    });

}


// =====================================
// INITIALIZE PAGE
// =====================================

// =====================================
// INITIALIZE PAGE
// =====================================

document.addEventListener("DOMContentLoaded", async function () {

    console.log("iSave page loaded.");

    // Login page
    setupLogin();

    // Create Account page
    setupCreateAccount();

    // Dashboard page
    const transactionTableBody =
        document.getElementById("transactionTableBody");

    if (transactionTableBody) {

        const { data, error } = await db.auth.getSession();

        if (error || !data.session) {

            console.warn("No active session. Redirecting to login.");

            window.location.replace("index.html");
            return;

        }

        console.log("Authenticated dashboard access.");

        loadTransactions();

    }

});



// =====================================
// LOGIN AUTHENTICATION
// =====================================

// =====================================
// LOGIN AUTHENTICATION
// =====================================

function setupLogin() {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) return;

    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            loginMessage.textContent = "Please enter your email and password.";
            return;
        }

        loginButton.disabled = true;
        loginButton.innerHTML = "Logging in...";

        loginMessage.textContent = "";

        try {

            const { data, error } = await db.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            console.log("Login successful:", data.user);

            loginMessage.textContent = "Login successful! Redirecting...";

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("LOGIN ERROR:", error);

            loginMessage.textContent = error.message;

        } finally {

            loginButton.disabled = false;

            loginButton.innerHTML = `
                <span>Log In</span>
                <span class="button-right-arrow">→</span>
            `;

        }

    });

}


// =====================================
// INITIALIZE LOGIN
// =====================================

document.addEventListener("DOMContentLoaded", function () {
    setupLogin();
});