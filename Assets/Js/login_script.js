// ============================================================================
// CODE SPÉCIFIQUE À LA PAGE DE CONNEXION
// ============================================================================

const correctUsername = "Lucas";
const correctPassword = "testmdp";

// Gestion du formulaire de connexion
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('error-message');

            // Réinitialiser le message d'erreur
            if (errorElement) {
                errorElement.innerText = "";
            }

            // Validation des champs
            if (!username || !password) {
                if (errorElement) {
                    errorElement.innerText = "Veuillez remplir tous les champs.";
                }
                return;
            }

            // Vérification des identifiants
            if (username === correctUsername && password === correctPassword) {
                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("loginTime", new Date().toISOString());
                window.location.href = "index.html";
            } else {
                if (errorElement) {
                    errorElement.innerText = "Identifiants incorrects.";
                }

                // Ajouter une animation d'erreur
                const form = document.getElementById('loginForm');
                if (form) {
                    form.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        form.style.animation = '';
                    }, 500);
                }
            }
        });
    }
}

// Vérifier si déjà connecté
function checkIfAlreadyLoggedIn() {
    if (localStorage.getItem("loggedIn") === "true") {
        window.location.href = "index.html";
    }
}

// Ajouter les styles pour l'animation de shake
function addShakeAnimation() {
    if (!document.getElementById('shake-animation')) {
        const style = document.createElement('style');
        style.id = 'shake-animation';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    checkIfAlreadyLoggedIn();
    initLoginForm();
    addShakeAnimation();

    // Focus automatique sur le champ username
    const usernameField = document.getElementById('username');
    if (usernameField) {
        usernameField.focus();
    }
});