// --- Estado do Jogo ---
const gameState = {
    managerName: null,
    userClub: null,
    currentScreen: 'manager-creation-screen', // Tela inicial
    currentMainContent: 'home-content'
};

// --- Funções de Navegação ---

/** Mostra uma tela principal e esconde as outras */
function showScreen(screenId) {
    document.getElementById(gameState.currentScreen).classList.remove('active');
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
}

/** Mostra um painel de conteúdo dentro da tela principal do jogo */
function showMainContent(contentId) {
    // Esconde o painel antigo
    document.getElementById(gameState.currentMainContent).classList.remove('active');
    // Remove a classe 'active' do item de menu antigo
    document.querySelector(`#sidebar li.active`).classList.remove('active');

    // Mostra o novo painel
    document.getElementById(contentId).classList.add('active');
    // Adiciona a classe 'active' ao novo item de menu
    const newMenuItem = Array.from(document.querySelectorAll('#sidebar li')).find(el => el.getAttribute('onclick').includes(contentId));
    newMenuItem.classList.add('active');
    
    gameState.currentMainContent = contentId;
}

function exitToStartScreen() {
    // Reseta o estado do jogo para um novo jogo
    gameState.userClub = null;
    showScreen('manager-creation-screen');
}


// --- Lógica de Inicialização do Jogo ---

function createManager() {
    const nameInput = document.getElementById('manager-name-input');
    if (nameInput.value.trim() === '') {
        alert('Por favor, digite seu nome.');
        return;
    }
    gameState.managerName = nameInput.value.trim();
    showScreen('start-screen');
}

/** Carrega as ligas na tela de seleção */
function loadLeagues() {
    const leagueSelectionDiv = document.getElementById('league-selection');
    leagueSelectionDiv.innerHTML = ''; 
    for (const leagueId in leaguesData) {
        const league = leaguesData[leagueId];
        const leagueCard = document.createElement('div');
        leagueCard.className = 'league-card';
        leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}"><span>${league.name}</span>`;
        leagueCard.onclick = () => loadTeams(leagueId);
        leagueSelectionDiv.appendChild(leagueCard);
    }
}

/** Carrega os times da liga selecionada */
function loadTeams(leagueId) {
    const teamSelectionDiv = document.getElementById('team-selection');
    teamSelectionDiv.innerHTML = '';
    const teams = leaguesData[leagueId].teams;
    for (const team of teams) {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`;
        teamCard.onclick = () => startGame(team);
        teamSelectionDiv.appendChild(teamCard);
    }
    showScreen('select-team-screen');
}

function createClub() {
    const clubName = document.getElementById('club-name-input').value;
    const clubInitials = document.getElementById('club-initials-input').value;

    if (!clubName || !clubInitials) {
        alert("Por favor, preencha o nome e as iniciais do clube.");
        return;
    }
    
    const generatedPlayers = [];
    for (let i = 0; i < 22; i++) {
        generatedPlayers.push({
            name: `*Jogador Gerado ${i + 1}`,
            position: "Genérico",
            attributes: { pace: 55, shooting: 55, passing: 55, dribbling: 55, defending: 55, physical: 55 },
            overall: 55
        });
    }

    const newClub = {
        name: clubName,
        logo: 'logo_default.png',
        players: generatedPlayers
    };

    startGame(newClub);
}


// --- Função Principal de Início do Jogo ---

/** Configura o estado do jogo e vai para a tela principal */
function startGame(team) {
    gameState.userClub = team;
    
    // Atualiza a UI com as informações do clube e treinador
    document.getElementById('header-manager-name').innerText = gameState.managerName;
    document.getElementById('header-club-name').innerText = gameState.userClub.name;
    document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`;
    
    // Carrega os dados nas telas
    loadSquadTable();
    
    // Vai para a tela principal do jogo
    showScreen('main-game-screen');
    showMainContent('home-content'); // Garante que a aba "Início" seja a primeira a ser vista
}


// --- Funções de Conteúdo ---

/** Monta e exibe a tabela do elenco */
function loadSquadTable() {
    const playerListDiv = document.getElementById('player-list-table');
    if (!gameState.userClub) return;

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Posição</th>
                    <th>Ritmo</th>
                    <th>Chute</th>
                    <th>Passe</th>
                    <th>Drible</th>
                    <th>Defesa</th>
                    <th>Físico</th>
                    <th>Overall</th>
                </tr>
            </thead>
            <tbody>
    `;
    for (const player of gameState.userClub.players) {
        tableHTML += `
            <tr>
                <td>${player.name}</td>
                <td>${player.position}</td>
                <td>${player.attributes.pace}</td>
                <td>${player.attributes.shooting}</td>
                <td>${player.attributes.passing}</td>
                <td>${player.attributes.dribbling}</td>
                <td>${player.attributes.defending}</td>
                <td>${player.attributes.physical}</td>
                <td><b>${player.overall}</b></td>
            </tr>
        `;
    }
    tableHTML += `</tbody></table>`;
    playerListDiv.innerHTML = tableHTML;
}

// --- Inicialização ---
// Roda quando o script é carregado
document.addEventListener('DOMContentLoaded', () => {
    loadLeagues();
});
