"use client";

import { useCallback, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/Button";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

type Props = {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  onClose: () => void;
};

export function LocationMapPicker({
  latitude,
  longitude,
  onChange,
  onClose,
}: Props) {
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom: 14,
  });
  const [marker, setMarker] = useState({ latitude, longitude });

  const onMapClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      const { lat, lng } = e.lngLat;
      setMarker({ latitude: lat, longitude: lng });
      onChange(lat, lng);
    },
    [onChange]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-2xl border border-yellow-600/30 bg-zinc-900/80 p-6 text-center text-sm text-zinc-400">
        Setel{" "}
        <code className="text-amber-200/90">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>{" "}
        di .env.local untuk menampilkan peta Mapbox (dark).
        <div className="mt-4 flex justify-center gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-yellow-600/20">
      <div className="h-[min(360px,55vh)] w-full">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: "100%", height: "100%" }}
          onClick={onMapClick}
        >
          <NavigationControl position="top-right" />
          <Marker
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="center"
          >
            <div
              className="h-4 w-4 rounded-full border-2 border-amber-300 bg-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
              aria-hidden
            />
          </Marker>
        </Map>
      </div>
      <p className="border-t border-white/10 bg-black/40 px-4 py-2 text-center text-xs text-zinc-500">
        Ketuk peta untuk meletakkan pin lokasi toko.
      </p>
    </div>
  );
}
