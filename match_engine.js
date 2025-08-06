let matchInterval;
const SIMULATION_DURATION_MS = 4 * 60 * 1000;

function promptMatchConfirmation() { if (!gameState.nextUserMatch) return; document.getElementById('match-confirmation-modal').classList.add('active'); }

function startMatchSimulation() {
    document.getElementById('match-confirmation-modal').classList.remove('active');
    const startingXIKeys = Object.keys(gameState.squadManagement.startingXI);
    if (startingXIKeys.length !== 11 || startingXIKeys.some(key => !gameState.squadManagement.startingXI[key] || !gameState.squadManagement.startingXI[key].name)) {
        showInfoModal("Escalação Incompleta", "Você precisa de 11 jogadores na escalação titular para começar a partida!");
        showMainContent('tactics-content');
        return;
    }

    showScreen('match-simulation-screen');
    
    setTimeout(() => {
        gameState.isMatchLive = true;
        gameState.isPaused = false;
        const userTeam = gameState.userClub;
        const opponentTeam = gameState.nextUserMatch.home.name === userTeam.name ? gameState.nextUserMatch.away : gameState.nextUserMatch.home;
        const opponentSquad = setupOpponentSquad(opponentTeam);
        gameState.matchState = {
            home: gameState.nextUserMatch.home.name === userTeam.name ? { team: userTeam, ...gameState.squadManagement, formation: formationLayouts[gameState.tactics.formation], tactics: gameState.tactics } : { team: opponentTeam, ...opponentSquad },
            away: gameState.nextUserMatch.away.name === userTeam.name ? { team: userTeam, ...gameState.squadManagement, formation: formationLayouts[gameState.tactics.formation], tactics: gameState.tactics } : { team: opponentTeam, ...opponentSquad },
            score: { home: 0, away: 0 },
            gameTime: 0,
            elapsedRealTime: 0,
            half: 1,
            playerPositions: new Map(),
            playerRatings: new Map(),
            playerIntents: new Map(),
            aiDecisionTimer: 0,
            lastPasser: null,
            possession: 'home',
            playState: 'kickoff',
            stateTimer: 0,
            ball: { y: 50, x: 50, targetY: 50, targetX: 50, speed: 0, owner: null }
        };
        
        initializeMatchPlayers();
        
        document.getElementById('match-home-team-name').innerText = gameState.matchState.home.team.name;
        document.getElementById('match-home-team-logo').src = `images/${gameState.matchState.home.team.logo}`;
        document.getElementById('match-away-team-name').innerText = gameState.matchState.away.team.name;
        document.getElementById('match-away-team-logo').src = `images/${gameState.matchState.away.team.logo}`;
        
        updateScoreboard();
        resizeCanvas();
        setPlayState('kickoff'); 
        matchInterval = setInterval(gameLoop, 50);

        setInterval(() => { if (gameState.isMatchLive && !gameState.isPaused) { updatePlayerRatings(); } }, 30000);
    }, 500); 
}

function setupOpponentSquad(team) {
    const todosJogadores = [...team.players].sort((a, b) => b.overall - a.overall);
    const startingXI = {};
    const formationKey = Object.keys(formationLayouts)[Math.floor(Math.random() * 4)];
    const formation = formationLayouts[formationKey];
    const posicoesDaFormacao = Object.keys(formation);
    let jogadoresDisponiveis = [...todosJogadores];
    for (const posicao of posicoesDaFormacao) {
        if (jogadoresDisponiveis.length > 0) {
            startingXI[posicao] = jogadoresDisponiveis.shift();
        }
    }
    const substitutes = jogadoresDisponiveis.splice(0, 7);
    const reserves = jogadoresDisponiveis;
    const tactics = { mentality: 'balanced', defensiveLine: 'standard', onPossessionLoss: 'regroup', buildUp: 'pass_into_space', attackingWidth: 'normal' };
    return { startingXI, substitutes, reserves, formation, tactics };
}

