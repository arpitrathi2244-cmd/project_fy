/* =========================================================
   FILE: app.js
   PROJECT: AI Road Safety & Accident Prevention System

   PURPOSE:
   Controls frontend interactions.

   SECTIONS:
   01. UI element references
   02. Toast notifications
   03. Module navigation
   04. Emergency SOS
   05. Global search
   06. Dashboard animations
   07. Hover / pointer interactions
   08. Route Weather
   09. Route Traffic
   10. Traffic button
   ========================================================= */


/* =========================================================
   01. COLLECT MAIN UI ELEMENTS
   ========================================================= */

const sections =
    [...document.querySelectorAll(".page-section")];

const navItems =
    [...document.querySelectorAll(".nav-item")];

const toast =
    document.getElementById("toast");


/* =========================================================
   02. TOAST NOTIFICATIONS
   ========================================================= */

function showToast(message) {

    if (!toast) {

        console.log("Toast:", message);

        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.__toastTimer);

    window.__toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2600);
}


window.showToast = showToast;


/* =========================================================
   03. MODULE NAVIGATION
   ========================================================= */

function openSection(id) {

    sections.forEach(section => {

        section.classList.toggle(
            "active",
            section.id === id
        );

    });


    navItems.forEach(nav => {

        nav.classList.toggle(
            "active",
            nav.dataset.section === id
        );

    });


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


    if (id !== "dashboard") {

        const activeNav =
            document.querySelector(
                `[data-section="${id}"]`
            );


        showToast(

            activeNav?.innerText.trim() ||
            "Module opened"

        );
    }
}


window.openSection = openSection;


navItems.forEach(item => {

    item.addEventListener(
        "click",
        () => {

            openSection(
                item.dataset.section
            );

        }
    );

});


/* =========================================================
   OTHER DASHBOARD BUTTONS
   ========================================================= */

document
    .getElementById("callNow")
    ?.addEventListener(
        "click",
        triggerSOS
    );


document
    .getElementById("notificationBtn")
    ?.addEventListener(
        "click",
        () => {

            showToast(
                "3 active safety notifications"
            );

        }
    );


document
    .getElementById("themeToggle")
    ?.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-mode"
            );


            showToast(

                document.body.classList.contains(
                    "light-mode"
                )

                    ? "Light mode preview"

                    : "Dark mode enabled"

            );

        }
    );


/* =========================================================
   04. EMERGENCY SOS
   ========================================================= */

function triggerSOS() {

    const ok =
        confirm(
            "Emergency SOS will share your GPS location with the registered emergency contact. Continue?"
        );


    if (ok) {

        showToast(
            "SOS triggered • GPS location sharing started"
        );

    }
}


window.triggerSOS = triggerSOS;


/* =========================================================
   05. GLOBAL SEARCH
   ========================================================= */

const search =
    document.getElementById(
        "globalSearch"
    );


search?.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Enter") {

            return;

        }


        const query =
            search.value
                .trim()
                .toLowerCase();


        if (!query) {

            return;

        }


        const match =
            navItems.find(
                nav =>
                    nav.innerText
                        .toLowerCase()
                        .includes(query)
            );


        if (match) {

            openSection(
                match.dataset.section
            );

        } else {

            showToast(
                `Searching for "${search.value}"`
            );

        }

    }
);


/* =========================================================
   CTRL + K SEARCH
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (

            (event.ctrlKey || event.metaKey) &&

            event.key.toLowerCase() === "k"

        ) {

            event.preventDefault();

            search?.focus();

        }

    }
);


/* =========================================================
   06. DASHBOARD ENTRANCE ANIMATION
   ========================================================= */

document
    .querySelectorAll(
        ".summary-card,.action-card,.panel"
    )
    .forEach(
        (element, index) => {

            element.style.animation =
                `fadeIn .45s ease ${Math.min(
                    index * 35,
                    500
                )}ms both`;

        }
    );


