import * as THREE from 'three'

// ==================== GAME CONFIG ====================
const CONFIG = {
  playerSpeed: 5,
  sprintSpeed: 10,
  jumpForce: 10,
  gravity: 30,
  worldSize: 500
}

// ==================== GAME STATE ====================
const state = {
  health: 5,
  maxHealth: 5,
  stamina: 100,
  rupees: 0,
  keys: 0,
  isSprinting: false,
  isJumping: false,
  velocity: new THREE.Vector3(),
  keys: {},
  position: new THREE.Vector3(0, 5, 0)
}

// ==================== SCENE ====================
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
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
sunLight.shadow.camera.left = -100
sunLight.shadow.camera.right = 100
sunLight.shadow.camera.top = 100
sunLight.shadow.camera.bottom = -100
scene.add(sunLight)

// ==================== TERRAIN ====================
function createTerrain() {
  const groundGeo = new THREE.PlaneGeometry(CONFIG.worldSize, CONFIG.worldSize, 100, 100)
  const vertices = groundGeo.attributes.position.array
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] = Math.sin(vertices[i] * 0.02) * Math.cos(vertices[i + 1] * 0.02) * 2 + Math.random() * 0.5
  }
  groundGeo.computeVertexNormals()
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.9, flatShading: true })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
}

function createGrass(x, z) {
  const grassGeo = new THREE.ConeGeometry(0.3, 1, 4)
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.position.set(x, 0.5, z)
  scene.add(grass)
}

// ==================== TREES ====================
function createTree(x, z, scale = 1) {
  const group = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  )
  trunk.position.y = 1.5 * scale
  trunk.castShadow = true
  group.add(trunk)
  
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(2 * scale, 4 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  )
  foliage.position.y = 5 * scale
  foliage.castShadow = true
  group.add(foliage)
  
  group.position.set(x, 0, z)
  scene.add(group)
}

// ==================== BUILDINGS ====================
function createHouse(x, z) {
  const group = new THREE.Group()
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 4),
    new THREE.MeshStandardMaterial({ color: 0xd4a574 })
  )
  walls.position.y = 1.5
  walls.castShadow = true
  group.add(walls)
  
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  )
  roof.position.y = 4
  roof.rotation.y = Math.PI / 4
  group.add(roof)
  
  group.position.set(x, 0, z)
  scene.add(group)
}

function createTower(x, z) {
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  )
  tower.position.y = 4
  tower.castShadow = true
  scene.add(tower)
  
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(2, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0xaa4444 })
  )
  top.position.y = 9.5
  scene.add(top)
  
  tower.position.set(x, 0, z)
  top.position.set(x, 0, z)
}

function createLake(x, z, r = 20) {
  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(r, 32),
    new THREE.MeshStandardMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.8 })
  )
  lake.rotation.x = -Math.PI / 2
  lake.position.set(x, 0.1, z)
  scene.add(lake)
}

function createMountain(x, z, h) {
  const mtn = new THREE.Mesh(
    new THREE.ConeGeometry(30, h, 8),
    new THREE.MeshStandardMaterial({ color: 0x666666 })
  )
  mtn.position.set(x, h / 2, z)
  mtn.castShadow = true
  scene.add(mtn)
  
  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(10, h * 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )
  snow.position.set(x, h * 0.85, z)
  scene.add(snow)
}

// ==================== DUNGEONS ====================
function createDungeon(x, z) {
  const group = new THREE.Group()
  
  // Entrance
  const entrance = new THREE.Mesh(
    new THREE.BoxGeometry(8, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  )
  entrance.position.y = 3
  entrance.castShadow = true
  group.add(entrance)
  
  // Door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(2, 4, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x2a1a0a })
  )
  door.position.set(0, 2, 4)
  group.add(door)
  
  // Glow
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 1 })
  )
  glow.position.set(0, 5, 0)
  group.add(glow)
  
  group.position.set(x, 0, z)
  group.userData = { type: 'dungeon', locked: true }
  scene.add(group)
  return group
}

