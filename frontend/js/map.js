/* =========================================================
   FILE: map.js
   PROJECT: AI Road Safety & Accident Prevention System

   PURPOSE:
   Leaflet map, GPS, destination routing and live TomTom
   traffic overlay.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       01. MAP CONTAINER
       ========================================================= */

    const mapContainer =
        document.getElementById("roadSafetyMap");

    if (!mapContainer) {
        console.error("roadSafetyMap element not found.");
        return;
    }


    /* =========================================================
       02. DEFAULT MAP LOCATION
       ========================================================= */

    const DEFAULT_LOCATION = [
        30.3165,
        78.0322
    ];


    /* =========================================================
       03. LOCATION CARD
       ========================================================= */

    const locationName =
        document.getElementById(
            "currentLocationName"
        );

    const locationCoords =
        document.getElementById(
            "currentLocationCoords"
        );


    /* =========================================================
       04. CREATE LEAFLET MAP
       ========================================================= */

    const map =
        L.map("roadSafetyMap").setView(
            DEFAULT_LOCATION,
            13
        );


    window.roadSafetyMap = map;


    /* =========================================================
       05. MAPTILER BASE MAP
       ========================================================= */

    const MAPTILER_API_KEY =
        "AIjMLb00jID8SbW9SdMs";

    L.tileLayer(
        `https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
        {
            tileSize: 512,
            zoomOffset: -1,
            minZoom: 1,
            maxZoom: 22,

            attribution:
                '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> ' +
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
        }
    ).addTo(map);


    /* =========================================================
       06. GPS VARIABLES
       ========================================================= */

    let userMarker = null;

    let accuracyCircle = null;

    let currentUserLocation = null;

    let firstGPSUpdate = true;

    let watchId = null;

    let reverseGeocodeRunning = false;

    let lastReverseGeocodeTime = 0;


    /* =========================================================
       07. UPDATE LOCATION CARD
       ========================================================= */

    function updateLocationCard(
        lat,
        lon
    ) {

        if (locationCoords) {

            locationCoords.textContent =
                `${lat.toFixed(6)}° N, ${lon.toFixed(6)}° E`;

        }

        if (locationName) {

            locationName.textContent =
                "Current GPS Location";

        }

    }


    /* =========================================================
       08. REVERSE GEOCODING
       ========================================================= */

    async function reverseGeocode(
        lat,
        lon
    ) {

        const now =
            Date.now();


        if (
            reverseGeocodeRunning ||
            now - lastReverseGeocodeTime < 30000
        ) {

            return;

        }


        reverseGeocodeRunning = true;

        lastReverseGeocodeTime = now;


        try {

            const url =
                "https://nominatim.openstreetmap.org/reverse?" +
                new URLSearchParams({

                    format: "json",

                    lat: lat,

                    lon: lon,

                    zoom: 18,

                    addressdetails: 1

                });


            const response =
                await fetch(

                    url,

                    {

                        headers: {

                            "Accept":
                                "application/json"

                        }

                    }

                );


            if (!response.ok) {

                throw new Error(
                    "Reverse geocoding failed"
                );

            }


            const data =
                await response.json();


            if (
                data &&
                data.display_name
            ) {

                const address =
                    data.address || {};


                const placeName =

                    address.road ||

                    address.suburb ||

                    address.neighbourhood ||

                    address.city ||

                    address.town ||

                    address.village ||

                    "Current GPS Location";


                if (locationName) {

                    locationName.textContent =
                        placeName;

                }


                console.log(
                    "Current Location Name:",
                    data.display_name
                );

            }

        } catch (error) {

            console.warn(
                "Reverse geocoding error:",
                error
            );


            if (locationName) {

                locationName.textContent =
                    "Current GPS Location";

            }

        } finally {

            reverseGeocodeRunning =
                false;

        }

    }


    /* =========================================================
       09. UPDATE USER GPS LOCATION
       ========================================================= */

    function updateUserLocation(
        position
    ) {

        const lat =
            position.coords.latitude;

        const lon =
            position.coords.longitude;

        const accuracy =
            position.coords.accuracy;


        currentUserLocation = {

            lat: lat,

            lon: lon,

            accuracy: accuracy

        };


        updateLocationCard(
            lat,
            lon
        );


        reverseGeocode(
            lat,
            lon
        );


        /* =====================================================
           USER MARKER
           ===================================================== */

        if (!userMarker) {

            userMarker =
                L.marker(

                    [
                        lat,
                        lon
                    ],

                    {
                        title:
                            "Your Current Location"
                    }

                )
                    .addTo(map);


            userMarker.bindPopup(

                `
                <b>📍 You are here</b><br>
                Latitude: ${lat.toFixed(6)}<br>
                Longitude: ${lon.toFixed(6)}<br>
                Accuracy: ${Math.round(accuracy)} m
                `

            );

        } else {

            userMarker.setLatLng(

                [
                    lat,
                    lon
                ]

            );


            userMarker.setPopupContent(

                `
                <b>📍 You are here</b><br>
                Latitude: ${lat.toFixed(6)}<br>
                Longitude: ${lon.toFixed(6)}<br>
                Accuracy: ${Math.round(accuracy)} m
                `

            );

        }


        /* =====================================================
           GPS ACCURACY CIRCLE
           ===================================================== */

        if (!accuracyCircle) {

            accuracyCircle =
                L.circle(

                    [
                        lat,
                        lon
                    ],

                    {

                        radius:
                        accuracy,

                        color:
                            "#2563eb",

                        fillColor:
                            "#2563eb",

                        fillOpacity:
                            0.12,

                        weight:
                            1

                    }

                )
                    .addTo(map);

        } else {

            accuracyCircle.setLatLng(

                [
                    lat,
                    lon
                ]

            );


            accuracyCircle.setRadius(
                accuracy
            );

        }


        /* =====================================================
           CENTER MAP ON FIRST REAL GPS LOCATION
           ===================================================== */

        if (firstGPSUpdate) {

            map.setView(

                [
                    lat,
                    lon
                ],

                16

            );

            firstGPSUpdate =
                false;

        }


        /* =====================================================
           SEND LOCATION TO GEOFENCE.JS
           ===================================================== */

        window.dispatchEvent(

            new CustomEvent(

                "userLocationUpdated",

                {

                    detail: {

                        lat:
                        lat,

                        lon:
                        lon,

                        accuracy:
                        accuracy

                    }

                }

            )

        );


        console.log(

            "Current GPS Location:",

            lat,

            lon,

            "Accuracy:",

            accuracy,

            "meters"

        );

    }


    /* =========================================================
       10. GPS ERROR
       ========================================================= */

    function gpsError(error) {

        console.error(
            "GPS Error:",
            error
        );


        if (locationName) {

            if (error.code === 1) {

                locationName.textContent =
                    "Location Permission Denied";

            } else if (error.code === 2) {

                locationName.textContent =
                    "Location Unavailable";

            } else if (error.code === 3) {

                locationName.textContent =
                    "GPS Request Timed Out";

            } else {

                locationName.textContent =
                    "Unable to Get GPS Location";

            }

        }


        if (locationCoords) {

            locationCoords.textContent =
                "Location unavailable";

        }

    }


    /* =========================================================
       11. START GPS
       ========================================================= */

    function requestInitialLocation() {

        if (!navigator.geolocation) {

            gpsError({
                code: 0
            });

            return;

        }


        navigator.geolocation.getCurrentPosition(

            function (position) {

                console.log(
                    "Initial GPS permission granted."
                );


                updateUserLocation(
                    position
                );

            },

            function (error) {

                gpsError(
                    error
                );

            },

            {

                enableHighAccuracy:
                    true,

                timeout:
                    15000,

                maximumAge:
                    0

            }

        );


        /* Continuous GPS tracking */

        watchId =

            navigator.geolocation.watchPosition(

                function (position) {

                    updateUserLocation(
                        position
                    );

                },

                function (error) {

                    gpsError(
                        error
                    );

                },

                {

                    enableHighAccuracy:
                        true,

                    maximumAge:
                        3000,

                    timeout:
                        15000

                }

            );


        console.log(
            "Live GPS tracking started."
        );

    }


    requestInitialLocation();


    /* =========================================================
       12. CURRENT LOCATION BUTTON
       ========================================================= */

    const currentLocationBtn =
        document.getElementById(
            "currentLocationBtn"
        );


    if (currentLocationBtn) {

        currentLocationBtn.addEventListener(

            "click",

            function () {

                if (currentUserLocation) {

                    map.setView(

                        [
                            currentUserLocation.lat,
                            currentUserLocation.lon
                        ],

                        17

                    );


                    if (userMarker) {

                        userMarker.openPopup();

                    }

                } else {

                    navigator.geolocation.getCurrentPosition(

                        function (position) {

                            updateUserLocation(
                                position
                            );


                            map.setView(

                                [
                                    position.coords.latitude,
                                    position.coords.longitude
                                ],

                                17

                            );

                        },

                        function (error) {

                            gpsError(
                                error
                            );

                        },

                        {

                            enableHighAccuracy:
                                true,

                            timeout:
                                15000,

                            maximumAge:
                                0

                        }

                    );

                }

            }

        );

    }


    /* =========================================================
       13. MAP CONTROLS
       ========================================================= */

    const zoomInBtn =
        document.getElementById(
            "zoomInBtn"
        );

    const zoomOutBtn =
        document.getElementById(
            "zoomOutBtn"
        );

    const resetMapBtn =
        document.getElementById(
            "resetMapBtn"
        );


    if (zoomInBtn) {

        zoomInBtn.addEventListener(
            "click",
            function () {

                map.zoomIn();

            }
        );

    }


    if (zoomOutBtn) {

        zoomOutBtn.addEventListener(
            "click",
            function () {

                map.zoomOut();

            }
        );

    }


    if (resetMapBtn) {

        resetMapBtn.addEventListener(
            "click",
            function () {

                if (currentUserLocation) {

                    map.setView(

                        [
                            currentUserLocation.lat,
                            currentUserLocation.lon
                        ],

                        16

                    );

                } else {

                    map.setView(

                        DEFAULT_LOCATION,

                        13

                    );

                }

            }
        );

    }


    /* =========================================================
       14. TOMTOM LIVE TRAFFIC OVERLAY
       ========================================================= */

    let trafficLayer =
        null;

    let trafficRefreshTimer =
        null;

    let trafficEnabled =
        false;


    /*
       TomTom API key is NOT stored in frontend.

       Frontend calls Spring Boot:

       /api/traffic/tile/{z}/{x}/{y}.png

       Spring Boot then calls TomTom using the
       key stored in application.properties.
    */

    const TRAFFIC_TILE_API =
        "http://localhost:8080/api/traffic/tile/{z}/{x}/{y}.png";


    /* =========================================================
       TRAFFIC STATUS CONTROL
       ========================================================= */

    const TrafficStatusControl =
        L.Control.extend({

            options: {

                position:
                    "bottomright"

            },


            onAdd:
                function () {

                    const div =
                        L.DomUtil.create(

                            "div",

                            "traffic-status-control"

                        );


                    div.style.display =
                        "none";


                    div.style.background =
                        "rgba(255,255,255,0.95)";


                    div.style.padding =
                        "8px 10px";


                    div.style.borderRadius =
                        "8px";


                    div.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,.18)";


                    div.style.fontSize =
                        "11px";


                    div.style.lineHeight =
                        "1.5";


                    div.innerHTML = `

                        <strong>
                            🚦 Live Traffic
                        </strong>

                        <div>
                            <span style="color:#2EAB30">
                                ●
                            </span>
                            Low
                        </div>

                        <div>
                            <span style="color:#F1BF40">
                                ●
                            </span>
                            Moderate
                        </div>

                        <div>
                            <span style="color:#F18237">
                                ●
                            </span>
                            Heavy
                        </div>

                        <div>
                            <span style="color:#E70704">
                                ●
                            </span>
                            Severe
                        </div>

                    `;


                    L.DomEvent.disableClickPropagation(
                        div
                    );


                    this._container =
                        div;


                    return div;

                }

        });


    const trafficStatus =
        new TrafficStatusControl();


    trafficStatus.addTo(
        map
    );


    const trafficStatusElement =
        trafficStatus._container;


    function updateTrafficStatus(
        enabled
    ) {

        if (!trafficStatusElement) {

            return;

        }


        trafficStatusElement.style.display =

            enabled

                ? "block"

                : "none";

    }


    /* =========================================================
       REFRESH TRAFFIC
       ========================================================= */

    function refreshTrafficTiles() {

        if (

            !trafficEnabled ||

            !trafficLayer

        ) {

            return;

        }


        /*
           Cache busting forces Leaflet to request
           fresh traffic tiles.
        */

        trafficLayer.setUrl(

            TRAFFIC_TILE_API +

            "?t=" +

            Date.now()

        );

    }


    /* =========================================================
       ENABLE TRAFFIC
       ========================================================= */

    function enableTrafficLayer() {

        if (trafficEnabled) {

            return;

        }


        trafficEnabled =
            true;


        if (!trafficLayer) {

            trafficLayer =

                L.tileLayer(

                    TRAFFIC_TILE_API,

                    {

                        tileSize:
                            256,

                        opacity:
                            0.90,

                        zIndex:
                            250,

                        attribution:
                            "Traffic © TomTom"

                    }

                );

        }


        trafficLayer.setUrl(

            TRAFFIC_TILE_API +

            "?t=" +

            Date.now()

        );


        trafficLayer.addTo(
            map
        );


        updateTrafficStatus(
            true
        );


        clearInterval(
            trafficRefreshTimer
        );


        trafficRefreshTimer =

            setInterval(

                refreshTrafficTiles,

                60000

            );


        console.log(
            "TomTom live traffic layer: ON"
        );

    }


    /* =========================================================
       DISABLE TRAFFIC
       ========================================================= */

    function disableTrafficLayer() {

        trafficEnabled =
            false;


        if (trafficLayer) {

            map.removeLayer(
                trafficLayer
            );

        }


        updateTrafficStatus(
            false
        );


        clearInterval(
            trafficRefreshTimer
        );


        trafficRefreshTimer =
            null;


        console.log(
            "TomTom live traffic layer: OFF"
        );

    }


    /* =========================================================
       GLOBAL FUNCTION FOR app.js
       ========================================================= */

    function toggleTrafficLayer(
        enable
    ) {

        if (
            typeof enable ===
            "boolean"
        ) {

            if (enable) {

                enableTrafficLayer();

            } else {

                disableTrafficLayer();

            }

        } else {

            if (trafficEnabled) {

                disableTrafficLayer();

            } else {

                enableTrafficLayer();

            }

        }

    }


    /*
       app.js will call this.
    */

    window.toggleTrafficLayer =
        toggleTrafficLayer;


    /* =========================================================
       15. SAFE ROUTE MAP TAB
       ========================================================= */

    /*
       The first map tab was previously called Risk Map.
       It is converted to Safe Route here so no HTML change
       is required.
    */

    const safeRouteMapBtn =
        document.querySelector(".map-tabs button:first-child");

    let safeRouteActive = false;


    const SAFE_ROUTE_AI_API =
        "http://localhost:8080/api/ai/safe-route";


    /* ---------------------------------------------------------
       Get midpoint of a route for AI latitude/longitude.
       --------------------------------------------------------- */

    function getRouteMidpoint(route) {

        const points =
            Array.isArray(route?.points)
                ? route.points
                : [];


        if (!points.length) {
            return {
                latitude: 0,
                longitude: 0
            };
        }


        const point =
            points[
                Math.floor(points.length / 2)
                ];


        return {
            latitude: Number(point.lat || 0),
            longitude: Number(point.lon || point.lng || 0)
        };
    }


    /* ---------------------------------------------------------
       Build the exact 16 model features used by the trained
       safe_route_model.joblib pipeline.
       --------------------------------------------------------- */

    function buildSafeRouteAIFeatures(
        route,
        routeIndex
    ) {

        const now = new Date();

        const hour =
            now.getHours();

        const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

        const dayOfWeek =
            dayNames[now.getDay()];

        const isWeekend =
            now.getDay() === 0 ||
            now.getDay() === 6
                ? 1
                : 0;

        const isPeakHour =
            (hour >= 8 && hour <= 11) ||
            (hour >= 17 && hour <= 20)
                ? 1
                : 0;

        const weatherRoute =
            Array.isArray(window.routeWeatherData)
                ? window.routeWeatherData.find(
                    item =>
                        item.id === route.id ||
                        item.name === route.name
                )
                : null;

        const weatherPoint =
            weatherRoute &&
            Array.isArray(weatherRoute.weatherPoints) &&
            weatherRoute.weatherPoints.length
                ? weatherRoute.weatherPoints[0]
                : null;

        const trafficRoute =
            Array.isArray(window.routeTrafficData)
                ? window.routeTrafficData.find(
                    item =>
                        item.id === route.id ||
                        item.name === route.name
                )
                : null;

        const congestion =
            trafficRoute
                ? Number(
                    trafficRoute.trafficCongestionPercent || 0
                )
                : 0;

        let trafficDensity = "Low";

        if (congestion >= 70) {
            trafficDensity = "High";
        } else if (congestion >= 40) {
            trafficDensity = "Medium";
        }

        const midpoint =
            getRouteMidpoint(route);

        return {
            city:
                route.city ||
                "Unknown",

            state:
                route.state ||
                "Unknown",

            latitude:
            midpoint.latitude,

            longitude:
            midpoint.longitude,

            hour:
            hour,

            day_of_week:
            dayOfWeek,

            is_weekend:
            isWeekend,

            road_type:
                route.road_type ||
                "Unknown",

            lanes:
                Number(route.lanes || 2),

            traffic_signal:
                route.traffic_signal ||
                "Unknown",

            weather:
                weatherPoint?.condition ||
                "Clear",

            visibility:
                weatherPoint?.visibility ||
                "Good",

            temperature:
                Number(
                    weatherPoint?.temperature ?? 25
                ),

            traffic_density:
            trafficDensity,

            is_peak_hour:
            isPeakHour,

            festival:
                route.festival ||
                "No"
        };
    }


    /* ---------------------------------------------------------
       Ask Spring Boot -> Python AI service for route risk.
       --------------------------------------------------------- */

    async function requestSafeRouteAI() {

        const routes =
            Array.isArray(window.generatedRoutes)
                ? window.generatedRoutes
                : [];

        const payload = {
            routes: routes.map(
                (route, index) => ({
                    id:
                        route.id ||
                        `route-${index + 1}`,

                    name:
                        route.name ||
                        `Route ${String.fromCharCode(65 + index)}`,

                    distanceKm:
                        Number(route.distanceKm || 0),

                    durationMin:
                        Number(route.durationMin || 0),

                    coordinates:
                        Array.isArray(route.coordinates)
                            ? route.coordinates
                            : (Array.isArray(route.points)
                                ? route.points.map(point => [
                                    Number(point.lon ?? point.lng),
                                    Number(point.lat)
                                ]).filter(coord =>
                                    Number.isFinite(coord[0]) &&
                                    Number.isFinite(coord[1])
                                )
                                : []),

                    features:
                        buildSafeRouteAIFeatures(
                            route,
                            index
                        )
                })
            )
        };


        const response =
            await fetch(
                SAFE_ROUTE_AI_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );


        if (!response.ok) {
            throw new Error(
                `Safe Route AI API failed: ${response.status}`
            );
        }


        const data =
            await response.json();

        window.aiSafeRouteData = data;

        return data;
    }


    async function showAISafeRouteOnMap() {

        /* -----------------------------------------
           Route must already be calculated
           ----------------------------------------- */

        if (
            !Array.isArray(window.generatedRoutes) ||
            window.generatedRoutes.length === 0 ||
            !Array.isArray(window.routeLayers) ||
            window.routeLayers.length === 0
        ) {

            alert(
                "Pehle destination enter karke Find Route dabao."
            );

            return;
        }


        /* -----------------------------------------
           Use an existing AI result when available.
           Otherwise calculate it now.
           ----------------------------------------- */

        if (
            !window.aiSafeRouteData ||
            !window.aiSafeRouteData.recommendedRouteId
        ) {

            try {

                safeRouteMapBtn?.classList.add(
                    "selected"
                );

                await requestSafeRouteAI();

            } catch (error) {

                console.error(
                    "Safe Route AI Error:",
                    error
                );

                alert(
                    "AI Safe Route calculate nahi ho paaya. Spring Boot aur AI service check karo."
                );

                return;
            }
        }


        /* -----------------------------------------
           AI result check
           ----------------------------------------- */

        if (
            !window.aiSafeRouteData ||
            !window.aiSafeRouteData.recommendedRouteId
        ) {

            alert(
                "AI safe route result available nahi hai."
            );

            return;
        }


        const safeRouteId =
            window.aiSafeRouteData.recommendedRouteId;


        /* -----------------------------------------
           Find recommended route
           ----------------------------------------- */

        const safeIndex =
            window.generatedRoutes.findIndex(
                route =>
                    route.id === safeRouteId
            );


        if (safeIndex === -1) {

            alert(
                "AI recommended route map par nahi mili."
            );

            return;
        }


        /* -----------------------------------------
           Make safe route GREEN and fade others
           ----------------------------------------- */

        window.routeLayers.forEach(
            (layer, index) => {

                if (index === safeIndex) {

                    layer.setStyle({
                        color: "#16a34a",
                        weight: 8,
                        opacity: 1
                    });

                    if (
                        typeof layer.bringToFront ===
                        "function"
                    ) {
                        layer.bringToFront();
                    }

                } else {

                    layer.setStyle({
                        color: "#94a3b8",
                        weight: 4,
                        opacity: 0.25
                    });
                }

            }
        );


        /* -----------------------------------------
           Focus map on safe route
           ----------------------------------------- */

        const safeLayer =
            window.routeLayers[safeIndex];

        map.fitBounds(
            safeLayer.getBounds(),
            {
                padding: [40, 40]
            }
        );


        /* -----------------------------------------
           Popup with AI result
           ----------------------------------------- */

        const safeRoute =
            window.generatedRoutes[safeIndex];

        const aiRouteData =
            Array.isArray(
                window.aiSafeRouteData.routes
            )
                ? window.aiSafeRouteData.routes.find(
                    route =>
                        route.id === safeRouteId
                )
                : null;

        const riskPercentage =
            aiRouteData &&
            aiRouteData.finalRiskPercentage !== undefined
                ? Number(
                    aiRouteData.finalRiskPercentage
                ).toFixed(1)
                : "N/A";

        safeLayer.bindPopup(`
            <div style="min-width:190px">
                <b>🟢 AI SAFE ROUTE</b><br><br>
                <b>${safeRoute.name}</b><br>
                Distance: ${safeRoute.distanceKm.toFixed(1)} km<br>
                ETA: ${Math.round(safeRoute.durationMin)} min<br>
                AI Risk: ${riskPercentage}%
            </div>
        `);


        safeLayer.openPopup();


        console.log(
            "AI Safe Route displayed:",
            safeRoute,
            window.aiSafeRouteData
        );
    }


    /* =========================================================
       SAFE ROUTE ON / OFF TOGGLE
       ========================================================= */

    function saveOriginalRouteStyles() {

        if (!Array.isArray(window.routeLayers)) {
            return;
        }

        window.routeLayers.forEach((layer) => {

            if (!layer) {
                return;
            }

            if (!layer._originalSafeRouteStyle) {

                const style = layer.options || {};

                layer._originalSafeRouteStyle = {
                    color: style.color,
                    weight: style.weight,
                    opacity: style.opacity,
                    fillOpacity: style.fillOpacity
                };
            }
        });
    }


    function restoreNormalRoutes() {

        if (!Array.isArray(window.routeLayers)) {
            return;
        }

        window.routeLayers.forEach((layer) => {

            if (!layer) {
                return;
            }

            const original = layer._originalSafeRouteStyle;

            if (original) {

                const restoreStyle = {};

                if (original.color !== undefined) {
                    restoreStyle.color = original.color;
                }
                if (original.weight !== undefined) {
                    restoreStyle.weight = original.weight;
                }
                if (original.opacity !== undefined) {
                    restoreStyle.opacity = original.opacity;
                }
                if (original.fillOpacity !== undefined) {
                    restoreStyle.fillOpacity = original.fillOpacity;
                }

                layer.setStyle(restoreStyle);

            } else {

                layer.setStyle({
                    weight: 5,
                    opacity: 0.55
                });
            }
        });

        if (typeof map.closePopup === "function") {
            map.closePopup();
        }
    }


    async function enableSafeRoute() {

        if (
            !Array.isArray(window.generatedRoutes) ||
            window.generatedRoutes.length === 0 ||
            !Array.isArray(window.routeLayers) ||
            window.routeLayers.length === 0
        ) {

            alert("Pehle destination enter karke Find Route dabao.");
            return;
        }

        saveOriginalRouteStyles();

        try {

            await showAISafeRouteOnMap();

            if (
                !window.aiSafeRouteData ||
                !window.aiSafeRouteData.recommendedRouteId
            ) {
                return;
            }

            safeRouteActive = true;

            if (safeRouteMapBtn) {

                safeRouteMapBtn.classList.add(
                    "active",
                    "safe-route-active"
                );

                safeRouteMapBtn.classList.remove("selected");

                safeRouteMapBtn.innerHTML = "🔵 Safe Route ON";
            }

            console.log("Safe Route: ON");

        } catch (error) {

            safeRouteActive = false;

            console.error("Safe Route ON error:", error);
        }
    }


    function disableSafeRoute() {

        safeRouteActive = false;

        restoreNormalRoutes();

        if (safeRouteMapBtn) {

            safeRouteMapBtn.classList.remove(
                "active",
                "safe-route-active",
                "selected"
            );

            safeRouteMapBtn.innerHTML = "🟢 Safe Route";
        }

        if (
            Array.isArray(window.routeLayers) &&
            window.routeLayers.length > 0
        ) {

            const allBounds =
                L.featureGroup(window.routeLayers);

            map.fitBounds(
                allBounds.getBounds(),
                { padding: [30, 30] }
            );
        }

        console.log("Safe Route: OFF");
    }


    if (safeRouteMapBtn) {

        safeRouteMapBtn.id = "safeRouteMapBtn";
        safeRouteMapBtn.innerHTML = "🟢 Safe Route";

        safeRouteMapBtn.classList.remove(
            "active",
            "safe-route-active",
            "selected"
        );

        safeRouteMapBtn.addEventListener(
            "click",
            async function () {

                if (safeRouteActive) {
                    disableSafeRoute();
                } else {
                    await enableSafeRoute();
                }
            }
        );
    }


    window.enableSafeRoute = enableSafeRoute;
    window.disableSafeRoute = disableSafeRoute;
    window.showAISafeRouteOnMap = showAISafeRouteOnMap;


    /* =========================================================
       16. DESTINATION SEARCH
       ========================================================= */

    const destinationInput =
        document.getElementById(
            "destinationInput"
        );

    const findRouteBtn =
        document.getElementById(
            "findRouteBtn"
        );

    let destinationMarker = null;


    /* =========================================================
       17. SEARCH DESTINATION
       ========================================================= */

    async function searchDestination() {

        const destination =
            destinationInput
                ? destinationInput.value.trim()
                : "";

        if (!destination) {

            alert("Please enter a destination.");
            return;
        }

        try {

            let destinationLat = null;
            let destinationLon = null;
            let displayName = destination;

            // ====================================================
            // 1. TRY NOMINATIM
            // ====================================================

            try {

                const nominatimUrl =
                    "https://nominatim.openstreetmap.org/search?" +
                    new URLSearchParams({
                        format: "jsonv2",
                        limit: "1",
                        q: destination
                    });

                const response = await fetch(
                    nominatimUrl,
                    {
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

                if (response.ok) {

                    const data = await response.json();

                    if (Array.isArray(data) && data.length > 0) {

                        destinationLat =
                            parseFloat(data[0].lat);

                        destinationLon =
                            parseFloat(data[0].lon);

                        displayName =
                            data[0].display_name || destination;
                    }
                }

            } catch (geocodeError) {

                console.warn(
                    "Nominatim geocoding failed, trying MapTiler:",
                    geocodeError
                );
            }

            // ====================================================
            // 2. FALLBACK: MAPTILER GEOCODING
            // ====================================================

            if (
                !Number.isFinite(destinationLat) ||
                !Number.isFinite(destinationLon)
            ) {

                const mapTilerUrl =
                    `https://api.maptiler.com/geocoding/` +
                    `${encodeURIComponent(destination)}.json?key=${MAPTILER_API_KEY}&limit=1`;

                const response = await fetch(mapTilerUrl);

                if (!response.ok) {
                    throw new Error(
                        `Geocoding failed with status ${response.status}`
                    );
                }

                const data = await response.json();

                const feature =
                    data?.features?.[0];

                if (
                    !feature ||
                    !Array.isArray(feature.center) ||
                    feature.center.length < 2
                ) {
                    throw new Error(
                        "Destination not found."
                    );
                }

                destinationLon =
                    Number(feature.center[0]);

                destinationLat =
                    Number(feature.center[1]);

                displayName =
                    feature.place_name ||
                    feature.text ||
                    destination;
            }

            // ====================================================
            // VALIDATE COORDINATES
            // ====================================================

            if (
                !Number.isFinite(destinationLat) ||
                !Number.isFinite(destinationLon)
            ) {
                throw new Error(
                    "Invalid destination coordinates."
                );
            }

            // ====================================================
            // REMOVE PREVIOUS DESTINATION MARKER
            // ====================================================

            if (destinationMarker) {

                map.removeLayer(
                    destinationMarker
                );
            }

            // ====================================================
            // ADD DESTINATION MARKER
            // ====================================================

            destinationMarker =
                L.marker([
                    destinationLat,
                    destinationLon
                ])
                    .addTo(map)
                    .bindPopup(
                        `<b>📍 Destination</b><br>${displayName}`
                    )
                    .openPopup();

            // ====================================================
            // GPS REQUIRED FOR ROUTING
            // ====================================================

            if (!currentUserLocation) {

                alert(
                    "Destination found, but current GPS location is not available yet."
                );

                map.setView(
                    [destinationLat, destinationLon],
                    14
                );

                return;
            }

            // ====================================================
            // CALCULATE ROUTE
            // ====================================================

            try {

                await drawRoute(
                    currentUserLocation.lat,
                    currentUserLocation.lon,
                    destinationLat,
                    destinationLon
                );

            } catch (routeError) {

                console.error(
                    "Route calculation error:",
                    routeError
                );

                alert(
                    "Destination mil gaya, lekin route calculate nahi ho paaya. Browser Console check karo."
                );
            }

        } catch (error) {

            console.error(
                "Destination search error:",
                error
            );

            alert(
                "Destination search failed: " +
                (error?.message || "Unknown error")
            );
        }
    }


    if (findRouteBtn) {

        findRouteBtn.addEventListener(

            "click",

            searchDestination

        );

    }


    if (destinationInput) {

        destinationInput.addEventListener(

            "keydown",

            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    searchDestination();

                }

            }

        );

    }


    /* =========================================================
       18. DRAW ROUTE USING OSRM
       ========================================================= */

    /* =========================================================
       18. DRAW ROUTES USING OSRM
       ========================================================= */

    async function fetchOSRMJson(url) {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Routing API request failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (data.code !== "Ok" || !Array.isArray(data.routes)) {
            return { routes: [] };
        }

        return data;
    }


    function buildRouteFromOSRM(
        route,
        index,
        sourceTag = "osrm"
    ) {

        const coordinates =
            Array.isArray(route?.geometry?.coordinates)
                ? route.geometry.coordinates
                    .map(coord => [
                        Number(coord[0]),
                        Number(coord[1])
                    ])
                    .filter(coord =>
                        Number.isFinite(coord[0]) &&
                        Number.isFinite(coord[1])
                    )
                : [];

        const points = coordinates.map(coord => ({
            lon: coord[0],
            lat: coord[1]
        }));

        return {
            id: `${sourceTag}-${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: "",
            distanceKm: Number(route.distance || 0) / 1000,
            durationMin: Number(route.duration || 0) / 60,
            points,
            coordinates
        };
    }


    function routeSignature(route) {

        const coords =
            Array.isArray(route?.coordinates)
                ? route.coordinates
                : [];

        if (coords.length < 2) {
            return "";
        }

        const sampleIndexes = [
            0,
            Math.floor(coords.length * 0.25),
            Math.floor(coords.length * 0.50),
            Math.floor(coords.length * 0.75),
            coords.length - 1
        ];

        return sampleIndexes
            .map(index => {
                const point = coords[index] || [0, 0];
                return `${Number(point[0]).toFixed(4)},${Number(point[1]).toFixed(4)}`;
            })
            .join("|");
    }


    function deduplicateRoutes(routes) {

        const unique = [];
        const seen = new Set();

        routes.forEach(route => {

            const signature = routeSignature(route);

            if (!signature || seen.has(signature)) {
                return;
            }

            seen.add(signature);
            unique.push(route);
        });

        return unique;
    }


    function buildCorridorWaypoints(
        startLat,
        startLon,
        destinationLat,
        destinationLon
    ) {

        const latDelta = destinationLat - startLat;
        const lonDelta = destinationLon - startLon;
        const length = Math.sqrt(
            (latDelta * latDelta) +
            (lonDelta * lonDelta)
        ) || 1;

        // Unit vector perpendicular to the direct line.
        const perpLat = -lonDelta / length;
        const perpLon = latDelta / length;

        // Multiple corridor offsets intentionally create
        // additional practical route candidates.
        const offsets = [
            0.015,
            -0.015,
            0.035,
            -0.035
        ];

        const fractions = [
            0.35,
            0.50,
            0.65
        ];

        const waypoints = [];

        fractions.forEach(fraction => {

            const baseLat =
                startLat + latDelta * fraction;

            const baseLon =
                startLon + lonDelta * fraction;

            offsets.forEach(offset => {

                waypoints.push({
                    lat: baseLat + perpLat * offset,
                    lon: baseLon + perpLon * offset
                });

            });
        });

        return waypoints;
    }


    async function drawRoute(
        startLat,
        startLon,
        destinationLat,
        destinationLon
    ) {

        try {

            /* =================================================
               1. NORMAL OSRM ALTERNATIVES
               OSRM supports up to 3 requested alternatives on
               its standard server, but may return fewer.
               ================================================= */

            const baseUrl =
                `https://router.project-osrm.org/route/v1/driving/` +
                `${startLon},${startLat};` +
                `${destinationLon},${destinationLat}` +
                `?alternatives=3&overview=full&geometries=geojson`;

            const baseData =
                await fetchOSRMJson(baseUrl);

            if (!baseData.routes.length) {

                alert("Route could not be found.");
                return;
            }


            let candidateOSRMRoutes =
                [...baseData.routes];


            /* =================================================
               2. EXTRA CORRIDOR ROUTES
               OSRM does not promise every physically possible
               route. To get more distinct practical candidates,
               route through several corridor waypoints too.
               ================================================= */

            const waypoints =
                buildCorridorWaypoints(
                    startLat,
                    startLon,
                    destinationLat,
                    destinationLon
                );

            const extraPromises =
                waypoints.map((waypoint, index) => {

                    const url =
                        `https://router.project-osrm.org/route/v1/driving/` +
                        `${startLon},${startLat};` +
                        `${waypoint.lon},${waypoint.lat};` +
                        `${destinationLon},${destinationLat}` +
                        `?alternatives=3&overview=full&geometries=geojson`;

                    return fetchOSRMJson(url)
                        .then(data => ({
                            index,
                            data
                        }))
                        .catch(error => {
                            console.warn(
                                "Extra route query failed:",
                                error
                            );
                            return {
                                index,
                                data: { routes: [] }
                            };
                        });
                });

            const extraResults =
                await Promise.all(extraPromises);

            extraResults.forEach(result => {

                if (Array.isArray(result.data.routes)) {
                    candidateOSRMRoutes.push(
                        ...result.data.routes
                    );
                }
            });


            /* =================================================
               3. CONVERT + DEDUPLICATE
               ================================================= */

            let routes =
                candidateOSRMRoutes
                    .map((route, index) =>
                        buildRouteFromOSRM(
                            route,
                            index,
                            "candidate"
                        )
                    )
                    .filter(route =>
                        route.coordinates.length >= 2
                    );

            routes = deduplicateRoutes(routes);


            /* =================================================
               4. KEEP PRACTICAL ROUTES
               Don't keep extreme accidental detours created by
               corridor waypoints. The fastest route is always
               retained; others can be up to 2.0x its distance.
               ================================================= */

            const fastestDistance =
                Math.min(
                    ...routes.map(route =>
                        route.distanceKm
                    )
                );

            routes = routes.filter(route =>
                fastestDistance <= 0 ||
                route.distanceKm <=
                    fastestDistance * 2.0
            );


            /* =================================================
               5. SORT BY ROUTE DISTANCE
               ================================================= */

            routes.sort(
                (a, b) =>
                    a.distanceKm - b.distanceKm
            );


            /* =================================================
               6. DISPLAY ALL DISTINCT PRACTICAL CANDIDATES
               Keep a sensible upper bound so weather/traffic
               APIs are not hammered on one click.
               ================================================= */

            const MAX_PRACTICAL_ROUTES = 10;

            routes =
                routes.slice(
                    0,
                    MAX_PRACTICAL_ROUTES
                );

            routes.forEach((route, index) => {

                route.id = `route-${index + 1}`;
                route.name =
                    `Route ${String.fromCharCode(65 + index)}`;
            });


            /* =================================================
               7. REMOVE OLD ROUTES
               ================================================= */

            if (window.routeLayers) {

                window.routeLayers.forEach(
                    layer => map.removeLayer(layer)
                );
            }

            window.routeLayers = [];


            /* =================================================
               8. SAVE ROUTES FOR AI SAFE ROUTE
               ================================================= */

            window.generatedRoutes = routes;
            window.aiSafeRouteData = null;
            safeRouteActive = false;

            if (safeRouteMapBtn) {

                safeRouteMapBtn.classList.remove(
                    "active",
                    "safe-route-active",
                    "selected"
                );

                safeRouteMapBtn.innerHTML =
                    "🟢 Safe Route";
            }


            /* =================================================
               9. DRAW EVERY DISTINCT ROUTE
               ================================================= */

            routes.forEach((route, index) => {

                const isMainRoute = index === 0;

                const originalRouteStyle = {
                    color: "#3388ff",
                    weight: isMainRoute ? 7 : 5,
                    opacity: isMainRoute ? 0.90 : 0.55
                };

                const layer =
                    L.geoJSON(
                        {
                            type: "LineString",
                            coordinates: route.coordinates
                        },
                        {
                            style: originalRouteStyle
                        }
                    ).addTo(map);

                layer._originalSafeRouteStyle = {
                    color: originalRouteStyle.color,
                    weight: originalRouteStyle.weight,
                    opacity: originalRouteStyle.opacity
                };

                layer.bindPopup(
                    `<b>🚗 ${route.name}</b><br>` +
                    `Distance: ${route.distanceKm.toFixed(1)} km<br>` +
                    `ETA: ${Math.round(route.durationMin)} min`
                );

                window.routeLayers.push(layer);
            });


            if (!window.routeLayers.length) {

                alert("No practical routes were found.");
                return;
            }


            /* =================================================
               10. FIT MAP TO ALL ROUTES
               ================================================= */

            const allBounds =
                L.featureGroup(
                    window.routeLayers
                );

            map.fitBounds(
                allBounds.getBounds(),
                { padding: [30, 30] }
            );


            /* =================================================
               11. WEATHER + TRAFFIC + AI FOR EVERY ROUTE
               ================================================= */

            if (
                typeof window.loadRouteWeather ===
                "function"
            ) {

                await window.loadRouteWeather(
                    routes
                );

            } else {

                console.error(
                    "loadRouteWeather() not found. Check app.js"
                );
            }


            if (trafficEnabled) {
                refreshTrafficTiles();
            }

            console.log(
                `Generated ${routes.length} distinct practical routes:`,
                routes
            );

        } catch (error) {

            console.error(
                "Routing error:",
                error
            );

            alert(
                "Unable to calculate routes."
            );
        }
    }


    /* =========================================================
       19. CLEANUP
       ========================================================= */

    window.addEventListener(
        "beforeunload",
        function () {

            if (
                watchId !== null
            ) {

                navigator.geolocation.clearWatch(
                    watchId
                );

            }


            clearInterval(
                trafficRefreshTimer
            );

        }
    );

});
// ============================================================
// LIVE TRAFFIC MAP OVERLAY
// ============================================================

