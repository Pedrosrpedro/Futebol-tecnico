// --- Estado do Jogo ---
const gameState = {
    managerName: null,
    userClub: null,
    currentLeagueId: null,
    currentDate: null,
    leagueTable: [],
    schedule: [],
    nextUserMatch: null,
    currentScreen: 'manager-creation-screen',
    currentMainContent: 'home-content'
};

// --- Funções de Navegação ---

/** Mostra uma tela principal e esconde as outras */
function showScreen(screenId) {
    const current = document.getElementById(gameState.currentScreen);
    if (current) {
        current.classList.remove('active');
    }
    const next = document.getElementById(screenId);
    if (next) {
        next.classList.add('active');
    }
    gameState.currentScreen = screenId;
}

/** Mostra um painel de conteúdo dentro da tela principal do jogo */
function showMainContent(contentId) {
    // Esconde o painel e desativa o item de menu antigo
    document.getElementById(gameState.currentMainContent).classList.remove('active');
    const oldMenuItem = document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`);
    if (oldMenuItem) {
        oldMenuItem.classList.remove('active');
    }

    // Mostra o novo painel e ativa o novo item de menu
    document.getElementById(contentId).classList.add('active');
    const newMenuItem = document.querySelector(`#sidebar li[data-content='${contentId}']`);
    if (newMenuItem) {
        newMenuItem.classList.add('active');
    }
    
    gameState.currentMainContent = contentId;
}

/** Função para trocar de aba (Tabela/Calendário) */
function openTab(evt) {
    const tabId = evt.target.dataset.tab;
    const parent = evt.target.closest('.main-content-panel');
    parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    parent.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
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

function loadLeagues() {
    const leagueSelectionDiv = document.getElementById('league-selection');
    leagueSelectionDiv.innerHTML = '';
    for (const leagueId in leaguesData) {
        const league = leaguesData[leagueId];
        const leagueCard = document.createElement('div');
        leagueCard.className = 'league-card';
        leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}"><span>${league.name}</span>`;
        leagueCard.addEventListener('click', () => loadTeams(leagueId));
        leagueSelectionDiv.appendChild(leagueCard);
    }
}

function loadTeams(leagueId) {
    gameState.currentLeagueId = leagueId;
    const teamSelectionDiv = document.getElementById('team-selection');
    teamSelectionDiv.innerHTML = '';
    const teams = leaguesData[leagueId].teams;
    for (const team of teams) {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`;
        teamCard.addEventListener('click', () => startGame(team));
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
    
    // Associa o clube criado à primeira liga da lista por padrão
    gameState.currentLeagueId = Object.keys(leaguesData)[0]; 

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

function startGame(team) {
    gameState.userClub = team;
    const leagueInfo = leaguesData[gameState.currentLeagueId].leagueInfo;
    const teams = leaguesData[gameState.currentLeagueId].teams;

    gameState.currentDate = new Date(leagueInfo.startDate + 'T12:00:00');
    gameState.schedule = generateSchedule(teams, leagueInfo);
    gameState.leagueTable = initializeLeagueTable(teams);
    findNextUserMatch();

    document.getElementById('header-manager-name').innerText = gameState.managerName;
    document.getElementById('header-club-name').innerText = gameState.userClub.name;
    document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`;
    
    loadSquadTable();
    updateLeagueTable();
    updateCalendar();
    updateContinueButton();
    
    showScreen('main-game-screen');
    showMainContent('home-content');
}

// --- Funções de Avanço e Simulação ---

function advanceDay() {
    gameState.currentDate.setDate(gameState.currentDate.getDate() + 1);
    simulateDayMatches();
    updateLeagueTable();
    updateCalendar();
    updateContinueButton();
}

function updateContinueButton() {
    const button = document.getElementById('advance-day-button');
    const displayDate = document.getElementById('current-date-display');
    
    displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) {
        button.innerText = "JOGAR PARTIDA";
        button.disabled = true;
    } else {
        button.innerText = "Avançar";
        button.disabled = false;
    }
}

function simulateDayMatches() {
    const todayMatches = gameState.schedule.filter(match => isSameDay(new Date(match.date), gameState.currentDate));
    for (const match of todayMatches) {
        if (match.status === 'scheduled') {
            // Simula apenas jogos que não envolvem o usuário
            if (match.home.name !== gameState.userClub.name && match.away.name !== gameState.userClub.name) {
                match.homeScore = Math.floor(Math.random() * 4);
                match.awayScore = Math.floor(Math.random() * 4);
                match.status = 'played';
                updateTableWithResult(match);
            }
        }
    }
}

// --- Funções de Atualização da Interface (UI) ---

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