function initializeMatchPlayers() {
    const { home, away } = gameState.matchState;
    const allPlayers = [...Object.values(home.startingXI), ...Object.values(away.startingXI)];
    
    allPlayers.forEach(player => {
        if (player) {
            gameState.matchState.playerRatings.set(player.name, 6.0);
            gameState.matchState.playerPositions.set(player.name, { x: 50, y: 50 });
            gameState.matchState.playerIntents.set(player.name, { action: 'hold_position', target: null });
        }
    });

    resetPlayersToKickoffPositions();
}

function gameLoop() {
    if (!gameState.isMatchLive) return;
    
    const interval = 50;
    
    if (!gameState.isPaused) {
        gameState.matchState.elapsedRealTime += interval;
        gameState.matchState.gameTime = (gameState.matchState.elapsedRealTime / SIMULATION_DURATION_MS) * 90;
    }

    if (gameState.matchState.stateTimer > 0) {
        gameState.matchState.stateTimer -= interval;
    } else if (gameState.matchState.playState !== 'playing') {
         setPlayState('playing');
    }

    if (gameState.matchState.gameTime >= 45 && gameState.matchState.half === 1) {
        gameState.matchState.half = 2;
        gameState.matchState.gameTime = 45;
        gameState.matchState.elapsedRealTime = SIMULATION_DURATION_MS / 2;
        document.getElementById('match-time-status').innerText = "INTERVALO";
        togglePause(true);
        setPlayState('kickoff');
        return;
    }
    
    if (gameState.matchState.gameTime >= 90) {
        endMatch();
        return;
    }

    if (gameState.isPaused) return;

    updateScoreboard();

    if (gameState.matchState.playState === 'playing') {
        gameState.matchState.aiDecisionTimer -= interval;
        if (gameState.matchState.aiDecisionTimer <= 0) {
            updateAIIntents();
            gameState.matchState.aiDecisionTimer = 1000 + Math.random() * 500;
        }
    }
    
    executePlayerActions();
    movePlayers();
    moveBall();
    checkBallState();
    drawMatch();
}

function updateAIIntents() {
    const { ball, playerIntents, home, away } = gameState.matchState;
    const allPlayers = [...Object.values(home.startingXI), ...Object.values(away.startingXI)];

    for (const player of allPlayers) {
        if (!player) continue;

        const teamKey = getPlayerTeam(player);
        const playerPos = gameState.matchState.playerPositions.get(player.name);
        
        if (ball.owner === player) {
            const options = [];
            const goalX = teamKey === 'home' ? 100 : 0;
            const distToGoal = Math.hypot(playerPos.x - goalX, playerPos.y - 50);
            if (distToGoal < 25) {
                options.push({ action: 'shoot', score: player.attributes.shooting - distToGoal });
            }

            const bestPass = findBestPassTarget(player);
            if (bestPass.target) {
                let passScore = player.attributes.passing + bestPass.score;
                options.push({ action: 'pass', target: bestPass.target, score: passScore });
            }

            options.push({ action: 'dribble', score: player.attributes.dribbling - 20 });

            const bestOption = options.sort((a, b) => b.score - a.score)[0];
            if (bestOption) {
                playerIntents.set(player.name, { action: bestOption.action, target: bestOption.target || null });
            }
        } else {
            const isDefending = teamKey !== gameState.matchState.possession && gameState.matchState.possession !== null;
            if (isDefending) {
                const closestToBall = getClosestPlayer(ball, teamKey).player;
                if (player === closestToBall) {
                    playerIntents.set(player.name, { action: 'press_ball_carrier', target: null });
                } else {
                     playerIntents.set(player.name, { action: 'hold_position', target: null });
                }
            } else {
                playerIntents.set(player.name, { action: 'support_play', target: null });
            }
        }
    }
}