let trafficLayer = null;
let trafficEnabled = false;

const TRAFFIC_TILE_API =
    "http://localhost:8080/api/traffic/tile/{z}/{x}/{y}.png";


// ============================================================
// CREATE TRAFFIC LAYER
// ============================================================

function createTrafficLayer() {

    if (trafficLayer) {
        return;
    }

    trafficLayer = L.tileLayer(
        TRAFFIC_TILE_API,
        {
            tileSize: 256,
            opacity: 1.0,
            zIndex: 500,

            minZoom: 1,
            maxZoom: 22,

            attribution:
                "&copy; TomTom Traffic"
        }
    );

    // Debug
    trafficLayer.on(
        "tileerror",
        function (error) {

            console.error(
                "Traffic tile failed:",
                error
            );

        }
    );
}


// ============================================================
// TOGGLE TRAFFIC
// ============================================================

function toggleTrafficLayer() {

    createTrafficLayer();

    if (!window.roadSafetyMap) {

        console.error(
            "Map not available"
        );

        return;
    }


    if (!trafficEnabled) {

        trafficLayer.addTo(
            window.roadSafetyMap
        );

        trafficEnabled = true;

        console.log(
            "LIVE TRAFFIC: ON"
        );


        showTrafficLegend();

    } else {

        window.roadSafetyMap.removeLayer(
            trafficLayer
        );

        trafficEnabled = false;

        console.log(
            "LIVE TRAFFIC: OFF"
        );


        hideTrafficLegend();
    }
}