/* =========================================================
   07. HOVER / POINTER MICRO-INTERACTIONS
   ========================================================= */

document
    .querySelectorAll(
        "button, a, .summary-card, .action-card, .service-row, .module-list > div, .route-options > div"
    )
    .forEach(
        element => {

            element.addEventListener(
                "mouseenter",
                () => {

                    element.classList.add(
                        "is-hovered"
                    );

                }
            );


            element.addEventListener(
                "mouseleave",
                () => {

                    element.classList.remove(
                        "is-hovered"
                    );

                }
            );

        }
    );


/* =========================================================
   POINTER GLOW
   ========================================================= */

const pointerGlow =
    document.createElement("div");


pointerGlow.className =
    "pointer-glow";


document.body.appendChild(
    pointerGlow
);


document.addEventListener(
    "mousemove",
    event => {

        pointerGlow.style.left =
            `${event.clientX}px`;

        pointerGlow.style.top =
            `${event.clientY}px`;

    }
);


/* =========================================================
   08. ROUTE WEATHER
   ========================================================= */


/* ---------------------------------------------------------
   Spring Boot Route Weather API
   --------------------------------------------------------- */

const ROUTE_WEATHER_API =
    "http://localhost:8080/api/weather/route";


/* ---------------------------------------------------------
   Global route weather storage
   --------------------------------------------------------- */

window.routeWeatherData = [];


/* =========================================================
   NORMALIZE ROUTE POINTS
   ========================================================= */

function normalizeRoutePoints(route) {

    /* -----------------------------------------
       Leaflet Polyline
       ----------------------------------------- */

    if (

        route &&

        typeof route.getLatLngs ===
        "function"

    ) {

        return route
            .getLatLngs()
            .map(point => ({

                lat: point.lat,

                lon: point.lng

            }));

    }


    /* -----------------------------------------
       Leaflet layer inside object
       ----------------------------------------- */

    if (

        route &&

        route.layer &&

        typeof route.layer.getLatLngs ===
        "function"

    ) {

        return route
            .layer
            .getLatLngs()
            .map(point => ({

                lat: point.lat,

                lon: point.lng

            }));

    }


    /* -----------------------------------------
       GeoJSON LineString
       ----------------------------------------- */

    if (

        route &&

        route.geometry &&

        Array.isArray(
            route.geometry.coordinates
        )

    ) {

        return route
            .geometry
            .coordinates
            .map(point => ({

                lon: point[0],

                lat: point[1]

            }));

    }


    /* -----------------------------------------
       Normal route points
       ----------------------------------------- */

    const points =

        route?.points ||

        route?.latLngs ||

        route?.coordinates ||

        [];


    return points

        .map(point => {


            /* { lat, lon } */

            if (

                point &&

                typeof point.lat ===
                "number" &&

                typeof point.lon ===
                "number"

            ) {

                return {

                    lat: point.lat,

                    lon: point.lon

                };

            }


            /* { lat, lng } */

            if (

                point &&

                typeof point.lat ===
                "number" &&

                typeof point.lng ===
                "number"

            ) {

                return {

                    lat: point.lat,

                    lon: point.lng

                };

            }


            /* [lat, lon] */

            if (

                Array.isArray(point) &&

                point.length >= 2

            ) {

                return {

                    lat: point[0],

                    lon: point[1]

                };

            }


            return null;

        })

        .filter(
            point => point !== null
        );
}


/* =========================================================
   SAMPLE ROUTE POINTS
   ========================================================= */

function sampleRoutePoints(
    points,
    maxPoints = 5
) {

    if (

        !points ||

        points.length === 0

    ) {

        return [];

    }


    if (

        points.length <= maxPoints

    ) {

        return points;

    }


    const indexes = [

        0,

        Math.floor(
            points.length * 0.25
        ),

        Math.floor(
            points.length * 0.50
        ),

        Math.floor(
            points.length * 0.75
        ),

        points.length - 1

    ];


    return indexes.map(
        index => points[index]
    );
}


