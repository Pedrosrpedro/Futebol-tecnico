document.addEventListener('DOMContentLoaded', () => {

    const database = { leagues, players };
    const mainContent = document.getElementById('main-content');
    
    let gameState = {
        manager: {},
        difficulty: {},
        playerTeamId: null,
        currentDate: new Date(2025, 0, 1),
        tactics: { formation: '4-4-2', mentality: 'Equilibrada', lineup: {} }
    };

    let matchState = {};
    
    const formationLayouts = {
        '4-4-2': {'GOL':{r:5,c:3},'LD':{r:4,c:1},'ZAG1':{r:4,c:2},'ZAG2':{r:4,c:4},'LE':{r:4,c:5},'MD':{r:3,c:1},'MC1':{r:3,c:2},'MC2':{r:3,c:4},'ME':{r:3,c:5},'ATA1':{r:2,c:2},'ATA2':{r:2,c:4}},
        '4-3-3': {'GOL':{r:5,c:3},'LD':{r:4,c:1},'ZAG1':{r:4,c:2},'ZAG2':{r:4,c:4},'LE':{r:4,c:5},'VOL':{r:3,c:3},'MC1':{r:2,c:2},'MC2':{r:2,c:4},'PD':{r:1,c:1},'ATA':{r:1,c:3},'PE':{r:1,c:5}},
        '3-5-2': {'GOL':{r:5,c:3},'ZAG1':{r:4,c:2},'ZAG2':{r:4,c:3},'ZAG3':{r:4,c:4},'MD':{r:3,c:1},'MC1':{r:3,c:2},'MC2':{r:3,c:4},'ME':{r:3,c:5},'VOL':{r:2,c:3},'ATA1':{r:1,c:2},'ATA2':{r:1,c:4}}
    };

    function calculateTeamRatings(teamId, lineup, mentality) { /* ... */ }
    function processMatchMinute() { /* ... */ }
    function addCommentary(minute, text) { /* ... */ }

    function showMainMenu() {
        mainContent.innerHTML = `<div class="main-menu-container"><button class="menu-button" id="new-game">Novo Jogo</button><button class="menu-button" disabled>Carregar Jogo</button><button class="menu-button" id="credits">Créditos</button></div>`;
        document.getElementById('new-game').addEventListener('click', showManagerCreationScreen);
        document.getElementById('credits').addEventListener('click', () => alert('Criado por você com a ajuda da IA!'));
    }

    function showManagerCreationScreen() {
        mainContent.innerHTML = `<div class="setup-screen"><h2>Quem é você?</h2><div class="form-group"><label>Nome:</label><input type="text" id="first-name"></div><div class="form-group"><label>Sobrenome:</label><input type="text" id="last-name"></div><div class="form-group"><label>Nacionalidade:</label><select id="nationality"><option>Brasileiro</option></select></div><div class="form-group"><label>Vida Pessoal:</label><div class="toggle-switch"><input type="checkbox" id="family-feature"><label for="family-feature">Toggle</label></div></div><div class="navigation-buttons"><button class="menu-button" id="back-to-main">Voltar</button><button class="menu-button" id="next-step">Avançar</button></div></div>`;
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
        document.getElementById('next-step').addEventListener('click', () => {
            gameState.manager.firstName = document.getElementById('first-name').value || 'Manager';
            gameState.manager.lastName = document.getElementById('last-name').value || 'Padrão';
            gameState.manager.nationality = document.getElementById('nationality').value;
            gameState.manager.familyFeature = document.getElementById('family-feature').checked;
            if (gameState.manager.familyFeature) showFamilySetupScreen();
            else showDifficultyScreen();
        });
    }

    function showFamilySetupScreen() {
        mainContent.innerHTML = `<div class="setup-screen"><h2>Qual o seu status familiar?</h2><div class="family-container"><p>Defina sua situação familiar inicial.</p><div class="family-grid">${Array(8).fill('<div class="family-slot">+</div>').join('')}</div></div><div class="navigation-buttons"><button class="menu-button" id="back-to-manager">Voltar</button><button class="menu-button" id="next-step">Avançar</button></div></div>`;
        document.getElementById('back-to-manager').addEventListener('click', showManagerCreationScreen);
        document.getElementById('next-step').addEventListener('click', showDifficultyScreen);
    }
    
    function showDifficultyScreen() {
        mainContent.innerHTML = `<div class="setup-screen"><h2>Configuração de Dificuldade</h2><div class="form-group"><label>Orçamentos:</label><select id="budgets"><option>Baixo</option><option selected>Médio</option><option>Alto</option></select></div><div class="form-group"><label>Segurança no Emprego:</label><select id="job-security"><option>Alta</option><option selected>Normal</option><option>Baixa</option></select></div><div class="navigation-buttons"><button class="menu-button" id="back-to-setup">Voltar</button><button class="menu-button" id="next-step">Avançar</button></div></div>`;
        document.getElementById('back-to-setup').addEventListener('click', gameState.manager.familyFeature ? showFamilySetupScreen : showManagerCreationScreen);
        document.getElementById('next-step').addEventListener('click', () => {
            gameState.difficulty.budgets = document.getElementById('budgets').value;
            gameState.difficulty.jobSecurity = document.getElementById('job-security').value;
            selectLeagueScreen();
        });
    }
    
    function selectLeagueScreen() {
        const leagueButtonsHTML = database.leagues.map(league => `<button class="menu-button" data-league-id="${league.id}">${league.name}</button>`).join('');
        mainContent.innerHTML = `<div class="setup-screen"><h2>Selecione uma Liga</h2><div style="height: 500px; overflow-y: auto; padding: 10px;">${leagueButtonsHTML}</div><div class="navigation-buttons"><button class="menu-button" id="back-to-difficulty">Voltar</button></div></div>`;
        document.querySelectorAll('[data-league-id]').forEach(button => button.addEventListener('click', e => selectTeamScreen(e.target.getAttribute('data-league-id'))));
        document.getElementById('back-to-difficulty').addEventListener('click', showDifficultyScreen);
    }

    function selectTeamScreen(leagueId) {
        const league = database.leagues.find(l => l.id === leagueId);
        const teamButtonsHTML = league.teams.sort((a,b) => b.overall - a.overall).map(team => `<button class="menu-button" data-team-id="${team.id}">${team.name} (OVR: ${team.overall})</button>`).join('');
        mainContent.innerHTML = `<div class="setup-screen"><h2>Selecione um Time de ${league.name}</h2><div style="height: 500px; overflow-y: auto; padding: 10px;">${teamButtonsHTML}</div><div class="navigation-buttons"><button class="menu-button" id="back-to-leagues">Voltar</button></div></div>`;
        document.querySelectorAll('[data-team-id]').forEach(button => button.addEventListener('click', e => startGame(parseInt(e.currentTarget.getAttribute('data-team-id')))));
        document.getElementById('back-to-leagues').addEventListener('click', selectLeagueScreen);
    }

    function startGame(teamId) {
        gameState.playerTeamId = teamId;
        showClubHub();
    }
    
    function showClubHub() {
        const team = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        const familyButtonHTML = gameState.manager.familyFeature ? `<button class="hub-action-button" id="hub-family"><img src="images/family_icon.png" alt="Família"><span>Vida Pessoal</span></button>` : '';
        mainContent.innerHTML = `<h2>Painel do Clube - ${team.name}</h2><div class="club-hub-actions"><button class="hub-action-button" id="hub-squad"><img src="images/squad_icon.png" alt="Elenco"><span>Elenco</span></button><button class="hub-action-button" id="hub-tactics"><img src="images/tactics_icon.png" alt="Táticas"><span>Táticas</span></button><button class="hub-action-button" id="hub-calendar"><img src="images/calendar_icon.png" alt="Calendário"><span>Calendário</span></button>${familyButtonHTML}<button class="hub-action-button" id="hub-stadium" disabled><img src="images/stadium_icon.png" alt="Estádio"><span>Estádio</span></button></div><div class="navigation-buttons" style="margin-top: 40px;"><button class="menu-button" id="back-to-main">Sair para Menu</button></div>`;
        document.getElementById('hub-squad').addEventListener('click', showSquadScreen);
        document.getElementById('hub-tactics').addEventListener('click', () => showTacticsScreen('hub'));
        document.getElementById('hub-calendar').addEventListener('click', showCalendarScreen);
        if (gameState.manager.familyFeature) document.getElementById('hub-family').addEventListener('click', showFamilyScreen);
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
    }
    
    function showSquadScreen() { /* ... */ }
    function showFamilyScreen() { /* ... */ }
    
    function showCalendarScreen() {
        const myTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        const leagueTeams = database.leagues.find(l => l.teams.some(t => t.id === myTeam.id)).teams;
        const opponents = leagueTeams.filter(t => t.id !== myTeam.id).slice(0, 5);
        let fixtureHTML = '';
        for (let i = 0; i < opponents.length; i++) {
            let gameDate = new Date(gameState.currentDate);
            gameDate.setDate(gameDate.getDate() + (i * 7));
            fixtureHTML += `<tr><td>${gameDate.toLocaleDateString('pt-BR')}</td><td>${myTeam.name}</td><td><button class="menu-button" style="width:100px;padding:5px;" data-opponent-id="${opponents[i].id}">Jogar</button></td><td>${opponents[i].name}</td><td>Brasileirão Série A</td></tr>`;
        }
        mainContent.innerHTML = `<div class="calendar-container"><h2>Próximas Partidas</h2><table class="data-table"><thead><tr><th>Data</th><th colspan="3">Confronto</th><th>Competição</th></tr></thead><tbody>${fixtureHTML}</tbody></table><div class="navigation-buttons"><button class="menu-button" id="back-to-hub">Voltar</button></div></div>`;
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
        document.querySelectorAll('[data-opponent-id]').forEach(button => {
            button.addEventListener('click', (e) => startMatch(parseInt(e.currentTarget.getAttribute('data-opponent-id'))));
        });
    }

    function startMatch(opponentId) {
        matchState = {
            intervalId: null, minute: 0, homeScore: 0, awayScore: 0,
            homeTeamId: gameState.playerTeamId, awayTeamId: opponentId, commentary: [],
        };
        addCommentary(0, 'A partida vai começar!');
        updateMatchScreen(); // Renderiza a tela da partida pela primeira vez
        matchState.intervalId = setInterval(processMatchMinute, 1000);
    }
    
    function updateMatchScreen() {
        if (!document.querySelector('.match-container')) return; // Impede erro se a tela não estiver visível
        const homeTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === matchState.homeTeamId);
        const awayTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === matchState.awayTeamId);
        const commentaryHTML = matchState.commentary.map(e => `<div class="commentary-entry"><span class="minute">${e.minute}'</span><span class="text">${e.text}</span></div>`).join('');
        document.querySelector('.scoreboard').innerText = `${homeTeam.name} ${matchState.homeScore} x ${matchState.awayScore} ${awayTeam.name}`;
        document.querySelector('.match-time').innerText = `${matchState.minute}'`;
        document.querySelector('.commentary-box').innerHTML = commentaryHTML;
    }
    
    function showTacticsScreen(context = 'hub') { /* ... */ }
    function saveCurrentTactics() { /* ... */ }

    // --- INICIALIZAÇÃO ---
    showMainMenu();
});