function executePlayerActions() {
    const { ball, playerIntents } = gameState.matchState;
    if (!ball.owner) return;

    const owner = ball.owner;
    const intent = playerIntents.get(owner.name);

    switch(intent.action) {
        case 'shoot':
            resolveShot(owner);
            playerIntents.set(owner.name, { action: 'hold_position', target: null });
            break;
        case 'pass':
            const targetPlayer = intent.target;
            const targetPos = gameState.matchState.playerPositions.get(targetPlayer.name);
            
            ball.targetX = targetPos.x;
            ball.targetY = targetPos.y;
            ball.speed = 1.2 + (owner.attributes.passing / 200);
            
            const passError = 10 - (owner.attributes.passing / 10);
            ball.targetX += (Math.random() - 0.5) * passError;
            ball.targetY += (Math.random() - 0.5) * passError;
            
            gameState.matchState.lastPasser = owner;
            ball.owner = null;
            gameState.matchState.possession = null;
            playerIntents.set(owner.name, { action: 'hold_position', target: null });
            break;
        case 'dribble':
            const teamKey = getPlayerTeam(owner);
            const dribbleTarget = { x: ball.x + (teamKey === 'home' ? 10 : -10), y: ball.y + (Math.random() - 0.5) * 15 };
            ball.targetX = dribbleTarget.x;
            ball.targetY = dribbleTarget.y;
            ball.speed = 0.5;
            break;
    }
}

function findBestPassTarget(passer) {
    const passerPos = gameState.matchState.playerPositions.get(passer.name);
    const teamKey = getPlayerTeam(passer);
    const team = gameState.matchState[teamKey];
    const teammates = Object.values(team.startingXI).filter(p => p && p.name !== passer.name);
    
    let bestTarget = null;
    let maxScore = -Infinity;

    for (const teammate of teammates) {
        if (gameState.matchState.lastPasser && teammate.name === gameState.matchState.lastPasser.name) continue;

        const targetPos = gameState.matchState.playerPositions.get(teammate.name);
        const opponent = getClosestPlayer(targetPos, teamKey === 'home' ? 'away' : 'home');
        
        const distToPasser = Math.hypot(passerPos.y - targetPos.y, passerPos.x - targetPos.x);
        const distForward = (teamKey === 'home') ? (targetPos.x - passerPos.x) : (passerPos.x - targetPos.x);

        let score = 0;
        score += distForward * 0.5;
        score += opponent.distance * 1.5; 
        score -= distToPasser * 0.2;

        if (score > maxScore) {
            maxScore = score;
            bestTarget = teammate;
        }
    }
    return { target: bestTarget, score: maxScore };
}

function resolveShot(shooter) {
    const { ball, possession } = gameState.matchState;
    const teamKey = getPlayerTeam(shooter);
    const goalX = teamKey === 'home' ? 100 : 0;
    const defendingTeamKey = teamKey === 'home' ? 'away' : 'home';
    const keeper = gameState.matchState[defendingTeamKey].startingXI['GK'];

    showNotification(`Chute de ${shooter.name}!`);
    ball.targetX = goalX;
    ball.targetY = 50 + (Math.random() - 0.5) * PITCH_DIMS.goalHeight;
    ball.speed = 2.0;

    const shotPower = (shooter.attributes.shooting * 0.7) + (Math.random() * 30);
    const savePower = (keeper.attributes.defending * 0.8) + (Math.random() * 30);

    if (shotPower > savePower) {
        if (Math.random() < 0.1) {
            showNotification("NA TRAVE!");
            setPlayState('goalKick', defendingTeamKey);
        } else {
            gameState.matchState.score[teamKey]++;
            showNotification(`GOL! ${shooter.name} marca!`);
            setPlayState('goal');
        }
    } else {
        showNotification(`Defesa do goleiro ${keeper.name}!`);
        setPlayState(Math.random() > 0.5 ? 'corner' : 'goalKick', Math.random() > 0.5 ? teamKey : defendingTeamKey);
    }
    ball.owner = null;
    gameState.matchState.possession = null;
    gameState.matchState.lastPasser = null;
}