/* =========================================================
   LOAD WEATHER FOR ALL ROUTES
   ========================================================= */

async function loadRouteWeather(routes) {

    const resultBox =
        document.getElementById(
            "routeWeatherResults"
        );


    if (!resultBox) {

        console.error(
            "routeWeatherResults element not found."
        );

        return;

    }


    /* -----------------------------------------
       Loading message
       ----------------------------------------- */

    resultBox.innerHTML = `

        <div class="route-weather-empty">

            🌦 Checking weather along all routes...

        </div>

    `;


    try {


        /* -----------------------------------------
           Safety check
           ----------------------------------------- */

        if (

            !Array.isArray(routes) ||

            routes.length === 0

        ) {

            resultBox.innerHTML = `

                <div class="route-weather-empty">

                    ❌ No routes available.

                </div>

            `;

            return;

        }


        /* -----------------------------------------
           Normalize all routes
           ----------------------------------------- */

        const normalizedRoutes =

            routes

                .map(
                    (route, index) => {

                        const points =

                            normalizeRoutePoints(
                                route
                            );


                        return {

                            id:

                                route.id ||

                                `route-${index + 1}`,

                            name:

                                route.name ||

                                `Route ${
                                    String.fromCharCode(
                                        65 + index
                                    )
                                }`,

                            distanceKm:

                                Number(
                                    route.distanceKm ||
                                    route.distance ||
                                    0
                                ),

                            durationMin:

                                Number(
                                    route.durationMin ||
                                    route.duration ||
                                    0
                                ),

                            points:

                                sampleRoutePoints(
                                    points,
                                    5
                                )

                        };

                    }
                )

                .filter(

                    route =>
                        route.points.length > 0

                );


        /* -----------------------------------------
           No coordinates
           ----------------------------------------- */

        if (

            normalizedRoutes.length === 0

        ) {

            resultBox.innerHTML = `

                <div class="route-weather-empty">

                    ❌ No route coordinates available.

                </div>

            `;

            return;

        }


        console.log(
            "Sending routes to weather API:",
            normalizedRoutes
        );


        /* =========================================
           SEND TO SPRING BOOT WEATHER API
           ========================================= */

        const response =

            await fetch(
                ROUTE_WEATHER_API,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            routes:
                            normalizedRoutes

                        })

                }
            );


        if (!response.ok) {

            throw new Error(

                "Route weather API failed: " +

                response.status

            );

        }


        /* -----------------------------------------
           Read response
           ----------------------------------------- */

        const data =
            await response.json();


        /* -----------------------------------------
           Save route weather
           ----------------------------------------- */

        window.routeWeatherData =

            Array.isArray(
                data.routes
            )

                ? data.routes

                : [];


        /* -----------------------------------------
           Render weather
           ----------------------------------------- */

        renderRouteWeather(
            window.routeWeatherData
        );


        /* -----------------------------------------
           IMPORTANT:
           Traffic AFTER normalizedRoutes exists
           ----------------------------------------- */

        await loadRouteTraffic(
            normalizedRoutes
        );
        await loadAISafeRoutePrediction(
            normalizedRoutes
        );
        console.log(
            "Route Weather Data:",
            window.routeWeatherData
        );


    } catch (error) {


        console.error(
            "Route Weather Error:",
            error
        );


        resultBox.innerHTML = `

            <div class="route-weather-empty">

                ❌ Unable to load route weather.

                <br>

                <small>

                    Check Spring Boot weather API
                    and OpenWeather configuration.

                </small>

            </div>

        `;

    }
}


/* =========================================================
   DISPLAY ROUTE WEATHER
   ========================================================= */

