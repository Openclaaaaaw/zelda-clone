import * as THREE from 'three'

const CONFIG = { playerSpeed: 5, sprintSpeed: 12, jumpForce: 10, gravity: 30, worldSize: 500 }

const state = {
  health: 5, maxHealth: 5, stamina: 100, rupees: 0, keys: 0,
  isSprinting: false, isJumping: false,
  velocity: new THREE.Vector3(), keys: {}, position: new THREE.Vector3(0, 5, 0),
  weather: 'sunny', isRiding: false
}

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
scene.fog = new THREE.Fog(0x87ceeb, 50, 200)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.getElementById('game').appendChild(renderer.domElement)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight(0xfffaed, 1)
sunLight.position.set(50, 100, 50)
sunLight.castShadow = true
sunLight.shadow.mapSize.width = 2048
sunLight.shadow.mapSize.height = 2048
scene.add(sunLight)

function createTerrain() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.worldSize, CONFIG.worldSize, 100, 100),
    new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.9, flatShading: true })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  
  for (let i = 0; i < 500; i++) {
    const grass = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1, 4),
      new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
    )
    grass.position.set((Math.random() - 0.5) * 400, 0.5, (Math.random() - 0.5) * 400)
    scene.add(grass)
  }
}

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

function createHouse(x, z) {
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 4),
    new THREE.MeshStandardMaterial({ color: 0xd4a574 })
  )
  walls.position.set(x, 1.5, z)
  walls.castShadow = true
  scene.add(walls)
  
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  )
  roof.position.set(x, 4, z)
  roof.rotation.y = Math.PI / 4
  scene.add(roof)
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
  scene.add(mtn)
  
  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(10, h * 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )
  snow.position.set(x, h * 0.85, z)
  scene.add(snow)
}

function createDungeon(x, z) {
  const entrance = new THREE.Mesh(
    new THREE.BoxGeometry(8, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  )
  entrance.position.set(x, 3, z)
  entrance.castShadow = true
  scene.add(entrance)
  
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 1 })
  )
  glow.position.set(x, 6, z)
  scene.add(glow)
}

let player
function createPlayer() {
  const group = new THREE.Group()
  
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  )
  body.position.y = 0.9
  body.castShadow = true
  group.add(body)
  
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffdbac })
  )
  head.position.y = 1.8
  group.add(head)
  
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  )
  hat.position.y = 2.1
  group.add(hat)
  
  const sword = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.8, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0 })
  )
  sword.position.set(0.3, 1.2, -0.2)
  sword.name = 'sword'
  group.add(sword)
  
  group.position.copy(state.position)
  scene.add(group)
  return group
}

const enemies = []

function createGoblin(x, z) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
  )
  body.position.y = 0.8
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

function createBoss(x, z) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.5, 2, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b0000 })
  )
  body.position.y = 2.5
  group.add(body)
  
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

const items = []

function createRupee(x, z) {
  const rupee = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.3),
    new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5 })
  )
  rupee.position.set(x, 1, z)
  rupee.userData = { type: 'rupee', value: 10 }
  scene.add(rupee)
  items.push(rupee)
}

function createHeart(x, z) {
  const heart = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.25),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 })
  )
  heart.position.set(x, 1, z)
  heart.userData = { type: 'heart' }
  scene.add(heart)
  items.push(heart)
}

function createKey(x, z) {
  const key = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.05, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.5 })
  )
  key.position.set(x, 1, z)
  key.userData = { type: 'key' }
  scene.add(key)
  items.push(key)
}

function generateWorld() {
  createTerrain()
  
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 200
    const z = (Math.random() - 0.5) * 200
    for (let j = 0; j < 5; j++) {
      createTree(x + Math.random() * 10, z + Math.random() * 10, 0.8 + Math.random() * 0.5)
    }
  }
  
  createHouse(20, 20)
  createHouse(-30, 40)
  createHouse(40, -20)
  
  createLake(-50, 50, 25)
  createLake(80, -60, 15)
  
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    createMountain(Math.cos(angle) * 180, Math.sin(angle) * 180, 30 + Math.random() * 30)
  }
  
  createDungeon(-80, -80)
  
  createGoblin(30, 30)
  createGoblin(-40, 20)
  createGoblin(50, -40)
  
  createBoss(-80, -80)
  
  for (let i = 0; i < 20; i++) {
    createRupee((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100)
  }
  createHeart(25, 25)
  createKey(0, 50)
}

// ==================== WEATHER SYSTEM ====================
let weatherParticles = []
let currentWeather = 'sunny'

