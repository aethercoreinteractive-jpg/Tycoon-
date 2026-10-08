// Aethercore Mechanics - Main Game Logic

// Game Data & State
const GAME_CONFIG = {
    startMoney: 100000,
    tickInterval: 1000, // 1 second per day tick
};

let gameState = {
    money: 100000,
    reputation: 50,
    factoryLevel: 1,
    factoryXP: 0,
    factoryXPRequired: 300,
    day: 1,
    efficiency: 92,
    quality: 95,
    machines: [
        { id: 'm1', type: 'lathe', level: 1, x: -3, z: -2, condition: 100, workerId: 'w1' },
        { id: 'm2', type: 'drill', level: 1, x: 3, z: -2, condition: 100, workerId: 'w2' }
    ],
    workers: [
        { id: 'w1', name: 'Arun', skill: 65, speedBonus: 5, salary: 1500, machineId: 'm1' },
        { id: 'w2', name: 'Priya', skill: 70, speedBonus: 8, salary: 1800, machineId: 'm2' }
    ],
    inventory: {
        raw: { steel: 250, aluminium: 100, copper: 50, stainless: 0 },
        finished: { bracket: 10, shaft: 5, bush: 15, gear: 0, pulley: 0, coupling: 0, housing: 0, pump: 0, motor: 0, auto_comp: 0, trans_comp: 0, precision_shaft: 0, adv_assembly: 0, auto_assembly: 0, high_precision: 0 }
    },
    orders: [],
    marketPrices: { steel: 85, aluminium: 220, copper: 760, stainless: 450 },
    settings: { sound: true }
};

// Machine Definitions
const MACHINE_TYPES = {
    lathe: { name: 'Lathe Machine', cost: 25000, speed: 10, energy: 5, maintCost: 2000, desc: 'Performs precision turning and facing operations.' },
    drill: { name: 'Drill Press', cost: 18000, speed: 12, energy: 4, maintCost: 1500, desc: 'Drills accurate holes and threads in raw stock.' },
    milling: { name: 'Milling Machine', cost: 45000, speed: 8, energy: 8, maintCost: 3500, desc: 'Cuts flat surfaces, grooves, and complex contours.' },
    cnc_lathe: { name: 'CNC Lathe', cost: 85000, speed: 18, energy: 12, maintCost: 6000, desc: 'Computer-controlled high speed turning center.' },
    cnc_mill: { name: 'CNC Milling', cost: 110000, speed: 15, energy: 15, maintCost: 8000, desc: 'Advanced 3-axis CNC milling for intricate components.' },
    vmc: { name: 'Vertical Machining Center', cost: 180000, speed: 22, energy: 20, maintCost: 12000, desc: 'High production vertical machining center.' },
    grinding: { name: 'Grinding Machine', cost: 35000, speed: 14, energy: 6, maintCost: 2500, desc: 'Surface and cylindrical grinding for mirror finishes.' },
    hydraulic_press: { name: 'Hydraulic Press', cost: 50000, speed: 20, energy: 10, maintCost: 4000, desc: 'Heavy duty stamping and metal forming.' },
    welding: { name: 'Welding Station', cost: 30000, speed: 10, energy: 7, maintCost: 2200, desc: 'Robotic and manual metal joining station.' },
    cmm: { name: 'CMM Inspection', cost: 95000, speed: 30, energy: 5, maintCost: 5000, desc: 'Coordinate measuring machine for rigorous quality checks.' }
};