function renderRouteWeather(routes) {

    const resultBox =

        document.getElementById(
            "routeWeatherResults"
        );


    if (!resultBox) {

        return;

    }


    resultBox.innerHTML = "";


    /* -----------------------------------------
       No weather data
       ----------------------------------------- */

    if (

        !Array.isArray(routes) ||

        routes.length === 0

    ) {

        resultBox.innerHTML = `

            <div class="route-weather-empty">

                ❌ No route weather data available.

            </div>

        `;

        return;

    }


    /* -----------------------------------------
       Create route card
       ----------------------------------------- */

    routes.forEach(route => {


        const riskLevel =

            (
                route.weatherRiskLevel ||

                "LOW"

            ).toUpperCase();


        const riskClass =
            riskLevel.toLowerCase();


        const weatherPoints =

            Array.isArray(
                route.weatherPoints
            )

                ? route.weatherPoints

                : [];


        /* -----------------------------------------
           Weather HTML
           ----------------------------------------- */

        let weatherHTML = "";


        weatherPoints.forEach(
            (point, index) => {

                const temperature =

                    Number(
                        point.temperature ||
                        0
                    );


                const humidity =

                    Number(
                        point.humidity ||
                        0
                    );


                weatherHTML += `

                    <div class="weather-point">

                        <div>

                            <b>
                                Point ${index + 1}
                            </b>

                            <span>
                                ${
                    point.condition ||
                    "Unknown"
                }
                            </span>

                            <small>
                                ${
                    point.description ||
                    ""
                }
                            </small>

                        </div>


                        <div>

                            <strong>
                                ${temperature.toFixed(1)}°C
                            </strong>

                            <small>
                                Humidity
                                ${humidity}%
                            </small>

                        </div>

                    </div>

                `;

            }
        );


        /* -----------------------------------------
           Create card
           ----------------------------------------- */

        const card =
            document.createElement(
                "div"
            );


        card.className =

            `route-weather-card ${riskClass}`;


        const distance =

            Number(
                route.distanceKm || 0
            );


        const duration =

            Number(
                route.durationMin || 0
            );


        card.innerHTML = `

            <div class="route-weather-header">

                <div>

                    <h3>
                        ${
            route.name ||
            "Route"
        }
                    </h3>

                    <p>

                        ${
            distance > 0
                ? distance.toFixed(1) + " km"
                : "Distance unavailable"
        }

                        •

                        ${
            duration > 0
                ? Math.round(duration) + " min"
                : "Time unavailable"
        }

                    </p>

                </div>


                <strong
                    class="weather-risk-badge"
                >

                    WEATHER
                    ${riskLevel}

                </strong>

            </div>


            <div class="weather-point-list">

                ${
            weatherHTML ||

            `

                        <div class="weather-point">

                            <div>

                                <b>
                                    Weather Data
                                </b>

                                <small>
                                    Weather data unavailable
                                </small>

                            </div>

                        </div>

                    `
        }

            </div>

        `;


        resultBox.appendChild(
            card
        );

    });
}


/* =========================================================
   MAKE FUNCTION AVAILABLE TO map.js
   ========================================================= */

window.loadRouteWeather =
    loadRouteWeather;


/* =========================================================
   09. ROUTE TRAFFIC
   ========================================================= */

const ROUTE_TRAFFIC_API =
    "http://localhost:8080/api/traffic/route";


window.routeTrafficData = [];


/* =========================================================
   LOAD ROUTE TRAFFIC
   ========================================================= */

