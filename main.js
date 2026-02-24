import * as THREE from 'three'

// ==================== GAME CONFIG ====================
const CONFIG = {
  playerSpeed: 5,
  sprintSpeed: 10,
  jumpForce: 10,
  gravity: 30,
  worldSize: 500,
  chunkSize: 50
}

// ==================== GAME STATE ====================
const state = {
  health: 5,
  stamina: 100,
  isSprinting: false,
  isJumping: false,
  velocity: new THREE.Vector3(),
  keys: {},
  position: new THREE.Vector3(0, 5, 0)
}

// ==================== SCENE SETUP ====================
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb) // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 50, 200)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.getElementById('game').appendChild(renderer.domElement)

// ==================== LIGHTING ====================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight(0xfffaed, 1)
sunLight.position.set(50, 100, 50)
sunLight.castShadow = true
sunLight.shadow.mapSize.width = 2048
sunLight.shadow.mapSize.height = 2048
sunLight.shadow.camera.near = 0.5
sunLight.shadow.camera.far = 500
sunLight.shadow.camera.left = -100
sunLight.shadow.camera.right = 100
sunLight.shadow.camera.top = 100
sunLight.shadow.camera.bottom = -100
scene.add(sunLight)

// ==================== TERRAIN ====================
function createTerrain() {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(CONFIG.worldSize, CONFIG.worldSize, 100, 100)
  
  // Add some height variation
  const vertices = groundGeo.attributes.position.array
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i]
    const y = vertices[i + 1]
    vertices[i + 2] = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 2 + Math.random() * 0.5
  }
  groundGeo.computeVertexNormals()
  
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c3f,
    roughness: 0.9,
    flatShading: true
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  
  // Add grass patches
  for (let i = 0; i < 500; i++) {
    const x = (Math.random() - 0.5) * CONFIG.worldSize * 0.8
    const z = (Math.random() - 0.5) * CONFIG.worldSize * 0.8
    createGrass(x, z)
  }
}

function createGrass(x, z) {
  const grassGeo = new THREE.ConeGeometry(0.3, 1, 4)
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.position.set(x, 0.5, z)
  grass.rotation.y = Math.random() * Math.PI
  scene.add(grass)
}

// ==================== TREES ====================
function createTree(x, z, scale = 1) {
  const group = new THREE.Group()
  
  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.y = 1.5 * scale
  trunk.castShadow = true
  group.add(trunk)
  
  // Foliage
  const foliageGeo = new THREE.ConeGeometry(2 * scale, 4 * scale, 8)
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228b22 })
  const foliage = new THREE.Mesh(foliageGeo, foliageMat)
  foliage.position.y = 5 * scale
  foliage.castShadow = true
  group.add(foliage)
  
  group.position.set(x, 0, z)
  scene.add(group)
}

// ==================== BUILDINGS ====================
function createBuilding(x, z, type = 'house') {
  const group = new THREE.Group()
  
  if (type === 'house') {
    // Walls
    const wallsGeo = new THREE.BoxGeometry(4, 3, 4)
    const wallsMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 })
    const walls = new THREE.Mesh(wallsGeo, wallsMat)
    walls.position.y = 1.5
    walls.castShadow = true
    walls.receiveShadow = true
    group.add(walls)
    
    // Roof
    const roofGeo = new THREE.ConeGeometry(3.5, 2, 4)
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.y = 4
    roof.rotation.y = Math.PI / 4
    group.add(roof)
    
    // Door
    const doorGeo = new THREE.BoxGeometry(1, 2, 0.1)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 })
    const door = new THREE.Mesh(doorGeo, doorMat)
    door.position.set(0, 1, 2)
    group.add(door)
  } else if (type === 'tower') {
    const towerGeo = new THREE.CylinderGeometry(1.5, 2, 8, 8)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const tower = new THREE.Mesh(towerGeo, towerMat)
    tower.position.y = 4
    tower.castShadow = true
    group.add(tower)
    
    // Top
    const topGeo = new THREE.ConeGeometry(2, 3, 8)
    const topMat = new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    const top = new THREE.Mesh(topGeo, topMat)
    top.position.y = 9.5
    group.add(top)
  }
  
  group.position.set(x, 0, z)
  scene.add(group)
}

// ==================== WATER ====================
function createLake(x, z, radius = 20) {
  const lakeGeo = new THREE.CircleGeometry(radius, 32)
  const lakeMat = new THREE.MeshStandardMaterial({ 
    color: 0x1e90ff,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1
  })
  const lake = new THREE.Mesh(lakeGeo, lakeMat)
  lake.rotation.x = -Math.PI / 2
  lake.position.set(x, 0.1, z)
  scene.add(lake)
}