const PRODUCTS = {
    bracket: { name: 'Metal Bracket', level: 1, raw: { steel: 5 }, time: 5, price: 350, cost: 180 },
    shaft: { name: 'Steel Shaft', level: 1, raw: { steel: 8 }, time: 7, price: 520, cost: 260 },
    bush: { name: 'Bronze Bush', level: 1, raw: { copper: 6 }, time: 6, price: 680, cost: 320 },
    gear: { name: 'Drive Gear', level: 2, raw: { steel: 12, aluminium: 4 }, time: 12, price: 1250, cost: 600 },
    pulley: { name: 'Timing Pulley', level: 2, raw: { aluminium: 10 }, time: 10, price: 980, cost: 480 },
    coupling: { name: 'Shaft Coupling', level: 2, raw: { steel: 15 }, time: 14, price: 1400, cost: 700 },
    housing: { name: 'Bearing Housing', level: 3, raw: { stainless: 10, aluminium: 5 }, time: 18, price: 2400, cost: 1150 },
    pump: { name: 'Pump Component', level: 3, raw: { stainless: 12, copper: 4 }, time: 20, price: 2900, cost: 1400 },
    motor: { name: 'Motor Housing', level: 3, raw: { aluminium: 18 }, time: 22, price: 3200, cost: 1550 },
    auto_comp: { name: 'Automotive Component', level: 4, raw: { steel: 25, stainless: 10 }, time: 30, price: 4800, cost: 2300 },
    trans_comp: { name: 'Transmission Part', level: 4, raw: { steel: 30, copper: 8 }, time: 35, price: 5600, cost: 2700 },
    precision_shaft: { name: 'Precision Shaft', level: 4, raw: { stainless: 20 }, time: 28, price: 4200, cost: 2000 },
    adv_assembly: { name: 'Advanced Assembly', level: 5, raw: { steel: 40, aluminium: 20, stainless: 15 }, time: 50, price: 9500, cost: 4500 },
    auto_assembly: { name: 'Automotive Assembly', level: 5, raw: { steel: 50, aluminium: 25, copper: 10 }, time: 60, price: 12000, cost: 5800 },
    high_precision: { name: 'High-Precision Unit', level: 5, raw: { stainless: 35, copper: 15 }, time: 55, price: 11000, cost: 5200 }
};

const CUSTOMER_COMPANIES = [
    "Metro Components", "Nova Motors", "Apex Engineering", "Vertex Industries",
    "Prime Machines", "Orion Automotive", "Titanics Mech", "Vanguard Industrial",
    "Delta Gearworks", "Zenith Systems"
];

// Three.js Global Variables
let scene, camera, renderer, controls;
let factoryFloorMesh, machineMeshes = [], workerMeshes = [], vehicleMeshes = [];
let activeTab = 'factory';
let machineSubTab = 'fleet';

// Initialize Game on Window Load
window.onload = function() {
    loadGame();
    initThreeJS();
    initUI();
    startGameLoop();
    
    // Check onboarding
    if (!localStorage.getItem('aethercore_onboarded')) {
        document.getElementById('onboarding-modal').classList.remove('hidden');
    }
};

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.035);

    // Camera setup for Isometric view
    const aspect = container.clientWidth / container.clientHeight;
    const d = 14;
    camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.minZoom = 0.5;
    controls.maxZoom = 2.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(30, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf59e0b, 1, 30);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    buildFactoryEnvironment();

    window.addEventListener('resize', onWindowResize);
}

function buildFactoryEnvironment() {
    // Floor
    const floorSizeX = 24;
    const floorSizeZ = 20;
    const floorGeo = new THREE.BoxGeometry(floorSizeX, 0.5, floorSizeZ);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.2 });
    factoryFloorMesh = new THREE.Mesh(floorGeo, floorMat);
    factoryFloorMesh.position.y = -0.25;
    factoryFloorMesh.receiveShadow = true;
    scene.add(factoryFloorMesh);

    // Grid helper on floor
    const grid = new THREE.GridHelper(24, 24, 0x06b6d4, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Walls (Back and Left)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    
    const backWallGeo = new THREE.BoxGeometry(floorSizeX, 6, 0.5);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 3, -floorSizeZ / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWallGeo = new THREE.BoxGeometry(0.5, 6, floorSizeZ);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-floorSizeX / 2, 3, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Loading dock / Storage Pallets outside
    createStoragePallets();
    
    // Refresh 3D Machines & Workers
    update3DFactoryEntities();
}

function createStoragePallets() {
    // Raw material stack placeholder
    const palletGeo = new THREE.BoxGeometry(2, 0.2, 2);
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    
    const rawPallet = new THREE.Mesh(palletGeo, palletMat);
    rawPallet.position.set(-9, 0.1, 7);
    scene.add(rawPallet);

    // Steel beams stacks
    const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 1.8);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            const b = new THREE.Mesh(boxGeo, boxMat);
            b.position.set(-9 + (i*0.5) - 0.5, 0.4 + (j*0.4), 7);
            b.castShadow = true;
            scene.add(b);
        }
    }

    // Finished goods warehouse shelf
    const shelfGeo = new THREE.BoxGeometry(3, 3, 1);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(9, 1.5, 7);
    shelf.castShadow = true;
    scene.add(shelf);
}

