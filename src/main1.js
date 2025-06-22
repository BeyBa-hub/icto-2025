// Отримуємо доступ до елементів DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const statusText = document.getElementById('status');
const ctx = canvas.getContext('2d');

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// Зв'язки між точками для малювання скелета
const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],             // Великий палець
    [0, 5], [5, 6], [6, 7], [7, 8],             // Вказівний
    [5, 9], [9, 10], [10, 11], [11, 12],         // Середній
    [9, 13], [13, 14], [14, 15], [15, 16],       // Безіменний
    [13, 17], [17, 18], [18, 19], [19, 20],      // Мізинець
    [0, 17]
];

// Функція для налаштування камери
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
            facingMode: 'user',
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT
        }
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// Функція для завантаження моделі Handpose
async function loadHandpose() {
    statusText.innerText = "Завантаження моделі...";
    const model = await handpose.load();
    return model;
}

// Функція для обчислення кута між трьома точками (p2 - вершина)
function calculateAngle(p1, p2, p3) {
    const v1 = { x: p1[0] - p2[0], y: p1[1] - p2[1] };
    const v2 = { x: p3[0] - p2[0], y: p3[1] - p2[1] };
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 0;
    const cosAngle = dotProduct / (mag1 * mag2);
    const angleRad = Math.acos(Math.max(-1.0, Math.min(1.0, cosAngle)));
    return angleRad * (180 / Math.PI);
}

// Функція для малювання руки (точки та з'єднання)
function drawHand(landmarks, ctx) {
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    for (const connection of connections) {
        const [startIdx, endIdx] = connection;
        const startPoint = landmarks[startIdx];
        const endPoint = landmarks[endIdx];
        ctx.beginPath();
        ctx.moveTo(startPoint[0], startPoint[1]);
        ctx.lineTo(endPoint[0], endPoint[1]);
        ctx.stroke();
    }
    ctx.fillStyle = '#FF0000';
    for (const landmark of landmarks) {
        const [x, y] = landmark;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// --- ЗМІНИ ТУТ ---
// Функція для обчислення та відображення кутів
function calculateAndDrawAngles(landmarks, ctx) {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const angleThumbIndex = calculateAngle(thumbTip, wrist, indexTip);
    const angleIndexMiddle = calculateAngle(indexTip, wrist, middleTip);
    const angleMiddleRing = calculateAngle(middleTip, wrist, ringTip);
    const angleRingPinky = calculateAngle(ringTip, wrist, pinkyTip);
    
    // 1. Зберігаємо поточний стан канвасу (який є віддзеркаленим)
    ctx.save();
    
    // 2. Тимчасово скасовуємо віддзеркалення, щоб текст малювався нормально
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    // 3. Малюємо текст у звичайному, невіддзеркаленому просторі
    ctx.fillStyle = 'blue';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    
    const xPos = 15;
    const lineHeight = 25;
    let yPos = 30;

    ctx.fillText(`Великий-Вказівний: ${angleThumbIndex.toFixed(1)}°`, xPos, yPos);
    yPos += lineHeight;
    ctx.fillText(`Вказівний-Середній: ${angleIndexMiddle.toFixed(1)}°`, xPos, yPos);
    yPos += lineHeight;
    ctx.fillText(`Середній-Безіменний: ${angleMiddleRing.toFixed(1)}°`, xPos, yPos);
    yPos += lineHeight;
    ctx.fillText(`Безіменний-Мізинець: ${angleRingPinky.toFixed(1)}°`, xPos, yPos);

    // 4. Повертаємо канвас до віддзеркаленого стану для наступного кадру
    ctx.restore();
}
// --- КІНЕЦЬ ЗМІН ---


// Головний цикл розпізнавання
async function runDetection(model) {
    // --- ЗМІНА ТУТ ---
    // Ми прибрали другий аргумент `true`, щоб модель не віддзеркалювала координати.
    // Тепер за віддзеркалення відповідає лише трансформація канвасу.
    const predictions = await model.estimateHands(video);

    // Малюємо відео-кадр на канвасі. Оскільки канвас віддзеркалений, відео теж буде.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        // Малюємо руку. Оскільки канвас віддзеркалений, рука теж буде.
        drawHand(landmarks, ctx);
        // Малюємо текст (ця функція тепер сама дбає про віддзеркалення)
        calculateAndDrawAngles(landmarks, ctx);
    }

    requestAnimationFrame(() => runDetection(model));
}

// Основна функція запуску
async function main() {
    try {
        await setupCamera();
        video.play();
        statusText.innerText = "Камера запущена.";

        const model = await loadHandpose();
        statusText.innerText = "Модель завантажено. Покажіть руку в камеру.";
        
        canvas.width = VIDEO_WIDTH;
        canvas.height = VIDEO_HEIGHT;

        // Встановлюємо віддзеркалення для канвасу один раз на початку
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        runDetection(model);
    } catch (error) {
        console.error("Помилка під час ініціалізації:", error);
        statusText.innerText = "Помилка: не вдалося отримати доступ до камери або завантажити модель.";
    }
}

// Запускаємо все
main();