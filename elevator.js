import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Main class to handle the 3D elevator scene
class ElevatorScene {
    constructor() {
        this.init();
        this.currentFloor = 1;
        this.targetFloor = 1;
        this.isMoving = false;
        this.doorOpen = false;
        this.elevatorSpeed = 0.05;
        this.doorSpeed = 0.03;
        this.elevatorHeight = 4;
        this.floorHeight = 6;
        this.projectShown = false;
    }

    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
        
        // Add ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        
        // Add directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(5, 10, 7.5);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);

        // Add point light inside elevator
        this.elevatorLight = new THREE.PointLight(0xffffcc, 1, 10);
        this.elevatorLight.position.set(0, 1.5, 0);
        this.scene.add(this.elevatorLight);

        // Controls - limited for mobile compatibility
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 8;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 0, 0);

        // Create elevator shaft
        this.createElevatorShaft();
        
        // Create elevator
        this.createElevator();
        
        // Create floors
        this.createFloors();
        
        // Create elevator buttons
        this.createElevatorButtons();

        // Event listener for window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Setup animation loop
        this.animate();

        // Hide loading screen after everything is ready
        setTimeout(() => {
            document.querySelector('.loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.querySelector('.loading-screen').style.display = 'none';
            }, 500);
        }, 2000);
    }

    createElevatorShaft() {
        const totalHeight = (projects.length + 1) * this.floorHeight;
        
        // Shaft walls
        const shaftGeometry = new THREE.BoxGeometry(6, totalHeight, 6);
        const shaftMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            side: THREE.BackSide,
            roughness: 0.8,
            metalness: 0.2
        });
        this.shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        this.shaft.position.y = totalHeight / 2 - this.floorHeight;
        this.scene.add(this.shaft);

        // Shaft rails (for elevator)
        const railGeometry = new THREE.BoxGeometry(0.1, totalHeight, 0.1);
        const railMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.5,
            metalness: 0.8
        });
        
        // Create four rails at corners
        for (let x of [-2.2, 2.2]) {
            for (let z of [-2.2, 2.2]) {
                const rail = new THREE.Mesh(railGeometry, railMaterial);
                rail.position.set(x, totalHeight / 2 - this.floorHeight, z);
                this.scene.add(rail);
            }
        }
    }

    createElevator() {
        // Elevator group to contain all elevator parts
        this.elevator = new THREE.Group();
        
        // Floor
        const floorGeometry = new THREE.BoxGeometry(4, 0.2, 4);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -this.elevatorHeight / 2 + 0.1;
        this.elevator.add(floor);
        
        // Ceiling
        const ceilingGeometry = new THREE.BoxGeometry(4, 0.2, 4);
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.9,
            metalness: 0.1
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = this.elevatorHeight / 2 - 0.1;
        this.elevator.add(ceiling);
        
        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(4, this.elevatorHeight, 0.2);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x998877,
            roughness: 0.7,
            metalness: 0.3
        });
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.z = -2;
        this.elevator.add(backWall);
        
        // Side walls
        const sideWallGeometry = new THREE.BoxGeometry(0.2, this.elevatorHeight, 4);
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.x = -2;
        this.elevator.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.x = 2;
        this.elevator.add(rightWall);
        
        // Doors (split in the middle)
        const doorGeometry = new THREE.BoxGeometry(2, this.elevatorHeight, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xaaaaaa,
            roughness: 0.5,
            metalness: 0.7
        });
        
        this.leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        this.leftDoor.position.set(-1, 0, 2);
        this.elevator.add(this.leftDoor);
        
        this.rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        this.rightDoor.position.set(1, 0, 2);
        this.elevator.add(this.rightDoor);
        
        // Position the elevator
        this.elevator.position.y = (this.currentFloor - 1) * this.floorHeight;
        this.scene.add(this.elevator);
    }

    createFloors() {
        this.floors = [];
        this.screenDisplays = [];
        
        for (let i = 0; i < projects.length; i++) {
            const floorNumber = i + 1;
            const yPosition = i * this.floorHeight;
            
            // Floor entrance for each level
            const entranceGroup = new THREE.Group();
            entranceGroup.position.y = yPosition;
            
            // Floor indicator
            const indicatorGeometry = new THREE.PlaneGeometry(1, 0.5);
            const indicatorMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x222222,
                side: THREE.DoubleSide
            });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.position.set(0, 1.5, 2.5);
            entranceGroup.add(indicator);
            
            // Floor number
            const textCanvas = document.createElement('canvas');
            textCanvas.width = 64;
            textCanvas.height = 32;
            const ctx = textCanvas.getContext('2d');
            ctx.fillStyle = '#ffff00';
            ctx.font = 'Bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(floorNumber, 32, 16);
            
            const numberTexture = new THREE.CanvasTexture(textCanvas);
            const numberMaterial = new THREE.MeshBasicMaterial({ 
                map: numberTexture,
                transparent: true,
                side: THREE.DoubleSide
            });
            const numberPlane = new THREE.Mesh(indicatorGeometry, numberMaterial);
            numberPlane.position.set(0, 1.5, 2.51);
            entranceGroup.add(numberPlane);
            
            // Project display screen
            const screenGeometry = new THREE.PlaneGeometry(3.5, 2);
            
            // Create dynamic texture for screen
            const screenCanvas = document.createElement('canvas');
            screenCanvas.width = 512;
            screenCanvas.height = 256;
            const screenCtx = screenCanvas.getContext('2d');
            
            // Fill with gradient background
            const gradient = screenCtx.createLinearGradient(0, 0, 0, 256);
            gradient.addColorStop(0, '#333344');
            gradient.addColorStop(1, '#222233');
            screenCtx.fillStyle = gradient;
            screenCtx.fillRect(0, 0, 512, 256);
            
            // Add project title
            screenCtx.fillStyle = '#ffffff';
            screenCtx.font = 'Bold 36px Arial';
            screenCtx.textAlign = 'center';
            screenCtx.fillText(projects[i].name, 256, 80);
            
            // Add project description
            screenCtx.font = '24px Arial';
            screenCtx.fillText(projects[i].description, 256, 130);
            
            // Add prompt badge
            screenCtx.fillStyle = '#ff0000';
            screenCtx.beginPath();
            screenCtx.arc(256, 200, 20, 0, Math.PI * 2);
            screenCtx.fill();
            
            screenCtx.fillStyle = '#ffffff';
            screenCtx.font = 'Bold 24px Arial';
            screenCtx.fillText('1', 256, 200);
            
            screenCtx.fillStyle = '#ffffff';
            screenCtx.font = '20px Arial';
            screenCtx.fillText('prompt', 350, 200);
            
            const screenTexture = new THREE.CanvasTexture(screenCanvas);
            const screenMaterial = new THREE.MeshBasicMaterial({ 
                map: screenTexture,
                side: THREE.DoubleSide
            });
            
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(0, 0, 2.51);
            screen.userData = { 
                projectId: floorNumber,
                url: projects[i].url
            };
            entranceGroup.add(screen);
            this.screenDisplays.push(screen);
            
            // Floor surface
            const floorGeometry = new THREE.BoxGeometry(6, 0.2, 6);
            const floorMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                roughness: 0.8,
                metalness: 0.2
            });
            const floorSurface = new THREE.Mesh(floorGeometry, floorMaterial);
            floorSurface.position.y = -this.elevatorHeight / 2;
            entranceGroup.add(floorSurface);
            
            this.scene.add(entranceGroup);
            this.floors.push(entranceGroup);
        }

        // Add raycaster for screen interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Add event listener for screen clicking
        window.addEventListener('click', this.onMouseClick.bind(this));
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    createElevatorButtons() {
        // Control panel inside the elevator
        const panelGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
        const panelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });
        this.controlPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        this.controlPanel.position.set(1.5, 0, -1.9);
        this.controlPanel.rotation.y = Math.PI / 2;
        this.elevator.add(this.controlPanel);
        
        // Floor buttons
        this.buttons = [];
        const buttonSize = 0.15;
        const spacing = 0.25;
        const cols = 3;
        
        for (let i = 0; i < projects.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const buttonGeometry = new THREE.CylinderGeometry(buttonSize, buttonSize, 0.05, 32);
            const buttonMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                roughness: 0.5,
                metalness: 0.7,
                emissive: 0x000000
            });
            
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.rotation.x = Math.PI / 2;
            button.position.set(
                1.5,
                0.8 - row * spacing,
                -1.85 + (col - 1) * spacing
            );
            button.userData = { floorNumber: i + 1 };
            
            // Add number label to button
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 64;
            labelCanvas.height = 64;
            const ctx = labelCanvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.font = 'Bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i + 1, 32, 32);
            
            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            const labelMaterial = new THREE.MeshBasicMaterial({ 
                map: labelTexture,
                transparent: true
            });
            
            const labelGeometry = new THREE.CircleGeometry(buttonSize * 0.8, 32);
            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            label.position.z = 0.03;
            label.rotation.x = -Math.PI / 2;
            
            button.add(label);
            this.elevator.add(button);
            this.buttons.push(button);
        }

        // Add raycaster for button interaction
        this.buttonRaycaster = new THREE.Raycaster();
        
        // Add event listener for button clicking
        window.addEventListener('click', this.onButtonClick.bind(this));
        window.addEventListener('touchend', this.onButtonTouchEnd.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseClick(event) {
        if (this.projectShown) return;
        
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.checkScreenInteraction();
    }

    onTouchEnd(event) {
        if (this.projectShown || event.touches.length > 0) return;
        
        // Get touch position
        const touch = event.changedTouches[0];
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        this.checkScreenInteraction();
    }

    checkScreenInteraction() {
        // Check for screen interaction only if doors are open
        if (!this.doorOpen) return;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.screenDisplays);
        
        if (intersects.length > 0) {
            const screen = intersects[0].object;
            this.showProject(screen.userData.projectId, screen.userData.url);
        }
    }

    onButtonClick(event) {
        if (this.isMoving || this.projectShown) return;
        
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.checkButtonInteraction();
    }

    onButtonTouchEnd(event) {
        if (this.isMoving || this.projectShown || event.touches.length > 0) return;
        
        // Get touch position
        const touch = event.changedTouches[0];
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        this.checkButtonInteraction();
    }

    checkButtonInteraction() {
        this.buttonRaycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.buttonRaycaster.intersectObjects(this.buttons);
        
        if (intersects.length > 0) {
            const button = intersects[0].object;
            this.moveToFloor(button.userData.floorNumber);
            
            // Highlight the button
            button.material.emissive.set(0xff0000);
            setTimeout(() => {
                button.material.emissive.set(0x000000);
            }, 500);
        }
    }

    moveToFloor(floorNumber) {
        if (this.isMoving || floorNumber === this.currentFloor) return;
        
        // Close doors first if open
        if (this.doorOpen) {
            this.closeDoors().then(() => {
                this.targetFloor = floorNumber;
                this.isMoving = true;
            });
        } else {
            this.targetFloor = floorNumber;
            this.isMoving = true;
        }
        
        // Update floor display
        document.getElementById('current-floor').textContent = floorNumber;
        document.getElementById('floor-name').textContent = projects[floorNumber - 1].name;
    }

    async openDoors() {
        return new Promise(resolve => {
            const animate = () => {
                const leftDoorTargetX = -2;
                const rightDoorTargetX = 2;
                
                const leftDoorDistanceToMove = leftDoorTargetX - this.leftDoor.position.x;
                const rightDoorDistanceToMove = rightDoorTargetX - this.rightDoor.position.x;
                
                if (Math.abs(leftDoorDistanceToMove) > 0.01 || Math.abs(rightDoorDistanceToMove) > 0.01) {
                    this.leftDoor.position.x += leftDoorDistanceToMove * this.doorSpeed;
                    this.rightDoor.position.x += rightDoorDistanceToMove * this.doorSpeed;
                    requestAnimationFrame(animate);
                } else {
                    this.doorOpen = true;
                    resolve();
                }
            };
            
            animate();
        });
    }

    async closeDoors() {
        return new Promise(resolve => {
            const animate = () => {
                const leftDoorTargetX = -1;
                const rightDoorTargetX = 1;
                
                const leftDoorDistanceToMove = leftDoorTargetX - this.leftDoor.position.x;
                const rightDoorDistanceToMove = rightDoorTargetX - this.rightDoor.position.x;
                
                if (Math.abs(leftDoorDistanceToMove) > 0.01 || Math.abs(rightDoorDistanceToMove) > 0.01) {
                    this.leftDoor.position.x += leftDoorDistanceToMove * this.doorSpeed;
                    this.rightDoor.position.x += rightDoorDistanceToMove * this.doorSpeed;
                    requestAnimationFrame(animate);
                } else {
                    this.doorOpen = false;
                    resolve();
                }
            };
            
            animate();
        });
    }

    showProject(projectId, url) {
        this.projectShown = true;
        
        // Set iframe URL
        const iframe = document.getElementById('project-iframe');
        iframe.src = url;
        
        // Show iframe container
        const container = document.querySelector('.iframe-container');
        container.style.display = 'block';
        
        // Setup close button
        const closeButton = document.getElementById('close-iframe');
        closeButton.onclick = () => {
            container.style.display = 'none';
            iframe.src = 'about:blank';
            this.projectShown = false;
        };
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Move elevator if needed
        if (this.isMoving) {
            const targetY = (this.targetFloor - 1) * this.floorHeight;
            const currentY = this.elevator.position.y;
            const distanceToMove = targetY - currentY;
            
            if (Math.abs(distanceToMove) > 0.1) {
                this.elevator.position.y += distanceToMove * this.elevatorSpeed;
            } else {
                this.elevator.position.y = targetY;
                this.isMoving = false;
                this.currentFloor = this.targetFloor;
                this.openDoors();
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the scene once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ElevatorScene();
});