function update3DFactoryEntities() {
    // Remove existing dynamic meshes
    machineMeshes.forEach(m => scene.remove(m));
    machineMeshes = [];
    workerMeshes.forEach(w => scene.remove(w));
    workerMeshes = [];

    // Render Machines
    gameState.machines.forEach((mach, idx) => {
        const group = new THREE.Group();
        
        // Base body
        const bodyGeo = new THREE.BoxGeometry(1.8, 1.2, 1.8);
        const color = mach.type.includes('cnc') ? 0x06b6d4 : (mach.type === 'lathe' ? 0x3b82f6 : 0x10b981);
        const bodyMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.7, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        // Control panel / details
        const panelGeo = new THREE.BoxGeometry(0.8, 0.6, 0.4);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(0, 1.2, 0.8);
        group.add(panel);

        // Rotating workpiece / spindle indicator
        const spindleGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 12);
        const spindleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
        const spindle = new THREE.Mesh(spindleGeo, spindleMat);
        spindle.rotation.z = Math.PI / 2;
        spindle.position.set(0, 1.2, 0);
        spindle.name = 'spindle';
        group.add(spindle);

        group.position.set(mach.x, 0, mach.z);
        scene.add(group);
        machineMeshes.push(group);
    });

    // Render Workers
    gameState.workers.forEach((worker, idx) => {
        const group = new THREE.Group();

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        // Head / Helmet (yellow safety helmet)
        const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.35;
        group.add(head);

        // Position near assigned machine
        const assignedMach = gameState.machines.find(m => m.id === worker.machineId);
        if (assignedMach) {
            group.position.set(assignedMach.x + 1.2, 0, assignedMach.z + 0.5);
        } else {
            group.position.set(-5 + (idx * 2), 0, 0);
        }

        scene.add(group);
        workerMeshes.push(group);
    });
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const aspect = container.clientWidth / container.clientHeight;
    const d = 14;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Game Simulation Loop
function startGameLoop() {
    setInterval(() => {
        processProductionTick();
        processDailyBusiness();
        updateHUD();
    }, GAME_CONFIG.tickInterval);

    // Render loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // Animate machine spindles
        machineMeshes.forEach(m => {
            const spindle = m.getObjectByName('spindle');
            if (spindle) spindle.rotation.x += 0.1;
        });

        renderer.render(scene, camera);
    }
    animate();
}

function processProductionTick() {
    // Produce items based on active machines & assigned workers
    gameState.machines.forEach(mach => {
        if (mach.condition <= 10) return; // Broken down
        
        // Find worker
        const worker = gameState.workers.find(w => w.machineId === mach.id);
        const speedMultiplier = worker ? (1 + worker.speedBonus / 100) : 1.0;

        // Decrease machine condition slightly
        mach.condition = Math.max(0, mach.condition - 0.05);

        // Produce random available product tier matching factory level
        const availableProducts = Object.keys(PRODUCTS).filter(p => PRODUCTS[p].level <= gameState.factoryLevel);
        const prodKey = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        const prod = PRODUCTS[prodKey];

        // Check if we have raw materials
        let hasMaterials = true;
        for (const [mat, qty] of Object.entries(prod.raw)) {
            if ((gameState.inventory.raw[mat] || 0) < qty) {
                hasMaterials = false;
                break;
            }
        }

        if (hasMaterials) {
            // Deduct raw materials
            for (const [mat, qty] of Object.entries(prod.raw)) {
                gameState.inventory.raw[mat] -= qty;
            }
            // Add finished product
            gameState.inventory.finished[prodKey] = (gameState.inventory.finished[prodKey] || 0) + Math.ceil(mach.level * speedMultiplier);
        }
    });

    // Check active orders progress
    gameState.orders.forEach(order => {
        if (order.status === 'active') {
            const stock = gameState.inventory.finished[order.productKey] || 0;
            if (stock >= order.qtyNeeded) {
                // Complete Order!
                gameState.inventory.finished[order.productKey] -= order.qtyNeeded;
                gameState.money += order.payment;
                gameState.reputation = Math.min(100, gameState.reputation + 3);
                gameState.factoryXP += 50;
                order.status = 'completed';
                showToast(`Order completed for ${order.company}! Earned ₹${order.payment.toLocaleString()}`, 'success');
                checkFactoryLevelUp();
            }
        }
    });
}