function checkBallState() {
    const { ball } = gameState.matchState;
    if (gameState.matchState.stateTimer > 0) return;

    if (ball.x < PITCH_DIMS.left) setPlayState('goalKick', 'home');
    else if (ball.x > PITCH_DIMS.right) setPlayState('goalKick', 'away');
    else if (ball.y < PITCH_DIMS.top || ball.y > PITCH_DIMS.bottom) {
        const attackingTeam = ball.x > 50 ? 'home' : 'away';
        setPlayState('throwIn', attackingTeam === 'home' ? 'away' : 'home');
    }

    if (ball.owner === null && ball.speed < 0.1 && gameState.matchState.playState === 'playing') {
        const closest = getClosestPlayer(ball);
        if (closest.player && closest.distance < 4) {
            ball.owner = closest.player;
            const newPossessionTeam = getPlayerTeam(closest.player);
            if (gameState.matchState.possession !== newPossessionTeam) {
                showNotification("Recuperação de bola!");
            }
            gameState.matchState.possession = newPossessionTeam;
            gameState.matchState.lastPasser = null;
        }
    }
}

function getClosestPlayer(target, teamKey = null) { let closestPlayer = null; let minDistance = Infinity; const teamsToScan = teamKey ? [gameState.matchState[teamKey]] : [gameState.matchState.home, gameState.matchState.away]; for (const team of teamsToScan) { for(const player of Object.values(team.startingXI)) { if(!player) continue; const playerPos = gameState.matchState.playerPositions.get(player.name); const distance = Math.hypot(playerPos.y - target.y, playerPos.x - target.x); if (distance < minDistance) { minDistance = distance; closestPlayer = player; } } } return { player: closestPlayer, distance: minDistance }; }
function getPlayerTeam(player) { if(!player) return null; return Object.values(gameState.matchState.home.startingXI).some(p => p && p.name === player.name) ? 'home' : 'away'; }

function moveBall() {
    const { ball } = gameState.matchState;
    if (ball.speed > 0) {
        const distY = ball.targetY - ball.y;
        const distX = ball.targetX - ball.x;
        const distance = Math.hypot(distY, distX);

        if (distance < ball.speed) {
            ball.y = ball.targetY;
            ball.x = ball.targetX;
            ball.speed *= 0.8;
            if(ball.speed < 0.1) ball.speed = 0;
        } else {
            ball.y += (distY / distance) * ball.speed;
            ball.x += (distX / distance) * ball.speed;
        }
    } else if (ball.owner) {
        const ownerPos = gameState.matchState.playerPositions.get(ball.owner.name);
        ball.x = ownerPos.x;
        ball.y = ownerPos.y;
    }
}

function getPlayerHomePosition(player, playerPosId, teamKey) {
    const team = gameState.matchState[teamKey];
    const [baseY, baseX] = team.formation[playerPosId]; 
    let tacticalX = baseX, tacticalY = baseY;

    if (player.position.includes('W') || player.position.includes('B')) {
        if (team.tactics.attackingWidth === 'wide') tacticalX = (tacticalX > 50) ? 95 : 5;
        else if (team.tactics.attackingWidth === 'narrow') tacticalX = (tacticalX > 50) ? 75 : 25;
    }
    
    let yShift = 0;
    const mentality = team.tactics.mentality;
    if (mentality === 'very_attacking') yShift = 10;
    else if (mentality === 'attacking') yShift = 5;
    else if (mentality === 'defensive') yShift = -5;
    else if (mentality === 'very_defensive') yShift = -10;
    
    if (player.position === 'CB' || player.position === 'LB' || player.position === 'RB') {
        if(team.tactics.defensiveLine === 'higher') yShift += 5;
        if(team.tactics.defensiveLine === 'deeper') yShift -= 5;
    }

    tacticalY += yShift;
    
    return teamKey === 'home' ? [tacticalY, tacticalX] : [100 - tacticalY, 100 - tacticalX];
}

