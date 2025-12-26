// ==========================================
// 1. SETUP SCENE
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load OrbitControls (So she can drag the earth)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = false; // Disable zoom (we control zoom via code)
controls.enablePan = false;
controls.enabled = false; // Disabled initially (in Solar System mode)

// Textures
const loader = new THREE.TextureLoader();

// ==========================================
// 2. CREATE OBJECTS
// ==========================================

// SUN
const sunGeometry = new THREE.SphereGeometry(2, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ map: loader.load('assets/images/sun_texture.jpg') });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// EARTH GROUP (Earth + Cloud/Pins will rotate together)
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// EARTH
const earthGeometry = new THREE.SphereGeometry(0.5, 64, 64);
const earthMaterial = new THREE.MeshStandardMaterial({
    map: loader.load('assets/images/earth_texture.jpg'),
    roughness: 1, metalness: 0
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earthGroup.add(earth); // Add Earth to the Group

// STARS
const starGeometry = new THREE.SphereGeometry(50, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({
    map: loader.load('assets/images/stars.jpg'), side: THREE.BackSide
});
const starBackground = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starBackground);

// LIGHTS
const pointLight = new THREE.PointLight(0xffffff, 2, 100);
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// ==========================================
// 3. VARIABLES & COORDINATE MATH
// ==========================================
let viewState = "SOLAR_SYSTEM"; // Options: SOLAR_SYSTEM, TRAVELING, EARTH_VIEW
let angle = 0;
const orbitRadius = 7;
const earthRadius = 0.5;

// LEAFLET MAP VARIABLES
let map = null; // Country View Map
let cityMap = null; // City Gallery Map
let currentLayer = null;
let currentPerson = null; // Global reference for current person context

// Raycaster for interactions (declared early so animate() can use it)
const raycaster = new THREE.Raycaster();
raycaster.params.Sprite = { threshold: 0.1 };
const mouse = new THREE.Vector2();

// Camera Start Position
camera.position.z = 12;
camera.position.y = 3;

// Helper: Convert Lat/Lon to 3D Position
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

// ==========================================
// 4. ADD CITY MARKERS (The "Pins")
// ==========================================
const markers = []; // Keep track of markers to detect clicks later

function createMarkers() {
    // Load the pin texture
    const pinTexture = loader.load('assets/images/pin.png');

    // Read from the global 'database' variable in data.js (NOW COUNTRIES)
    database.countries.forEach(country => {
        // 1. Create the Pin Sprite for the COUNTRY
        const pinMaterial = new THREE.SpriteMaterial({ map: pinTexture });
        const pin = new THREE.Sprite(pinMaterial);

        // Adjust scale (larger for easier clicking)
        pin.scale.set(0.35, 0.35, 1);

        // Anchor bottom center (0.5, 0)
        pin.center.set(0.5, 0);

        // Calculate position
        const pos = latLonToVector3(country.lat, country.lng, earthRadius);
        pin.position.copy(pos);

        // Store COUNTRY data inside the marker object
        pin.userData = {
            type: 'country',
            countryData: country
        };

        // Add to Earth Group so it rotates WITH the earth
        earthGroup.add(pin);
        markers.push(pin);

        // 2. Create the Text Label
        const textSprite = createTextLabel(country.name);
        const labelPos = pos.clone().multiplyScalar(1.4);
        textSprite.position.copy(labelPos);
        earthGroup.add(textSprite);
    });
}

function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = 256;
    canvas.height = 64;

    // Style text
    context.font = 'Bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Add text shadow/glow for visibility
    context.shadowColor = 'rgba(0,0,0,0.8)';
    context.shadowBlur = 4;
    context.lineWidth = 2; // for stroke if needed

    // Draw text
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    sprite.scale.set(0.5, 0.125, 1); // Adjust scale to match canvas aspect ratio
    return sprite;
}
createMarkers(); // Run this immediately

// ==========================================
// 4b. ADD EXTRA PLANETS (For "Nudge" Delight)
// ==========================================
const planets = [];
function createExtraPlanets() {
    const planetData = [
        { color: 0xff4444, size: 0.3, orbit: 4, speed: 0.008, name: 'Mars' },
        { color: 0xffaa00, size: 0.8, orbit: 9, speed: 0.004, name: 'Jupiter' },
        { color: 0x4444ff, size: 0.7, orbit: 11, speed: 0.003, name: 'Neptune' }
    ];

    planetData.forEach(p => {
        const geo = new THREE.SphereGeometry(p.size, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);

        // Random starting angle
        const startAngle = Math.random() * Math.PI * 2;

        mesh.userData = {
            orbitRadius: p.orbit,
            orbitSpeed: p.speed,
            angle: startAngle,
            baseRotationSpeed: 0.01,
            hoverRotationSpeed: 0.1, // Fast spin on nudge
            isHovered: false
        };

        // Initial Pos
        mesh.position.x = p.orbit * Math.cos(startAngle);
        mesh.position.z = p.orbit * Math.sin(startAngle);

        scene.add(mesh);
        planets.push(mesh);
    });
}
createExtraPlanets();

createExtraPlanets();

// ==========================================
// 4c. INTERACTIVE STAR PARTICLES ("Gravity" Delight)
// ==========================================
const starParticlesGeometry = new THREE.BufferGeometry();
const starCount = 1500;
const starPositions = new Float32Array(starCount * 3);
const starInitialPositions = new Float32Array(starCount * 3);
const starVelocities = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i++) {
    const val = (Math.random() - 0.5) * 100; // Spread wide
    starPositions[i] = val;
    starInitialPositions[i] = val;
    starVelocities[i] = 0;
}

starParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starParticlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    transparent: true,
    opacity: 0.8
});
const starField = new THREE.Points(starParticlesGeometry, starParticlesMaterial);
scene.add(starField);