function processDailyBusiness() {
    // Every 30 ticks = 1 Day
    if (Math.random() < 0.03) {
        gameState.day++;
        
        // Calculate daily expenses
        let totalSalary = gameState.workers.reduce((acc, w) => acc + w.salary, 0);
        let totalMaint = gameState.machines.reduce((acc, m) => acc + 1500, 0);
        let totalEnergy = gameState.machines.length * 500;
        let totalExpense = totalSalary + totalMaint + totalEnergy;

        gameState.money -= totalExpense;
        showToast(`Day ${gameState.day} started. Paid salaries & expenses: ₹${totalExpense.toLocaleString()}`, 'info');

        // Generate new random orders if list is short
        if (gameState.orders.filter(o => o.status === 'active').length < 3) {
            generateNewOrder();
        }

        // Slight fluctuation in market prices
        for (const mat in gameState.marketPrices) {
            const change = (Math.random() - 0.48) * 10;
            gameState.marketPrices[mat] = Math.max(50, Math.round(gameState.marketPrices[mat] + change));
        }
    }
}

function generateNewOrder() {
    const company = CUSTOMER_COMPANIES[Math.floor(Math.random() * CUSTOMER_COMPANIES.length)];
    const prodKeys = Object.keys(PRODUCTS).filter(p => PRODUCTS[p].level <= gameState.factoryLevel);
    const prodKey = prodKeys[Math.floor(Math.random() * prodKeys.length)];
    const prod = PRODUCTS[prodKey];
    const qty = Math.floor(Math.random() * 50) + 50;
    const payment = qty * prod.price;

    const newOrder = {
        id: 'ord_' + Math.random().toString(36.substring(2, 9)),
        company: company,
        productKey: prodKey,
        productName: prod.name,
        qtyNeeded: qty,
        payment: payment,
        deadlineDays: 3,
        status: 'pending'
    };

    gameState.orders.push(newOrder);
    showToast(`New order received from ${company}!`, 'info');
}

function checkFactoryLevelUp() {
    if (gameState.factoryXP >= gameState.factoryXPRequired && gameState.factoryLevel < 5) {
        gameState.factoryLevel++;
        gameState.factoryXP = 0;
        gameState.factoryXPRequired = gameState.factoryLevel * 500;
        showToast(`🎉 Factory Level Up! Reached Level ${gameState.factoryLevel}`, 'success');
    }
}

// UI Controller & Modals
function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-cyan-400', 'bg-cyan-500/10');
        btn.classList.add('text-slate-400');
    });
    const activeBtn = document.getElementById('nav-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('text-cyan-400', 'bg-cyan-500/10');
        activeBtn.classList.remove('text-slate-400');
    }

    const modalContainer = document.getElementById('modal-container');
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));

    if (tabId === 'factory') {
        modalContainer.classList.add('hidden');
        renderFactoryPanel();
    } else {
        modalContainer.classList.remove('hidden');
        const panel = document.getElementById('panel-' + tabId);
        if (panel) panel.classList.remove('hidden');
        
        // Render tab contents
        if (tabId === 'orders') renderOrdersPanel();
        if (tabId === 'inventory') renderInventoryPanel();
        if (tabId === 'machines') renderMachinesPanel();
        if (tabId === 'staff') renderStaffPanel();
        if (tabId === 'upgrades') renderUpgradesPanel();
    }
}

function closeModals() {
    document.getElementById('modal-container').classList.add('hidden');
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    switchTab('factory');
}

function updateHUD() {
    document.getElementById('hud-money').innerText = Math.round(gameState.money).toLocaleString();
    document.getElementById('hud-reputation').innerText = gameState.reputation;
    document.getElementById('hud-factory-level').innerText = `Factory Lvl ${gameState.factoryLevel}`;
    document.getElementById('hud-day').innerText = `Day ${gameState.day}`;
}