// ============================================================
// TRAFFIC LEGEND
// ============================================================

function showTrafficLegend() {

    let legend =
        document.getElementById(
            "trafficLegend"
        );


    if (legend) {

        legend.style.display =
            "flex";

        return;
    }


    legend =
        document.createElement(
            "div"
        );

    legend.id =
        "trafficLegend";

    legend.innerHTML = `

        <div class="traffic-title">
            🚦 LIVE TRAFFIC
        </div>

        <div class="traffic-item">
            <span class="traffic-color traffic-green"></span>
            <span>Normal</span>
        </div>

        <div class="traffic-item">
            <span class="traffic-color traffic-yellow"></span>
            <span>Moderate</span>
        </div>

        <div class="traffic-item">
            <span class="traffic-color traffic-orange"></span>
            <span>Heavy</span>
        </div>

        <div class="traffic-item">
            <span class="traffic-color traffic-red"></span>
            <span>Severe</span>
        </div>

    `;


    const mapStage =
        document.querySelector(
            ".map-stage"
        );


    if (mapStage) {

        mapStage.appendChild(
            legend
        );

    }
}


// ============================================================
// HIDE LEGEND
// ============================================================

function hideTrafficLegend() {

    const legend =
        document.getElementById(
            "trafficLegend"
        );

    if (legend) {

        legend.style.display =
            "none";

    }
}


// ============================================================
// MAKE GLOBAL
// ============================================================

window.toggleTrafficLayer =
    toggleTrafficLayer;