// ==================== PLAYER ====================
let player
function createPlayer() {
  const group = new THREE.Group()
  
  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  )
  body.position.y = 0.9
  body.castShadow = true
  group.add(body)
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffdbac })
  )
  head.position.y = 1.8
  group.add(head)
  
  // Hat
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  )
  hat.position.y = 2.1
  group.add(hat)
  
  // Sword
  const sword = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.8, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0 })
  )
  sword.position.set(0.3, 1.2, -0.2)
  sword.rotation.x = 0.3
  sword.name = 'sword'
  group.add(sword)
  
  group.position.copy(state.position)
  scene.add(group)
  return group
}

// ==================== ENEMIES ====================
const enemies = []

function createGoblin(x, z) {
  const group = new THREE.Group()
  
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
  )
  body.position.y = 0.8
  body.castShadow = true
  group.add(body)
  
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a7c3f })
  )
  head.position.y = 1.6
  group.add(head)
  
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 })
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat)
  eye1.position.set(-0.15, 1.65, 0.25)
  group.add(eye1)
  const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat)
  eye2.position.set(0.15, 1.65, 0.25)
  group.add(eye2)
  
  group.position.set(x, 0, z)
  group.userData = { type: 'goblin', health: 3, speed: 2, damage: 1, name: 'Goblin' }
  scene.add(group)
  enemies.push(group)
}

function createOctorok(x, z) {
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xcc4444 })
  )
  body.position.set(x, 1, z)
  body.castShadow = true
  body.userData = { type: 'octorok', health: 5, speed: 1.5, damage: 2, name: 'Octorok' }
  scene.add(body)
  enemies.push(body)
}

function createBoss(x, z) {
  const group = new THREE.Group()
  
  // Big body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.5, 2, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b0000 })
  )
  body.position.y = 2.5
  body.castShadow = true
  group.add(body)
  
  // Horns
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x222222 })
  const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 8), hornMat)
  horn1.position.set(-0.8, 4.5, 0)
  horn1.rotation.z = 0.3
  group.add(horn1)
  const horn2 = horn1.clone()
  horn2.position.x = 0.8
  horn2.rotation.z = -0.3
  group.add(horn2)
  
  // Glowing eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 })
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), eyeMat)
  eye1.position.set(-0.5, 3.5, 1)
  group.add(eye1)
  const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), eyeMat)
  eye2.position.set(0.5, 3.5, 1)
  group.add(eye2)
  
  group.position.set(x, 0, z)
  group.userData = { type: 'boss', health: 20, speed: 1, damage: 3, name: 'Ganon' }
  scene.add(group)
  enemies.push(group)
}

// ==================== ITEMS ====================
const items = []

function createRupee(x, z, color = 0x00ff00) {
  const rupee = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.3),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
  )
  rupee.position.set(x, 1, z)
  rupee.userData = { type: 'rupee', value: 10, name: 'Rupee' }
  scene.add(rupee)
  items.push(rupee)
}

function createHeart(x, z) {
  const heart = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.25),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 })
  )
  heart.position.set(x, 1, z)
  heart.userData = { type: 'heart', name: 'Heart' }
  scene.add(heart)
  items.push(heart)
}

function createKey(x, z) {
  const key = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.05, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.5 })
  )
  key.position.set(x, 1, z)
  key.userData = { type: 'key', name: 'Dungeon Key' }
  scene.add(key)
  items.push(key)
}

function createWeapon(x, z, type = 'sword') {
  let geo, color, name
  if (type === 'sword') {
    geo = new THREE.BoxGeometry(0.1, 1, 0.1)
    color = 0xc0c0c0
    name = 'Master Sword'
  } else if (type === 'bow') {
    geo = new THREE.TorusGeometry(0.5, 0.05, 8, 16, Math.PI)
    color = 0x8b4513
    name = 'Bow'
  }
  
  const weapon = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 }))
  weapon.position.set(x, 1, z)
  weapon.userData = { type: 'weapon', name }
  scene.add(weapon)
  items.push(weapon)
}