async function loadRouteTraffic(routes) {

    try {


        if (

            !Array.isArray(routes) ||

            routes.length === 0

        ) {

            return;

        }


        /* -----------------------------------------
           Prepare traffic request
           ----------------------------------------- */

        const trafficRoutes =

            routes.map(
                (route, index) => ({

                    id:

                        route.id ||

                        `route-${index + 1}`,

                    name:

                        route.name ||

                        `Route ${
                            String.fromCharCode(
                                65 + index
                            )
                        }`,

                    distanceKm:

                        Number(
                            route.distanceKm ||
                            0
                        ),

                    durationMin:

                        Number(
                            route.durationMin ||
                            0
                        ),

                    points:

                        sampleRoutePoints(
                            route.points || [],
                            5
                        )

                })
            );


        console.log(
            "Sending routes to traffic API:",
            trafficRoutes
        );


        /* -----------------------------------------
           Send to Spring Boot
           ----------------------------------------- */

        const response =

            await fetch(
                ROUTE_TRAFFIC_API,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:

                        JSON.stringify({

                            routes:
                            trafficRoutes

                        })

                }
            );


        if (!response.ok) {

            throw new Error(

                "Traffic API failed: " +

                response.status

            );

        }


        /* -----------------------------------------
           Read response
           ----------------------------------------- */

        const data =
            await response.json();


        /* -----------------------------------------
           Save traffic data
           ----------------------------------------- */

        window.routeTrafficData =

            Array.isArray(
                data.routes
            )

                ? data.routes

                : [];


        console.log(
            "Route Traffic Data:",
            window.routeTrafficData
        );


        /* -----------------------------------------
           Render route traffic info
           ----------------------------------------- */

        renderRouteTraffic(
            window.routeTrafficData
        );


    } catch (error) {


        console.error(
            "Route Traffic Error:",
            error
        );


    }
}


/* =========================================================
   DISPLAY ROUTE TRAFFIC
   ========================================================= */

function renderRouteTraffic(routes) {

    const resultBox =

        document.getElementById(
            "routeWeatherResults"
        );


    if (!resultBox) {

        return;

    }


    if (

        !Array.isArray(routes)

    ) {

        return;

    }


    routes.forEach(route => {


        const trafficBox =

            document.createElement(
                "div"
            );


        trafficBox.className =
            "weather-point";


        const congestion =

            Number(
                route.trafficCongestionPercent ||
                0
            );


        const currentSpeed =

            Number(
                route.averageCurrentSpeed ||
                0
            );


        const freeFlowSpeed =

            Number(
                route.averageFreeFlowSpeed ||
                0
            );


        const riskLevel =

            (
                route.trafficRiskLevel ||
                "LOW"
            ).toUpperCase();


        trafficBox.innerHTML = `

            <div>

                <b>
                    🚦 Live Traffic
                </b>

                <span>
                    ${riskLevel}
                </span>

                <small>

                    Congestion:
                    ${congestion.toFixed(0)}%

                </small>

            </div>


            <div>

                <strong>

                    ${currentSpeed.toFixed(0)}
                    km/h

                </strong>

                <small>

                    Free Flow:
                    ${freeFlowSpeed.toFixed(0)}
                    km/h

                </small>

            </div>

        `;


        /* -----------------------------------------
           Find matching route card
           ----------------------------------------- */

        const cards =

            resultBox.querySelectorAll(
                ".route-weather-card"
            );


        cards.forEach(card => {


            const heading =

                card.querySelector(
                    ".route-weather-header h3"
                );


            if (

                heading &&

                heading.textContent.trim() ===
                route.name

            ) {


                const pointList =

                    card.querySelector(
                        ".weather-point-list"
                    );


                if (pointList) {

                    pointList.appendChild(
                        trafficBox
                    );

                }

            }

        });

    });
}


window.loadRouteTraffic =
    loadRouteTraffic;


/* =========================================================
   10. TRAFFIC BUTTON
   ========================================================= */

/*
   IMPORTANT:

   Actual Leaflet + TomTom traffic layer
   map.js handle karega.

   app.js sirf button ko control karega
   aur map.js ke global function:

       window.toggleTrafficLayer()

   ko call karega.
*/

const trafficToggleBtn =
    document.getElementById(
        "trafficToggleBtn"
    );


