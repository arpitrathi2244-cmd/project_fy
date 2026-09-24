// ==========================================
// SafeRoad AI - Real Backend Registration
// ==========================================

const API_BASE_URL = "http://localhost:8080/api";

// Registration form
const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        // Page reload prevent karo
        event.preventDefault();

        // Form values
        const fullName = document.getElementById("fullName").value.trim();
        const age = Number(document.getElementById("age").value);
        const mobile = document.getElementById("mobile").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        // ==========================================
        // Basic Frontend Validation
        // ==========================================

        if (!fullName) {
            alert("Please enter your full name.");
            return;
        }

        if (!age || age < 1) {
            alert("Please enter a valid age.");
            return;
        }

        if (!/^\d{10}$/.test(mobile)) {
            alert("Mobile number must contain exactly 10 digits.");
            return;
        }

        if (!email) {
            alert("Please enter your email.");
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

        // ==========================================
        // Backend Registration Request
        // ==========================================

        const registrationData = {
            fullName: fullName,
            age: age,
            mobile: mobile,
            email: email,
            password: password
        };

        try {

            const response = await fetch(
                `${API_BASE_URL}/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(registrationData)
                }
            );

            const data = await response.json();

            // ==========================================
            // Backend Error
            // ==========================================

            if (!response.ok) {
                alert(data.message || "Registration failed.");
                return;
            }

            // ==========================================
            // Registration Successful
            // ==========================================

            alert("Registration successful! Please login.");

            // Login page par redirect
            window.location.href = "sign-in.html";

        } catch (error) {

            console.error("Registration Error:", error);

            alert(
                "Unable to connect to backend. " +
                "Please make sure Spring Boot is running."
            );
        }
    });
}