function updateTableWithResult(match) {
    const homeTeam = gameState.leagueTable.find(t => t.name === match.home.name);
    const awayTeam = gameState.leagueTable.find(t => t.name === match.away.name);

    if (!homeTeam || !awayTeam) return;

    homeTeam.played++;
    awayTeam.played++;
    homeTeam.goalsFor += match.homeScore;
    homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore;
    awayTeam.goalsAgainst += match.homeScore;
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (match.homeScore > match.awayScore) { // Vitória do time da casa
        homeTeam.wins++;
        homeTeam.points += 3;
        awayTeam.losses++;
    } else if (match.awayScore > match.homeScore) { // Vitória do visitante
        awayTeam.wins++;
        awayTeam.points += 3;
        homeTeam.losses++;
    } else { // Empate
        homeTeam.draws++;
        awayTeam.draws++;
        homeTeam.points += 1;
        awayTeam.points += 1;
    }
}

function updateLeagueTable() {
    const container = document.getElementById('league-table-container');
    const tiebreakers = leaguesData[gameState.currentLeagueId].leagueInfo.tiebreakers;

    gameState.leagueTable.sort((a, b) => {
        for (const key of tiebreakers) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
        }
        return 0;
    });

    let tableHTML = `<table><thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>`;
    gameState.leagueTable.forEach((team, index) => {
        const isUserTeam = team.name === gameState.userClub.name;
        tableHTML += `<tr class="${isUserTeam ? 'user-team-row' : ''}"><td>${index + 1}</td><td>${team.name}</td><td>${team.points}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

function updateCalendar() {
    const container = document.getElementById('calendar-container');
    const date = gameState.currentDate;
    const month = date.getMonth();
    const year = date.getFullYear();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let html = `<div class="calendar-header"><h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3></div>
                <div class="calendar-grid">
                    <div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`;

    for (let i = 0; i < firstDay.getDay(); i++) {
        html += `<div class="calendar-day other-month"></div>`;
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const loopDate = new Date(year, month, i);
        const hasMatch = gameState.schedule.some(m => isSameDay(new Date(m.date), loopDate));
        html += `<div class="calendar-day ${hasMatch ? 'match-day' : ''}">${i}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

// --- Funções Auxiliares ---

function findNextUserMatch() {
    gameState.nextUserMatch = gameState.schedule
        .filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

function initializeLeagueTable(teams) {
    return teams.map(team => ({
        name: team.name, logo: team.logo, played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    }));
}

function generateSchedule(teams, leagueInfo) {
    const schedule = [];
    let clubes = [...teams];
    if (clubes.length % 2 !== 0) {
        clubes.push({ name: "BYE" });
    }
    const numRounds = clubes.length - 1;
    const half = clubes.length / 2;
    let roundDate = new Date(leagueInfo.startDate + 'T12:00:00Z');
    
    let allMatches = [];
    for (let i = 0; i < numRounds; i++) {
        for (let j = 0; j < half; j++) {
            const home = clubes[j];
            const away = clubes[clubes.length - 1 - j];
            if (home.name !== "BYE" && away.name !== "BYE") {
                allMatches.push({ home, away });
            }
        }
        clubes.splice(1, 0, clubes.pop());
    }
    
    // Ida e volta
    const numMatchesInSeason = allMatches.length;
    for(let i=0; i<numMatchesInSeason; i++) {
        let match;
        if (i < numMatchesInSeason / 2) { // Jogos de ida
            match = allMatches[i];
        } else { // Jogos de volta
            let returnMatch = allMatches[i - numMatchesInSeason / 2];
            match = { home: returnMatch.away, away: returnMatch.home };
        }
        
        schedule.push({ 
            home: match.home, 
            away: match.away, 
            date: new Date(roundDate).toISOString(), 
            status: 'scheduled' 
        });

        // Avança data da rodada
        if ((i + 1) % half === 0) {
            roundDate.setDate(roundDate.getDate() + (roundDate.getDay() === 6 ? 4 : 3)); // Avança para próxima rodada
        }
    }

    return schedule.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}


// --- Central de Eventos ---

function initializeEventListeners() {
    // Tela de Criação de Treinador
    document.getElementById('confirm-manager-name-btn').addEventListener('click', createManager);

    // Tela Inicial
    document.getElementById('go-to-new-club-btn').addEventListener('click', () => showScreen('new-club-screen'));
    document.getElementById('go-to-select-league-btn').addEventListener('click', () => showScreen('select-league-screen'));

    // Tela de Criação de Clube
    document.getElementById('create-new-club-btn').addEventListener('click', createClub);
    document.getElementById('new-club-back-btn').addEventListener('click', () => showScreen('start-screen'));
    
    // Telas de Seleção
    document.getElementById('select-league-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-team-back-btn').addEventListener('click', () => showScreen('select-league-screen'));
    
    // Tela Principal
    document.getElementById('advance-day-button').addEventListener('click', advanceDay);
    document.getElementById('exit-game-btn').addEventListener('click', () => window.location.reload());

    // Menu Lateral (Sidebar)
    document.querySelectorAll('#sidebar li').forEach(item => {
        item.addEventListener('click', () => showMainContent(item.dataset.content));
    });

    // Abas (Tabela/Calendário)
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', openTab);
    });
}

// --- Inicialização do Jogo ---
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadLeagues();
});
