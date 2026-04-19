"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, FeatureCollection, Point } from "geojson";

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
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null);
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

      hoverPopupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        className: "heatmap-hover-popup"
      });

      map.on("mouseenter", "zone-posts-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "zone-posts-points", () => {
        map.getCanvas().style.cursor = "";
        hoverPopupRef.current?.remove();
      });

      map.on("mousemove", "zone-posts-points", (event) => {
        const feature = event.features?.[0] as Feature<Point> | undefined;

        if (!feature || !feature.geometry || feature.geometry.type !== "Point") {
          return;
        }

        const coordinates = [...feature.geometry.coordinates] as [number, number];
        const content = renderHoverCard(feature);

        hoverPopupRef.current?.setLngLat(coordinates).setHTML(content).addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      placementMarkersRef.current.forEach((marker) => marker.remove());
      placementMarkersRef.current = [];
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
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

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(renderPlacementCard(placement));

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

function renderHoverCard(feature: Feature<Point>) {
  const properties = feature.properties as Record<string, unknown> | null;

  if (!properties) {
    return `<div class="map-info-card"><div class="map-info-title">Map point</div></div>`;
  }

  const hashtagItems = Array.isArray(properties.hashtags)
    ? properties.hashtags.map((tag) => String(tag))
    : typeof properties.hashtags === "string"
      ? properties.hashtags.split(",").map((tag) => tag.trim())
      : [];

  const zoneLabel = stringOrFallback(properties.zone_label ?? properties.zone_id, "Unknown zone");
  const engagement = numberOrFallback(properties.engagement);
  const platform = stringOrFallback(properties.platform, "Unknown");
  const comment = stringOrFallback(properties.comment, "");
  const commentDate = formatDate(properties.comment_date);
  const source = stringOrFallback(properties.source, "Unknown source");
  const intensity = numberOrFallback(properties.weight);

  const noteHtml = comment ? `<div class="map-info-note">${escapeHtml(comment)}</div>` : "";

  return `
    <div class="map-info-card">
      <div class="map-info-eyebrow" style="margin-bottom: 0.6rem;">Heat Point</div>
      <div class="map-info-grid">
        <div class="map-info-stat">
          <span class="map-info-stat-label">Engagement</span>
          <strong class="map-info-stat-value">${engagement}</strong>
        </div>
        <div class="map-info-stat">
          <span class="map-info-stat-label">Heat</span>
          <strong class="map-info-stat-value">${intensity}</strong>
        </div>
      </div>
      <div class="map-info-row">
        <span class="map-info-row-label">Date</span>
        <span class="map-info-row-value">${escapeHtml(commentDate)}</span>
      </div>
      <div class="map-info-tags">
        ${renderTagList(hashtagItems.slice(0, 3))}
      </div>
      ${noteHtml}
    </div>
  `;
}

function renderPlacementCard(placement: Placement) {
  return `
    <div class="map-info-card">
      <div class="map-info-header">
        <div>
          <div class="map-info-eyebrow">Placement</div>
          <div class="map-info-title">${escapeHtml(placement.label)}</div>
        </div>
        <div class="map-info-chip">${escapeHtml(placement.placementType)}</div>
      </div>
      <div class="map-info-grid">
        <div class="map-info-stat">
          <span class="map-info-stat-label">Impressions</span>
          <strong class="map-info-stat-value">${placement.estDailyImpressions.toLocaleString()}</strong>
        </div>
      </div>
      <div class="map-info-row">
        <span class="map-info-row-label">Peak hours</span>
        <span class="map-info-row-value">${escapeHtml(placement.peakHours.join(", "))}</span>
      </div>
    </div>
  `;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "Unknown";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberOrFallback(value: unknown) {
  return typeof value === "number" ? value.toLocaleString() : "n/a";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTagList(tags: string[]) {
  if (tags.length === 0) {
    return `<span class="map-info-tag map-info-tag-muted">No hashtags</span>`;
  }

  return tags
    .slice(0, 3)
    .map((tag) => {
      const cleaned = tag
        .replace(/^#/, "")
        .replace(/^\["/, "")
        .replace(/"\]$/, "")
        .replace(/"/g, "")
        .trim();
      return `<span class="map-info-tag">${escapeHtml(cleaned)}</span>`;
    })
    .join("");
}
