// ============================================================================
// CODE PRINCIPAL DE L'APPLICATION (index.html)
// ============================================================================

// Vérification de l'authentification au chargement
function checkAuthentication() {
    if (localStorage.getItem("loggedIn") !== "true") {
        window.location.href = "login.html";
    }
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userCollection");
    localStorage.removeItem("selectedGames");
    window.location.href = "login.html";
}

// ============================================================================
// NAVIGATION ET GESTION DES PAGES
// ============================================================================

function showPage(pageId) {
    // Masquer toutes les sections
    const pages = document.querySelectorAll(".page");
    pages.forEach(page => page.classList.remove("active"));

    // Afficher la section sélectionnée
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add("active");
    }

    // Réinitialiser l'état des boutons
    const buttons = document.querySelectorAll(".nav-buttons .btn");
    buttons.forEach(btn => btn.classList.remove("active"));

    // Activer le bouton correspondant
    const clickedBtn = [...buttons].find(btn => btn.getAttribute("onclick")?.includes(pageId));
    if (clickedBtn) {
        clickedBtn.classList.add("active");
    }

    // Actions spécifiques selon la page
    if (pageId === 'favoris') {
        displayFavoritesPage();
    } else if (pageId === 'collection') {
        refreshCharacterDisplay();
    } else if (pageId === 'jeux') {
        loadSelectedGames(); // Charger les jeux sélectionnés
    }
}

// ============================================================================
// GESTION DES JEUX ET BASES DE DONNÉES
// ============================================================================

let characterBase = {
    "solo-leveling": [],
    "seven-knights": []
};

// Configuration spécifique à chaque jeu
const gameConfig = {
    "solo-leveling": {
        doublonLabel: "Doublons",
        maxLevel: 110,
        showDoublon: true
    },
    "seven-knights": {
        doublonLabel: "Étoiles",
        maxLevel: 100,
        showDoublon: true
    }
};


// Chargement des bases de données de personnages
function loadCharacterDatabases() {
    // Charger Solo Leveling
    fetch('Assets/Json/database_character_solo_leveling_arise.json')
        .then(res => {
            if (!res.ok) throw new Error('Erreur de chargement Solo Leveling');
            return res.json();
        })
        .then(data => {
            characterBase["solo-leveling"] = data;
            console.log('Base Solo Leveling chargée:', data.length, 'personnages');
        })
        .catch(error => {
            console.error('Erreur Solo Leveling:', error);
            showNotification('Erreur de chargement de la base Solo Leveling', 'error');
        });

    // Charger Seven Knights
    fetch('Assets/Json/database_character_seven_knight_idle_adventure.json')
        .then(res => {
            if (!res.ok) throw new Error('Erreur de chargement Seven Knights');
            return res.json();
        })
        .then(data => {
            characterBase["seven-knights"] = data;
            console.log('Base Seven Knights chargée:', data.length, 'personnages');
        })
        .catch(error => {
            console.error('Erreur Seven Knights:', error);
            showNotification('Erreur de chargement de la base Seven Knights', 'error');
        });
}

// Charger les jeux sélectionnés depuis le localStorage
function loadSelectedGames() {
    const savedGames = JSON.parse(localStorage.getItem("selectedGames") || "[]");
    const checkboxes = document.querySelectorAll('#jeux input[type="checkbox"]');

    // Cocher les cases des jeux précédemment sélectionnés
    checkboxes.forEach(checkbox => {
        if (savedGames.includes(checkbox.id)) {
            checkbox.checked = true;
            // Ajouter la classe selected à la carte parent
            const gameCard = checkbox.closest('.game-card');
            if (gameCard) {
                gameCard.classList.add('selected');
            }
        }
    });
}

// Sauvegarde des jeux sélectionnés et navigation vers la collection
function saveGamesAndGoToCollection() {
    const selectedGames = [];
    const checkboxes = document.querySelectorAll('#jeux input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedGames.push(checkbox.id);
        }
    });

    if (selectedGames.length === 0) {
        showNotification("Tu dois sélectionner au moins un jeu !", 'warning');
        return;
    }

    // Stocker en localStorage
    localStorage.setItem("selectedGames", JSON.stringify(selectedGames));

    // Passer à la page Collection
    showPage("collection");

    // Charger dynamiquement les jeux sélectionnés dans les onglets
    generateGameTabs(selectedGames);
    populateGameDropdown(selectedGames);

    showNotification(`${selectedGames.length} jeu(x) sélectionné(s) !`, 'success');
}

