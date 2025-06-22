document.addEventListener('DOMContentLoaded', () => {
    const sceneEl = document.querySelector('a-scene');

    // Отримуємо наш єдиний якір (другий дочірній елемент сцени після камери)
    const maskAnchor = sceneEl.children[1];

    // Змінна для зберігання об'єкта маски
    let catMask = null;

    // Коли обличчя знайдено
    sceneEl.addEventListener('targetFound', event => {
        console.log("Обличчя знайдено! Мяу!");

        // Створюємо маску, якщо її ще немає
        if (!catMask) {
            // Створюємо площину для нашої маски
            catMask = document.createElement('a-plane');
            
            // Встановлюємо атрибути
            catMask.setAttribute('src', './images/cat1.png');
            // Підбираємо розмір. Маска має бути досить великою, щоб покрити обличчя і вуха
            catMask.setAttribute('width', '1.6');
            catMask.setAttribute('height', '2.5');
            // Трохи піднімаємо маску, щоб очі краще збігалися з прорізами
            catMask.setAttribute('position', '0 0.3 0');
            catMask.setAttribute('transparent', 'true'); // Обов'язково для PNG

            // Додаємо маску до якоря на сцені
            maskAnchor.appendChild(catMask);
        }
    });

    // Коли обличчя втрачено
    sceneEl.addEventListener('targetLost', event => {
        console.log("Обличчя втрачено!");

        // Якщо маска існує, видаляємо її
        if (catMask) {
            catMask.remove();
            catMask = null; // Очищуємо змінну
        }
    });
});