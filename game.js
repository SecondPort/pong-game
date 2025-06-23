const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const difficultySelect = document.getElementById('difficulty');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game states
let gameState = 'countdown'; // 'countdown', 'playing', 'paused'
let countdown = 5;
let lastCountdownTime = Date.now();

// Paddle settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const PLAYER_X = 20;
const AI_X = WIDTH - PADDLE_WIDTH - 20;

// Difficulty settings
const DIFFICULTIES = {
    easy: { ballSpeed: 4, paddleSpeed: 4, aiSpeed: 0.6 },
    medium: { ballSpeed: 6, paddleSpeed: 6, aiSpeed: 0.8 },
    hard: { ballSpeed: 8, paddleSpeed: 8, aiSpeed: 1.0 }
};

let currentDifficulty = DIFFICULTIES.medium;

// Ball settings
const BALL_SIZE = 14;

// Initial positions
let playerY = (HEIGHT - PADDLE_HEIGHT) / 2;
let aiY = (HEIGHT - PADDLE_HEIGHT) / 2;
let ballX = WIDTH / 2 - BALL_SIZE / 2;
let ballY = HEIGHT / 2 - BALL_SIZE / 2;
let ballSpeedX = 0;
let ballSpeedY = 0;

// Score
let playerScore = 0;
let aiScore = 0;

// Event listeners
canvas.addEventListener('mousemove', function (e) {
    if (gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;

    // Clamp paddle within canvas
    if (playerY < 0) playerY = 0;
    if (playerY + PADDLE_HEIGHT > HEIGHT) playerY = HEIGHT - PADDLE_HEIGHT;
});

// Keyboard event listener for pause
document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
    }
});

// Difficulty selector event listener
difficultySelect.addEventListener('change', function () {
    currentDifficulty = DIFFICULTIES[this.value];
    if (gameState === 'playing') {
        // Reset ball speed with new difficulty
        const direction = ballSpeedX > 0 ? 1 : -1;
        ballSpeedX = currentDifficulty.ballSpeed * direction;
    }
});

// Initialize ball speed
function initializeBall() {
    ballSpeedX = currentDifficulty.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = currentDifficulty.ballSpeed * (Math.random() * 2 - 1);

    // Ensure minimum Y speed to avoid purely horizontal movement
    if (Math.abs(ballSpeedY) < currentDifficulty.ballSpeed * 0.3) {
        ballSpeedY = ballSpeedY >= 0 ?
            currentDifficulty.ballSpeed * 0.3 :
            -currentDifficulty.ballSpeed * 0.3;
    }
}

// Start countdown
function startCountdown() {
    gameState = 'countdown';
    countdown = 5;
    lastCountdownTime = Date.now();
}

// Update countdown
function updateCountdown() {
    const now = Date.now();
    if (now - lastCountdownTime >= 1000) {
        countdown--;
        lastCountdownTime = now;

        if (countdown <= 0) {
            gameState = 'playing';
            initializeBall();
        }
    }
}

// Draw everything
function draw() {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Net
    ctx.fillStyle = '#fff';
    for (let i = 0; i < HEIGHT; i += 30) {
        ctx.fillRect(WIDTH / 2 - 1, i, 2, 15);
    }

    // Paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball (only draw if game is playing)
    if (gameState === 'playing') {
        ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);
    }

    // Score
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore, WIDTH / 2 - 60, 40);
    ctx.fillText(aiScore, WIDTH / 2 + 60, 40);

    // Game state messages
    if (gameState === 'countdown') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PREPARATE', WIDTH / 2, HEIGHT / 2 - 30);
        ctx.font = '72px Arial';
        ctx.fillStyle = countdown <= 2 ? '#ff4444' : '#ffffff';
        ctx.fillText(countdown, WIDTH / 2, HEIGHT / 2 + 40);
    } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSADO', WIDTH / 2, HEIGHT / 2 - 10);
        ctx.font = '20px Arial';
        ctx.fillText('Presiona ESPACIO para continuar', WIDTH / 2, HEIGHT / 2 + 30);
    }
}

