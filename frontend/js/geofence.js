document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // GEOFENCING CONFIGURATION
    // =========================================

    const GEOFENCE_API = "http://localhost:8080/api/geofences";

    let geofences = [];
    let currentLocation = null;
    let geofenceLayers = [];
    let activeZones = new Set();


    // =========================================
    // GET LEAFLET MAP
    // =========================================

    function getMap() {
        return window.roadSafetyMap || null;
    }


    // =========================================
    // WAIT FOR MAP TO INITIALIZE
    // =========================================

    function waitForMap(callback) {

        const map = getMap();

        if (map) {
            callback(map);
            return;
        }

        setTimeout(function () {
            waitForMap(callback);
        }, 300);
    }


    // =========================================
    // LOAD GEOFENCES FROM SPRING BOOT
    // =========================================

    async function loadGeofences() {

        try {

            console.log("Loading geofences...");

            const response = await fetch(GEOFENCE_API);

            if (!response.ok) {
                throw new Error(
                    "Geofence API returned HTTP " + response.status
                );
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error(
                    "Invalid geofence data received from backend"
                );
            }

            geofences = data;

            console.log(
                "Geofences loaded:",
                geofences.length
            );

            waitForMap(function (map) {
                displayGeofences(map);

                // If GPS already available
                if (currentLocation) {
                    checkGeofences();
                }
            });

        } catch (error) {

            console.error(
                "Geofence API Error:",
                error
            );

        }

    }


    // =========================================
    // DISPLAY GEOFENCES ON LEAFLET MAP
    // =========================================

    function displayGeofences(map) {

        // Remove old polygons
        geofenceLayers.forEach(function (layer) {
            map.removeLayer(layer);
        });

        geofenceLayers = [];


        geofences.forEach(function (zone) {

            if (
                !zone.coordinates ||
                zone.coordinates.length < 3
            ) {
                console.warn(
                    "Invalid coordinates for zone:",
                    zone
                );

                return;
            }


            const zoneColor =
                getZoneColor(zone);


            const polygon = L.polygon(
                zone.coordinates,
                {
                    color: zoneColor,
                    fillColor: zoneColor,
                    fillOpacity: 0.20,
                    weight: 2
                }
            ).addTo(map);


            // =========================================
            // POPUP
            // =========================================

            const name =
                escapeHTML(zone.name || "Safety Zone");

            const type =
                escapeHTML(zone.type || "UNKNOWN");

            const risk =
                escapeHTML(zone.riskLevel || "UNKNOWN");


            polygon.bindPopup(
                "<b>" + name + "</b><br>" +
                "Type: " + type + "<br>" +
                "Risk Level: " + risk
            );


            geofenceLayers.push(polygon);

        });

    }


    // =========================================
    // ZONE COLOR
    // =========================================

    function getZoneColor(zone) {

        const type =
            String(zone.type || "").toUpperCase();

        const risk =
            String(zone.riskLevel || "").toUpperCase();


        if (risk === "HIGH") {
            return "#ff0000";
        }


        switch (type) {

            case "SCHOOL":
                return "#ff9800";

            case "HILL":
                return "#9c27b0";

            case "WILDLIFE":
                return "#4caf50";

            case "WEATHER":
                return "#2196f3";

            case "HIGH_RISK":
                return "#f44336";

            default:
                return "#ff0000";
        }

    }


    // =========================================
    // RECEIVE GPS LOCATION FROM map.js
    // =========================================

    window.addEventListener(
        "userLocationUpdated",
        function (event) {

            if (!event.detail) {
                return;
            }


            const latitude =
                event.detail.lat;

            const longitude =
                event.detail.lon;


            if (
                typeof latitude !== "number" ||
                typeof longitude !== "number"
            ) {
                return;
            }


            currentLocation = [
                latitude,
                longitude
            ];


            console.log(
                "Current GPS Location:",
                latitude,
                longitude
            );


            checkGeofences();

        }
    );


    // =========================================
    // POINT-IN-POLYGON CHECK
    // =========================================

    function isInsideGeofence(
        latitude,
        longitude,
        polygon
    ) {

        let inside = false;


        for (
            let i = 0,
                j = polygon.length - 1;

            i < polygon.length;

            j = i++
        ) {

            const lat1 =
                Number(polygon[i][0]);

            const lon1 =
                Number(polygon[i][1]);


            const lat2 =
                Number(polygon[j][0]);

            const lon2 =
                Number(polygon[j][1]);


            const intersect =
                (
                    (lon1 > longitude) !==
                    (lon2 > longitude)
                )
                &&
                (
                    latitude <
                    (
                        (lat2 - lat1) *
                        (longitude - lon1)
                        /
                        (lon2 - lon1)
                    ) +
                    lat1
                );


            if (intersect) {
                inside = !inside;
            }

        }


        return inside;

    }


    // =========================================
    // CHECK ALL GEOFENCES
    // =========================================

    function checkGeofences() {

        if (!currentLocation) {
            return;
        }


        const latitude =
            currentLocation[0];

        const longitude =
            currentLocation[1];


        geofences.forEach(function (zone) {

            if (
                !zone.coordinates ||
                zone.coordinates.length < 3
            ) {
                return;
            }


            const inside =
                isInsideGeofence(
                    latitude,
                    longitude,
                    zone.coordinates
                );


            const zoneId =
                zone.id ??
                zone.name ??
                JSON.stringify(zone.coordinates);


            // =========================================
            // USER ENTERED ZONE
            // =========================================

            if (inside) {

                if (!activeZones.has(zoneId)) {

                    activeZones.add(zoneId);

                    showSafetyAlert(zone);

                }

            }


            // =========================================
            // USER LEFT ZONE
            // =========================================

            else {

                activeZones.delete(zoneId);

            }

        });

    }


    // =========================================
    // SAFETY ALERT
    // =========================================

    function showSafetyAlert(zone) {

        const zoneName =
            zone.name || "Safety Zone";

        const risk =
            zone.riskLevel || "UNKNOWN";

        const message =
            "⚠️ " +
            zoneName +
            "\n\n" +
            "Risk Level: " +
            risk +
            "\n\n" +
            getSafetyMessage(zone.type);


        console.log(
            "GEOFENCE ALERT:",
            message
        );


        // Browser alert
        alert(message);


        // Optional custom event
        window.dispatchEvent(
            new CustomEvent(
                "geofenceAlert",
                {
                    detail: {
                        zone: zone,
                        message: message
                    }
                }
            )
        );

    }


    // =========================================
    // SAFETY MESSAGE
    // =========================================

    function getSafetyMessage(type) {

        switch (
            String(type || "").toUpperCase()
        ) {

            case "HIGH_RISK":

                return (
                    "High accident-risk area. " +
                    "Drive carefully."
                );


            case "HILL":

                return (
                    "Hill area ahead. " +
                    "Reduce speed and drive carefully."
                );


            case "WILDLIFE":

                return (
                    "Wildlife zone. " +
                    "Watch for animals crossing."
                );


            case "SCHOOL":

                return (
                    "School zone. " +
                    "Reduce speed and watch for pedestrians."
                );


            case "WEATHER":

                return (
                    "Weather hazard detected. " +
                    "Drive carefully."
                );


            default:

                return (
                    "Please drive carefully."
                );

        }

    }


    // =========================================
    // HTML ESCAPE
    // =========================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =========================================
    // DEBUG FUNCTIONS
    // =========================================

    window.reloadGeofences =
        function () {

            loadGeofences();

        };


    window.getCurrentGeofenceLocation =
        function () {

            console.log(
                "Current Location:",
                currentLocation
            );

            return currentLocation;

        };


    window.getLoadedGeofences =
        function () {

            console.log(
                "Loaded Geofences:",
                geofences
            );

            return geofences;

        };


    // =========================================
    // START
    // =========================================

    console.log(
        "Geofencing system initialized"
    );


    loadGeofences();

});