if (trafficToggleBtn) {


    trafficToggleBtn.addEventListener(
        "click",
        async function () {


            const enableTraffic =

                !this.classList.contains(
                    "selected"
                );


            try {


                /* ---------------------------------
                   Check map.js function
                   --------------------------------- */

                if (

                    typeof
                        window.toggleTrafficLayer !==
                    "function"

                ) {

                    console.error(
                        "toggleTrafficLayer() not found. Check map.js."
                    );


                    showToast(
                        "Traffic map control not connected"
                    );


                    return;

                }


                /* ---------------------------------
                   Call map.js
                   --------------------------------- */

                await window.toggleTrafficLayer(
                    enableTraffic
                );


                /* ---------------------------------
                   Update button
                   --------------------------------- */

                this.classList.toggle(
                    "selected",
                    enableTraffic
                );


                this.setAttribute(
                    "aria-pressed",
                    String(enableTraffic)
                );


                /* ---------------------------------
                   Toast
                   --------------------------------- */

                showToast(

                    enableTraffic

                        ? "Live traffic enabled"

                        : "Live traffic hidden"

                );


            } catch (error) {


                console.error(
                    "Traffic button error:",
                    error
                );


                showToast(
                    "Unable to load live traffic"
                );


            }

        }
    );

}
// ============================================================
// AI SAFE ROUTE PREDICTION
// ============================================================

const SAFE_ROUTE_AI_API =
    "http://localhost:8080/api/ai/safe-route";


async function loadAISafeRoutePrediction(
    routes
) {

    try {

        if (
            !Array.isArray(routes) ||
            routes.length === 0
        ) {

            return;

        }


        // ====================================================
        // CURRENT TIME
        // ====================================================

        const now =
            new Date();


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
            dayNames[
                now.getDay()
                ];


        const isWeekend =
            (
                now.getDay() === 0 ||
                now.getDay() === 6
            )
                ? 1
                : 0;


        const isPeakHour =
            (
                hour >= 8 &&
                hour <= 10
            ) ||
            (
                hour >= 17 &&
                hour <= 20
            )
                ? 1
                : 0;


        // ====================================================
        // BUILD AI INPUT FOR EACH ROUTE
        // ====================================================

        const aiRoutes =
            routes.map(
                function (
                    route,
                    index
                ) {

                    const points =
                        Array.isArray(
                            route.points
                        )
                            ? route.points
                            : [];


                    // ----------------------------------------
                    // Use route midpoint
                    // ----------------------------------------

                    const middleIndex =
                        points.length > 0
                            ? Math.floor(
                                points.length / 2
                            )
                            : 0;


                    const middlePoint =
                        points.length > 0
                            ? points[middleIndex]
                            : null;


                    const latitude =
                        Number(
                            middlePoint?.lat ||
                            points[0]?.lat ||
                            0
                        );


                    const longitude =
                        Number(
                            middlePoint?.lon ||
                            points[0]?.lon ||
                            0
                        );


                    // =================================================
                    // WEATHER DATA
                    // =================================================

                    const weatherRoute =
                        Array.isArray(
                            window.routeWeatherData
                        )
                            ? window.routeWeatherData.find(
                                item =>
                                    item.name ===
                                    route.name
                            )
                            : null;


                    const weatherPoints =
                        weatherRoute &&
                        Array.isArray(
                            weatherRoute.weatherPoints
                        )
                            ? weatherRoute.weatherPoints
                            : [];


                    const firstWeather =
                        weatherPoints[0] ||
                        {};


                    const weather =
                        firstWeather.condition ||
                        "Clear";


                    const temperature =
                        Number(
                            firstWeather.temperature ||
                            25
                        );


                    const visibility =
                        firstWeather.visibility ||
                        "Good";


                    // =================================================
                    // TRAFFIC DATA
                    // =================================================

                    const trafficRoute =
                        Array.isArray(
                            window.routeTrafficData
                        )
                            ? window.routeTrafficData.find(
                                item =>
                                    item.name ===
                                    route.name
                            )
                            : null;


                    const congestion =
                        Number(
                            trafficRoute?.trafficCongestionPercent ||
                            0
                        );


                    let trafficDensity =
                        "Low";


                    if (
                        congestion >= 70
                    ) {

                        trafficDensity =
                            "High";

                    } else if (
                        congestion >= 40
                    ) {

                        trafficDensity =
                            "Medium";

                    }


                    // =================================================
                    // MODEL FEATURES
                    // =================================================

                    return {

                        id:
                            route.id ||
                            `route-${index + 1}`,

                        name:
                            route.name ||
                            `Route ${
                                String.fromCharCode(
                                    65 + index
                                )
                            }`,

                        distanceKm:
                            Number(
                                route.distanceKm ||
                                0
                            ),

                        durationMin:
                            Number(
                                route.durationMin ||
                                0
                            ),


                        features: {

                            city:
                                "Unknown",

                            state:
                                "Unknown",

                            latitude:
                            latitude,

                            longitude:
                            longitude,

                            hour:
                            hour,

                            day_of_week:
                            dayOfWeek,

                            is_weekend:
                            isWeekend,

                            road_type:
                                "Unknown",

                            lanes:
                                2,

                            traffic_signal:
                                "Unknown",

                            weather:
                            weather,

                            visibility:
                            visibility,

                            temperature:
                            temperature,

                            traffic_density:
                            trafficDensity,

                            is_peak_hour:
                            isPeakHour,

                            festival:
                                "No"
                        }
                    };

                }
            );


        console.log(
            "AI Safe Route Input:",
            aiRoutes
        );


        // ====================================================
        // SEND TO SPRING BOOT
        // ====================================================

        const response =
            await fetch(
                SAFE_ROUTE_AI_API,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            routes:
                            aiRoutes
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Safe Route AI API failed: " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "AI Safe Route Result:",
            result
        );


        // Save globally

        window.aiSafeRouteData =
            result;


        // Display AI results

        renderAISafeRouteResult(
            result
        );


    } catch (error) {

        console.error(
            "AI Safe Route Error:",
            error
        );

    }
}
// ============================================================
// DISPLAY AI SAFE ROUTE RESULT
// ============================================================

