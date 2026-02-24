import * as THREE from 'three'

const CONFIG = { playerSpeed: 5, sprintSpeed: 12, jumpForce: 10, gravity: 30, worldSize: 500, horseSpeed: 18 }

const state = {
  health: 5, maxHealth: 5, stamina: 100, rupees: 0, keys: 0,
  isSprinting: false, isJumping: false, isRiding: false,
  velocity: new THREE.Vector3(), keys: {}, position: new THREE.Vector3(0, 5, 0),
  weather: 'sunny', inventory: [], questProgress: {}, completedQuests: []
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
scene.add(sunLight)

// ==================== QUESTS ====================
const quests = [
  {
    id: 'tutorial',
    title: '🔰 Tutorial: Explore',
    desc: 'Explore the world and find 3 items',
    type: 'collect',
    target: 3,
    reward: 50,
    progress: 0
  },
  {
    id: 'goblins',
    title: '⚔️ Defeat Goblins',
    desc: 'Defeat 3 goblins',
    type: 'kill',
    target: 3,
    reward: 100,
    progress: 0
  },
  {
    id: 'horse',
    title: '🐴 Find Your Horse',
    desc: 'Find and mount a horse',
    type: 'custom',
    customCheck: () => state.isRiding,
    reward: 30,
    progress: 0
  },
  {
    id: 'cook',
    title: '🍳 Master Chef',
    desc: 'Cook any meal',
    type: 'custom',
    customCheck: () => state.cookedMeal,
    reward: 75,
    progress: 0
  },
  {
    id: 'rich',
    title: '💰 Wealthy',
    desc: 'Collect 100 rupees',
    type: 'rupees',
    target: 100,
    reward: 200,
    progress: 0
  },
  {
    id: 'boss',
    title: '👹 Defeat Ganon',
    desc: 'Enter the dungeon and defeat the boss',
    type: 'boss',
    target: 1,
    reward: 500,
    progress: 0
  }
]

function updateQuestProgress(type, amount = 1) {
  let updated = false
  
  quests.forEach(quest => {
    if (state.completedQuests.includes(quest.id)) return
    
    if (quest.type === type || (type === 'collect' && quest.type === 'collect')) {
      quest.progress = (quest.progress || 0) + amount
      
      if (quest.progress >= quest.target) {
        state.completedQuests.push(quest.id)
        state.rupees += quest.reward
        showMessage(`✅ Quest Complete: ${quest.title}! +${quest.reward} rupees`)
        updated = true
      }
    }
  })
  
  if (type === 'kill') {
    updateQuestProgress('goblins', amount)
  }
}

function showQuestLog() {
  const existing = document.getElementById('quest-log')
  if (existing) {
    existing.remove()
    return
  }
  
  const log = document.createElement('div')
  log.id = 'quest-log'
  log.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.95);padding:30px;border-radius:15px;color:white;z-index:300;min-width:400px;max-height:80vh;overflow-y:auto;'
  
  let html = '<h2 style="color:#ffd700;margin-bottom:20px;">📜 Quest Log</h2>'
  
  quests.forEach(quest => {
    const completed = state.completedQuests.includes(quest.id)
    const progress = quest.progress || 0
    const percent = Math.min(100, (progress / quest.target) * 100)
    
    html += `
      <div style="padding:15px;margin:10px 0;background:${completed ? '#1a4a1a' : '#333'};border-radius:10px;border:2px solid ${completed ? '#4a7' : '#555'};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:bold;color:${completed ? '#4a7' : '#ffd700'};">${quest.title}</span>
          <span style="color:#aaa;font-size:12px;">${quest.reward} 💎</span>
        </div>
        <p style="color:#aaa;margin:5px 0;font-size:14px;">${quest.desc}</p>
        ${!completed ? `<div style="background:#222;height:8px;border-radius:4px;margin-top:10px;"><div style="background:#ffd700;height:100%;width:${percent}%;border-radius:4px;"></div></div><p style="color:#888;font-size:12px;margin-top:5px;">${progress}/${quest.target}</p>` : '<p style="color:#4a7;margin-top:10px;">✅ COMPLETED</p>'}
      </div>
    `
  })
  
  html += '<button onclick="closeQuestLog()" style="margin-top:20px;padding:10px 30px;background:#ff4444;color:white;border:none;border-radius:5px;cursor:pointer;width:100%;">Close</button>'
  
  log.innerHTML = html
  document.body.appendChild(log)
}

window.closeQuestLog = function() {
  const log = document.getElementById('quest-log')
  if (log) log.remove()
}

// Make showQuestLog global
window.showQuestLog = showQuestLog

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
  glow.name = 'dungeonGlow'
  scene.add(glow)
}

function createCookingPot(x, z) {
  const group = new THREE.Group()
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.6, 1, 16),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  )
  pot.position.y = 0.5
  group.add(pot)
  
  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 1 })
  )
  fire.position.y = 0.2
  group.add(fire)
  
  group.position.set(x, 0, z)
  group.userData = { type: 'cookingPot' }
  scene.add(group)
  return group
}

let player, horse = null
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