// ==========================================
// 4d. "YOU ARE HERE" PULSE (Delight)
// ==========================================
let pulseMarker = null;
function createPulseMarker() {
    // Create soft glow texture
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw Gradient Circle
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 255, 255, 1)');   // Cyan Center
    grad.addColorStop(0.4, 'rgba(0, 255, 255, 0.5)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0)');   // Fade out

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: false, // Always visible on top (optional, maybe keep true for realism)
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    pulseMarker = new THREE.Sprite(mat);

    // Position at "Home" (e.g., New York: 40.7128° N, 74.0060° W)
    // Or just an arbitrary point that looks good in initial view
    const homePos = latLonToVector3(40.7128, -74.0060, earthRadius * 1.01); // Slightly above surface
    pulseMarker.position.copy(homePos);
    pulseMarker.scale.set(0.1, 0.1, 1);

    earthGroup.add(pulseMarker);
}
createPulseMarker();

// ==========================================
// 4e. STAR DUST BURST (Interaction Delight)
// ==========================================
let dustParticles = [];
function createDustBurst(position) {
    const particleCount = 20;
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Simple glowing dot
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'white');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending });

    for (let i = 0; i < particleCount; i++) {
        const sprite = new THREE.Sprite(mat.clone());
        sprite.position.copy(position);

        // Random velocity roughly upwards/outwards
        const vx = (Math.random() - 0.5) * 0.05;
        const vy = (Math.random() * 0.05) + 0.02; // Up
        const vz = (Math.random() - 0.5) * 0.05;

        sprite.userData = { velocity: new THREE.Vector3(vx, vy, vz), life: 1.0 };
        sprite.scale.set(0.2, 0.2, 1);

        scene.add(sprite);
        dustParticles.push(sprite);
    }
}

// ==========================================
// 4f. JANVI ORBITS (Revolving Images)
// ==========================================
const janviImages = [];
function createJanviOrbits() {
    const janviData = [
        { img: 'assets/images/jahnavi_1.jpg', orbit: 5.5, speed: 0.007, size: 2.0 }, // Between Mars (4) and Earth (7)
        { img: 'assets/images/jahnavi_3.jpg', orbit: 8.5, speed: 0.005, size: 2.5 }, // Between Earth (7) and Jupiter (9)
        { img: 'assets/images/jahnavi_4.jpg', orbit: 13, speed: 0.003, size: 3.0 }, // Beyond Neptune (11)
        { img: 'assets/images/jahnavi_5.jpg', orbit: 15, speed: 0.002, size: 3.5 }  // Far orbit
    ];

    janviData.forEach(d => {
        const tex = loader.load(d.img);
        // Use SpriteMaterial so it always faces camera
        const mat = new THREE.SpriteMaterial({ map: tex });
        const sprite = new THREE.Sprite(mat);

        sprite.scale.set(d.size, d.size, 1);

        // Random starting angle
        const startAngle = Math.random() * Math.PI * 2;

        sprite.userData = {
            orbitRadius: d.orbit,
            orbitSpeed: d.speed,
            angle: startAngle
        };

        // Initial Pos
        sprite.position.x = d.orbit * Math.cos(startAngle);
        sprite.position.z = d.orbit * Math.sin(startAngle);
        // Add a slight Y variation so they aren't all on the exact same plane
        sprite.position.y = (Math.random() - 0.5) * 2;

        scene.add(sprite);
        janviImages.push(sprite);
    });
}
createJanviOrbits();

// ==========================================
// 5. ANIMATION LOOP
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    // BACKGROUND MOVEMENT
    sun.rotation.y += 0.002;
    starBackground.rotation.y += 0.0005;

    // GRAVITY EFFECT (Stars pull to mouse)
    if (viewState === "SOLAR_SYSTEM") {
        // Unproject mouse to get a world point roughly in front of camera
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z; // Project to Z=0 plane (approx)
        const targetPos = camera.position.clone().add(dir.multiplyScalar(10)); // Arbitrary look-at point

        const positions = starField.geometry.attributes.position.array;

        for (let i = 0; i < starCount; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            const px = positions[ix];
            const py = positions[iy];
            const pz = positions[iz];

            // 1. Calculate distance to "Mouse Target"
            const dx = targetPos.x - px;
            const dy = targetPos.y - py;
            const dz = targetPos.z - pz;
            const distSq = dx * dx + dy * dy + dz * dz;

            // 2. Apply Force if close (Gravitational Pull)
            // Range 10 units. Force falls off with distance.
            if (distSq < 100) {
                const force = 0.05 * (1 - distSq / 100);
                positions[ix] += dx * force;
                positions[iy] += dy * force;
                positions[iz] += dz * force;
            } else {
                // 3. Return to initial position (Elasticity)
                positions[ix] += (starInitialPositions[ix] - px) * 0.02;
                positions[iy] += (starInitialPositions[iy] - py) * 0.02;
                positions[iz] += (starInitialPositions[iz] - pz) * 0.02;
            }
        }
        starField.geometry.attributes.position.needsUpdate = true;
    }

    if (viewState === "SOLAR_SYSTEM") {
        // Orbit Logic (Earth)
        earthGroup.rotation.y += 0.02; // Spin
        angle += 0.005; // Orbit
        earthGroup.position.x = orbitRadius * Math.cos(angle);
        earthGroup.position.z = orbitRadius * Math.sin(angle);

        // Orbit Logic (Extra Planets)
        planets.forEach(p => {
            const data = p.userData;
            data.angle += data.orbitSpeed;
            p.position.x = data.orbitRadius * Math.cos(data.angle);
            p.position.z = data.orbitRadius * Math.sin(data.angle);

            // Spin: Normal vs Hover
            const spinSpeed = data.isHovered ? data.hoverRotationSpeed : data.baseRotationSpeed;
            p.rotation.y += spinSpeed;

            // Interaction Decay (Stop spinning fast if not hovered)
            if (!data.isHovered && p.rotation.y > 0) {
                // Simple physics-ish decay could go here, but instant switch is fine for "nudge"
            }
        });

        // Orbit Logic (Janvi Images)
        janviImages.forEach(sprite => {
            sprite.visible = true; // Ensure visible in solar system
            const data = sprite.userData;
            data.angle += data.orbitSpeed;
            sprite.position.x = data.orbitRadius * Math.cos(data.angle);
            sprite.position.z = data.orbitRadius * Math.sin(data.angle);

            // Optional: Slight Bobbing
            // sprite.position.y += Math.sin(Date.now() * 0.001) * 0.005;
        });

        // Make sure camera is far
        controls.enabled = false;
    } else {
        // HIDE ORBITS when not in solar system to prevent interference
        janviImages.forEach(sprite => {
            sprite.visible = false;
        });
    }

    if (viewState === "TRAVELING") {
        // Zoom Logic (Lerp)
        const targetPos = earthGroup.position.clone();
        targetPos.z += 2; // Stop slightly in front

        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(earthGroup.position);

        // Check if we have arrived (distance is small)
        if (camera.position.distanceTo(targetPos) < 0.1) {
            viewState = "EARTH_VIEW";
            document.getElementById('btn-back').classList.remove('hidden');
            controls.enabled = true; // Allow dragging now!
            controls.target.copy(earthGroup.position); // Pivot around Earth
        }
    }
    else if (viewState === "EARTH_VIEW") {
        // User controls the rotation now with mouse (OrbitControls)
        controls.update();

        // PULSE ANIMATION
        if (pulseMarker) {
            pulseMarker.visible = true;
            const time = Date.now() * 0.002;
            const scale = 0.12 + Math.sin(time) * 0.04; // Oscillate size
            pulseMarker.scale.set(scale, scale, 1);
            pulseMarker.material.opacity = 0.6 + Math.sin(time) * 0.3; // Oscillate opacity
        }
    }

    renderer.render(scene, camera);
}
animate();

