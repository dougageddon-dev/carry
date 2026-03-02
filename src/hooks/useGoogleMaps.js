// src/hooks/useGoogleMaps.js
import { useState, useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";

let loaderInstance = null;
let mapsApiPromise = null;

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!loaderInstance) {
      loaderInstance = new Loader({
        apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
        libraries: ["places", "maps", "marker"],
      });
      mapsApiPromise = loaderInstance.load();
    }

    mapsApiPromise
      .then(() => setIsLoaded(true))
      .catch((err) => {
        console.error("Google Maps load error:", err);
        setLoadError(err.message);
      });
  }, []);

  return { isLoaded, loadError };
}

// Initialize a map in a container ref
export function useMap(containerRef, options = {}) {
  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || map) return;

    const newMap = new window.google.maps.Map(containerRef.current, {
      zoom: 12,
      center: options.center || { lat: 43.6532, lng: -79.3832 }, // Toronto default
      mapId: "carry-map",
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      ...options,
    });

    setMap(newMap);
  }, [isLoaded, containerRef, options, map]);

  return map;
}