// ==================== WORLD GENERATION ====================
function generateWorld() {
  createTerrain()
  
  // Forests
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 200
    const z = (Math.random() - 0.5) * 200
    for (let j = 0; j < 5; j++) {
      createTree(x + Math.random() * 10, z + Math.random() * 10, 0.8 + Math.random() * 0.5)
    }
  }
  
  // Buildings
  createHouse(20, 20)
  createHouse(-30, 40)
  createTower(40, -20)
  createHouse(-40, -30)
  createHouse(60, 60)
  
  // Lakes
  createLake(-50, 50, 25)
  createLake(80, -60, 15)
  
  // Mountains
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    const dist = 150 + Math.random() * 50
    createMountain(Math.cos(angle) * dist, Math.sin(angle) * dist, 20 + Math.random() * 30)
  }
  
  // Dungeon
  createDungeon(-80, -80)
  
  // Enemies
  createGoblin(30, 30)
  createGoblin(-40, 20)
  createGoblin(50, -40)
  createGoblin(-20, -50)
  createOctorok(60, 30)
  createOctorok(-50, -40)
  
  // Boss
  createBoss(-80, -80)
  
  // Items
  for (let i = 0; i < 20; i++) {
    createRupee((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100)
  }
  createHeart(25, 25)
  createHeart(-35, 35)
  createKey(0, 50)
  createWeapon(30, -30, 'sword')
}

// ==================== CONTROLS ====================
function setupControls() {
  window.addEventListener('keydown', (e) => {
    state.keys[e.key.toLowerCase()] = true
    if (e.key === 'Shift') state.isSprinting = true
    if (e.key === 'e' || e.key === 'E') attack()
    if (e.key === 'q' || e.key === 'Q') showInventory()
  })
  
  window.addEventListener('keyup', (e) => {
    state.keys[e.key.toLowerCase()] = false
    if (e.key === 'Shift') state.isSprinting = false
  })
  
  renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock())
  
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      camera.rotation.y -= e.movementX * 0.002
      camera.rotation.x -= e.movementY * 0.002
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x))
    }
  })
}

// ==================== COMBAT ====================
let attackCooldown = 0
let isAttacking = false

function attack() {
  if (attackCooldown > 0) return
  attackCooldown = 0.5
  isAttacking = true
  
  // Visual feedback
  const sword = player.getObjectByName('sword')
  if (sword) {
    sword.rotation.z = -Math.PI / 4
    setTimeout(() => sword.rotation.x = 0.3, 200)
  }
  
  // Hit detection
  enemies.forEach(enemy => {
    const dist = player.position.distanceTo(enemy.position)
    if (dist < 3) {
      enemy.userData.health -= 1
      const dir = new THREE.Vector3().subVectors(enemy.position, player.position).normalize()
      enemy.position.add(dir.multiplyScalar(3))
      showDamage(enemy.position, `-1 ❤️`)
      
      if (enemy.userData.health <= 0) {
        scene.remove(enemy)
        enemies.splice(enemies.indexOf(enemy), 1)
        showMessage(`Defeated ${enemy.userData.name}!`)
      }
    }
  })
  
  setTimeout(() => isAttacking = false, 300)
}

// ==================== UI ====================
function showMessage(text) {
  const msg = document.createElement('div')
  msg.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);color:#ffd700;font-size:36px;font-weight:bold;text-shadow:2px 2px 4px #000;z-index:200;animation:fadeOut 1.5s forwards;'
  msg.textContent = text
  document.body.appendChild(msg)
  setTimeout(() => msg.remove(), 1500)
}

function showDamage(pos, text) {
  const msg = document.createElement('div')
  msg.style.cssText = 'position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);color:#ff4444;font-size:24px;font-weight:bold;z-index:200;'
  msg.textContent = text
  document.body.appendChild(msg)
  setTimeout(() => msg.remove(), 500)
}

function showInventory() {
  showMessage(`Rupees: ${state.rupees} | Keys: ${state.keys}`)
}

function updateUI() {
  document.getElementById('hearts').textContent = '❤️'.repeat(state.health) + '🖤'.repeat(state.maxHealth - state.health)
  document.getElementById('stamina-bar').style.width = state.stamina + '%'
}

