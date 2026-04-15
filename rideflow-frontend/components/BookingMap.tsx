"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface BookingMapProps {
  onPickupSet: (lat: number, lng: number, label: string) => void;
  onDropoffSet: (lat: number, lng: number, label: string) => void;
  baseLat?: number;
  baseLng?: number;
  forcedPickup?: { lat: number; lng: number; label: string } | null;
  forcedDropoff?: { lat: number; lng: number; label: string } | null;
}

const BookingMap = ({ 
  onPickupSet, 
  onDropoffSet, 
  baseLat = 19.0760, 
  baseLng = 72.8777,
  forcedPickup,
  forcedDropoff
}: BookingMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [pMarker, setPMarker] = useState<L.Marker | null>(null);
  const [dMarker, setDMarker] = useState<L.Marker | null>(null);
  const [polyline, setPolyline] = useState<L.Polyline | null>(null);

  useEffect(() => {
    // Fix default icon issues
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    if (mapRef.current && !mapInstance.current) {
      const map = L.map(mapRef.current).setView([baseLat, baseLng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstance.current = map;

      const markers = {
        pickup: null as L.Marker | null,
        dropoff: null as L.Marker | null,
        line: null as L.Polyline | null
      };

      const updateRouteLine = () => {
         if (markers.pickup && markers.dropoff) {
            if (markers.line) markers.line.remove();
            markers.line = L.polyline([markers.pickup.getLatLng(), markers.dropoff.getLatLng()], {
               color: "#10B981",
               weight: 4,
               dashArray: "10, 10",
            }).addTo(map);
            setPolyline(markers.line);
            map.fitBounds(markers.line.getBounds(), { padding: [50, 50] });
         }
      };

      const getAddress = async (lat: number, lng: number) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'User-Agent': 'RideFlow-App-V2' }
          });
          const data = await res.json();
          return data.display_name.split(",")[0] + ", " + (data.address.suburb || data.address.neighbourhood || "");
        } catch (e) {
          return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        }
      };

      map.on("click", async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        if (!markers.pickup) {
          const label = await getAddress(lat, lng);
          markers.pickup = L.marker([lat, lng], { draggable: true }).addTo(map);
          markers.pickup.bindPopup(`<b>Pickup:</b> ${label}`).openPopup();
          
          markers.pickup.on("dragend", async (ev: any) => {
             const m = ev.target;
             const pos = m.getLatLng();
             const newLabel = await getAddress(pos.lat, pos.lng);
             m.setPopupContent(`<b>Pickup:</b> ${newLabel}`).openPopup();
             onPickupSet(pos.lat, pos.lng, newLabel);
          });

          setPMarker(markers.pickup);
          onPickupSet(lat, lng, label);
        } else if (!markers.dropoff) {
          const label = await getAddress(lat, lng);
          markers.dropoff = L.marker([lat, lng], { draggable: true }).addTo(map);
          markers.dropoff.bindPopup(`<b>Drop-off:</b> ${label}`).openPopup();
          
          markers.dropoff.on("dragend", async (ev: any) => {
             const m = ev.target;
             const pos = m.getLatLng();
             const newLabel = await getAddress(pos.lat, pos.lng);
             m.setPopupContent(`<b>Drop-off:</b> ${newLabel}`).openPopup();
             onDropoffSet(pos.lat, pos.lng, newLabel);
          });

          setDMarker(markers.dropoff);
          onDropoffSet(lat, lng, label);
          updateRouteLine();
        }
      });

      // @ts-ignore
      map._markerRefs = markers;
      // @ts-ignore
      map._updateRouteLine = updateRouteLine;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Effect to re-center when city changes
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView([baseLat, baseLng], 13);
      
      if (pMarker) { pMarker.remove(); setPMarker(null); }
      if (dMarker) { dMarker.remove(); setDMarker(null); }
      if (polyline) { polyline.remove(); setPolyline(null); }
      
      // @ts-ignore
      if (mapInstance.current._markerRefs) {
        // @ts-ignore
        mapInstance.current._markerRefs.pickup = null;
        // @ts-ignore
        mapInstance.current._markerRefs.dropoff = null;
        // @ts-ignore
        mapInstance.current._markerRefs.line = null;
      }
    }
  }, [baseLat, baseLng]);

  // Effect for Forced Data (Search Selection)
  useEffect(() => {
    if (mapInstance.current && forcedPickup) {
      // @ts-ignore
      const refs = mapInstance.current._markerRefs;
      if (refs.pickup) refs.pickup.remove();
      refs.pickup = L.marker([forcedPickup.lat, forcedPickup.lng], { draggable: true }).addTo(mapInstance.current);
      refs.pickup.bindPopup(`<b>Pickup:</b> ${forcedPickup.label}`).openPopup();
      setPMarker(refs.pickup);
      mapInstance.current.setView([forcedPickup.lat, forcedPickup.lng], 15);
      // @ts-ignore
      mapInstance.current._updateRouteLine();
    }
  }, [forcedPickup]);

  useEffect(() => {
    if (mapInstance.current && forcedDropoff) {
      // @ts-ignore
      const refs = mapInstance.current._markerRefs;
      if (refs.dropoff) refs.dropoff.remove();
      refs.dropoff = L.marker([forcedDropoff.lat, forcedDropoff.lng], { draggable: true }).addTo(mapInstance.current);
      refs.dropoff.bindPopup(`<b>Drop-off:</b> ${forcedDropoff.label}`).openPopup();
      setDMarker(refs.dropoff);
      mapInstance.current.setView([forcedDropoff.lat, forcedDropoff.lng], 15);
      // @ts-ignore
      mapInstance.current._updateRouteLine();
    }
  }, [forcedDropoff]);

  return <div ref={mapRef} className="w-full h-full rounded-xl z-0 bg-gray-100" />;
};

export default BookingMap;