function renderAISafeRouteResult(
    result
) {

    const resultBox =
        document.getElementById(
            "routeWeatherResults"
        );


    if (
        !resultBox ||
        !result ||
        !Array.isArray(result.routes)
    ) {

        return;

    }


    result.routes.forEach(
        function (route) {

            const cards =
                resultBox.querySelectorAll(
                    ".route-weather-card"
                );


            cards.forEach(
                function (card) {

                    const heading =
                        card.querySelector(
                            ".route-weather-header h3"
                        );


                    if (
                        !heading ||
                        heading.textContent.trim() !==
                        route.name
                    ) {

                        return;

                    }


                    // Remove old AI box

                    const oldBox =
                        card.querySelector(
                            ".ai-route-risk"
                        );


                    if (oldBox) {

                        oldBox.remove();

                    }


                    const aiBox =
                        document.createElement(
                            "div"
                        );


                    aiBox.className =
                        "ai-route-risk";


                    const isRecommended =
                        result.recommendedRouteId ===
                        route.id;


                    aiBox.innerHTML = `

                        <div>

                            <strong>
                                🤖 AI RISK
                            </strong>

                            <span>
                                ${route.riskLevel}
                            </span>

                        </div>

                        <div>

                            <b>
                                ${route.riskPercentage}%
                            </b>

                            <small>
                                Risk Score:
                                ${route.riskScore}
                            </small>

                        </div>

                        ${
                        isRecommended
                            ? `
                                <div
                                    class="ai-recommended"
                                >
                                    ✓ SAFER ROUTE
                                </div>
                                `
                            : ""
                    }

                    `;


                    card.appendChild(
                        aiBox
                    );

                }
            );

        }
    );


    console.log(
        "Recommended AI route:",
        result.recommendedRouteName
    );
}