// Génération des onglets de jeux pour la collection
function generateGameTabs(games) {
    const tabsContainer = document.querySelector('#collection .game-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = ""; // Reset

    // Ajouter un bouton "Tous"
    const allBtn = document.createElement("button");
    allBtn.classList.add("btn", "active");
    allBtn.textContent = "Tous";
    allBtn.addEventListener("click", () => {
        displayFilteredCharacters(userCollection);
        setActiveTab(allBtn);
    });
    tabsContainer.appendChild(allBtn);

    // Ajouter les boutons pour chaque jeu
    games.forEach(game => {
        const btn = document.createElement("button");
        btn.classList.add("btn");
        btn.textContent = getGameLabel(game);
        btn.dataset.game = game;
        btn.addEventListener("click", () => {
            filterByGame(game);
            setActiveTab(btn);
        });
        tabsContainer.appendChild(btn);
    });
}

// Fonction pour définir l'onglet actif
function setActiveTab(activeButton) {
    const tabs = document.querySelectorAll('#collection .game-tabs .btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    activeButton.classList.add('active');
}

// Remplissage du dropdown des jeux
function populateGameDropdown(games) {
    const dropdown = document.getElementById("char-game");
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Sélectionner un jeu</option>';

    games.forEach(game => {
        const option = document.createElement("option");
        option.value = game;
        option.textContent = getGameLabel(game);
        dropdown.appendChild(option);
    });

    // Ajouter un événement pour charger les personnages quand on change de jeu
    dropdown.addEventListener('change', function () {
        populateCharacterDropdown(this.value);
    });
}

// NOUVELLE FONCTION: Remplir la liste des personnages selon le jeu sélectionné
function populateCharacterDropdown(gameId) {
    const dropdown = document.getElementById("char-name");
    if (!dropdown || !gameId) {
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Sélectionner d\'abord un jeu</option>';
        }
        return;
    }

    dropdown.innerHTML = '<option value="">Sélectionner un personnage</option>';

    const characters = characterBase[gameId] || [];
    characters.forEach(char => {
        const option = document.createElement("option");
        option.value = char.name;
        option.textContent = char.name;
        dropdown.appendChild(option);
    });

    // 🔧 Adapter dynamiquement le formulaire selon le jeu sélectionné
    const config = gameConfig[gameId];
    if (config) {
        // Modifier le label "Doublons"/"Étoiles"
        const doublonLabel = document.querySelector("label[for='char-copies']");
        if (doublonLabel) {
            doublonLabel.textContent = config.doublonLabel + " :";
        }

        // Définir le niveau max
        const levelInput = document.getElementById("char-level");
        if (levelInput) {
            levelInput.max = config.maxLevel;
        }

        // Afficher/masquer les champs selon la config du jeu
        const starsGroup = document.getElementById("char-stars")?.closest(".form-group");
        const doublonGroup = document.getElementById("char-copies")?.closest(".form-group");
        if (doublonGroup) doublonGroup.style.display = config.showDoublon ? "block" : "none";
    }

    // 🆕 Ajouter un événement pour remplir automatiquement l'arme quand on sélectionne un personnage
    dropdown.addEventListener('change', function () {
        const selectedCharName = this.value;
        if (selectedCharName) {
            const selectedChar = characters.find(char => char.name === selectedCharName);
            if (selectedChar && selectedChar.weapon) {
                const weaponInput = document.getElementById("char-weapon");
                if (weaponInput) {
                    weaponInput.value = selectedChar.weapon;
                }
            }
        }
    });

}

// Obtenir le label d'affichage d'un jeu
function getGameLabel(id) {
    switch (id) {
        case 'solo-leveling': return 'Solo Leveling';
        case 'seven-knights': return 'Seven Knights';
        default: return id;
    }
}

// Filtrer par jeu
function filterByGame(gameId) {
    console.log(`Filtrage par jeu: ${gameId}`);
    // Filtrer l'affichage des personnages
    const filteredCollection = userCollection.filter(char => char.game === gameId);
    displayFilteredCharacters(filteredCollection);
}

// ============================================================================
// GESTION DE LA COLLECTION
// ============================================================================

let userCollection = JSON.parse(localStorage.getItem("userCollection")) || [];

// Sauvegarde de la collection utilisateur
function saveUserCollection() {
    localStorage.setItem("userCollection", JSON.stringify(userCollection));
}

// Nouvelle version de addCharacter() adaptée au nouveau formulaire
function addCharacter() {
    const game = document.getElementById('char-game')?.value;
    const name = document.getElementById('char-name')?.value;
    const level = parseInt(document.getElementById('char-level')?.value) || 1;
    const doublon = parseInt(document.getElementById('char-copies')?.value) || 0;

    const weapon = document.getElementById('char-weapon')?.value || "";
    const weaponLevel = parseInt(document.getElementById('char-weapon-level')?.value) || 1;
    const weaponDoublon = parseInt(document.getElementById('char-weapon-copies')?.value) || 0;

    const powerTotal = document.getElementById('char-power')?.value || "";
    const statsPrincipal = document.getElementById('char-stats-principal')?.value || "";
    const statsSecondary = document.getElementById('char-stats-secondary')?.value || "";
    const bonusStats = document.getElementById('char-bonus')?.value || "";
    const description = document.getElementById('char-description')?.value || "";

    if (!game || !name) {
        showNotification("Tu dois sélectionner un jeu et un personnage.", 'warning');
        return;
    }

    const baseChar = characterBase[game]?.find(c =>
        c.name.toLowerCase() === name.toLowerCase()
    );

    if (!baseChar) {
        showNotification("Ce personnage n'existe pas dans la base du jeu sélectionné.", 'error');
        return;
    }

    if (level > baseChar.maxLevel || doublon > baseChar.maxDoublon ||
        weaponLevel > baseChar.maxLevelWeapon || weaponDoublon > baseChar.maxDoublonWeapon) {
        showNotification(`Limite dépassée : perso max niveau ${baseChar.maxLevel}, ${baseChar.maxDoublon} doublons, arme max niveau ${baseChar.maxLevelWeapon}, ${baseChar.maxDoublonWeapon} doublons.`, 'error');
        return;
    }

    const exists = userCollection.find(c =>
        c.name.toLowerCase() === name.toLowerCase() && c.game === game
    );

    if (exists) {
        showNotification("Ce personnage est déjà dans ta collection.", 'warning');
        return;
    }

    const newCharacter = {
        id: Date.now(),
        game,
        name: baseChar.name,
        type: baseChar.type || "",
        level,
        doublon,
        weapon,
        weaponLevel,
        weaponDoublon,
        powerTotal,
        statsPrincipal,
        statsSecondary,
        BonusStats: bonusStats,
        description,
        isFavorite: false,
        tags: [],
        dateAdded: new Date().toISOString()
    };

    userCollection.push(newCharacter);
    saveUserCollection();
    refreshCharacterDisplay();
    hideAddForm();

    showNotification(`${baseChar.name} ajouté à ta collection !`, 'success');
}

// Fonction pour modifier un personnage existant
type = "";
let editingCharacterId = null;

function editCharacter(charId) {
    const char = userCollection.find(c => c.id === parseInt(charId));
    if (!char) return;

    editingCharacterId = parseInt(charId);

    document.getElementById('char-game').value = char.game;
    populateCharacterDropdown(char.game);

    setTimeout(() => {
        document.getElementById('char-name').value = char.name;
    }, 100);

    document.getElementById('char-level').value = char.level;
    document.getElementById('char-copies').value = char.doublon;
    document.getElementById('char-weapon').value = char.weapon;
    document.getElementById('char-weapon-level').value = char.weaponLevel;
    document.getElementById('char-weapon-copies').value = char.weaponDoublon;
    document.getElementById('char-power').value = char.powerTotal;
    document.getElementById('char-stats-principal').value = char.statsPrincipal;
    document.getElementById('char-stats-secondary').value = char.statsSecondary;
    document.getElementById('char-bonus').value = char.BonusStats || "";
    document.getElementById('char-description').value = char.description;

    const submitBtn = document.querySelector('#add-form button[onclick="addCharacter()"]');
    if (submitBtn) {
        submitBtn.textContent = '💾 Modifier le personnage';
        submitBtn.setAttribute('onclick', 'updateCharacter()');
    }

    const formTitle = document.querySelector('#add-form h3');
    if (formTitle) {
        formTitle.textContent = '✏️ Modifier le personnage';
    }

    showAddForm();
}

function updateCharacter() {
    if (!editingCharacterId) return;

    const game = document.getElementById('char-game')?.value;
    const name = document.getElementById('char-name')?.value;
    const level = parseInt(document.getElementById('char-level')?.value) || 1;
    const doublon = parseInt(document.getElementById('char-copies')?.value) || 0;
    const weapon = document.getElementById('char-weapon')?.value || "";
    const weaponLevel = parseInt(document.getElementById('char-weapon-level')?.value) || 1;
    const weaponDoublon = parseInt(document.getElementById('char-weapon-copies')?.value) || 0;
    const powerTotal = document.getElementById('char-power')?.value || "";
    const statsPrincipal = document.getElementById('char-stats-principal')?.value || "";
    const statsSecondary = document.getElementById('char-stats-secondary')?.value || "";
    const bonusStats = document.getElementById('char-bonus')?.value || "";
    const description = document.getElementById('char-description')?.value || "";

    if (!game || !name) {
        showNotification("Tu dois sélectionner un jeu et un personnage.", 'warning');
        return;
    }

    const baseChar = characterBase[game]?.find(c =>
        c.name.toLowerCase() === name.toLowerCase()
    );

    if (!baseChar) {
        showNotification("Ce personnage n'existe pas dans la base du jeu sélectionné.", 'error');
        return;
    }

    if (level > baseChar.maxLevel || doublon > baseChar.maxDoublon ||
        weaponLevel > baseChar.maxLevelWeapon || weaponDoublon > baseChar.maxDoublonWeapon) {
        showNotification(`Limite dépassée : perso max niveau ${baseChar.maxLevel}, ${baseChar.maxDoublon} doublons, arme max niveau ${baseChar.maxLevelWeapon}, ${baseChar.maxDoublonWeapon} doublons.`, 'error');
        return;
    }

    const charIndex = userCollection.findIndex(c => c.id === editingCharacterId);
    if (charIndex !== -1) {
        userCollection[charIndex] = {
            ...userCollection[charIndex],
            game,
            name: baseChar.name,
            type: baseChar.type || "",
            level,
            doublon,
            weapon,
            weaponLevel,
            weaponDoublon,
            powerTotal,
            statsPrincipal,
            statsSecondary,
            BonusStats: bonusStats,
            description
        };

        saveUserCollection();
        refreshCharacterDisplay();
        hideAddForm();
        resetAddFormToAdd();

        showNotification(`${baseChar.name} modifié avec succès !`, 'success');
    }
}

function resetAddForm() {
    const form = document.getElementById('add-form');
    if (form) {
        form.querySelector('#char-game').value = '';
        form.querySelector('#char-name').innerHTML = '<option value="">Sélectionner d\'abord un jeu</option>';
        form.querySelector('#char-level').value = '1';
        form.querySelector('#char-copies').value = '0';
        form.querySelector('#char-weapon').value = '';
        form.querySelector('#char-weapon-level').value = '1';
        form.querySelector('#char-weapon-copies').value = '0';
        form.querySelector('#char-power').value = '';
        form.querySelector('#char-stats-principal').value = '';
        form.querySelector('#char-stats-secondary').value = '';
        form.querySelector('#char-bonus').value = "";
        form.querySelector('#char-description').value = '';
    }
}

// Basculer le statut favori d'un personnage
function toggleFavorite(charId) {
    const char = userCollection.find(c => c.id === parseInt(charId));

    if (char) {
        char.isFavorite = !char.isFavorite;
        saveUserCollection();
        refreshCharacterDisplay();

        const status = char.isFavorite ? 'ajouté aux favoris' : 'retiré des favoris';
        showNotification(`${char.name} ${status}`, 'success');
    }
}

// Supprimer un personnage
function removeCharacter(charId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce personnage ?')) {
        const charIndex = userCollection.findIndex(c => c.id === parseInt(charId));
        if (charIndex !== -1) {
            const charName = userCollection[charIndex].name;
            userCollection.splice(charIndex, 1);
            saveUserCollection();
            refreshCharacterDisplay();
            showNotification(`${charName} supprimé de ta collection`, 'success');
        }
    }
}