// Ball movement and collision
function updateBall() {
    if (gameState !== 'playing') return;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Top/bottom collision
    if (ballY <= 0 || ballY + BALL_SIZE >= HEIGHT) {
        ballSpeedY = -ballSpeedY;
        // Ensure ball doesn't get stuck at boundaries
        if (ballY <= 0) ballY = 0;
        if (ballY + BALL_SIZE >= HEIGHT) ballY = HEIGHT - BALL_SIZE;
    }

    // Player paddle collision
    if (
        ballSpeedX < 0 && // Only check when ball is moving towards player
        ballX <= PLAYER_X + PADDLE_WIDTH &&
        ballX + BALL_SIZE >= PLAYER_X &&
        ballY + BALL_SIZE >= playerY &&
        ballY <= playerY + PADDLE_HEIGHT
    ) {
        ballSpeedX = Math.abs(currentDifficulty.ballSpeed); // Ensure minimum speed
        // Add spin based on where the ball hits the paddle
        let hitPos = (ballY + BALL_SIZE / 2) - (playerY + PADDLE_HEIGHT / 2);
        ballSpeedY = (hitPos * 0.3) + (ballSpeedY * 0.1); // Mix calculated and current Y speed

        // Ensure minimum Y speed to avoid horizontal-only movement
        if (Math.abs(ballSpeedY) < 1) {
            ballSpeedY = ballSpeedY >= 0 ? 1 : -1;
        }

        // Move ball away from paddle to prevent multiple collisions
        ballX = PLAYER_X + PADDLE_WIDTH + 1;
    }

    // AI paddle collision
    if (
        ballSpeedX > 0 && // Only check when ball is moving towards AI
        ballX + BALL_SIZE >= AI_X &&
        ballX <= AI_X + PADDLE_WIDTH &&
        ballY + BALL_SIZE >= aiY &&
        ballY <= aiY + PADDLE_HEIGHT
    ) {
        ballSpeedX = -Math.abs(currentDifficulty.ballSpeed); // Ensure minimum speed
        let hitPos = (ballY + BALL_SIZE / 2) - (aiY + PADDLE_HEIGHT / 2);
        ballSpeedY = (hitPos * 0.3) + (ballSpeedY * 0.1); // Mix calculated and current Y speed

        // Ensure minimum Y speed to avoid horizontal-only movement
        if (Math.abs(ballSpeedY) < 1) {
            ballSpeedY = ballSpeedY >= 0 ? 1 : -1;
        }

        // Move ball away from paddle to prevent multiple collisions
        ballX = AI_X - BALL_SIZE - 1;
    }

    // Score
    if (ballX < -10) { // Give some margin
        aiScore++;
        resetBall(-1);
    } else if (ballX + BALL_SIZE > WIDTH + 10) { // Give some margin
        playerScore++;
        resetBall(1);
    }
}

// Reset ball to center
function resetBall(direction) {
    ballX = WIDTH / 2 - BALL_SIZE / 2;
    ballY = HEIGHT / 2 - BALL_SIZE / 2;

    // Reset ball speeds to zero temporarily
    ballSpeedX = 0;
    ballSpeedY = 0;

    // Start countdown before next round
    gameState = 'countdown';
    countdown = 3; // Shorter countdown between points
    lastCountdownTime = Date.now();

    // Set ball direction for when countdown ends with proper speed
    setTimeout(() => {
        if (gameState === 'playing') {
            ballSpeedX = currentDifficulty.ballSpeed * direction;
            ballSpeedY = currentDifficulty.ballSpeed * (Math.random() * 1.6 - 0.8); // -0.8 to 0.8

            // Ensure minimum Y speed
            if (Math.abs(ballSpeedY) < currentDifficulty.ballSpeed * 0.3) {
                ballSpeedY = ballSpeedY >= 0 ?
                    currentDifficulty.ballSpeed * 0.3 :
                    -currentDifficulty.ballSpeed * 0.3;
            }
        }
    }, 100);
}

// Basic AI for right paddle
function updateAI() {
    if (gameState !== 'playing') return;

    let aiCenter = aiY + PADDLE_HEIGHT / 2;
    let ballCenter = ballY + BALL_SIZE / 2;
    if (aiCenter < ballCenter - 10) {
        aiY += currentDifficulty.paddleSpeed * currentDifficulty.aiSpeed;
    } else if (aiCenter > ballCenter + 10) {
        aiY -= currentDifficulty.paddleSpeed * currentDifficulty.aiSpeed;
    }
    // Clamp
    if (aiY < 0) aiY = 0;
    if (aiY + PADDLE_HEIGHT > HEIGHT) aiY = HEIGHT - PADDLE_HEIGHT;
}

// Main game loop
function gameLoop() {
    if (gameState === 'countdown') {
        updateCountdown();
    }

    updateBall();
    updateAI();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game with initial countdown
startCountdown();
gameLoop();