function createHorse(x, z, color = 0x8B4513) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.6, 1.8, 4, 8),
    new THREE.MeshStandardMaterial({ color })
  )
  body.position.y = 1.2
  body.rotation.x = Math.PI / 2
  body.castShadow = true
  group.add(body)
  
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.5, 0.8),
    new THREE.MeshStandardMaterial({ color })
  )
  head.position.set(0, 2.3, 1.3)
  group.add(head)
  
  group.position.set(x, 0, z)
  group.userData = { type: 'horse', speed: CONFIG.horseSpeed }
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
const ingredients = [
  { name: 'Apple', color: 0xff0000, heal: 2 },
  { name: 'Mushroom', color: 0xcc9966, heal: 1 },
  { name: 'Fish', color: 0x6699cc, heal: 3 },
  { name: 'Meat', color: 0x993333, heal: 4 },
  { name: 'Herb', color: 0x66cc66, heal: 2 }
]

function createIngredient(x, z, type) {
  const ing = ingredients[type]
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: ing.color, emissive: ing.color, emissiveIntensity: 0.3 })
  )
  mesh.position.set(x, 1, z)
  mesh.userData = { type: 'ingredient', name: ing.name, heal: ing.heal }
  scene.add(mesh)
  items.push(mesh)
}

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

const recipes = [
  { name: 'Soup', ingredients: ['Mushroom', 'Herb'], heal: 5 },
  { name: 'Stew', ingredients: ['Meat', 'Mushroom', 'Herb'], heal: 10 },
  { name: 'Fish Stew', ingredients: ['Fish', 'Herb'], heal: 8 },
  { name: 'Power Food', ingredients: ['Apple', 'Meat'], heal: 15 },
  { name: 'Full Restore', ingredients: ['Apple', 'Meat', 'Fish', 'Herb', 'Mushroom'], heal: 25 }
]

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
  createCookingPot(25, -25)
  
  createHorse(10, 10, 0x8B4513)
  createHorse(15, 15, 0xFFFFFF)
  createHorse(-10, 20, 0x222222)
  
  createGoblin(30, 30)
  createGoblin(-40, 20)
  createGoblin(50, -40)
  
  createBoss(-80, -80)
  
  for (let i = 0; i < 15; i++) {
    createIngredient((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, Math.floor(Math.random() * ingredients.length))
  }
  
  for (let i = 0; i < 20; i++) {
    createRupee((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100)
  }
  createHeart(25, 25)
  createKey(0, 50)
}

let weatherParticles = []
let currentWeather = 'sunny'

function setWeather(type) {
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
      drop.position.set((Math.random() - 0.5) * 200, Math.random() * 60, (Math.random() - 0.5) * 200)
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
      flake.position.set((Math.random() - 0.5) * 200, Math.random() * 60, (Math.random() - 0.5) * 200)
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
  }
}

