'use client'
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// 老成渝铁路沿线城市大致坐标（成都 → 重庆）
const DEFAULT_CENTER: [number, number] = [30.0, 105.5]
const DEFAULT_ZOOM = 8

export default function TrackMap({
  path,
  historyPath,
  historyDistance,
  historyDate,
}: {
  path: [number, number][]
  historyPath?: [number, number][]
  historyDistance?: number | null
  historyDate?: string | null
}) {
  const showHistory = historyPath && historyPath.length > 1
  const center: [number, number] =
    path.length > 0 ? path[path.length - 1] : showHistory
      ? historyPath![Math.floor(historyPath!.length / 2)]
      : DEFAULT_CENTER

  return (
    <MapContainer
      center={center}
      zoom={showHistory || path.length > 0 ? 13 : DEFAULT_ZOOM}
      style={{ height: '420px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 上次轨迹：灰色虚线 */}
      {showHistory && (
        <>
          <Polyline
            positions={historyPath!}
            pathOptions={{ color: '#9ca3af', weight: 5, dashArray: '6 6', opacity: 0.8 }}
          />
          {/* 历史经过点位：灰色点亮 */}
          {historyPath!.map((pos, i) => (
            <CircleMarker key={`h-${i}`} center={pos} radius={4}
              pathOptions={{ color: '#6b7280', fillColor: '#9ca3af', fillOpacity: 0.9 }} />
          ))}
        </>
      )}

      {/* 本次轨迹：蓝色实线 */}
      {path.length > 1 && (
        <Polyline
          positions={path}
          pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.95 }}
        />
      )}
      {/* 经过点位点亮 */}
      {path.map((pos, i) => (
        <CircleMarker key={`c-${i}`} center={pos} radius={4}
          pathOptions={{ color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 0.9 }} />
      ))}

      {/* 起点/终点标记 */}
      {path.length > 0 && (
        <>
          <CircleMarker center={path[0]} radius={8}
            pathOptions={{ color: '#16a34a', fillColor: '#22c55e', fillOpacity: 1 }} />
          <CircleMarker center={path[path.length - 1]} radius={8}
            pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 1 }} />
        </>
      )}
    </MapContainer>
  )
}