// ==========================================
// 6. UI FUNCTIONS
// ==========================================

function showFakePopup() {
    document.getElementById('custom-modal').classList.remove('hidden');
}

function closePopupAndStart() {
    document.getElementById('custom-modal').classList.add('hidden');
    startJourney();
}

function startJourney() {
    const intro = document.getElementById('intro-screen');
    intro.style.opacity = "0";
    setTimeout(() => intro.style.display = "none", 1000);

    // Trigger Atmosphere Effect
    const atmos = document.getElementById('atmosphere-overlay');
    atmos.classList.remove('hidden');
    atmos.classList.add('active');

    // Cleanup after animation
    setTimeout(() => {
        atmos.classList.remove('active');
        atmos.classList.add('hidden');
    }, 2500);

    viewState = "TRAVELING";
}

function goBackToSpace() {
    viewState = "SOLAR_SYSTEM";

    // Reset Camera
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 0, 0);

    // Show Intro Again
    const intro = document.getElementById('intro-screen');
    intro.style.display = "block";
    // Small delay to allow display:block to apply before changing opacity
    setTimeout(() => intro.style.opacity = "1", 100);

    // Hide Back Button
    document.getElementById('btn-back').classList.add('hidden');
}

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// ==========================================
// 7. CLICKING PINS & PLANET INTERACTION
// ==========================================
// (raycaster and mouse declared at top of file)


// Planet Interaction (Hover/Nudge) - Desktop
window.addEventListener('mousemove', (event) => {
    if (viewState !== "SOLAR_SYSTEM") return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Reset all
    planets.forEach(p => p.userData.isHovered = false);

    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0) {
        const p = intersects[0].object;
        p.userData.isHovered = true;
        document.body.style.cursor = 'pointer'; // Feedback
    } else {
        document.body.style.cursor = 'default';
    }
});

// Planet Interaction (Touch) - Mobile Nudge
window.addEventListener('touchstart', (event) => {
    if (viewState !== "SOLAR_SYSTEM") return;
    // ... Simplified touch logic can map to mouse for this demo
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0) {
        const p = intersects[0].object;
        p.userData.isHovered = true;
        // Reset after a second for mobile "nudge" feel
        setTimeout(() => p.userData.isHovered = false, 1000);
    }
}, { passive: false });



window.addEventListener('click', (event) => {
    if (viewState !== "EARTH_VIEW") return;

    // Calculate mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Check intersection with ALL objects in earthGroup (recursive)
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([earthGroup], true);

    // Find first intersection that has COUNTRY data
    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.type === 'country') {


            // Open Country View instead of City Gallery directly
            setTimeout(() => openCountryView(obj.userData.countryData), 150);
            return;
        }
    }
});

// ==========================================
// 8a. COUNTRY VIEW LOGIC (2D Overlay)
// ==========================================

// ==========================================
// 8a. COUNTRY VIEW LOGIC (LEAFLET MAP)
// ==========================================