// Afficher des personnages filtrés
function displayFilteredCharacters(characters) {
    const container = document.querySelector('#collection #characters-container');
    if (!container) return;

    container.innerHTML = "";

    if (characters.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>🎯 Aucun personnage trouvé</h3>
                <p>Aucun personnage ne correspond aux filtres sélectionnés.</p>
            </div>`;
        return;
    }

    characters.forEach(char => createCharacterCard(char, container));
}

// Rafraîchir l'affichage des personnages
function refreshCharacterDisplay() {
    displayFilteredCharacters(userCollection);
}

// Créer une carte de personnage (mise à jour)
function createCharacterCard(char, container) {
    const card = document.createElement("div");
    card.classList.add("character-card");
    if (char.isFavorite) card.classList.add("favorite");

    card.innerHTML = `
        <div class="card-header">
            <h4>${char.name}</h4>
            <button class="favorite-btn" onclick="toggleFavorite(${char.id})" title="${char.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                ${char.isFavorite ? '⭐' : '☆'}
            </button>
        </div>
        <div class="card-body">
            <p><strong>Jeu :</strong> ${getGameLabel(char.game)}</p>
            <p><strong>Type :</strong> ${char.type || '—'}</p>
            <p><strong>Niveau :</strong> ${char.level}</p>
            <p><strong>Doublons perso :</strong> ${char.doublon}</p>
            <p><strong>Arme :</strong> ${char.weapon || '—'} (${char.weaponLevel || '—'} lvl, ${char.weaponDoublon || 0} doublons)</p>
            <p><strong>Puissance :</strong> ${char.powerTotal || '—'}</p>
            <p><strong>Stat principale :</strong> ${char.statsPrincipal || '—'}</p>
            <p><strong>Stats secondaires :</strong> ${char.statsSecondary || '—'}</p>
            <p><strong>Bonus Stats :</strong> ${char.BonusStats || '—'}</p>
            <p><strong>Description :</strong> ${char.description || '—'}</p>
        </div>
        <div class="card-actions">
            <button class="btn-edit" onclick="editCharacter(${char.id})">✏️ Modifier</button>
            <button class="btn-delete" onclick="removeCharacter(${char.id})">🗑️ Supprimer</button>
        </div>
    `;

    container.appendChild(card);
}


// Afficher le formulaire d'ajout
function showAddForm() {
    const form = document.getElementById('add-form');
    if (form) {
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

// Masquer le formulaire d'ajout
function hideAddForm() {
    const form = document.getElementById('add-form');
    if (form) {
        form.style.display = 'none';
        resetAddForm();
        resetAddFormToAdd();
    }
}

// Réinitialiser le formulaire d'ajout
function resetAddForm() {
    const form = document.getElementById('add-form');
    if (form) {
        form.querySelector('#char-game').value = '';
        form.querySelector('#char-name').innerHTML = '<option value="">Sélectionner d\'abord un jeu</option>';
        form.querySelector('#char-level').value = '1';
        form.querySelector('#char-copies').value = '0';
        form.querySelector('#char-note').value = '';
    }
}

// Basculer la sélection d'un jeu
function toggleGame(cardElement, gameId) {
    const checkbox = cardElement.querySelector('input[type="checkbox"]');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        cardElement.classList.toggle('selected', checkbox.checked);
    }
}

// Afficher les favoris
function showFavorites() {
    const favorites = userCollection.filter(char => char.isFavorite);
    displayFilteredCharacters(favorites);
}

// FONCTION CORRIGÉE: Fonction pour la page favoris
function displayFavoritesPage() {
    const container = document.querySelector('#favoris #characters-container');
    if (!container) {
        // Si le conteneur n'existe pas, essayons un autre sélecteur
        const altContainer = document.querySelector('#favoris-characters-container');
        if (altContainer) {
            displayFavoritesInContainer(altContainer);
        }
        return;
    }

    displayFavoritesInContainer(container);
}

// NOUVELLE FONCTION: Afficher les favoris dans un conteneur spécifique
function displayFavoritesInContainer(container) {
    const favorites = userCollection.filter(char => char.isFavorite);

    container.innerHTML = "";

    if (favorites.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>🎯 Aucun favori pour le moment</h3>
                <p>Ajoute des personnages à tes favoris depuis ta collection !</p>
            </div>`;
        return;
    }

    favorites.forEach(char => createCharacterCard(char, container));
}