// ==================== PLAYER ====================
function createPlayer() {
  const group = new THREE.Group()
  
  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 4, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x228b22 }) // Green tunic
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.9
  body.castShadow = true
  group.add(body)
  
  // Head
  const headGeo = new THREE.SphereGeometry(0.3, 16, 16)
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac }) // Skin
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.8
  group.add(head)
  
  // Hat
  const hatGeo = new THREE.ConeGeometry(0.4, 0.3, 16)
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x228b22 })
  const hat = new THREE.Mesh(hatGeo, hatMat)
  hat.position.y = 2.1
  group.add(hat)
  
  // Sword (on back)
  const swordGeo = new THREE.BoxGeometry(0.05, 0.8, 0.02)
  const swordMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 })
  const sword = new THREE.Mesh(swordGeo, swordMat)
  sword.position.set(0.3, 1.2, -0.2)
  sword.rotation.x = 0.3
  group.add(sword)
  
  group.position.copy(state.position)
  scene.add(group)
  
  return group
}

// ==================== WORLD GENERATION ====================
function generateWorld() {
  createTerrain()
  
  // Create forests
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 200
    const z = (Math.random() - 0.5) * 200
    for (let j = 0; j < 5; j++) {
      createTree(x + Math.random() * 10, z + Math.random() * 10, 0.8 + Math.random() * 0.5)
    }
  }
  
  // Create buildings
  createBuilding(20, 20, 'house')
  createBuilding(-30, 40, 'house')
  createBuilding(40, -20, 'tower')
  createBuilding(-40, -30, 'house')
  createBuilding(60, 60, 'house')
  
  // Create lakes
  createLake(-50, 50, 25)
  createLake(80, -60, 15)
  
  // Create mountains in distance
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    const dist = 150 + Math.random() * 50
    const x = Math.cos(angle) * dist
    const z = Math.sin(angle) * dist
    createMountain(x, z, 20 + Math.random() * 30)
  }
}

function createMountain(x, z, height) {
  const mountainGeo = new THREE.ConeGeometry(30, height, 8)
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x666666 })
  const mountain = new THREE.Mesh(mountainGeo, mountainMat)
  mountain.position.set(x, height / 2, z)
  mountain.castShadow = true
  scene.add(mountain)
  
  // Snow cap
  const snowGeo = new THREE.ConeGeometry(10, height * 0.3, 8)
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const snow = new THREE.Mesh(snowGeo, snowMat)
  snow.position.set(x, height * 0.85, z)
  scene.add(snow)
}

// ==================== INPUT HANDLING ====================
function setupControls() {
  window.addEventListener('keydown', (e) => {
    state.keys[e.key.toLowerCase()] = true
    if (e.key === 'Shift') state.isSprinting = true
  })
  
  window.addEventListener('keyup', (e) => {
    state.keys[e.key.toLowerCase()] = false
    if (e.key === 'Shift') state.isSprinting = false
  })
  
  // Pointer lock for mouse look
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock()
  })
  
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      camera.rotation.y -= e.movementX * 0.002
      camera.rotation.x -= e.movementY * 0.002
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x))
    }
  })
}

// ==================== GAME LOOP ====================
let player

function update(delta) {
  // Movement
  const speed = state.isSprinting ? CONFIG.sprintSpeed : CONFIG.playerSpeed
  const direction = new THREE.Vector3()
  
  if (state.keys['w']) direction.z -= 1
  if (state.keys['s']) direction.z += 1
  if (state.keys['a']) direction.x -= 1
  if (state.keys['d']) direction.x += 1
  
  if (direction.length() > 0) {
    direction.normalize()
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y)
    state.position.x += direction.x * speed * delta
    state.position.z += direction.z * speed * delta
    
    // Sprint stamina drain
    if (state.isSprinting && state.stamina > 0) {
      state.stamina = Math.max(0, state.stamina - 20 * delta)
    } else if (!state.isSprinting) {
      state.stamina = Math.min(100, state.stamina + 10 * delta)
    }
  }
  
  // Jump
  if (state.keys[' '] && !state.isJumping && state.position.y <= 5.1) {
    state.velocity.y = CONFIG.jumpForce
    state.isJumping = true
  }
  
  // Gravity
  state.velocity.y -= CONFIG.gravity * delta
  state.position.y += state.velocity.y * delta
  
  // Ground collision
  if (state.position.y < 5) {
    state.position.y = 5
    state.velocity.y = 0
    state.isJumping = false
  }
  
  // Update player position
  player.position.copy(state.position)
  player.rotation.y = camera.rotation.y
  
  // Update camera
  camera.position.copy(state.position)
  camera.position.y += 1.6 // Eye height
  
  // Update UI
  updateUI()
}

function updateUI() {
  // Hearts
  const hearts = '❤️'.repeat(state.health) + '🖤'.repeat(5 - state.health)
  document.getElementById('hearts').textContent = hearts
  
  // Stamina
  document.getElementById('stamina-bar').style.width = state.stamina + '%'
}

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const delta = Math.min(clock.getDelta(), 0.1)
  update(delta)
  renderer.render(scene, camera)
}

// ==================== INIT ====================
function init() {
  generateWorld()
  player = createPlayer()
  setupControls()
  
  // Hide loading screen
  document.getElementById('loading').classList.add('hidden')
  
  // Start game loop
  animate()
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Start!
init()