// ==================== GAME LOOP ====================
let gameTime = 0
function updateWeather(delta)
  update(delta) {
  gameTime += delta
  
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
  
  state.velocity.y -= CONFIG.gravity * delta
  state.position.y += state.velocity.y * delta
  
  if (state.position.y < 5) {
    state.position.y = 5
    state.velocity.y = 0
    state.isJumping = false
  }
  
  // Update player
  player.position.copy(state.position)
  player.rotation.y = camera.rotation.y
  camera.position.copy(state.position)
  camera.position.y += 1.6
  
  // Animate items
  items.forEach(item => {
    item.rotation.y += delta
    item.position.y = 1 + Math.sin(gameTime * 2) * 0.2
  })
  
  // Enemy AI
  enemies.forEach(enemy => {
    const dist = enemy.position.distanceTo(player.position)
    if (dist < 30 && dist > 2) {
      const dir = new THREE.Vector3().subVectors(player.position, enemy.position).normalize()
      enemy.position.add(dir.multiplyScalar(enemy.userData.speed * delta))
      enemy.lookAt?.(player.position)
    }
    
    // Attack player
    if (dist < 2) {
      if (Math.random() < delta * 2) {
        state.health -= enemy.userData.damage
        showDamage(player.position, `-${enemy.userData.damage} ❤️`)
        if (state.health <= 0) {
          state.health = state.maxHealth
          state.position.set(0, 5, 0)
          showMessage('You died! Respawning...')
        }
      }
    }
  })
  
  // Collect items
  items.forEach((item, index) => {
    if (player.position.distanceTo(item.position) < 2) {
      if (item.userData.type === 'rupee') {
        state.rupees += item.userData.value
      } else if (item.userData.type === 'heart') {
        state.maxHealth = Math.min(10, state.maxHealth + 1)
        state.health = state.maxHealth
      } else if (item.userData.type === 'key') {
        state.keys += 1
      } else if (item.userData.type === 'weapon') {
        showMessage(`Got ${item.userData.name}!`)
      }
      showMessage(`+${item.userData.name}`)
      scene.remove(item)
      items.splice(index, 1)
    }
  })
  
  if (attackCooldown > 0) attackCooldown -= delta
  
  updateUI()
}

// ==================== INIT ====================
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const delta = Math.min(clock.getDelta(), 0.1)
  updateWeather(delta)
  update(delta)
  renderer.render(scene, camera)
}

function init() {
  generateWorld()
  player = createPlayer()
  setupControls()
  document.getElementById('loading').classList.add('hidden')
  showMessage('Welcome to Hyrule!')
  animate()
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

init()

// ==================== HORSES ====================
let horse = null

function createHorse(x, z) {
  const group = new THREE.Group()
  
  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  )
  body.position.y = 1
  body.rotation.x = Math.PI / 2
  group.add(body)
  
  // Head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.8, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  )
  head.position.set(0, 1.5, 1.2)
  group.add(head)
  
  // Legs (simplified)
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    )
    leg.position.set((i % 2 - 0.5) * 0.4, 0.5, (i < 2 ? 0.5 : -0.5))
    group.add(leg)
  }
  
  group.position.set(x, 0, z)
  group.userData = { type: 'horse', speed: 15, canRide: true }
  scene.add(group)
  return group
}

function rideHorse() {
  if (horse) {
    state.position.copy(horse.position)
    state.position.y = 2
    showMessage('Riding horse!')
  }
}

// ==================== SWIMMING ====================
function canSwim() {
  return state.position.y < 2
}

// ==================== WEATHER ====================
let weather = 'sunny'
let rainDrops = []

function setWeather(type) {
  weather = type
  
  if (type === 'rain') {
    // Add rain particles
    for (let i = 0; i < 500; i++) {
      const drop = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.2, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xaaaaff, transparent: true, opacity: 0.6 })
      )
      drop.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 50,
        (Math.random() - 0.5) * 100
      )
      scene.add(drop)
      rainDrops.push(drop)
    }
  }
}

function updateWeather(delta) {
  if (weather === 'rain') {
    rainDrops.forEach(drop => {
      drop.position.y -= 30 * delta
      if (drop.position.y < 0) drop.position.y = 50
    })
  }
}