function renderFactoryPanel() {
    document.getElementById('factory-level-title').innerText = getFactoryLevelName(gameState.factoryLevel);
    document.getElementById('factory-xp-text').innerText = `${gameState.factoryXP} / ${gameState.factoryXPRequired}`;
    const pct = Math.min(100, (gameState.factoryXP / gameState.factoryXPRequired) * 100);
    document.getElementById('factory-xp-bar').style.width = pct + '%';
    document.getElementById('metric-efficiency').innerText = gameState.efficiency + '%';
    document.getElementById('metric-machines').innerText = `${gameState.machines.length} Active`;
    document.getElementById('metric-workers').innerText = gameState.workers.length;
    document.getElementById('metric-quality').innerText = gameState.quality + '%';
    document.getElementById('metric-energy').innerText = (gameState.machines.length * 5) + ' kW';
    document.getElementById('metric-salaries').innerText = '₹' + gameState.workers.reduce((a,w)=>a+w.salary,0).toLocaleString();
    document.getElementById('metric-maint').innerText = '₹' + (gameState.machines.length * 1500).toLocaleString();
}

function getFactoryLevelName(lvl) {
    switch(lvl) {
        case 1: return 'Small Workshop (Level 1)';
        case 2: return 'Medium Manufacturing Unit (Level 2)';
        case 3: return 'Large Factory (Level 3)';
        case 4: return 'Industrial Plant (Level 4)';
        case 5: return 'Automated Manufacturing Facility (Level 5)';
        default: return 'Mega Plant';
    }
}