// ============================================================================
// UTILITAIRES
// ============================================================================

// Système de notifications
function showNotification(message, type = 'info') {
    // Créer le conteneur de notifications s'il n'existe pas
    let container = document.getElementById('notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    // Créer la notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${getNotificationColor(type)};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        pointer-events: auto;
        cursor: pointer;
        max-width: 300px;
    `;

    notification.textContent = message;
    notification.onclick = () => notification.remove();

    // Ajouter l'animation CSS
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    container.appendChild(notification);

    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#28a745';
        case 'error': return '#dc3545';
        case 'warning': return '#ffc107';
        case 'info': return '#17a2b8';
        default: return '#6c757d';
    }
}

// ============================================================================
// INITIALISATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Vérifier l'authentification
    checkAuthentication();

    // Charger les bases de données de personnages
    loadCharacterDatabases();

    // Initialiser le bouton de sauvegarde des jeux
    const saveBtn = document.getElementById("save-games-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveGamesAndGoToCollection);
    }

    // Charger les jeux sélectionnés précédemment pour la collection
    const savedGames = JSON.parse(localStorage.getItem("selectedGames") || "[]");
    if (savedGames.length > 0) {
        generateGameTabs(savedGames);
        populateGameDropdown(savedGames);
    }

    // Rafraîchir l'affichage de la collection
    refreshCharacterDisplay();

    // Gestion de la page favoris
    const favoritesPage = document.getElementById('favoris');
    if (favoritesPage && favoritesPage.classList.contains('active')) {
        displayFavoritesPage();
    }

    console.log("Application initialisée avec succès !");
});