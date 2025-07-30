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
    currentMainContent: 'home-content',
    // NOVO: Objeto para armazenar as táticas
    tactics: {
        formation: '4-4-2',
        mentality: 'balanced',
        passing: 'mixed',
        attackWidth: 'normal',
        pressing: 5,
        defensiveLine: 'normal'
    }
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
    const currentPanel = document.getElementById(gameState.currentMainContent);
    if(currentPanel) currentPanel.classList.remove('active');
    
    const oldMenuItem = document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`);
    if (oldMenuItem) {
        oldMenuItem.classList.remove('active');
    }

    const newPanel = document.getElementById(contentId);
    if(newPanel) newPanel.classList.add('active');
    
    const newMenuItem = document.querySelector(`#sidebar li[data-content='${contentId}']`);
    if (newMenuItem) {
        newMenuItem.classList.add('active');
    }
    
    gameState.currentMainContent = contentId;
    
    // Se o painel de táticas for aberto, carrega as informações salvas
    if (contentId === 'tactics-content') {
        loadTacticsScreen();
    }
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
    if (!clubName) {
        alert("Por favor, preencha o nome do clube.");
        return;
    }
    
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

    const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers };
    startGame(newClub);
}

function startGame(team) {
    gameState.userClub = team;
    const leagueInfo = leaguesData[gameState.currentLeagueId].leagueInfo;
    const teams = leaguesData[gameState.currentLeagueId].teams;

    // Inicializa as táticas padrão no início do jogo
    gameState.tactics = {
        formation: '4-4-2', mentality: 'balanced', passing: 'mixed',
        attackWidth: 'normal', pressing: 5, defensiveLine: 'normal'
    };

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

// --- Lógica de Táticas ---

/** Carrega os valores salvos no gameState para a tela de táticas */
function loadTacticsScreen() {
    document.getElementById('tactic-formation').value = gameState.tactics.formation;
    document.getElementById('tactic-mentality').value = gameState.tactics.mentality;
    document.getElementById('tactic-passing').value = gameState.tactics.passing;
    document.getElementById('tactic-attack-width').value = gameState.tactics.attackWidth;
    document.getElementById('tactic-pressing').value = gameState.tactics.pressing;
    document.getElementById('pressing-value').innerText = gameState.tactics.pressing;
    document.getElementById('tactic-defensive-line').value = gameState.tactics.defensiveLine;
}

/** Salva os valores da tela de táticas no gameState */
function saveTactics() {
    gameState.tactics.formation = document.getElementById('tactic-formation').value;
    gameState.tactics.mentality = document.getElementById('tactic-mentality').value;
    gameState.tactics.passing = document.getElementById('tactic-passing').value;
    gameState.tactics.attackWidth = document.getElementById('tactic-attack-width').value;
    gameState.tactics.pressing = document.getElementById('tactic-pressing').value;
    gameState.tactics.defensiveLine = document.getElementById('tactic-defensive-line').value;

    alert('Plano tático salvo com sucesso!');
    console.log('Táticas salvas:', gameState.tactics);
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
            if (match.home.name !== gameState.userClub.name && match.away.name !== gameState.userClub.name) {
                // Futuramente, as táticas salvas em gameState.tactics influenciarão este resultado
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
    if (!gameState.userClub || !gameState.userClub.players) return;
    let tableHTML = `<table><thead><tr><th>Nome</th><th>Pos.</th><th>Veloc.</th><th>Finaliz.</th><th>Passe</th><th>Drible</th><th>Defesa</th><th>Físico</th><th>GERAL</th></tr></thead><tbody>`;
    for (const player of gameState.userClub.players) {
        tableHTML += `<tr><td>${player.name}</td><td>${player.position}</td><td>${player.attributes.pace}</td><td>${player.attributes.shooting}</td><td>${player.attributes.passing}</td><td>${player.attributes.dribbling}</td><td>${player.attributes.defending}</td><td>${player.attributes.physical}</td><td><b>${player.overall}</b></td></tr>`;
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

    if (match.homeScore > match.awayScore) {
        homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++;
    } else if (match.awayScore > match.homeScore) {
        awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++;
    } else {
        homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1;
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
                <div class="calendar-grid"><div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`;
    for (let i = 0; i < firstDay.getDay(); i++) { html += `<div class="calendar-day other-month"></div>`; }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const loopDate = new Date(year, month, i);
        const isCurrent = isSameDay(loopDate, gameState.currentDate);
        const hasMatch = gameState.schedule.some(m => isSameDay(new Date(m.date), loopDate));
        let dayClasses = 'calendar-day';
        if (hasMatch) dayClasses += ' match-day';
        if (isCurrent) dayClasses += ' current-day';
        html += `<div class="${dayClasses}">${i}</div>`;
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
    let clubes = [...teams];
    if (clubes.length % 2 !== 0) { clubes.push({ name: "BYE" }); }
    const numTeams = clubes.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const firstHalfMatches = [];
    for (let round = 0; round < numRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            const home = clubes[match];
            const away = clubes[numTeams - 1 - match];
            if (home.name !== "BYE" && away.name !== "BYE") {
                firstHalfMatches.push({ home, away });
            }
        }
        clubes.splice(1, 0, clubes.pop());
    }
    const secondHalfMatches = firstHalfMatches.map(match => ({ home: match.away, away: match.home }));
    const allMatches = [...firstHalfMatches, ...secondHalfMatches];
    const schedule = [];
    let roundDate = new Date(leagueInfo.startDate + 'T12:00:00Z');
    for (let i = 0; i < allMatches.length; i++) {
        if (i > 0 && i % matchesPerRound === 0) {
            roundDate.setDate(roundDate.getDate() + (roundDate.getDay() === 3 ? 3 : 4));
        }
        schedule.push({ ...allMatches[i], date: new Date(roundDate).toISOString(), status: 'scheduled' });
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
    document.getElementById('confirm-manager-name-btn').addEventListener('click', createManager);
    document.getElementById('go-to-new-club-btn').addEventListener('click', () => showScreen('new-club-screen'));
    document.getElementById('go-to-select-league-btn').addEventListener('click', () => showScreen('select-league-screen'));
    document.getElementById('create-new-club-btn').addEventListener('click', createClub);
    document.getElementById('new-club-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-league-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-team-back-btn').addEventListener('click', () => showScreen('select-league-screen'));
    document.getElementById('advance-day-button').addEventListener('click', advanceDay);
    document.getElementById('exit-game-btn').addEventListener('click', () => window.location.reload());
    
    // Listeners do menu lateral
    document.querySelectorAll('#sidebar li').forEach(item => {
        item.addEventListener('click', () => showMainContent(item.dataset.content));
    });

    // Listeners da tela de táticas
    document.getElementById('save-tactics-btn').addEventListener('click', saveTactics);
    document.getElementById('tactic-pressing').addEventListener('input', (e) => {
        document.getElementById('pressing-value').innerText = e.target.value;
    });
}

// --- Inicialização do Jogo ---
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadLeagues();
});