function renderOrdersPanel() {
    const list = document.getElementById('orders-list');
    list.innerHTML = '';
    
    if (gameState.orders.length === 0) {
        list.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs">No active customer orders. Check back soon!</div>`;
        return;
    }

    gameState.orders.forEach(ord => {
        if (ord.status === 'completed') return;
        const prod = PRODUCTS[ord.productKey];
        const currentStock = gameState.inventory.finished[ord.productKey] || 0;
        const isReady = currentStock >= ord.qtyNeeded;

        const card = document.createElement('div');
        card.className = "bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3";
        card.innerHTML = `
            <div>
                <span class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">${ord.company}</span>
                <h4 class="font-extrabold text-sm text-white">${ord.qtyNeeded}x ${ord.productName}</h4>
                <p class="text-xs text-slate-400 mt-0.5">Reward: <strong class="text-emerald-400">₹${ord.payment.toLocaleString()}</strong> | In Stock: <span class="${isReady ? 'text-emerald-400 font-bold' : 'text-amber-400'}">${currentStock} / ${ord.qtyNeeded}</span></p>
            </div>
            <div>
                ${ord.status === 'pending' ? 
                    `<button onclick="acceptOrder('${ord.id}')" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-cyan-600/30">Accept Order</button>` :
                    `<span class="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold">${isReady ? 'Ready to Deliver' : 'Manufacturing...'}</span>`
                }
            </div>
        `;
        list.appendChild(card);
    });
}

function acceptOrder(orderId) {
    const ord = gameState.orders.find(o => o.id === orderId);
    if (ord) {
        ord.status = 'active';
        showToast(`Accepted order from ${ord.company}!`, 'success');
        renderOrdersPanel();
    }
}

function renderInventoryPanel() {
    const rawList = document.getElementById('raw-materials-list');
    rawList.innerHTML = '';
    for (const [mat, qty] of Object.entries(gameState.inventory.raw)) {
        const price = gameState.marketPrices[mat] || 100;
        const row = document.createElement('div');
        row.className = "flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800";
        row.innerHTML = `
            <div>
                <h5 class="font-bold text-xs text-white capitalize">${mat}</h5>
                <p class="text-[10px] text-slate-400">Qty: <strong>${qty} kg</strong> | Price: ₹${price}/kg</p>
            </div>
            <button onclick="buyRawMaterial('${mat}', 50)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md">Buy 50kg (₹${price * 50})</button>
        `;
        rawList.appendChild(row);
    }

    const finList = document.getElementById('finished-goods-list');
    finList.innerHTML = '';
    for (const [prodKey, qty] of Object.entries(gameState.inventory.finished)) {
        if (qty > 0) {
            const prod = PRODUCTS[prodKey];
            const row = document.createElement('div');
            row.className = "flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800";
            row.innerHTML = `
                <div>
                    <h5 class="font-bold text-xs text-white">${prod ? prod.name : prodKey}</h5>
                    <p class="text-[10px] text-slate-400">In Stock: <strong>${qty} units</strong></p>
                </div>
                <button onclick="sellFinishedProduct('${prodKey}', 10)" class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs shadow-md">Sell 10</button>
            `;
            finList.appendChild(row);
        }
    }
}

function buyRawMaterial(mat, amount) {
    const cost = (gameState.marketPrices[mat] || 100) * amount;
    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.inventory.raw[mat] = (gameState.inventory.raw[mat] || 0) + amount;
        showToast(`Purchased ${amount}kg of ${mat} for ₹${cost.toLocaleString()}`, 'success');
        renderInventoryPanel();
        updateHUD();
    } else {
        showCustomAlert('Insufficient Funds', 'You do not have enough money to purchase this material.');
    }
}

function sellFinishedProduct(prodKey, amount) {
    const prod = PRODUCTS[prodKey];
    const stock = gameState.inventory.finished[prodKey] || 0;
    const sellQty = Math.min(stock, amount);
    if (sellQty > 0) {
        gameState.inventory.finished[prodKey] -= sellQty;
        const revenue = sellQty * Math.round(prod.price * 0.8);
        gameState.money += revenue;
        showToast(`Sold ${sellQty}x ${prod.name} on open market for ₹${revenue.toLocaleString()}`, 'success');
        renderInventoryPanel();
        updateHUD();
    }
}

function switchMachineSubTab(sub) {
    machineSubTab = sub;
    if (sub === 'fleet') {
        document.getElementById('msub-fleet-btn').className = "flex-1 py-2 rounded-lg text-xs font-bold bg-cyan-600 text-white transition-all";
        document.getElementById('msub-buy-btn').className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all";
        document.getElementById('msub-fleet-view').classList.remove('hidden');
        document.getElementById('msub-buy-view').classList.add('hidden');
        renderMachineFleet();
    } else {
        document.getElementById('msub-buy-btn').className = "flex-1 py-2 rounded-lg text-xs font-bold bg-cyan-600 text-white transition-all";
        document.getElementById('msub-fleet-btn').className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all";
        document.getElementById('msub-buy-view').classList.remove('hidden');
        document.getElementById('msub-fleet-view').classList.add('hidden');
        renderMachineCatalog();
    }
}

function renderMachinesPanel() {
    document.getElementById('count-active-machines').innerText = gameState.machines.length;
    if (machineSubTab === 'fleet') renderMachineFleet();
    else renderMachineCatalog();
}

function renderMachineFleet() {
    const view = document.getElementById('msub-fleet-view');
    view.innerHTML = '';
    gameState.machines.forEach(mach => {
        const def = MACHINE_TYPES[mach.type];
        const card = document.createElement('div');
        card.className = "bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3";
        card.innerHTML = `
            <div>
                <h4 class="font-extrabold text-sm text-white">${def ? def.name : mach.type} (Lvl ${mach.level})</h4>
                <p class="text-xs text-slate-400 mt-0.5">Condition: <strong class="${mach.condition < 30 ? 'text-rose-400' : 'text-emerald-400'}">${Math.round(mach.condition)}%</strong></p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="maintainMachine('${mach.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl font-bold text-xs border border-slate-700">Maintain (₹1,500)</button>
                <button onclick="upgradeMachine('${mach.id}')" class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-md">Upgrade</button>
            </div>
        `;
        view.appendChild(card);
    });
}

function renderMachineCatalog() {
    const view = document.getElementById('msub-buy-view');
    view.innerHTML = '';
    for (const [typeKey, def] of Object.entries(MACHINE_TYPES)) {
        const card = document.createElement('div');
        card.className = "bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3";
        card.innerHTML = `
            <div>
                <h4 class="font-extrabold text-sm text-white">${def.name}</h4>
                <p class="text-xs text-slate-400 mt-0.5">${def.desc}</p>
                <p class="text-xs text-emerald-400 font-bold mt-1">Price: ₹${def.cost.toLocaleString()}</p>
            </div>
            <button onclick="buyMachine('${typeKey}')" class="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md whitespace-nowrap">Purchase</button>
        `;
        view.appendChild(card);
    }
}

function buyMachine(typeKey) {
    const def = MACHINE_TYPES[typeKey];
    if (gameState.money >= def.cost) {
        gameState.money -= def.cost;
        const newId = 'm_' + Math.random().toString(36).substring(2, 9);
        gameState.machines.push({
            id: newId,
            type: typeKey,
            level: 1,
            x: (Math.random() - 0.5) * 10,
            z: (Math.random() - 0.5) * 8,
            condition: 100,
            workerId: null
        });
        update3DFactoryEntities();
        showToast(`Purchased ${def.name}!`, 'success');
        updateHUD();
        renderMachinesPanel();
    } else {
        showCustomAlert('Insufficient Funds', 'You do not have enough money to purchase this machine.');
    }
}

function maintainMachine(machId) {
    const cost = 1500;
    if (gameState.money >= cost) {
        gameState.money -= cost;
        const mach = gameState.machines.find(m => m.id === machId);
        if (mach) mach.condition = 100;
        showToast('Machine fully maintained and restored!', 'success');
        updateHUD();
        renderMachinesPanel();
    } else {
        showCustomAlert('Insufficient Funds', 'You need ₹1,500 to perform maintenance.');
    }
}

function upgradeMachine(machId) {
    const cost = 15000;
    if (gameState.money >= cost) {
        gameState.money -= cost;
        const mach = gameState.machines.find(m => m.id === machId);
        if (mach) mach.level++;
        showToast('Machine upgraded successfully!', 'success');
        updateHUD();
        renderMachinesPanel();
    } else {
        showCustomAlert('Insufficient Funds', 'You need ₹15,000 to upgrade this machine.');
    }
}

function renderStaffPanel() {
    const list = document.getElementById('staff-list');
    list.innerHTML = '';
    gameState.workers.forEach(worker => {
        const card = document.createElement('div');
        card.className = "bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3";
        card.innerHTML = `
            <div>
                <h4 class="font-extrabold text-sm text-white">${worker.name} <span class="text-xs text-cyan-400 font-normal">(Skill: ${worker.skill}%)</span></h4>
                <p class="text-xs text-slate-400 mt-0.5">Daily Salary: <strong class="text-rose-400">₹${worker.salary.toLocaleString()}</strong> | Speed Bonus: +${worker.speedBonus}%</p>
            </div>
            <button onclick="trainWorker('${worker.id}')" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md">Train (₹5,000)</button>
        `;
        list.appendChild(card);
    });
}

function trainWorker(workerId) {
    const cost = 5000;
    if (gameState.money >= cost) {
        gameState.money -= cost;
        const worker = gameState.workers.find(w => w.id === workerId);
        if (worker) {
            worker.skill = Math.min(100, worker.skill + 5);
            worker.speedBonus += 3;
        }
        showToast('Worker successfully trained!', 'success');
        updateHUD();
        renderStaffPanel();
    } else {
        showCustomAlert('Insufficient Funds', 'You need ₹5,000 to train staff.');
    }
}

function renderUpgradesPanel() {
    document.getElementById('expansion-tier-title').innerText = getFactoryLevelName(gameState.factoryLevel);
}

function upgradeFactory() {
    const cost = 150000;
    if (gameState.factoryLevel >= 5) {
        showCustomAlert('Max Level Reached', 'Your factory is already at maximum tier!');
        return;
    }
    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.factoryLevel++;
        showToast(`🎉 Factory expanded to ${getFactoryLevelName(gameState.factoryLevel)}!`, 'success');
        updateHUD();
        renderUpgradesPanel();
    } else {
        showCustomAlert('Insufficient Funds', 'You need ₹150,000 to expand your plant.');
    }
}

// Toast & Alert System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
    toast.className = `toast-anim w-full p-3 rounded-2xl border backdrop-blur-md shadow-xl text-xs font-bold flex items-center space-x-3 ${bg}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-base"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function showCustomAlert(title, message) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('custom-alert-modal').classList.remove('hidden');
}

function closeCustomAlert() {
    document.getElementById('custom-alert-modal').classList.add('hidden');
}

function closeOnboarding() {
    document.getElementById('onboarding-modal').classList.add('hidden');
    localStorage.setItem('aethercore_onboarded', 'true');
}

// Save & Load
function saveGameManual() {
    localStorage.setItem('aethercore_save', JSON.stringify(gameState));
    showToast('Game saved successfully!', 'success');
}

function loadGame() {
    const saved = localStorage.getItem('aethercore_save');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch(e) {
            console.error('Failed to load save', e);
        }
    }
}

function resetGameConfirm() {
    if (confirm('Are you sure you want to reset all factory progress?')) {
        localStorage.removeItem('aethercore_save');
        location.reload();
    }
}