function movePlayers() {
    const { ball, playerIntents, playerPositions } = gameState.matchState;

    for (const [playerName, playerPos] of playerPositions.entries()) {
        const player = findTeamInLeagues(playerName, true);
        if (!player) continue;

        const teamKey = getPlayerTeam(player);
        const team = gameState.matchState[teamKey];
        const posId = Object.keys(team.startingXI).find(key => team.startingXI[key] === player);
        if (!posId) continue;
        
        const [homeY, homeX] = getPlayerHomePosition(player, posId, teamKey);
        let targetX = homeX, targetY = homeY;
        const intent = playerIntents.get(playerName);

        switch(intent.action) {
            case 'press_ball_carrier':
                if (ball.owner) {
                    const ownerPos = playerPositions.get(ball.owner.name);
                    targetX = ownerPos.x;
                    targetY = ownerPos.y;
                }
                break;
            case 'support_play':
                targetX += (ball.x - targetX) * 0.3;
                targetY += (ball.y - targetY) * 0.3;
                const distForward = (teamKey === 'home') ? (targetY - playerPos.y) : (playerPos.y - targetY);
                if (distForward > 0 && player.position !== 'CB') {
                    targetY += (teamKey === 'home' ? 10 : -10);
                }
                break;
            default: // hold_position
                targetX = homeX;
                targetY = homeY;
                break;
        }

        const moveSpeed = 0.05 + (player.attributes.pace / 2000);
        playerPos.x += (targetX - playerPos.x) * moveSpeed;
        playerPos.y += (targetY - playerPos.y) * moveSpeed;

        playerPos.x = Math.max(0, Math.min(100, playerPos.x));
        playerPos.y = Math.max(0, Math.min(100, playerPos.y));
    }
}

function resetPlayersToKickoffPositions() {
    const { home, away, possession } = gameState.matchState;

    for (const teamKey of ['home', 'away']) {
        const team = gameState.matchState[teamKey];
        for (const posId in team.startingXI) {
            const player = team.startingXI[posId];
            if (player) {
                const [y, x] = team.formation[posId];
                const playerPos = gameState.matchState.playerPositions.get(player.name);
                
                if (teamKey === 'home') {
                    playerPos.y = y * 0.9;
                    playerPos.x = x;
                    if (playerPos.y >= 50) playerPos.y = 48;
                } else {
                    playerPos.y = 100 - (y * 0.9);
                    playerPos.x = 100 - x;
                    if (playerPos.y < 50) playerPos.y = 52;
                }
            }
        }
    }
    
    const kickoffTeamKey = possession;
    const kickoffTeam = gameState.matchState[kickoffTeamKey];
    const kicker = Object.values(kickoffTeam.startingXI).find(p => p && (p.position === 'ST' || p.position === 'CAM'));
    if (kicker) {
        const kickerPos = gameState.matchState.playerPositions.get(kicker.name);
        kickerPos.y = kickoffTeamKey === 'home' ? 49.5 : 50.5;
        kickerPos.x = 50;
    }
}

