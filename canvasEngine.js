window.CanvasEngine = {
    canvas: null,
    ctx: null,
    dotnetRef: null,
    bgImage: new Image(),
    alexImage: new Image(),
    animFrame: 0,
    animTimer: 0,

    init: function (canvasId, dotnetRef) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.dotnetRef = dotnetRef;

        // Dimensión nativa 4:3 para encajar perfectamente con la imagen room_bg.jpg
        this.canvas.width = 1024;
        this.canvas.height = 768;

        this.bgImage.src = 'images/room_bg.jpg';
        this.alexImage.src = 'images/player_spritesheet.png';

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        requestAnimationFrame(this.gameLoop.bind(this));
    },

    handleKeyDown: function (e) {
        if (this.dotnetRef) this.dotnetRef.invokeMethodAsync('UpdateKeyState', e.code, true);
    },

    handleKeyUp: function (e) {
        if (this.dotnetRef) this.dotnetRef.invokeMethodAsync('UpdateKeyState', e.code, false);
    },

    gameLoop: function () {
        if (this.dotnetRef) {
            this.dotnetRef.invokeMethodAsync('GameTick');
        }
        requestAnimationFrame(this.gameLoop.bind(this));
    },

    renderFrame: function (data) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Dibujar Fondo
        if (this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
            this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "#1a1a2e";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 2. Dibujar Protagonista recortando el Spritesheet (4x4)
        if (data.alex) {
            if (this.alexImage.complete && this.alexImage.naturalWidth !== 0) {
                let frameWidth = this.alexImage.naturalWidth / 4;
                let frameHeight = this.alexImage.naturalHeight / 4;
                let dir = data.alex.direction || 0;

                if (data.alex.isMoving) {
                    this.animTimer++;
                    if (this.animTimer % 8 === 0) {
                        this.animFrame = (this.animFrame + 1) % 4;
                    }
                } else {
                    this.animFrame = 0;
                }

                this.ctx.drawImage(
                    this.alexImage,
                    this.animFrame * frameWidth, dir * frameHeight, frameWidth, frameHeight,
                    data.alex.x, data.alex.y, 64, 80
                );
            }
        }
    }
};
window.loadAndPlayVideo = async function (videoId, videoPath) {
    try {
        const response = await fetch(videoPath);
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        const videoElement = document.getElementById(videoId);
        if (videoElement) {
            videoElement.src = videoUrl;
            videoElement.play();
        }
    } catch (e) {
        console.error("Error al cargar el video:", e);
    }
};
window.CanvasEngine = {
    canvas: null,
    ctx: null,
    dotnetRef: null,
    bgImage: new Image(),
    alexImage: new Image(),
    roadImage: new Image(),
    carRedImage: new Image(),
    obstaclesImage: new Image(),
    roadY: 0,
    animFrame: 0,
    animTimer: 0,

    init: function (canvasId, dotnetRef) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.dotnetRef = dotnetRef;

        this.canvas.width = 1024;
        this.canvas.height = 768;

        this.bgImage.src = 'images/room_bg.jpg';
        this.alexImage.src = 'images/player_spritesheet.png';
        this.roadImage.src = 'images/road_track.jpg';
        this.carRedImage.src = 'images/car_red.png';
        this.obstaclesImage.src = 'images/obstacles.png';

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        requestAnimationFrame(this.gameLoop.bind(this));
    },

    handleKeyDown: function (e) {
        if (this.dotnetRef) this.dotnetRef.invokeMethodAsync('UpdateKeyState', e.code, true);
    },

    handleKeyUp: function (e) {
        if (this.dotnetRef) this.dotnetRef.invokeMethodAsync('UpdateKeyState', e.code, false);
    },

    gameLoop: function () {
        if (this.dotnetRef) {
            try { this.dotnetRef.invokeMethodAsync('GameTick'); } catch (e) { }
        }
        requestAnimationFrame(this.gameLoop.bind(this));
    },

    renderFrame: function (data) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // --- NIVEL 1: HABITACIÓN ---
        if (data.level === 1 || data.alex) {
            if (this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
                this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
            } else {
                this.ctx.fillStyle = "#1a1a2e";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            if (data.alex) {
                if (this.alexImage.complete && this.alexImage.naturalWidth !== 0) {
                    let frameWidth = this.alexImage.naturalWidth / 4;
                    let frameHeight = this.alexImage.naturalHeight / 4;
                    let dir = data.alex.direction || 0;

                    if (data.alex.isMoving) {
                        this.animTimer++;
                        if (this.animTimer % 8 === 0) {
                            this.animFrame = (this.animFrame + 1) % 4;
                        }
                    } else {
                        this.animFrame = 0;
                    }

                    this.ctx.drawImage(
                        this.alexImage,
                        this.animFrame * frameWidth, dir * frameHeight, frameWidth, frameHeight,
                        data.alex.x, data.alex.y, 64, 80
                    );
                }
            }
        }

        // --- NIVEL 3: CARRERA DE 3 MINUTOS (OBSTÁCULOS PRECISOS) ---
        else if (data.level === 3) {
            // Scroll de Pista Suave
            this.roadY += data.speed || 4;
            if (this.roadY >= this.canvas.height) {
                this.roadY = 0;
            }

            if (this.roadImage.complete && this.roadImage.naturalWidth !== 0) {
                this.ctx.drawImage(this.roadImage, 0, this.roadY - this.canvas.height, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(this.roadImage, 0, this.roadY, this.canvas.width, this.canvas.height);
            } else {
                this.ctx.fillStyle = "#333333";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // DIBUJAR OBSTÁCULOS CON RECORTE DINÁMICO
            if (data.obstacles) {
                for (let i = 0; i < data.obstacles.length; i++) {
                    let obs = data.obstacles[i];
                    if (obs.hit) continue;

                    if (this.obstaclesImage.complete && this.obstaclesImage.naturalWidth !== 0) {
                        let imgW = this.obstaclesImage.naturalWidth;
                        let imgH = this.obstaclesImage.naturalHeight;

                        let sx = 0, sy = 0, sw = 0, sh = 0;
                        let drawW = 50, drawH = 40; // Tamaño uniforme visual

                        if (obs.type === 0) {
                            // 1. TRONCO (Fila 2 Izquierda)
                            sx = imgW * 0.01;
                            sy = imgH * 0.28;
                            sw = imgW * 0.16;
                            sh = imgH * 0.20;
                            drawW = 60; drawH = 35;
                        } else if (obs.type === 1) {
                            // 2. CONO NARANJA (Fila 2 Derecha)
                            sx = imgW * 0.55;
                            sy = imgH * 0.27;
                            sw = imgW * 0.10;
                            sh = imgH * 0.22;
                            drawW = 40; drawH = 45;
                        } else {
                            // 3. ARBUSTO VERDE (Fila 4 Izquierda)
                            sx = imgW * 0.01;
                            sy = imgH * 0.77;
                            sw = imgW * 0.17;
                            sh = imgH * 0.20;
                            drawW = 50; drawH = 40;
                        }

                        this.ctx.drawImage(
                            this.obstaclesImage,
                            sx, sy, sw, sh,
                            obs.x, obs.y, drawW, drawH
                        );
                    } else {
                        // Respaldo de seguridad si aún no ha cargado la imagen
                        this.ctx.fillStyle = obs.type === 0 ? "#8B4513" : (obs.type === 1 ? "#FF6600" : "#228B22");
                        this.ctx.fillRect(obs.x, obs.y, 45, 35);
                    }
                }
            }

            // DIBUJAR JEEP ROJO JUGADOR
            if (this.carRedImage.complete && this.carRedImage.naturalWidth !== 0) {
                this.ctx.drawImage(this.carRedImage, data.playerX, data.playerY, 80, 130);
            } else {
                this.ctx.fillStyle = "#cc0000";
                this.ctx.fillRect(data.playerX, data.playerY, 70, 120);
            }
        }
    }
};