function setWeather(type) {
  // Clear existing
  weatherParticles.forEach(p => scene.remove(p))
  weatherParticles = []
  currentWeather = type
  
  if (type === 'rain') {
    scene.background = new THREE.Color(0x445566)
    scene.fog.color = new THREE.Color(0x445566)
    sunLight.intensity = 0.3
    
    for (let i = 0; i < 1000; i++) {
      const drop = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.3, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xaaaaff, transparent: true, opacity: 0.6 })
      )
      drop.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 60,
        (Math.random() - 0.5) * 200
      )
      scene.add(drop)
      weatherParticles.push(drop)
    }
  } else if (type === 'snow') {
    scene.background = new THREE.Color(0xaabbcc)
    scene.fog.color = new THREE.Color(0xaabbcc)
    sunLight.intensity = 0.5
    
    for (let i = 0; i < 500; i++) {
      const flake = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
      )
      flake.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 60,
        (Math.random() - 0.5) * 200
      )
      scene.add(flake)
      weatherParticles.push(flake)
    }
  } else if (type === 'sunny') {
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog.color = new THREE.Color(0x87ceeb)
    sunLight.intensity = 1
  } else if (type === 'night') {
    scene.background = new THREE.Color(0x0a0a2e)
    scene.fog.color = new THREE.Color(0x0a0a2e)
    sunLight.intensity = 0.1
    ambientLight.intensity = 0.2
  }
}

function updateWeather(delta) {
  weatherParticles.forEach(p => {
    if (currentWeather === 'rain') {
      p.position.y -= 40 * delta
      if (p.position.y < 0) p.position.y = 60
    } else if (currentWeather === 'snow') {
      p.position.y -= 5 * delta
      p.position.x += Math.sin(p.position.y) * delta
      if (p.position.y < 0) p.position.y = 60
    }
  })
}

function cycleWeather() {
  const weathers = ['sunny', 'rain', 'snow', 'night']
  const idx = weathers.indexOf(currentWeather)
  setWeather(weathers[(idx + 1) % weathers.length])
  showMessage(`Weather: ${currentWeather}`)
}

// ==================== CONTROLS ====================
function setupControls() {
  window.addEventListener('keydown', (e) => {
    state.keys[e.key.toLowerCase()] = true
    if (e.key === 'Shift') state.isSprinting = true
    if (e.key === 'e' || e.key === 'E') attack()
    if (e.key === 't' || e.key === 'T') cycleWeather()
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

function attack() {
  if (attackCooldown > 0) return
  attackCooldown = 0.5
  
  enemies.forEach(enemy => {
    const dist = player.position.distanceTo(enemy.position)
    if (dist < 3) {
      enemy.userData.health -= 1
      const dir = new THREE.Vector3().subVectors(enemy.position, player.position).normalize()
      enemy.position.add(dir.multiplyScalar(3))
      showDamage(enemy.position, '-1')
      
      if (enemy.userData.health <= 0) {
        scene.remove(enemy)
        enemies.splice(enemies.indexOf(enemy), 1)
        showMessage(`Defeated ${enemy.userData.name}!`)
      }
    }
  })
}

// ==================== UI ====================
function showMessage(text) {
  const msg = document.createElement('div')
  msg.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);color:#ffd700;font-size:32px;font-weight:bold;text-shadow:2px 2px 4px #000;z-index:200;animation:fadeOut 1.5s forwards;'
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

function updateUI() {
  document.getElementById('hearts').textContent = '❤️'.repeat(state.health) + '🖤'.repeat(state.maxHealth - state.health)
  document.getElementById('stamina-bar').style.width = state.stamina + '%'
}

// ==================== GAME LOOP ====================
let gameTime = 0
function update(delta) {
  gameTime += delta
  updateWeather(delta)
  
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
  
  player.position.copy(state.position)
  player.rotation.y = camera.rotation.y
  camera.position.copy(state.position)
  camera.position.y += 1.6
  
  items.forEach(item => {
    item.rotation.y += delta
    item.position.y = 1 + Math.sin(gameTime * 2) * 0.2
  })
  
  enemies.forEach(enemy => {
    const dist = enemy.position.distanceTo(player.position)
    if (dist < 30 && dist > 2) {
      const dir = new THREE.Vector3().subVectors(player.position, enemy.position).normalize()
      enemy.position.add(dir.multiplyScalar(enemy.userData.speed * delta))
      enemy.lookAt?.(player.position)
    }
    if (dist < 2 && Math.random() < delta * 2) {
      state.health -= enemy.userData.damage
      showDamage(player.position, `-${enemy.userData.damage}`)
      if (state.health <= 0) {
        state.health = state.maxHealth
        state.position.set(0, 5, 0)
        showMessage('You died!')
      }
    }
  })
  
  items.forEach((item, index) => {
    if (player.position.distanceTo(item.position) < 2) {
      if (item.userData.type === 'rupee') state.rupees += item.userData.value
      else if (item.userData.type === 'heart') { state.maxHealth = Math.min(10, state.maxHealth + 1); state.health = state.maxHealth }
      else if (item.userData.type === 'key') state.keys++
      showMessage(`+${item.userData.type}`)
      scene.remove(item)
      items.splice(index, 1)
    }
  })
  
  if (attackCooldown > 0) attackCooldown -= delta
  updateUI()
}

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const delta = Math.min(clock.getDelta(), 0.1)
  update(delta)
  renderer.render(scene, camera)
}

function init() {
  generateWorld()
  player = createPlayer()
  setupControls()
  document.getElementById('loading').classList.add('hidden')
  showMessage('Press T to change weather!')
  animate()
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

init()