function setPlayState(newState, teamToAct = null) {
    gameState.matchState.playState = newState;
    const { ball } = gameState.matchState;
    let setupTime = 1500;

    switch(newState) {
        case 'kickoff':
            gameState.matchState.possession = teamToAct || (gameState.matchState.half === 1 ? 'home' : 'away');
            resetPlayersToKickoffPositions();
            ball.y = 50; ball.x = 50; ball.targetY = 50; ball.targetX = 50; ball.speed = 0;
            ball.owner = getClosestPlayer({x: 50, y: 50}, gameState.matchState.possession).player;
            showNotification(gameState.matchState.gameTime < 1 ? "Apito Inicial!" : "Bola rolando!");
            setupTime = 2500;
            break;
        
        case 'playing':
            gameState.matchState.stateTimer = 0;
            return;

        case 'goal':
            setupTime = 4000;
            break;

        case 'goalKick':
            gameState.matchState.possession = teamToAct;
            ball.owner = gameState.matchState[teamToAct].startingXI['GK'];
            const ownerPos = gameState.matchState.playerPositions.get(ball.owner.name);
            ball.targetY = ownerPos.y; ball.targetX = ownerPos.x; ball.speed = 1;
            showNotification(`Tiro de meta para ${gameState.matchState[teamToAct].team.name}.`);
            break;

        case 'corner':
            gameState.matchState.possession = teamToAct;
            ball.owner = null;
            ball.targetY = teamToAct === 'home' ? 99 : 1;
            ball.targetX = Math.random() < 0.5 ? 1 : 99;
            ball.speed = 1.5;
            showNotification(`Escanteio para ${gameState.matchState[teamToAct].team.name}!`);
            setupTime = 3000;
            break;
        
        case 'throwIn':
             gameState.matchState.possession = teamToAct;
             ball.x = ball.x < 50 ? 0.1 : 99.9;
             ball.speed = 0;
             showNotification(`Lateral para ${gameState.matchState[teamToAct].team.name}.`);
             break;
    }

    gameState.matchState.stateTimer = setupTime;
}

function endMatch() { clearInterval(matchInterval); gameState.isMatchLive = false; document.getElementById('match-time-status').innerText = 'FIM DE JOGO'; const match = gameState.allMatches.find(m => isSameDay(new Date(m.date), new Date(gameState.nextUserMatch.date))); if (match) { match.status = 'played'; match.homeScore = gameState.matchState.score.home; match.awayScore = gameState.matchState.score.away; if (match.round !== 'Amistoso') { const leagueId = Object.keys(leaguesData).find(id => leaguesData[id].teams.some(t => t.name === match.home.name)); updateTableWithResult(leagueId, match); } } showPostMatchReport(); findNextUserMatch(); }

function resizeCanvas() {
    const canvas = document.getElementById('match-pitch-canvas');
    const container = document.getElementById('match-pitch-container');
    if (!canvas || !container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasAspectRatio = 7 / 5; 
    
    let newWidth = containerWidth;
    let newHeight = newWidth / canvasAspectRatio;

    if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = newHeight * canvasAspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    if(gameState.isMatchLive) drawMatch();
}
function drawMatch() {
    const canvas = document.getElementById('match-pitch-canvas');
    if (!canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height); 
    ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke(); 
    ctx.beginPath(); ctx.arc(width / 2, height / 2, height * 0.15, 0, 2 * Math.PI); ctx.stroke(); 

    const goalY = (100 - PITCH_DIMS.goalHeight) / 2 / 100 * height;
    const goalH = PITCH_DIMS.goalHeight / 100 * height;
    const goalW = 2 / 100 * width;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, goalY, goalW, goalH);
    ctx.strokeRect(width - goalW, goalY, goalW, goalH);

    const playerRadius = Math.min(width / 50, height / 35);
    const drawPlayer = (pos, color, hasBall) => { const x = (pos.x / 100) * width; const y = (pos.y / 100) * height; ctx.beginPath(); ctx.arc(x, y, playerRadius, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); if (hasBall) { ctx.strokeStyle = '#3DDC97'; ctx.lineWidth = 3; } else { ctx.strokeStyle = 'black'; ctx.lineWidth = 1; } ctx.stroke(); };
    
    for (const teamKey of ['home', 'away']) {
        const team = gameState.matchState[teamKey];
        const color = teamKey === 'home' ? '#c0392b' : '#f1c40f';
        for (const player of Object.values(team.startingXI)) {
            if (!player) continue;
            const pos = gameState.matchState.playerPositions.get(player.name);
            if(pos) drawPlayer(pos, color, gameState.matchState.ball.owner === player);
        }
    }
    
    const ballRadius = playerRadius / 2;
    const ballPos = gameState.matchState.ball;
    const ballX = (ballPos.x / 100) * width;
    const ballY = (ballPos.y / 100) * height;
    ctx.beginPath(); ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI); ctx.fillStyle = 'white'; ctx.fill();
}

