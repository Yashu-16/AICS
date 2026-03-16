import { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { useAppStore } from '../../store/appStore'
import EventInjector from './EventInjector'
import RippleOverlay from './RippleOverlay'
import { useCountryData } from '../../hooks/useCountryData'
import { Zap } from 'lucide-react'

const toVec3 = (lon, lat, r = 1.005) => {
  const phi   = (90 - lat)  * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  )
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float cosAngle = dot(normalize(vNormal), normalize(sunDirection));
    vec4 dayColor   = texture2D(dayTexture,   vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    float blend   = smoothstep(-0.1, 0.22, cosAngle);
    float diffuse = max(0.0, cosAngle);
    vec3 litDay   = dayColor.rgb * (0.08 + diffuse * 0.92);
    vec3 color    = mix(nightColor.rgb, litDay, blend);
    gl_FragColor  = vec4(color, 1.0);
  }
`

function RealisticEarth({ sunDirection }) {
  const cloudRef = useRef()

  const [dayTex, nightTex, cloudTex] = useLoader(TextureLoader, [
    '/earth-day.jpg',
    '/earth-night.jpg',
    '/earth-clouds.png',
  ])

  ;[dayTex, nightTex, cloudTex].forEach(t => {
    t.minFilter = THREE.LinearMipmapLinearFilter
    t.magFilter = THREE.LinearFilter
    t.anisotropy = 16
  })

  const uniforms = useRef({
    dayTexture:   { value: dayTex   },
    nightTexture: { value: nightTex },
    sunDirection: { value: sunDirection },
  })

  useFrame(() => {
    if (cloudRef.current) cloudRef.current.rotation.y += 0.00008
    uniforms.current.sunDirection.value.copy(sunDirection)
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms.current}
        />
      </mesh>
      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.008, 64, 64]} />
        <meshPhongMaterial
          map={cloudTex}
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// ── KEY FIX: depthTest:true + polygonOffset to sit cleanly on surface ──
const buildBorderLines = (feature, color, opacity = 0.85) => {
  const { type, coordinates } = feature.geometry || {}
  const group = new THREE.Group()
  const outerRings = []

  if (type === 'Polygon') {
    if (coordinates?.[0]) outerRings.push(coordinates[0])
  } else if (type === 'MultiPolygon') {
    for (const polygon of coordinates || []) {
      if (polygon?.[0]) outerRings.push(polygon[0])
    }
  }

  for (const ring of outerRings) {
    if (!ring || ring.length < 2) continue
    // r=1.009 lifts lines just above surface so they're visible
    // but NOT so high they appear on back of globe
    const pts = ring.map(([lon, lat]) => toVec3(lon, lat, 1.009))
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest:  true,   // ← ON: back-of-globe lines are hidden by sphere
      depthWrite: false,
    })
    group.add(new THREE.Line(geo, mat))
  }
  return group
}

const buildPickMesh = (feature) => {
  const { type, coordinates } = feature.geometry || {}
  const outerRings = []

  if (type === 'Polygon') {
    if (coordinates?.[0]) outerRings.push(coordinates[0])
  } else if (type === 'MultiPolygon') {
    for (const polygon of coordinates || []) {
      if (polygon?.[0]) outerRings.push(polygon[0])
    }
  }

  const group = new THREE.Group()
  for (const ring of outerRings) {
    if (!ring || ring.length < 4) continue
    try {
      const shape = new THREE.Shape()
      shape.moveTo(ring[0][0], ring[0][1])
      for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1])
      shape.closePath()

      const geo = new THREE.ShapeGeometry(shape, 1)
      const pos = geo.attributes.position
      const newPos = []
      for (let i = 0; i < pos.count; i++) {
        const v = toVec3(pos.getX(i), pos.getY(i), 1.003)
        newPos.push(v.x, v.y, v.z)
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3))
      geo.computeVertexNormals()
      group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false,
      })))
    } catch {}
  }
  return group
}

function CountryLayer({ geoJson, mode, onHover, onClick, earthRotationY }) {
  const { gl, camera } = useThree()
  const groupRef   = useRef()
  const countryMap = useRef({})
  const hoveredRef = useRef(null)

  const borderColor = {
    gdp:         '#c4b5fd',
    climate:     '#fca5a5',
    population:  '#6ee7b7',
    technology:  '#93c5fd',
    geopolitics: '#fde68a',
  }[mode] || '#c4b5fd'

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = earthRotationY.current
  })

  useEffect(() => {
    if (!geoJson || !groupRef.current) return
    Object.values(countryMap.current).forEach(({ borderGroup, pickGroup }) => {
      groupRef.current.remove(borderGroup)
      groupRef.current.remove(pickGroup)
    })
    countryMap.current = {}

    for (const feature of geoJson.features || []) {
      const name =
        feature.properties?.name  ||
        feature.properties?.NAME  ||
        feature.properties?.ADMIN ||
        'Unknown'
      const borderGroup = buildBorderLines(feature, borderColor, 0.85)
      const pickGroup   = buildPickMesh(feature)
      pickGroup.traverse(obj => { if (obj.isMesh) obj.userData.countryName = name })
      groupRef.current.add(borderGroup)
      groupRef.current.add(pickGroup)
      countryMap.current[name] = { borderGroup, pickGroup, name }
    }
  }, [geoJson])

  useEffect(() => {
    Object.values(countryMap.current).forEach(({ borderGroup, name }) => {
      const isHov = name === hoveredRef.current
      borderGroup.traverse(obj => {
        if (obj.isLine) {
          obj.material.color.set(isHov ? '#ffffff' : borderColor)
          obj.material.opacity = isHov ? 1.0 : 0.85
        }
      })
    })
  }, [borderColor])

  const setHighlight = useCallback((name, on) => {
    const entry = countryMap.current[name]
    if (!entry) return
    entry.borderGroup.traverse(obj => {
      if (obj.isLine) {
        obj.material.color.set(on ? '#ffffff' : borderColor)
        obj.material.opacity = on ? 1.0 : 0.85
      }
    })
  }, [borderColor])

  useEffect(() => {
    const canvas    = gl.domElement
    const raycaster = new THREE.Raycaster()
    const mouse     = new THREE.Vector2()

    const allPickMeshes = () => {
      const meshes = []
      Object.values(countryMap.current).forEach(({ pickGroup }) =>
        pickGroup.traverse(obj => { if (obj.isMesh) meshes.push(obj) })
      )
      return meshes
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits    = raycaster.intersectObjects(allPickMeshes(), false)
      const newName = hits.length > 0 ? hits[0].object.userData.countryName : null

      if (newName !== hoveredRef.current) {
        if (hoveredRef.current) setHighlight(hoveredRef.current, false)
        if (newName)            setHighlight(newName, true)
        hoveredRef.current = newName
        onHover(newName, e.clientX, e.clientY)
      } else if (newName) {
        onHover(newName, e.clientX, e.clientY)
      }
    }

    const onLeave = () => {
      if (hoveredRef.current) setHighlight(hoveredRef.current, false)
      hoveredRef.current = null
      onHover(null, 0, 0)
    }

    const onClickEvt = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(allPickMeshes(), false)
      if (hits.length > 0) onClick(hits[0].object.userData.countryName)
    }

    canvas.addEventListener('mousemove',  onMove)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('click',      onClickEvt)
    return () => {
      canvas.removeEventListener('mousemove',  onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('click',      onClickEvt)
    }
  }, [gl, camera, setHighlight, onHover, onClick])

  return <group ref={groupRef} />
}

function Scene({ geoJson, mode, onHover, onClick }) {
  const earthRotationY = useRef(0)
  const sunDirection   = useRef(new THREE.Vector3(1, 0.2, 0.5).normalize())
  const lightRef       = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    earthRotationY.current += 0.00025
    sunDirection.current.set(
      Math.cos(t * 0.008),
      0.18,
      Math.sin(t * 0.008)
    ).normalize()
    if (lightRef.current) {
      lightRef.current.position.copy(sunDirection.current).multiplyScalar(10)
    }
  })

  return (
    <>
      <ambientLight color="#0d0825" intensity={0.4} />
      <directionalLight
        ref={lightRef}
        color="#fff6ee"
        intensity={1.6}
        position={[1, 0.2, 0.5]}
      />
      <EarthWithRotation
        sunDirection={sunDirection.current}
        earthRotationY={earthRotationY}
      />
      <CountryLayer
        geoJson={geoJson}
        mode={mode}
        onHover={onHover}
        onClick={onClick}
        earthRotationY={earthRotationY}
      />
    </>
  )
}

function EarthWithRotation({ sunDirection, earthRotationY }) {
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = earthRotationY.current
  })
  return (
    <group ref={groupRef}>
      <RealisticEarth sunDirection={sunDirection} />
    </group>
  )
}

const COUNTRY_META = {
  'United States of America': { flag:'🇺🇸', key:'USA'          },
  'United States':            { flag:'🇺🇸', key:'USA'          },
  'China':                    { flag:'🇨🇳', key:'China'        },
  'India':                    { flag:'🇮🇳', key:'India'        },
  'Japan':                    { flag:'🇯🇵', key:'Japan'        },
  'United Kingdom':           { flag:'🇬🇧', key:'UK'           },
  'Brazil':                   { flag:'🇧🇷', key:'Brazil'       },
  'Russia':                   { flag:'🇷🇺', key:'Russia'       },
  'Canada':                   { flag:'🇨🇦', key:'Canada'       },
  'Australia':                { flag:'🇦🇺', key:'Australia'    },
  'South Korea':              { flag:'🇰🇷', key:'South Korea'  },
  'Mexico':                   { flag:'🇲🇽', key:'Mexico'       },
  'Indonesia':                { flag:'🇮🇩', key:'Indonesia'    },
  'Nigeria':                  { flag:'🇳🇬', key:'Nigeria'      },
  'South Africa':             { flag:'🇿🇦', key:'South Africa' },
  'Germany':                  { flag:'🇩🇪', key:'Germany'      },
  'France':                   { flag:'🇫🇷', key:'France'       },
  'Italy':                    { flag:'🇮🇹', key:'Italy'        },
  'Saudi Arabia':             { flag:'🇸🇦', key:'Saudi Arabia' },
  'Argentina':                { flag:'🇦🇷', key:'Argentina'    },
  'Pakistan':                 { flag:'🇵🇰', key:'Pakistan'     },
  'Bangladesh':               { flag:'🇧🇩', key:'Bangladesh'   },
  'Ethiopia':                 { flag:'🇪🇹', key:'Ethiopia'     },
  'Egypt':                    { flag:'🇪🇬', key:'Egypt'        },
  'Turkey':                   { flag:'🇹🇷', key:'Turkey'       },
  'Iran':                     { flag:'🇮🇷', key:'Iran'         },
  'Thailand':                 { flag:'🇹🇭', key:'Thailand'     },
  'Spain':                    { flag:'🇪🇸', key:'Spain'        },
  'Poland':                   { flag:'🇵🇱', key:'Poland'       },
  'Ukraine':                  { flag:'🇺🇦', key:'Ukraine'      },
  'Colombia':                 { flag:'🇨🇴', key:'Colombia'     },
  'Kenya':                    { flag:'🇰🇪', key:'Kenya'        },
  'Vietnam':                  { flag:'🇻🇳', key:'Vietnam'      },
  'Malaysia':                 { flag:'🇲🇾', key:'Malaysia'     },
  'Philippines':              { flag:'🇵🇭', key:'Philippines'  },
  'Myanmar':                  { flag:'🇲🇲', key:'Myanmar'      },
  'Peru':                     { flag:'🇵🇪', key:'Peru'         },
  'Venezuela':                { flag:'🇻🇪', key:'Venezuela'    },
  'Chile':                    { flag:'🇨🇱', key:'Chile'        },
  'Romania':                  { flag:'🇷🇴', key:'Romania'      },
  'Netherlands':              { flag:'🇳🇱', key:'Netherlands'  },
  'Belgium':                  { flag:'🇧🇪', key:'Belgium'      },
  'Sweden':                   { flag:'🇸🇪', key:'Sweden'       },
  'Norway':                   { flag:'🇳🇴', key:'Norway'       },
  'Finland':                  { flag:'🇫🇮', key:'Finland'      },
  'Denmark':                  { flag:'🇩🇰', key:'Denmark'      },
  'Switzerland':              { flag:'🇨🇭', key:'Switzerland'  },
  'Austria':                  { flag:'🇦🇹', key:'Austria'      },
  'Greece':                   { flag:'🇬🇷', key:'Greece'       },
  'Portugal':                 { flag:'🇵🇹', key:'Portugal'     },
  'Czech Republic':           { flag:'🇨🇿', key:'Czech Republic'},
  'Hungary':                  { flag:'🇭🇺', key:'Hungary'      },
  'Israel':                   { flag:'🇮🇱', key:'Israel'       },
  'United Arab Emirates':     { flag:'🇦🇪', key:'UAE'          },
  'Iraq':                     { flag:'🇮🇶', key:'Iraq'         },
  'Morocco':                  { flag:'🇲🇦', key:'Morocco'      },
  'Algeria':                  { flag:'🇩🇿', key:'Algeria'      },
  'Tanzania':                 { flag:'🇹🇿', key:'Tanzania'     },
  'Ghana':                    { flag:'🇬🇭', key:'Ghana'        },
  'Angola':                   { flag:'🇦🇴', key:'Angola'       },
  'Mozambique':               { flag:'🇲🇿', key:'Mozambique'   },
  'New Zealand':              { flag:'🇳🇿', key:'New Zealand'  },
  'Singapore':                { flag:'🇸🇬', key:'Singapore'    },
  'Kazakhstan':               { flag:'🇰🇿', key:'Kazakhstan'   },
}

const FALLBACK_DATA = {
  USA:             { gdp:27.4,  population:335,  tech_index:0.92, stability:0.72, unemployment:0.037, renewable_share:0.22, carbon_emissions:4.8  },
  China:           { gdp:17.8,  population:1409, tech_index:0.85, stability:0.68, unemployment:0.052, renewable_share:0.28, carbon_emissions:9.9  },
  India:           { gdp:3.55,  population:1428, tech_index:0.62, stability:0.63, unemployment:0.079, renewable_share:0.18, carbon_emissions:2.6  },
  Japan:           { gdp:4.21,  population:124,  tech_index:0.89, stability:0.80, unemployment:0.026, renewable_share:0.21, carbon_emissions:1.0  },
  UK:              { gdp:3.09,  population:67,   tech_index:0.87, stability:0.73, unemployment:0.042, renewable_share:0.42, carbon_emissions:0.4  },
  Brazil:          { gdp:2.13,  population:215,  tech_index:0.58, stability:0.55, unemployment:0.081, renewable_share:0.48, carbon_emissions:0.4  },
  Russia:          { gdp:2.24,  population:144,  tech_index:0.70, stability:0.45, unemployment:0.032, renewable_share:0.17, carbon_emissions:1.6  },
  Canada:          { gdp:2.14,  population:38,   tech_index:0.86, stability:0.82, unemployment:0.054, renewable_share:0.66, carbon_emissions:0.6  },
  Australia:       { gdp:1.69,  population:26,   tech_index:0.84, stability:0.83, unemployment:0.037, renewable_share:0.32, carbon_emissions:0.4  },
  'South Korea':   { gdp:1.67,  population:51,   tech_index:0.90, stability:0.76, unemployment:0.027, renewable_share:0.09, carbon_emissions:0.6  },
  Mexico:          { gdp:1.32,  population:128,  tech_index:0.54, stability:0.50, unemployment:0.028, renewable_share:0.24, carbon_emissions:0.4  },
  Indonesia:       { gdp:1.32,  population:277,  tech_index:0.50, stability:0.58, unemployment:0.054, renewable_share:0.14, carbon_emissions:0.7  },
  Nigeria:         { gdp:0.47,  population:223,  tech_index:0.32, stability:0.38, unemployment:0.043, renewable_share:0.19, carbon_emissions:0.1  },
  'South Africa':  { gdp:0.40,  population:60,   tech_index:0.48, stability:0.45, unemployment:0.329, renewable_share:0.10, carbon_emissions:0.4  },
  Germany:         { gdp:4.43,  population:84,   tech_index:0.88, stability:0.82, unemployment:0.031, renewable_share:0.47, carbon_emissions:0.6  },
  France:          { gdp:3.01,  population:68,   tech_index:0.84, stability:0.76, unemployment:0.073, renewable_share:0.20, carbon_emissions:0.3  },
  Italy:           { gdp:2.11,  population:59,   tech_index:0.80, stability:0.68, unemployment:0.068, renewable_share:0.20, carbon_emissions:0.3  },
  'Saudi Arabia':  { gdp:1.07,  population:36,   tech_index:0.66, stability:0.62, unemployment:0.055, renewable_share:0.02, carbon_emissions:0.6  },
  Argentina:       { gdp:0.62,  population:46,   tech_index:0.60, stability:0.38, unemployment:0.077, renewable_share:0.14, carbon_emissions:0.2  },
  Pakistan:        { gdp:0.34,  population:231,  tech_index:0.38, stability:0.35, unemployment:0.065, renewable_share:0.08, carbon_emissions:0.2  },
  Bangladesh:      { gdp:0.46,  population:170,  tech_index:0.38, stability:0.42, unemployment:0.053, renewable_share:0.04, carbon_emissions:0.1  },
  Ethiopia:        { gdp:0.16,  population:126,  tech_index:0.20, stability:0.30, unemployment:0.035, renewable_share:0.91, carbon_emissions:0.03 },
  Egypt:           { gdp:0.39,  population:105,  tech_index:0.45, stability:0.46, unemployment:0.071, renewable_share:0.12, carbon_emissions:0.2  },
  Turkey:          { gdp:1.03,  population:85,   tech_index:0.65, stability:0.48, unemployment:0.098, renewable_share:0.22, carbon_emissions:0.5  },
  Iran:            { gdp:0.37,  population:87,   tech_index:0.55, stability:0.40, unemployment:0.095, renewable_share:0.06, carbon_emissions:0.7  },
  Thailand:        { gdp:0.54,  population:72,   tech_index:0.60, stability:0.52, unemployment:0.011, renewable_share:0.19, carbon_emissions:0.3  },
  Spain:           { gdp:1.58,  population:47,   tech_index:0.80, stability:0.70, unemployment:0.121, renewable_share:0.44, carbon_emissions:0.2  },
  Poland:          { gdp:0.81,  population:38,   tech_index:0.75, stability:0.68, unemployment:0.028, renewable_share:0.16, carbon_emissions:0.3  },
  Ukraine:         { gdp:0.18,  population:44,   tech_index:0.62, stability:0.22, unemployment:0.182, renewable_share:0.14, carbon_emissions:0.1  },
  Colombia:        { gdp:0.36,  population:51,   tech_index:0.52, stability:0.48, unemployment:0.105, renewable_share:0.32, carbon_emissions:0.1  },
  Kenya:           { gdp:0.11,  population:55,   tech_index:0.38, stability:0.52, unemployment:0.053, renewable_share:0.75, carbon_emissions:0.02 },
  Vietnam:         { gdp:0.43,  population:98,   tech_index:0.55, stability:0.62, unemployment:0.023, renewable_share:0.43, carbon_emissions:0.3  },
  Malaysia:        { gdp:0.43,  population:33,   tech_index:0.68, stability:0.65, unemployment:0.037, renewable_share:0.22, carbon_emissions:0.3  },
  Philippines:     { gdp:0.40,  population:114,  tech_index:0.50, stability:0.52, unemployment:0.046, renewable_share:0.29, carbon_emissions:0.1  },
  Peru:            { gdp:0.25,  population:33,   tech_index:0.48, stability:0.50, unemployment:0.062, renewable_share:0.60, carbon_emissions:0.1  },
  Chile:           { gdp:0.30,  population:19,   tech_index:0.65, stability:0.62, unemployment:0.085, renewable_share:0.48, carbon_emissions:0.09 },
  Netherlands:     { gdp:1.08,  population:18,   tech_index:0.88, stability:0.84, unemployment:0.038, renewable_share:0.33, carbon_emissions:0.2  },
  Belgium:         { gdp:0.63,  population:12,   tech_index:0.84, stability:0.76, unemployment:0.055, renewable_share:0.22, carbon_emissions:0.1  },
  Sweden:          { gdp:0.59,  population:11,   tech_index:0.88, stability:0.88, unemployment:0.085, renewable_share:0.66, carbon_emissions:0.04 },
  Switzerland:     { gdp:0.82,  population:9,    tech_index:0.92, stability:0.90, unemployment:0.020, renewable_share:0.77, carbon_emissions:0.04 },
  Israel:          { gdp:0.52,  population:10,   tech_index:0.92, stability:0.62, unemployment:0.038, renewable_share:0.10, carbon_emissions:0.08 },
  UAE:             { gdp:0.50,  population:10,   tech_index:0.78, stability:0.72, unemployment:0.025, renewable_share:0.05, carbon_emissions:0.2  },
  Morocco:         { gdp:0.14,  population:37,   tech_index:0.45, stability:0.56, unemployment:0.118, renewable_share:0.37, carbon_emissions:0.07 },
  'New Zealand':   { gdp:0.25,  population:5,    tech_index:0.82, stability:0.86, unemployment:0.036, renewable_share:0.84, carbon_emissions:0.03 },
  Singapore:       { gdp:0.50,  population:6,    tech_index:0.95, stability:0.88, unemployment:0.020, renewable_share:0.04, carbon_emissions:0.04 },
  Kazakhstan:      { gdp:0.26,  population:19,   tech_index:0.55, stability:0.52, unemployment:0.049, renewable_share:0.12, carbon_emissions:0.3  },
}

function CountryDrawer({ name, onClose, snapshot }) {
  const meta = COUNTRY_META[name] || { flag: '🌍', key: name }

  // ── REAL DATA from World Bank ──
  const { data: liveData, loading } = useCountryData(name)

  // Priority: live World Bank > simulation snapshot > hardcoded fallback
  const simData = snapshot?.country_data?.[meta.key] || {}
  const base    = liveData
    || (Object.keys(simData).length > 0 ? simData : (FALLBACK_DATA[meta.key] || {}))

  const stability    = liveData?.stability        ?? base.stability        ?? 0.5
  const tech         = liveData?.tech_index       ?? base.tech_index       ?? 0.5
  const renewable    = liveData?.renewable_share  ?? base.renewable_share  ?? 0.2
  const unemployment = liveData?.unemployment     ?? base.unemployment     ?? 0.05
  const gdp          = liveData?.gdp              ?? base.gdp              ?? 1
  const population   = liveData?.population       ?? base.population       ?? 50
  const carbon       = liveData?.carbon_emissions ?? base.carbon_emissions ?? (gdp * 0.4)
  const lifeExp      = liveData?.life_expectancy  ?? null
  const internet     = liveData?.internet         ?? null
  const isLive       = !!liveData?._live
  const stabColor    = stability > 0.7 ? '#34d399' : stability > 0.45 ? '#fbbf24' : '#f87171'

  const stats = [
    { label: 'GDP',          value: `$${gdp.toFixed(2)}T`,                                                       color: '#a78bfa' },
    { label: 'Population',   value: population > 999 ? `${(population/1000).toFixed(2)}B` : `${Math.round(population)}M`, color: '#34d399' },
    { label: 'Tech Index',   value: `${(tech * 100).toFixed(0)}%`,                                               color: '#60a5fa' },
    { label: 'Stability',    value: `${(stability * 100).toFixed(0)}/100`,                                       color: stabColor  },
    { label: 'Unemployment', value: `${(unemployment * 100).toFixed(1)}%`,                                       color: unemployment > 0.15 ? '#f87171' : '#34d399' },
    { label: 'Renewables',   value: `${(renewable * 100).toFixed(0)}%`,                                          color: '#34d399'  },
    { label: 'CO₂ Emiss.',   value: `${carbon.toFixed(1)} GT`,                                                   color: '#fbbf24'  },
    { label: 'Life Exp.',    value: lifeExp ? `${lifeExp.toFixed(1)} yrs` : `${Math.round(tech * 82 + 18)}/100`, color: '#a78bfa'  },
    { label: 'Internet',     value: internet ? `${internet.toFixed(0)}%` : '—',                                  color: '#93c5fd'  },
  ]

  const bars = [
    { label: 'Tech Progress',       val: tech,           color: '#a78bfa' },
    { label: 'Political Stability', val: stability,      color: stabColor },
    { label: 'Renewable Energy',    val: renewable,      color: '#34d399' },
    { label: 'Employment Rate',     val: 1 - unemployment, color: '#60a5fa' },
  ]

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 310,
      background: 'rgba(8,8,16,0.97)',
      borderLeft: '1px solid rgba(124,58,237,0.30)',
      backdropFilter: 'blur(20px)',
      zIndex: 100, overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
      animation: 'slideIn 0.22s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(124,58,237,0.15)', background: 'rgba(124,58,237,0.04)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 38 }}>{meta.flag}</span>
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#f1f0ff', lineHeight: 1.2, margin: 0 }}>{name}</h2>
              <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                {/* Stability badge */}
                <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 4, letterSpacing: 1, fontWeight: 600, background: `${stabColor}18`, color: stabColor, border: `1px solid ${stabColor}30` }}>
                  {stability > 0.7 ? 'STABLE' : stability > 0.45 ? 'TENSE' : 'UNSTABLE'}
                </span>
                {/* Data source badge */}
                <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 4, letterSpacing: 1, background: loading ? 'rgba(255,215,0,0.10)' : isLive ? 'rgba(52,211,153,0.12)' : 'rgba(124,58,237,0.15)', color: loading ? '#ffd700' : isLive ? '#34d399' : '#a78bfa', border: `1px solid ${loading ? 'rgba(255,215,0,0.25)' : isLive ? 'rgba(52,211,153,0.25)' : 'rgba(124,58,237,0.25)'}` }}>
                  {loading ? '⟳ LOADING...' : isLive ? '● WORLD BANK LIVE' : '◎ BASELINE'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)', cursor: 'pointer', color: 'rgba(241,240,255,0.6)', fontSize: 16, width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>
      </div>

      {/* ── Loading bar ── */}
      {loading && (
        <div style={{ height: 2, background: 'rgba(124,58,237,0.1)', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)', animation: 'slideIn 1.2s ease infinite' }} />
        </div>
      )}

      {/* ── Data source strip ── */}
      {!loading && (
        <div style={{ padding: '5px 16px', flexShrink: 0, background: isLive ? 'rgba(52,211,153,0.04)' : 'rgba(124,58,237,0.04)', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
          <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, color: isLive ? 'rgba(52,211,153,0.55)' : 'rgba(124,58,237,0.45)' }}>
            {isLive
              ? `✓ WORLD BANK OPEN DATA · ${liveData._year} · LIVE`
              : '⚠ BASELINE ESTIMATES — WB DATA UNAVAILABLE'}
          </span>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(124,58,237,0.10)' }}>
        <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(241,240,255,0.28)', letterSpacing: 2.5, marginBottom: 10 }}>KEY INDICATORS</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {stats.map(s => (
            <div key={s.label} style={{ padding: '9px 11px', borderRadius: 8, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)', position: 'relative', overflow: 'hidden' }}>
              {/* Loading shimmer */}
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.08), transparent)', animation: 'slideIn 1.5s ease infinite' }} />
              )}
              <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(241,240,255,0.33)', marginBottom: 4, letterSpacing: 0.8 }}>{s.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: loading ? 'rgba(241,240,255,0.15)' : s.color, margin: 0, transition: 'color 0.3s' }}>
                {loading ? '———' : s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress bars ── */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(124,58,237,0.10)' }}>
        <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(241,240,255,0.28)', letterSpacing: 2.5, marginBottom: 12 }}>PERFORMANCE INDEX</p>
        {bars.map(b => (
          <div key={b.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(241,240,255,0.52)' }}>{b.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: loading ? 'rgba(255,255,255,0.15)' : b.color }}>
                {loading ? '—' : Math.round(b.val * 100)}
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(124,58,237,0.10)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, width: loading ? '0%' : `${Math.min(100, b.val * 100)}%`, background: b.color, transition: 'width 0.9s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── GDP share ── */}
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(241,240,255,0.28)', letterSpacing: 2.5, marginBottom: 10 }}>SHARE OF WORLD GDP</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 5, background: 'rgba(124,58,237,0.10)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, (gdp / 108) * 100)}%`, background: 'linear-gradient(90deg, #5b21b6, #a78bfa)', transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa', minWidth: 36 }}>
            {((gdp / 108) * 100).toFixed(1)}%
          </span>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(241,240,255,0.28)', marginTop: 5 }}>
          ${gdp.toFixed(2)}T of ~$108T global GDP
        </p>

        {/* Extra WB fields shown only when live data available */}
        {isLive && liveData.gini && (
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 6 }}>
            <p style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(241,240,255,0.3)', marginBottom: 4, letterSpacing: 1 }}>INEQUALITY (GINI)</p>
            <p style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: liveData.gini > 45 ? '#f87171' : liveData.gini > 35 ? '#fbbf24' : '#34d399', margin: 0 }}>
              {liveData.gini.toFixed(1)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Tooltip({ name, x, y }) {
  if (!name) return null
  const meta = COUNTRY_META[name] || { flag:'🌍' }
  return (
    <div style={{ position:'fixed', left:x+16, top:y-12, pointerEvents:'none', zIndex:200, padding:'6px 12px', borderRadius:8, background:'rgba(10,10,18,0.94)', border:'1px solid rgba(124,58,237,0.45)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:15 }}>{meta.flag}</span>
      <span style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace', color:'#f1f0ff', fontWeight:600 }}>{name}</span>
      <span style={{ fontSize:9, color:'rgba(241,240,255,0.38)', letterSpacing:1, marginLeft:2 }}>CLICK</span>
    </div>
  )
}

export default function Globe() {
  const { globeMode, snapshot, addInjectedEvent } = useAppStore()
  const [geoJson,      setGeoJson]      = useState(null)
  const [geoError,     setGeoError]     = useState(false)
  const [hoveredName,  setHoveredName]  = useState(null)
  const [tooltipPos,   setTooltipPos]   = useState({ x:0, y:0 })
  const [selectedName, setSelectedName] = useState(null)
  const [showInjector, setShowInjector] = useState(false)
  const [ripples,      setRipples]      = useState([])
  const containerRef = useRef()

  useEffect(() => {
    fetch('/world.geojson')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(setGeoJson)
      .catch(() => setGeoError(true))
  }, [])

  const handleHover = useCallback((name, x, y) => {
    setHoveredName(name || null)
    if (name) setTooltipPos({ x, y })
  }, [])

  const handleClick = useCallback((name) => {
    setSelectedName(prev => prev === name ? null : name)
  }, [])

  const handleInject = ({ event, scope, targetCountry, year }) => {
    const rect   = containerRef.current?.getBoundingClientRect() || { left:0, top:0, width:800, height:600 }
    const x      = rect.left + rect.width  * (0.35 + Math.random() * 0.3)
    const y      = rect.top  + rect.height * (0.25 + Math.random() * 0.5)
    const ripple = {
      id: Date.now(), x, y,
      label: event.label, icon: event.icon,
      category: event.category || (event.effect && Object.values(event.effect).some(v => v < 0) ? 'CRISIS' : 'BREAKTHROUGH'),
    }
    setRipples(prev => [...prev, ripple])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== ripple.id)), 4000)
    addInjectedEvent({ event, scope, targetCountry, year })
  }

  return (
    <div ref={containerRef} style={{ width:'100%', height:'100%', position:'relative', background:'radial-gradient(ellipse at 40% 50%, #06001a 0%, #03000d 60%, #010008 100%)' }}>
      <Canvas
        camera={{ position:[0, 0, 2.8], fov:45 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias:true }}
        style={{ cursor: hoveredName ? 'pointer' : 'grab' }}
      >
        <Stars radius={120} depth={60} count={6000} factor={3} saturation={0.2} fade speed={0.3} />
        <Scene geoJson={geoJson} mode={globeMode} onHover={handleHover} onClick={handleClick} />
        <OrbitControls enableZoom enablePan={false} minDistance={1.4} maxDistance={5} rotateSpeed={0.35} zoomSpeed={0.6} />
      </Canvas>

      <Tooltip name={hoveredName} x={tooltipPos.x} y={tooltipPos.y} />
      <RippleOverlay events={ripples} />

      {selectedName && (
        <CountryDrawer name={selectedName} snapshot={snapshot} onClose={() => setSelectedName(null)} />
      )}

      <button
        onClick={() => setShowInjector(true)}
        style={{ position:'absolute', bottom:90, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:7, padding:'8px 20px', borderRadius:20, background:'rgba(10,10,18,0.88)', border:'1px solid rgba(124,58,237,0.40)', backdropFilter:'blur(10px)', color:'#a78bfa', fontSize:12, fontFamily:'JetBrains Mono, monospace', cursor:'pointer', letterSpacing:1, zIndex:20 }}
      >
        <Zap size={13} /> INJECT EVENT
      </button>

      {showInjector && (
        <EventInjector targetCountry={selectedName || hoveredName || 'Global'} onClose={() => setShowInjector(false)} onInject={handleInject} />
      )}

      {geoError && (
        <div style={{ position:'absolute', bottom:80, left:'50%', transform:'translateX(-50%)', padding:'6px 14px', borderRadius:6, background:'rgba(251,191,36,0.10)', border:'1px solid rgba(251,191,36,0.25)', fontSize:10, fontFamily:'JetBrains Mono, monospace', color:'#fbbf24', pointerEvents:'none' }}>
          ⚠ world.geojson not found in /public
        </div>
      )}
    </div>
  )
}