function openCountryView(country) {
    const countryView = document.getElementById('country-view');
    const nameTitle = document.getElementById('country-name-title');
    const mapContainer = document.getElementById('country-map-container');

    // 1. Show View
    countryView.classList.remove('hidden');
    nameTitle.innerText = country.name;

    // HIDE GLOBAL BACK BUTTON (To prevent duplicate/overlap)
    document.getElementById('btn-back').classList.add('hidden');

    // 2. Initialize Leaflet Map (if not already done)
    if (!map) {
        map = L.map('country-map-container', {
            zoomControl: false, // We can add custom if needed
            attributionControl: false
        });

        // Add Bhuvan Satellite WMS Layer
        // URL: https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms
        // Layer: mostly 'lulc:BR_LULC50K_1112' or similar, but for base satellite we can try standard OGC or Esri as fallback.
        // Primary: Esri World Imagery (High Res Satellite)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(map);

        // Optional: Add Labels
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}').addTo(map);
    }

    // 3. Set View to Country
    // Leaflet uses [Lat, Lng]
    map.setView([country.lat, country.lng], 5); // Zoom 5 is good for country level

    // 4. Clear Loop Markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // 5. Add City Markers (Real Lat/Lon!)
    if (country.cities) {
        country.cities.forEach(city => {
            // Create Custom Icon
            const neonIcon = L.divIcon({
                className: 'neon-pin-icon',
                html: `<div class="pin-dot"></div><div class="pin-label">${city.name}</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20] // Center it
            });

            const marker = L.marker([city.lat, city.lng], { icon: neonIcon }).addTo(map);

            marker.on('click', () => {
                const galleryData = {
                    cityName: city.name,
                    people: city.people,
                    mapImage: city.mapImage
                };
                openCityGallery(galleryData);
            });
        });
    }
}

function backToEarth() {
    const countryView = document.getElementById('country-view');
    countryView.classList.add('hidden');
    // State is still EARTH_VIEW, so controls work immediately

    // SHOW GLOBAL BACK BUTTON (Restore access to Space)
    document.getElementById('btn-back').classList.remove('hidden');
}

/* OLD CODE COMMENTED OUT
function openCountryView_OLD(country) {
    const countryView = document.getElementById('country-view');
    const nameTitle = document.getElementById('country-name-title');
    const mapImg = document.getElementById('country-map-img');
    const pinsLayer = document.getElementById('country-pins-layer');

    // 1. Set Content
    nameTitle.innerText = country.name;
    mapImg.src = country.mapImage || "assets/images/map_placeholder.jpg";

    // 2. Clear Old Pins
    pinsLayer.innerHTML = '';

    // 3. Generate City Pins
    if (country.cities) {
        country.cities.forEach(city => {
            const pin = document.createElement('div');
            pin.className = 'city-pin-2d';
            pin.style.top = city.top + '%';
            pin.style.left = city.left + '%';

            pin.innerHTML = `
                <div class="pin-dot"></div>
                <div class="pin-label">${city.name}</div>
            `;

            pin.onclick = (e) => {
                e.stopPropagation(); // Prevent bubbling if map has events
                // Open the existing gallery using the CITY data
                // Ensure city object has what openCityGallery needs
                // openCityGallery expects: { cityName: "...", people: [...], mapImage: "..." }
                // checking usage below...
                // It accesses cityData.cityName, cityData.people, cityData.mapImage

                // Let's normalize it
                const galleryData = {
                    cityName: city.name,
                    people: city.people,
                    mapImage: city.mapImage || country.mapImage // Fallback to country map if city specific missing
                };

                openCityGallery(galleryData);
            };

            pinsLayer.appendChild(pin);
        });
    }

    // 4. Show View
    countryView.classList.remove('hidden');

    // OPTIONAL: Hide Earth canvas to save performance? 
    // Or just overlay it. Keeping it visible behind is cool context but might distract.
    // Let's keep it running but blurred or covered by opaque bg. 
    // css #country-view is background: #111 so it covers it.
}

function backToEarth() {
    const countryView = document.getElementById('country-view');
    countryView.classList.add('hidden');
    // State is still EARTH_VIEW, so controls work immediately
}
*/

// ==========================================
// 8. CITY GALLERY LOGIC
// ==========================================


function openCityGallery(cityData) {
    const gallery = document.getElementById('city-gallery');
    const title = document.getElementById('gallery-city-name');
    const miniGallery = document.getElementById('neon-mini-gallery');
    const bg = document.getElementById('neon-background');
    const mapBg = document.getElementById('city-map-background');

    // 1. Set City Name
    title.innerText = cityData.cityName;

    // 1b. Update Connections Badge
    const badge = document.getElementById('connections-badge');
    if (badge) {
        badge.innerText = `${cityData.people.length} Connections Found`;
    }

    // 2. Hide Static Background & Show Map Background
    bg.classList.add('hidden');

    // Hide Country View to prevent button overlap
    document.getElementById('country-view').classList.add('hidden');

    // 3. Initialize City Map (Leaflet)
    // We need to look up the city's lat/lng from the database since cityData passed here might be partial
    // Iterate through countries to find the city
    let targetCity = null;
    database.countries.forEach(c => {
        c.cities.forEach(city => {
            if (city.name === cityData.cityName) {
                targetCity = city;
            }
        });
    });

    if (targetCity && targetCity.lat && targetCity.lng) {
        if (!cityMap) {
            cityMap = L.map('city-map-background', {
                zoomControl: false,
                attributionControl: false,
                zoomAnimation: true
            });

            // Use Esri Satellite only (Clean, cinematic look)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri'
            }).addTo(cityMap);
        }

        // Slight timeout to ensure div is visible before setting view
        setTimeout(() => {
            cityMap.invalidateSize();
            // Zoom level 13 for "Deep into city" view
            cityMap.setView([targetCity.lat, targetCity.lng], 13);
        }, 100);
    } else {
        // Fallback if no coordinates found (shouldn't happen now)
        bg.classList.remove('hidden');
        const mapImg = cityData.mapImage || 'assets/images/map_placeholder.jpg';
        bg.style.backgroundImage = `url('${mapImg}')`;
    }

    // 4. Clear Mini Gallery
    miniGallery.innerHTML = '';

    // 5. Create Thumbnails
    cityData.people.forEach((person, index) => {
        const thumb = document.createElement('img');
        thumb.src = person.thumbnailImage || 'assets/images/placeholder_thumb.jpg';
        thumb.className = 'mini-thumb';
        thumb.alt = person.name;

        // Click Event
        thumb.onclick = () => {
            updateNeonCard(person, thumb);
        };

        miniGallery.appendChild(thumb);
    });

    // 6. Initialize with first person
    if (cityData.people.length > 0) {
        // Find the first thumb we just added
        const firstThumb = miniGallery.children[0];
        updateNeonCard(cityData.people[0], firstThumb);
    }

    // Show Gallery
    gallery.classList.remove('hidden');
}

function updateNeonCard(person, activeThumb) {
    // Update global state
    currentPerson = person;

    // Update UI Elements
    document.getElementById('neon-person-name').innerText = person.name;
    // We can keep the static description or update if later data has it

    const mainImg = document.getElementById('neon-main-img');
    mainImg.src = person.thumbnailImage || 'assets/images/placeholder_thumb.jpg';

    // Update Enter Button
    const btn = document.getElementById('btn-enter-memory');
    btn.onclick = () => {
        startPuzzle(person);
    };

    // Highlight Active Thumbnail
    const allThumbs = document.querySelectorAll('.mini-thumb');
    allThumbs.forEach(t => t.classList.remove('active'));
    if (activeThumb) {
        activeThumb.classList.add('active');
    }
}

function closeCityGallery() {
    document.getElementById('city-gallery').classList.add('hidden');
    document.getElementById('country-view').classList.remove('hidden');
    // NOTE: Country View is restored, so Global Back Button stays HIDDEN
    // (It will be shown only when 'backToEarth' is clicked from Country View)
}

// ==========================================
// 9. CUSTOM JIGSAW PUZZLE LOGIC (CANVAS)
// ==========================================

let puzzleInstance = null;
let puzzleTimer;
let seconds = 0;



class JigsawPuzzle {
    constructor(canvasId, imageUrl, rows, cols, onComplete) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.imageUrl = imageUrl;
        this.rows = rows;
        this.cols = cols;
        this.onComplete = onComplete;

        this.pieces = [];
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.pieceWidth = 0;
        this.pieceHeight = 0;

        this.selectedPiece = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isComplete = false;

        // Image
        this.img = new Image();
        this.img.onload = () => {
            this.init();
        };
        this.img.src = this.imageUrl;

        // Handle cached image immediately
        if (this.img.complete) {
            this.init();
        }

        // Event Listeners
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        // Touch Listeners
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);

        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
    }

    init() {
        console.log("Jigsaw: Init called");
        // dynamic resizing
        const optimalPieceSize = 130;
        this.pieceWidth = optimalPieceSize;
        this.pieceHeight = optimalPieceSize;

        // Canvas Size
        const padding = 50;
        this.width = (this.cols * this.pieceWidth) + padding;
        this.height = (this.rows * this.pieceHeight) + padding;

        // Resize Canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";

        // Center the "solved" grid
        this.startX = (this.width - (this.cols * this.pieceWidth)) / 2;
        this.startY = (this.height - (this.rows * this.pieceHeight)) / 2;

        this.generatePieces();
        this.shufflePieces();
        this.draw();

        console.log("Jigsaw: pieces generated", this.pieces.length);
    }

    generatePieces() {
        this.pieces = [];
        this.slots = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const solvedX = this.startX + c * this.pieceWidth;
                const solvedY = this.startY + r * this.pieceHeight;

                // Define the Target Slot
                this.slots.push({
                    r: r,
                    c: c,
                    x: solvedX,
                    y: solvedY
                });

                const piece = {
                    id: `${r}-${c}`,
                    r: r,
                    c: c,
                    currentX: 0,
                    currentY: 0,
                    solvedX: solvedX,
                    solvedY: solvedY,
                    top: r === 0 ? 0 : -this.pieces[(r - 1) * this.cols + c].bottom,
                    right: c === this.cols - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    bottom: r === this.rows - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    left: c === 0 ? 0 : -this.pieces[this.pieces.length - 1].right,
                    isCorrect: false,
                    isSnapped: false
                };
                this.pieces.push(piece);
            }
        }
    }

    shufflePieces() {
        this.pieces.forEach(p => {
            // Avoid placing on top of slots initially?
            // Or just random.
            p.currentX = Math.random() * (this.width - this.pieceWidth);
            p.currentY = Math.random() * (this.height - this.pieceHeight);
            p.isSnapped = false;
            p.isCorrect = false;
        });
    }

    // SCATTER FUNCTION
    scatter() {
        this.shufflePieces();
        this.draw();
    }

    draw() {
        try {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Guide (Faint Grid)
            this.ctx.strokeStyle = 'rgba(0, 210, 255, 0.1)';
            this.ctx.lineWidth = 1;
            if (this.slots) {
                this.slots.forEach(slot => {
                    this.ctx.strokeRect(slot.x, slot.y, this.pieceWidth, this.pieceHeight);
                });
            }

            // Sort: Non-snapped high, Snapped low, Selected Top
            const sorted = [...this.pieces].sort((a, b) => {
                if (a === this.selectedPiece) return 1;
                if (b === this.selectedPiece) return -1;
                // Draw snapped pieces below loose ones
                if (a.isSnapped && !b.isSnapped) return -1;
                if (!a.isSnapped && b.isSnapped) return 1;
                return 0;
            });

            sorted.forEach(p => this.drawPiece(p));
        } catch (e) {
            console.error("Jigsaw Draw Error:", e);
        }
    }

    drawPiece(p) {
        this.ctx.save();
        this.ctx.translate(p.currentX, p.currentY);

        this.createPiecePath(p);
        this.ctx.clip();

        // Draw Image
        this.ctx.drawImage(
            this.img,
            0, 0, this.img.width, this.img.height,
            -p.c * this.pieceWidth, -p.r * this.pieceHeight,
            this.cols * this.pieceWidth, this.rows * this.pieceHeight
        );

        // Stroke
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Visual Feedback: Correct Placement
        if (p.isCorrect) {
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 20;
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        // Highlight Selected
        else if (p === this.selectedPiece) {
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = '#fff';
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    createPiecePath(p) {
        // ... (Same Bezier Logic as before)
        const w = this.pieceWidth;
        const h = this.pieceHeight;
        const x = 0; const y = 0;
        const tabSize = w * 0.2;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        if (p.top !== 0) this.drawTab(x, y, x + w, y, p.top, tabSize);
        else this.ctx.lineTo(x + w, y);
        if (p.right !== 0) this.drawTab(x + w, y, x + w, y + h, p.right, tabSize);
        else this.ctx.lineTo(x + w, y + h);
        if (p.bottom !== 0) this.drawTab(x + w, y + h, x, y + h, p.bottom, tabSize);
        else this.ctx.lineTo(x, y + h);
        if (p.left !== 0) this.drawTab(x, y + h, x, y, p.left, tabSize);
        else this.ctx.lineTo(x, y);
        this.ctx.closePath();
    }

    drawTab(x1, y1, x2, y2, type, sz) {
        if (type === 0) { this.ctx.lineTo(x2, y2); return; }
        const dx = x2 - x1; const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const h = sz * type;
        this.ctx.save();
        this.ctx.translate(x1, y1);
        this.ctx.rotate(Math.atan2(dy, dx));
        // Symmetric shape
        this.ctx.lineTo(len * 0.35, 0);
        this.ctx.bezierCurveTo(len * 0.35, h * 0.5, len * 0.42, h, len * 0.42, h);
        this.ctx.bezierCurveTo(len * 0.42, h * 1.3, len * 0.58, h * 1.3, len * 0.58, h);
        this.ctx.bezierCurveTo(len * 0.58, h, len * 0.65, h * 0.5, len * 0.65, 0);
        this.ctx.lineTo(len, 0);
        this.ctx.restore();
    }

    handleStart(clientX, clientY) {
        if (this.isComplete) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        console.log("Click at:", mouseX, mouseY);

        // Find piece
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const p = this.pieces[i];
            if (mouseX >= p.currentX && mouseX <= p.currentX + this.pieceWidth &&
                mouseY >= p.currentY && mouseY <= p.currentY + this.pieceHeight) {

                console.log("Selected Piece:", p.id);
                this.selectedPiece = p;
                this.offsetX = mouseX - p.currentX;
                this.offsetY = mouseY - p.currentY;

                // Allow moving even if snapped
                p.isSnapped = false;
                p.isCorrect = false;

                this.draw();
                return;
            }
        }
        console.log("No piece selected");
    }

    handleMove(clientX, clientY) {
        if (!this.selectedPiece) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        this.selectedPiece.currentX = mouseX - this.offsetX;
        this.selectedPiece.currentY = mouseY - this.offsetY;

        this.draw();
    }

    handleEnd() {
        if (!this.selectedPiece) return;

        const p = this.selectedPiece;
        console.log("Dropped piece:", p.id, "at", p.currentX, p.currentY);

        // Snap to Slot
        let snapped = false;

        for (const slot of this.slots) {
            // Check center distance
            const centerX = slot.x; // actually slot.x is top-left
            // So check simple distance of top-lefts
            const dist = Math.hypot(p.currentX - slot.x, p.currentY - slot.y);

            if (dist < 60) { // Increased tolerance
                console.log("Snapped to slot:", slot.r, slot.c);
                p.currentX = slot.x;
                p.currentY = slot.y;
                p.isSnapped = true;

                if (p.r === slot.r && p.c === slot.c) {
                    p.isCorrect = true;
                    console.log("Correct Slot!");
                } else {
                    p.isCorrect = false;
                    console.log("Wrong Slot");
                }
                snapped = true;
                break;
            }
        }

        this.selectedPiece = null;
        this.draw();

        if (this.checkWin()) {
            console.log("WINNER!");
            this.isComplete = true; // Block further input
            if (this.onComplete) this.onComplete();
        }
    }

    checkWin() {
        // Win if ALL pieces are in their CORRECT slots
        return this.pieces.every(p => p.isCorrect);
    }

    // MOUSE
    handleMouseDown(e) { this.handleStart(e.clientX, e.clientY); }
    handleMouseMove(e) { this.handleMove(e.clientX, e.clientY); }
    handleMouseUp(e) { this.handleEnd(); }

    // TOUCH
    handleTouchStart(e) {
        if (e.touches.length > 0) {
            e.preventDefault();
            this.handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    }
    handleTouchMove(e) {
        if (e.touches.length > 0) {
            e.preventDefault();
            this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }
    handleTouchEnd(e) { this.handleEnd(); }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
}

function startPuzzle(person) {
    window.currentPerson = person;
    currentPerson = person; // Sync both just in case
    const puzzleContainer = document.getElementById('puzzle-container');
    const personDetail = document.getElementById('person-detail');
    const successPopup = document.getElementById('success-popup');

    // Check for Skip Logic
    if (person.skipPuzzle) {
        proceedToDetail();
        return;
    }

    // Reset State
    seconds = 0;
    document.getElementById('puzzle-timer').innerText = "00:00";
    personDetail.classList.add('hidden');
    successPopup.classList.add('hidden');
    puzzleContainer.classList.remove('hidden');

    // Setup Canvas
    const container = document.getElementById('puzzle-board');
    container.innerHTML = '<canvas id="game-canvas" width="600" height="600"></canvas>';

    // Cleanup old instance
    if (puzzleInstance) {
        puzzleInstance.cleanup();
    }

    // Start New
    puzzleInstance = new JigsawPuzzle('game-canvas', person.puzzleImage, 3, 3, () => {
        handlePuzzleSolved();
    });

    // Start Timer
    if (puzzleTimer) clearInterval(puzzleTimer);
    puzzleTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    seconds++;
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('puzzle-timer').innerText = `${m}:${s}`;
}

function handlePuzzleSolved() {
    clearInterval(puzzleTimer);

    // Show Success Popup
    const timeText = document.getElementById('puzzle-timer').innerText;
    document.getElementById('success-time').innerText = timeText;
    document.getElementById('success-popup').classList.remove('hidden');
}

function proceedToDetail() {
    // Hide Puzzle & Popup
    document.getElementById('success-popup').classList.add('hidden');
    document.getElementById('puzzle-container').classList.add('hidden');

    showPersonDetail();
}

function closeSuccessPopup() {
    document.getElementById('success-popup').classList.add('hidden');
    // User stays on puzzle screen (which is complete)
}

function showPersonDetail() {
    // Ensure we have reference
    const person = window.currentPerson || currentPerson;

    console.log('Opening Person Detail for:', person);
    try {
        if (!person) {
            console.error('No current person selected!');
            alert("Error: No person selected. Please try again from map.");
            return;
        }

        // Debug confirmation
        // alert('Success! Opening detail for ' + person.name);

        // Populate Detail
        const detailOverlay = document.getElementById('person-detail');
        if (!detailOverlay) {
            console.error('Detail overlay element not found!');
            return;
        }
        detailOverlay.classList.remove('hidden');

        // View Switching (Normal vs Audio vs Video)
        const detailBody = document.querySelector('.detail-body');
        const audioFocusView = document.getElementById('audio-focus-view');
        const videoFocusView = document.getElementById('video-focus-view');

        if (person.videoFocus) {
            if (detailBody) detailBody.classList.add('hidden');
            if (audioFocusView) audioFocusView.classList.add('hidden');
            if (videoFocusView) {
                videoFocusView.classList.remove('hidden');
                initVideoFocus(person);
            }
            return;
        }

        if (person.audioFocus) {
            if (detailBody) detailBody.classList.add('hidden');
            if (videoFocusView) videoFocusView.classList.add('hidden');
            if (audioFocusView) {
                audioFocusView.classList.remove('hidden');
                initAudioFocus(person);
            }
            return; // Skip standard carousel/letter logic
        } else {
            if (detailBody) detailBody.classList.remove('hidden');
            if (audioFocusView) audioFocusView.classList.add('hidden');
            if (videoFocusView) videoFocusView.classList.add('hidden');
        }

        // CAROUSEL LOGIC
        const carouselImg = document.getElementById('carousel-img');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');

        if (carouselImg) {
            // 1. Collect all images (Solved Puzzle + Extra Gallery)
            const images = [person.solvedImage];
            if (person.galleryImages && person.galleryImages.length > 0) {
                images.push(...person.galleryImages);
            }

            // 2. State
            let currentIndex = 0;

            // 3. Render
            const showImage = (index) => {
                carouselImg.style.opacity = '0';
                setTimeout(() => {
                    carouselImg.src = images[index];
                    carouselImg.style.opacity = '1';
                }, 150);

                // Toggle buttons visibility if only 1 image
                if (images.length <= 1) {
                    if (prevBtn) prevBtn.style.display = 'none';
                    if (nextBtn) nextBtn.style.display = 'none';
                } else {
                    if (prevBtn) prevBtn.style.display = 'block';
                    if (nextBtn) nextBtn.style.display = 'block';
                }
            };

            // 4. Initial Show
            showImage(0);

            // 5. Handlers (Remove old listeners first if possible, or use one-time setup)
            // Since showPersonDetail is called multiple times, we should stick to onclick assignment
            if (prevBtn) {
                prevBtn.onclick = () => {
                    currentIndex = (currentIndex - 1 + images.length) % images.length;
                    showImage(currentIndex);
                };
            }
            if (nextBtn) {
                nextBtn.onclick = () => {
                    currentIndex = (currentIndex + 1) % images.length;
                    showImage(currentIndex);
                };
            }
        }

        // IMAGE VS PDF LOGIC
        const letterImg = document.getElementById('detail-letter-img');
        const letterPdf = document.getElementById('detail-letter-pdf');
        const letterAudioRight = document.getElementById('detail-audio-right');
        const downloadBtn = document.getElementById('pdf-download-btn');

        if (letterImg && letterPdf && letterAudioRight) {

            if (person.rightSideAudio) {
                // Right Side Audio Mode
                letterImg.classList.add('hidden');
                letterPdf.classList.add('hidden');
                letterAudioRight.classList.remove('hidden');

                if (downloadBtn) downloadBtn.classList.add('hidden');
                initRightSideAudio(person);

            } else if (person.letterPdf) {
                // Show PDF, Hide Image/Audio
                letterImg.classList.add('hidden');
                letterAudioRight.classList.add('hidden');
                letterPdf.classList.remove('hidden');
                letterPdf.src = person.letterPdf;

                // Show Download Button
                if (downloadBtn) {
                    downloadBtn.classList.remove('hidden');
                    downloadBtn.href = person.letterPdf;
                }
            } else {
                // Show Image, Hide PDF/Audio
                letterPdf.src = '';
                letterPdf.classList.add('hidden');
                letterAudioRight.classList.add('hidden');
                letterImg.classList.remove('hidden');
                letterImg.src = person.letterImage || 'assets/images/letter_placeholder.jpg';

                // Show Download Button for Image too
                if (downloadBtn) {
                    if (person.letterImage) {
                        downloadBtn.classList.remove('hidden');
                        downloadBtn.href = person.letterImage;
                        downloadBtn.download = person.name + "_Letter.jpg";
                    } else {
                        downloadBtn.classList.add('hidden');
                    }
                }
            }
        }


        // AUDIO LOGIC
        const voiceCard = document.querySelector('.voice-note-card');
        const audio = document.getElementById('detail-audio');

        if (voiceCard && audio) {
            if (person.hideAudio) {
                voiceCard.classList.add('hidden');
                audio.pause();
                audio.currentTime = 0; // Reset
            } else {
                voiceCard.classList.remove('hidden');
                audio.src = person.audioFile;
                // audio.play(); 
            }
        }

        // WHATSAPP LOGIC
        const whatsapp = document.getElementById('whatsapp-btn');
        if (whatsapp) {
            if (person.hideWhatsapp) {
                whatsapp.classList.add('hidden');
            } else {
                whatsapp.classList.remove('hidden');
                const phone = (person.phoneNumber || '').replace(/[^0-9]/g, '');
                whatsapp.href = `https://wa.me/${phone}`;
            }
        }
    } catch (e) {
        console.error('Error in showPersonDetail:', e);
        alert('Something went wrong showing the gift! Check console.');
    }
}

function closePersonDetail() {
    document.getElementById('person-detail').classList.add('hidden');
    // Go back to city gallery
    document.getElementById('city-gallery').classList.remove('hidden');

    const audio = document.getElementById('detail-audio');
    if (audio) { audio.pause(); audio.currentTime = 0; }

    const afAudio = document.getElementById('af-audio-element');
    if (afAudio) { afAudio.pause(); afAudio.currentTime = 0; }

    const raAudio = document.getElementById('ra-audio-element');
    if (raAudio) { raAudio.pause(); raAudio.currentTime = 0; }

    const vfVideo = document.getElementById('vf-video-element');
    if (vfVideo) { vfVideo.pause(); vfVideo.currentTime = 0; }
}

function quitPuzzle() {
    document.getElementById('puzzle-container').classList.add('hidden');
    document.getElementById('success-popup').classList.add('hidden');
    clearInterval(puzzleTimer);
    if (puzzleInstance) puzzleInstance.cleanup();
}

function skipPuzzle() {
    clearInterval(puzzleTimer);
    if (puzzleInstance) puzzleInstance.cleanup();

    if (!window.currentPerson) {
        // Try fall back to global let if window prop missing (though they should be same)
        window.currentPerson = currentPerson;
    }

    // Skip directly to detail (bypass success popup)
    document.getElementById('puzzle-container').classList.add('hidden');
    document.getElementById('success-popup').classList.add('hidden');

    // Explicitly hide city gallery too (fail-safe)
    document.getElementById('city-gallery').classList.add('hidden');

    showPersonDetail();
}

// Global functions
window.quitPuzzle = quitPuzzle;
window.skipPuzzle = skipPuzzle;
window.closePersonDetail = closePersonDetail;
window.proceedToDetail = proceedToDetail;
window.closeSuccessPopup = closeSuccessPopup;
// Audio Focus Logic (Jai)
function initAudioFocus(person) {
    const audio = document.getElementById('af-audio-element');
    const playBtn = document.getElementById('af-play-btn');
    const progress = document.getElementById('af-progress');
    const timeDisplay = document.getElementById('af-time');
    const transcriptionText = document.getElementById('af-transcription-text');

    if (!audio) return;

    // Set Content
    audio.src = person.audioFile || '';
    transcriptionText.innerText = person.transcription || "No transcription available.";

    // Reset UI
    playBtn.innerText = "▶";
    progress.value = 0;
    timeDisplay.innerText = "00:00";

    // Play/Pause
    playBtn.onclick = () => {
        if (audio.paused) {
            audio.play().catch(e => console.error("Play error:", e));
            playBtn.innerText = "⏸";
        } else {
            audio.pause();
            playBtn.innerText = "▶";
        }
    };

    // Update Progress
    audio.ontimeupdate = () => {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progress.value = percent || 0;

            // Time Display
            const mins = Math.floor(audio.currentTime / 60);
            const secs = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
            timeDisplay.innerText = `${mins}:${secs}`;
        }
    };

    // Seek
    progress.oninput = () => {
        if (audio.duration) {
            const time = (progress.value / 100) * audio.duration;
            audio.currentTime = time;
        }
    };

    // On End
    audio.onended = () => {
        playBtn.innerText = "▶";
        progress.value = 0;
    };
}

