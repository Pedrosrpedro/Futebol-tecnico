let currentScreen = 'start-screen';
let userClub = null;

// Função para navegar entre as telas
function showScreen(screenId) {
    document.getElementById(currentScreen).classList.remove('active');
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

// Carrega as ligas na tela de seleção
function loadLeagues() {
    const leagueSelectionDiv = document.getElementById('league-selection');
    leagueSelectionDiv.innerHTML = ''; // Limpa a seleção anterior
    for (const leagueId in leaguesData) {
        const league = leaguesData[leagueId];
        const leagueCard = document.createElement('div');
        leagueCard.className = 'league-card';
        leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}"><span>${league.name}</span>`;
        leagueCard.onclick = () => loadTeams(leagueId);
        leagueSelectionDiv.appendChild(leagueCard);
    }
}

// Carrega os times da liga selecionada
function loadTeams(leagueId) {
    const teamSelectionDiv = document.getElementById('team-selection');
    teamSelectionDiv.innerHTML = '';
    const teams = leaguesData[leagueId].teams;
    for (const team of teams) {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`;
        teamCard.onclick = () => selectTeam(team);
        teamSelectionDiv.appendChild(teamCard);
    }
    showScreen('select-team-screen');
}

// Seleciona um time e inicia o jogo
function selectTeam(team) {
    userClub = team;
    document.getElementById('club-name-header').innerText = userClub.name;
    showScreen('main-menu-screen');
    loadSquad();
}

// Cria um novo clube
function createClub() {
    const clubName = document.getElementById('club-name-input').value;
    const clubInitials = document.getElementById('club-initials-input').value;

    if (!clubName || !clubInitials) {
        alert("Por favor, preencha o nome e as iniciais do clube.");
        return;
    }

    // Lógica para gerar jogadores para o novo clube (simplificado por enquanto)
    const generatedPlayers = [];
    for (let i = 0; i < 22; i++) {
        generatedPlayers.push({
            name: `*Jogador Gerado ${i + 1}`,
            position: "Desconhecida",
            attributes: { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 },
            overall: 60
        });
    }

    userClub = {
        name: clubName,
        initials: clubInitials,
        logo: 'logo_default.png', // Você precisará de um logo padrão
        players: generatedPlayers
    };

    document.getElementById('club-name-header').innerText = userClub.name;
    showScreen('main-menu-screen');
    loadSquad();
}


// Carrega o elenco na tela de elenco
function loadSquad() {
    const playerListDiv = document.getElementById('player-list');
    if (!userClub) return;

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Posição</th>
                    <th>Overall</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const player of userClub.players) {
        tableHTML += `
            <tr>
                <td>${player.name}</td>
                <td>${player.position}</td>
                <td>${player.overall}</td>
            </tr>
        `;
    }

    tableHTML += `</tbody></table>`;
    playerListDiv.innerHTML = tableHTML;
}


// Evento que inicia o jogo quando o HTML é carregado
document.addEventListener('DOMContentLoaded', () => {
    loadLeagues();
});
