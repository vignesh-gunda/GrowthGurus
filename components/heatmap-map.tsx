"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { FeatureCollection } from "geojson";

type Placement = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  placementType: string;
  estDailyImpressions: number;
  peakHours: string[];
};

type HeatmapMapProps = {
  data: FeatureCollection;
  placements: Placement[];
  initialView?: {
    center: [number, number];
    zoom: number;
  };
};

const MAP_STYLE = "mapbox://styles/mapbox/standard";
const DEFAULT_CENTER: [number, number] = [-118.269, 34.046];

export function HeatmapMap({ data, placements, initialView }: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const placementMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const sourceReadyRef = useRef(false);

  useEffect(() => {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!containerRef.current || mapRef.current || !accessToken) {
      return;
    }

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialView?.center ?? DEFAULT_CENTER,
      zoom: initialView?.zoom ?? 11.2,
      pitch: 32,
      attributionControl: true
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("zone-posts", {
        type: "geojson",
        data
      });
      sourceReadyRef.current = true;

      map.addLayer({
        id: "zone-posts-heat",
        type: "heatmap",
        source: "zone-posts",
        maxzoom: 14,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "weight"], 0],
            0,
            0,
            100,
            1
          ],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 14, 3.2],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 8, 14, 38],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.95, 15, 0.55],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(33,102,172,0)",
            0.2,
            "#52b6ff",
            0.4,
            "#86efac",
            0.6,
            "#facc15",
            0.8,
            "#fb923c",
            1,
            "#dc2626"
          ]
        }
      });

      map.addLayer({
        id: "zone-posts-points",
        type: "circle",
        source: "zone-posts",
        minzoom: 12,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "weight"], 0],
            0,
            4,
            100,
            12
          ],
          "circle-color": "#172033",
          "circle-stroke-color": "#fff7ed",
          "circle-stroke-width": 1.5,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0, 12, 0.6, 14, 0.9]
        }
      });
    });

    mapRef.current = map;

    return () => {
      placementMarkersRef.current.forEach((marker) => marker.remove());
      placementMarkersRef.current = [];
      sourceReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [data, initialView]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !sourceReadyRef.current) {
      return;
    }

    const source = map.getSource("zone-posts");

    if (source && "setData" in source) {
      source.setData(data);
    }
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !initialView) {
      return;
    }

    map.easeTo({
      center: initialView.center,
      zoom: initialView.zoom,
      duration: 1200
    });
  }, [initialView]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    placementMarkersRef.current.forEach((marker) => marker.remove());
    placementMarkersRef.current = [];

    placements.forEach((placement) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className =
        "flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-[#d7662f] text-sm font-semibold text-white shadow-lg";
      element.textContent = "P";

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(
        `
          <div style="min-width: 220px; color: #111827;">
            <div style="font-weight: 700; font-size: 14px;">${placement.label}</div>
            <div style="margin-top: 6px; font-size: 12px; color: rgba(17,24,39,0.7);">
              ${placement.placementType}
            </div>
            <div style="margin-top: 10px; font-size: 12px;">
              Estimated impressions: ${placement.estDailyImpressions.toLocaleString()}
            </div>
            <div style="margin-top: 6px; font-size: 12px;">
              Peak hours: ${placement.peakHours.join(", ")}
            </div>
          </div>
        `
      );

      const marker = new mapboxgl.Marker({ element })
        .setLngLat([placement.lng, placement.lat])
        .setPopup(popup)
        .addTo(map);

      placementMarkersRef.current.push(marker);
    });
  }, [placements]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-[#172033] p-6 text-center text-white">
        <div className="max-w-md">
          <p className="text-sm uppercase tracking-[0.22em] text-white/50">Mapbox Required</p>
          <h3 className="mt-3 text-2xl font-semibold">Add a public Mapbox token to render the map.</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Create <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in <code>.env.local</code>,
            restart the dev server, and this scaffold will render the sample heatmap.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