function updateScoreboard() {
    if (!gameState.matchState) return;
    const { score, gameTime } = gameState.matchState;
    document.getElementById('match-score-display').innerText = `${score.home} - ${score.away}`;
    
    const minutes = Math.floor(gameTime);
    const seconds = Math.floor((gameTime * 60) % 60);
    document.getElementById('match-clock').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const statusEl = document.getElementById('match-time-status');
    if (statusEl.innerText === 'FIM DE JOGO') return;
    
    if (gameState.isPaused) {
       if (gameState.matchState.half === 2 && gameTime >= 45) statusEl.innerText = 'INTERVALO';
       else statusEl.innerText = "PAUSA";
    } else {
        statusEl.innerText = gameState.matchState.half === 1 ? 'PRIMEIRO TEMPO' : 'SEGUNDO TEMPO';
    }
}
function togglePause(forcePause = null) { if (gameState.isMatchLive === false) return; gameState.isPaused = forcePause !== null ? forcePause : !gameState.isPaused; document.getElementById('pause-overlay').classList.toggle('active', gameState.isPaused); document.getElementById('pause-match-btn').innerText = gameState.isPaused ? '▶' : '❚❚'; updateScoreboard(); }
function showNotification(message) { const area = document.getElementById('match-notification-area'); area.innerHTML = ''; const notification = document.createElement('div'); notification.className = 'match-notification'; notification.innerText = message; area.appendChild(notification); setTimeout(() => { if(notification) notification.remove(); }, 3500); }
function updatePlayerRatings() { if(!gameState.matchState) return; for (const [playerName, currentRating] of gameState.matchState.playerRatings.entries()) { const performanceChange = (Math.random() - 0.47) * 0.2; let newRating = Math.max(0, Math.min(10, currentRating + performanceChange)); gameState.matchState.playerRatings.set(playerName, newRating); } }

function showPostMatchReport() {
    const { home, away, score } = gameState.matchState;
    const modal = document.getElementById('post-match-report-modal');
    const headline = document.getElementById('post-match-headline');
    const summary = document.getElementById('post-match-summary');
    let winner, loser, winnerScore, loserScore;
    if (score.home > score.away) {
        winner = home.team.name;
        loser = away.team.name;
        winnerScore = score.home;
        loserScore = score.away;
        headline.innerText = `${winner} vence ${loser} por ${winnerScore} a ${loserScore}!`;
    } else if (score.away > score.home) {
        winner = away.team.name;
        loser = home.team.name;
        winnerScore = score.away;
        loserScore = score.home;
        headline.innerText = `${winner} surpreende e vence ${loser} fora de casa!`;
    } else {
        headline.innerText = `${home.team.name} e ${away.team.name} empatam em jogo disputado.`;
        summary.innerText = `A partida terminou com o placar de ${score.home} a ${score.away}. Ambos os times tiveram suas chances, mas a igualdade prevaleceu no placar final.`;
        modal.classList.add('active');
        return;
    }
    const performanceFactor = Math.random();
    if (performanceFactor > 0.7) {
        summary.innerText = `Apesar da vitória do ${winner}, foi o ${loser} que dominou a maior parte das ações, criando mais chances. No entanto, a eficiência do ${winner} na finalização fez a diferença, garantindo o resultado de ${winnerScore} a ${loserScore}.`;
    } else {
        summary.innerText = `Com uma performance sólida, o ${winner} controlou a partida e mereceu a vitória sobre o ${loser}. O placar final de ${winnerScore} a ${loserScore} refletiu a superioridade vista em campo.`;
    }
    modal.classList.add('active');
}
