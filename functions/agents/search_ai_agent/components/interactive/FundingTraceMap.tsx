import React from "react";
import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";
import { FundingTraceData } from "../../types";
import useSWR from "swr";

// Dynamic import to avoid server-side rendering issues with leaflet
const MapComponent = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), {
  ssr: false,
});

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface FundingTraceMapProps {
  traceDataUrl: string;
}

const FundingTraceMap: React.FC<FundingTraceMapProps> = ({ traceDataUrl }) => {
  // Fetch trace data
  const { data, error } = useSWR<FundingTraceData>(traceDataUrl, fetcher);

  if (error) return <div>Error loading map data.</div>;
  if (!data) return <div>Loading map data...</div>;

  const position: LatLngExpression = [51.505, -0.09]; // Default starting position

  return (
    <div className="w-full h-full">
      <MapComponent center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data.map((trace, index) => (
          <Marker key={index} position={[trace.latitude, trace.longitude] as LatLngExpression}>
            <Popup>
              <div>
                <p>
                  <strong>Agency:</strong> {trace.agencyName}
                </p>
                <p>
                  <strong>Amount:</strong> ${trace.amount}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(trace.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Description:</strong> {trace.description}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapComponent>
    </div>
  );
};

export default FundingTraceMap;