function updateWeather(delta) {
  weatherParticles.forEach(p => {
    if (currentWeather === 'rain') {
      p.position.y -= 40 * delta
      if (p.position.y < 0) p.position.y = 60
    } else if (currentWeather === 'snow') {
      p.position.y -= 5 * delta
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

function setupControls() {
  window.addEventListener('keydown', (e) => {
    state.keys[e.key.toLowerCase()] = true
    if (e.key === 'Shift') state.isSprinting = true
    if (e.key === 'e' || e.key === 'E') {
      if (state.isRiding) dismountHorse()
      else tryMountHorse()
    }
    if (e.key === 't' || e.key === 'T') cycleWeather()
    if (e.key === 'q' || e.key === 'Q') showQuestLog()
    if (e.key === 's' || e.key === 'S') saveGame()
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

function tryMountHorse() {
  let closestHorse = null
  let closestDist = 5
  
  scene.traverse(obj => {
    if (obj.userData?.type === 'horse') {
      const dist = player.position.distanceTo(obj.position)
      if (dist < closestDist) {
        closestDist = dist
        closestHorse = obj
      }
    }
  })
  
  if (closestHorse) {
    horse = closestHorse
    state.isRiding = true
    player.visible = false
    showMessage('Mounted Horse!')
    updateQuestProgress('horse')
  }
}

function dismountHorse() {
  if (horse) {
    state.position.copy(horse.position)
    state.position.y = 1.5
    state.isRiding = false
    player.visible = true
    player.position.copy(state.position)
    horse = null
    showMessage('Dismounted')
  }
}

let attackCooldown = 0

function attack() {
  if (attackCooldown > 0) return
  attackCooldown = 0.5
  
  enemies.forEach(enemy => {
    const range = state.isRiding ? 4 : 3
    const dist = player.position.distanceTo(enemy.position)
    if (dist < range) {
      enemy.userData.health -= 1
      const dir = new THREE.Vector3().subVectors(enemy.position, player.position).normalize()
      enemy.position.add(dir.multiplyScalar(state.isRiding ? 5 : 3))
      
      if (enemy.userData.health <= 0) {
        scene.remove(enemy)
        enemies.splice(enemies.indexOf(enemy), 1)
        showMessage(`Defeated ${enemy.userData.name}!`)
        updateQuestProgress('kill')
      }
    }
  })
}

function showMessage(text) {
  const msg = document.createElement('div')
  msg.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);color:#ffd700;font-size:32px;font-weight:bold;text-shadow:2px 2px 4px #000;z-index:200;animation:fadeOut 1.5s forwards;'
  msg.textContent = text
  document.body.appendChild(msg)
  setTimeout(() => msg.remove(), 1500)
}

function updateUI() {
  document.getElementById('hearts').textContent = '❤️'.repeat(state.health) + '🖤'.repeat(state.maxHealth - state.health)
  document.getElementById('stamina-bar').style.width = state.stamina + '%'
}

function saveGame() {
  const saveData = {
    position: state.position,
    health: state.health,
    maxHealth: state.maxHealth,
    rupees: state.rupees,
    keys: state.keys,
    inventory: state.inventory,
    weather: currentWeather,
    completedQuests: state.completedQuests
  }
  localStorage.setItem('zelda_save', JSON.stringify(saveData))
  showMessage('Game Saved! 💾')
}

function loadGame() {
  const saved = localStorage.getItem('zelda_save')
  if (saved) {
    const data = JSON.parse(saved)
    state.position = new THREE.Vector3(data.position.x, data.position.y, data.position.z)
    state.health = data.health
    state.maxHealth = data.maxHealth
    state.rupees = data.rupees
    state.keys = data.keys
    state.inventory = data.inventory || []
    state.completedQuests = data.completedQuests || []
    if (data.weather) setWeather(data.weather)
    return true
  }
  return false
}

let gameTime = 0
function update(delta) {
  gameTime += delta
  updateWeather(delta)
  
  const speed = state.isRiding ? CONFIG.horseSpeed : (state.isSprinting ? CONFIG.sprintSpeed : CONFIG.playerSpeed)
  const direction = new THREE.Vector3()
  
  if (state.keys['w']) direction.z -= 1
  if (state.keys['s']) direction.z += 1
  if (state.keys['a']) direction.x -= 1
  if (state.keys['d']) direction.x += 1
  
  if (direction.length() > 0) {
    direction.normalize()
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y)
    
    if (state.isRiding && horse) {
      horse.position.x += direction.x * speed * delta
      horse.position.z += direction.z * speed * delta
      horse.rotation.y = camera.rotation.y
    }
    
    state.position.x += direction.x * speed * delta
    state.position.z += direction.z * speed * delta
    
    if (!state.isRiding && state.isSprinting && state.stamina > 0) {
      state.stamina = Math.max(0, state.stamina - 20 * delta)
    } else if (!state.isSprinting) {
      state.stamina = Math.min(100, state.stamina + 10 * delta)
    }
  }
  
  if (!state.isRiding) {
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
  }
  
  camera.position.copy(state.isRiding ? horse.position : state.position)
  camera.position.y += 2.5
  
  items.forEach(item => {
    item.rotation.y += delta
    item.position.y = 1 + Math.sin(gameTime * 2) * 0.2
  })
  
  enemies.forEach(enemy => {
    const dist = enemy.position.distanceTo(player.position)
    if (dist < 30 && dist > 2) {
      const dir = new THREE.Vector3().subVectors(player.position, enemy.position).normalize()
      enemy.position.add(dir.multiplyScalar(enemy.userData.speed * delta))
    }
    if (dist < 2 && Math.random() < delta * 2) {
      state.health -= enemy.userData.damage
      if (state.health <= 0) {
        state.health = state.maxHealth
        state.position.set(0, 5, 0)
        if (horse) dismountHorse()
        showMessage('You died!')
      }
    }
  })
  
  items.forEach((item, index) => {
    if (player.position.distanceTo(item.position) < 2) {
      if (item.userData.type === 'rupee') {
        state.rupees += item.userData.value
        updateQuestProgress('rupees', item.userData.value)
      } else if (item.userData.type === 'heart') {
        state.maxHealth = Math.min(10, state.maxHealth + 1)
        state.health = state.maxHealth
      } else if (item.userData.type === 'key') {
        state.keys++
      } else if (item.userData.type === 'ingredient') {
        if (state.inventory.length < 10) {
          state.inventory.push(item.userData.name)
          updateQuestProgress('collect')
          showMessage(`+${item.userData.name}`)
        }
      }
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
  
  if (!loadGame()) {
    showMessage('Welcome! Press Q for quests!')
  }
  
  document.getElementById('loading').classList.add('hidden')
  animate()
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

init()

// ==================== CRAFTING (Added) ====================
const materials = [
  { name: 'Wood', icon: '🪵' },
  { name: 'Iron', icon: '⛓️' },
  { name: 'Gem', icon: '💎' }
]

const craftRecipes = [
  { name: 'Sword', need: { Wood: 2, Iron: 3 }, damage: 5 },
  { name: 'Shield', need: { Wood: 3, Iron: 2 }, defense: 3 },
  { name: 'Bow', need: { Wood: 4 }, damage: 3 }
]

function showCrafting() {
  alert('Crafting coming soon!')
}