// Right Side Audio Logic (Dennis)
function initRightSideAudio(person) {
    const audio = document.getElementById('ra-audio-element');
    const playBtn = document.getElementById('ra-play-btn');
    const progress = document.getElementById('ra-progress');
    const timeDisplay = document.getElementById('ra-time');
    const transcriptionText = document.getElementById('ra-transcription-text');

    if (!audio) return;

    // Set Content
    audio.src = person.audioFile || '';
    transcriptionText.innerText = person.transcription || "No transcription available.";

    // Reset UI
    playBtn.innerText = "▶";
    progress.value = 0;
    timeDisplay.innerText = "00:00";

    // Play/Pause
    playBtn.onclick = () => {
        if (audio.paused) {
            audio.play().catch(e => console.error("Play error:", e));
            playBtn.innerText = "⏸";
        } else {
            audio.pause();
            playBtn.innerText = "▶";
        }
    };

    // Update Progress
    audio.ontimeupdate = () => {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progress.value = percent || 0;
            const mins = Math.floor(audio.currentTime / 60);
            const secs = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
            timeDisplay.innerText = `${mins}:${secs}`;
        }
    };

    // Seek
    progress.oninput = () => {
        if (audio.duration) {
            const time = (progress.value / 100) * audio.duration;
            audio.currentTime = time;
        }
    };

    // On End
    audio.onended = () => {
        playBtn.innerText = "▶";
        progress.value = 0;
    };
}

// Video Focus Logic (Pronil)
function initVideoFocus(person) {
    const video = document.getElementById('vf-video-element');
    const closeBtn = document.getElementById('vf-close-btn');

    if (!video) return;

    if (person.videoFile) {
        video.src = person.videoFile;
        // Attempt autoplay
        video.play().catch(e => console.log("Autoplay blocked:", e));
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
             closePersonDetail();
        };
    }
}
