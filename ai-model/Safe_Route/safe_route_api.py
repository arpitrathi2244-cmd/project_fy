from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

from accident_history import load_accident_history, route_history_risk

app = Flask(__name__)
CORS(app)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SAFE_MODEL_PATH = os.path.join(BASE_DIR, "safe_route_model.joblib")
ACCIDENT_MODEL_PATH = os.path.join(BASE_DIR, "..", "Accident_Risk", "accident_risk_model.joblib")
HISTORY_CSV_PATH = os.path.join(BASE_DIR, "..", "dataset", "india_accident_history_2022_2023.csv")

for required_path, label in [
    (SAFE_MODEL_PATH, "Safe-route model"),
    (ACCIDENT_MODEL_PATH, "Accident-risk model"),
    (HISTORY_CSV_PATH, "Accident history CSV"),
]:
    if not os.path.exists(required_path):
        raise FileNotFoundError(f"{label} not found: {required_path}")

safe_package = joblib.load(SAFE_MODEL_PATH)
safe_model = safe_package["pipeline"]
safe_features = safe_package["features"]

accident_package = joblib.load(ACCIDENT_MODEL_PATH)
accident_model = accident_package["pipeline"]
accident_features = accident_package["features"]

accident_history_df = load_accident_history(HISTORY_CSV_PATH)

print("Integrated Safe Route AI Loaded")
print("Safe-route features:", safe_features)
print("Accident AI features:", accident_features)
print("Historical accident points:", len(accident_history_df))


def safe_float(value, default=0.0):
    try:
        value = float(value)
        return value if np.isfinite(value) else float(default)
    except (TypeError, ValueError):
        return float(default)


def safe_int(value, default=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return int(default)


def build_safe_row(route_features, latitude=None, longitude=None):
    f = route_features if isinstance(route_features, dict) else {}
    return {
        "city": f.get("city", "Unknown"),
        "state": f.get("state", "Unknown"),
        "latitude": safe_float(latitude if latitude is not None else f.get("latitude", 0), 0),
        "longitude": safe_float(longitude if longitude is not None else f.get("longitude", 0), 0),
        "hour": safe_int(f.get("hour", 12), 12),
        "day_of_week": f.get("day_of_week", "Unknown"),
        "is_weekend": safe_int(f.get("is_weekend", 0), 0),
        "road_type": f.get("road_type", "Unknown"),
        "lanes": safe_int(f.get("lanes", 2), 2),
        "traffic_signal": f.get("traffic_signal", "Unknown"),
        "weather": f.get("weather", "Clear"),
        "visibility": f.get("visibility", "Good"),
        "temperature": safe_float(f.get("temperature", 25), 25),
        "traffic_density": f.get("traffic_density", "Low"),
        "is_peak_hour": safe_int(f.get("is_peak_hour", 0), 0),
        "festival": f.get("festival", "No"),
    }


def normalize_coordinates(route):
    coords = route.get("coordinates", []) if isinstance(route, dict) else []
    normalized = []
    if isinstance(coords, list):
        for point in coords:
            if isinstance(point, (list, tuple)) and len(point) >= 2:
                lon = safe_float(point[0], np.nan)
                lat = safe_float(point[1], np.nan)
            elif isinstance(point, dict):
                lon = safe_float(point.get("lon", point.get("lng")), np.nan)
                lat = safe_float(point.get("lat"), np.nan)
            else:
                continue
            if np.isfinite(lon) and np.isfinite(lat):
                normalized.append([lon, lat])
    return normalized


def sample_coords(coords, max_points=9):
    if not coords:
        return []
    if len(coords) <= max_points:
        return coords
    idxs = np.linspace(0, len(coords) - 1, max_points, dtype=int).tolist()
    return [coords[i] for i in idxs]


def predict_safe_segments(route_features, coordinates):
    sampled = sample_coords(coordinates, max_points=9)
    rows = []
    for lon, lat in sampled:
        rows.append(build_safe_row(route_features, latitude=lat, longitude=lon))

    # Fallback to the route-level row when geometry is unavailable.
    if not rows:
        rows = [build_safe_row(route_features)]

    df = pd.DataFrame(rows, columns=safe_features)
    predictions = np.clip(np.asarray(safe_model.predict(df), dtype=float), 0, 1)

    average_score = float(np.mean(predictions))
    max_score = float(np.max(predictions))
    # Risk score reflects the route overall while retaining the highest-risk segment.
    combined = float(np.clip(0.75 * average_score + 0.25 * max_score, 0, 1))

    return combined, average_score, max_score, len(predictions)


def condition_score(condition):
    value = str(condition or "").strip().lower()
    return {
        "thunderstorm": 1.00,
        "snow": 0.90,
        "rain": 0.70,
        "drizzle": 0.70,
        "mist": 0.60,
        "smoke": 0.60,
        "haze": 0.60,
        "fog": 0.60,
        "dust": 0.60,
        "sand": 0.60,
        "ash": 0.60,
        "squall": 0.60,
        "tornado": 0.60,
        "clouds": 0.20,
    }.get(value, 0.0)


def live_weather_risk(route):
    points = route.get("weatherPoints", []) if isinstance(route, dict) else []
    if not isinstance(points, list) or not points:
        return 0.0, 0

    scores = []
    for point in points:
        if not isinstance(point, dict):
            continue
        score = condition_score(point.get("condition"))
        rain_1h = safe_float(point.get("rain1h", 0), 0)
        if rain_1h > 0:
            score = max(score, min(rain_1h / 10.0, 1.0))
        visibility = str(point.get("visibility", "")).lower()
        if visibility in {"low", "poor", "very low", "fog"}:
            score = max(score, 0.60)
        scores.append(score)

    if not scores:
        return 0.0, 0
    # Weather risk is driven by the worst sampled condition, matching the route-weather logic.
    return float(np.clip(max(np.mean(scores), max(scores)), 0, 1)), len(scores)


def live_traffic_risk(route):
    points = route.get("trafficPoints", []) if isinstance(route, dict) else []
    scores = []
    closures = 0

    if isinstance(points, list):
        for point in points:
            if not isinstance(point, dict):
                continue
            congestion = safe_float(point.get("congestionPercent", 0), 0)
            scores.append(np.clip(congestion / 100.0, 0, 1))
            if bool(point.get("roadClosure", False)):
                closures += 1

    # Fallback to route-level summary if traffic points were not retained by the browser.
    if not scores:
        congestion = safe_float(route.get("trafficCongestionPercent", 0), 0)
        scores = [np.clip(congestion / 100.0, 0, 1)]

    risk = max(float(np.mean(scores)), float(np.max(scores))) if scores else 0.0
    if closures > 0:
        risk = 1.0
    return float(np.clip(risk, 0, 1)), len(scores), closures


def predict_accident_pattern(route_features):
    supplied = route_features.get("accident_model_features") if isinstance(route_features, dict) else None
    if not isinstance(supplied, dict):
        return None

    missing = [f for f in accident_features if f not in supplied]
    if missing:
        return None

    row = {feature: supplied.get(feature) for feature in accident_features}
    df = pd.DataFrame([row], columns=accident_features)
    if "Number_of_vehicles_involved" in df.columns:
        df["Number_of_vehicles_involved"] = pd.to_numeric(
            df["Number_of_vehicles_involved"], errors="coerce"
        )

    probabilities = accident_model.predict_proba(df)[0]
    classes = list(accident_model.classes_)
    probability_map = {str(cls): float(prob) for cls, prob in zip(classes, probabilities)}
    numeric = (
        0.10 * probability_map.get("Low", 0.0)
        + 0.50 * probability_map.get("Medium", 0.0)
        + 0.90 * probability_map.get("High", 0.0)
    )
    label = max(probability_map, key=probability_map.get)
    return {
        "patternRiskScore": round(float(numeric), 4),
        "patternRiskLevel": label,
        "classProbabilities": {k: round(v, 4) for k, v in probability_map.items()},
    }


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Integrated Safe Route AI API is running",
        "status": "success",
        "historicalAccidentPoints": int(len(accident_history_df)),
    })


@app.route("/predict-safe-route", methods=["POST"])
def predict_safe_route():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "JSON input is required"}), 400

        routes = data.get("routes")
        if not isinstance(routes, list) or not routes:
            return jsonify({"error": "routes must be a non-empty array"}), 400

        radius_km = safe_float(data.get("accidentRadiusKm", 1.0), 1.0)
        radius_km = float(np.clip(radius_km, 0.1, 5.0))
        results = []

        for index, route in enumerate(routes):
            if not isinstance(route, dict):
                continue

            route_id = route.get("id", f"route-{index + 1}")
            route_name = route.get("name", f"Route {index + 1}")
            route_features = route.get("features", {})
            if not isinstance(route_features, dict):
                route_features = {}

            coordinates = normalize_coordinates(route)
            ai_score, ai_average, ai_max, segment_count = predict_safe_segments(
                route_features,
                coordinates,
            )

            history = route_history_risk(
                coordinates,
                accident_history_df,
                radius_km=radius_km,
            )

            weather_risk, weather_count = live_weather_risk(route)
            traffic_risk, traffic_count, closure_count = live_traffic_risk(route)
            pattern = predict_accident_pattern(route_features)

            history_risk = float(history["historyRiskScore"])

            # Integration score: trained AI + defensible historical proximity +
            # live weather + live traffic. No model retraining or fabricated road data.
            if pattern is None:
                final_score = (
                    0.50 * ai_score
                    + 0.20 * history_risk
                    + 0.15 * weather_risk
                    + 0.15 * traffic_risk
                )
            else:
                final_score = (
                    0.40 * ai_score
                    + 0.15 * pattern["patternRiskScore"]
                    + 0.20 * history_risk
                    + 0.125 * weather_risk
                    + 0.125 * traffic_risk
                )

            final_score = float(np.clip(final_score, 0, 1))
            if final_score < 0.33:
                level = "LOW"
            elif final_score < 0.66:
                level = "MEDIUM"
            else:
                level = "HIGH"

            results.append({
                "id": route_id,
                "name": route_name,
                "distanceKm": route.get("distanceKm", 0),
                "durationMin": route.get("durationMin", 0),
                "aiRiskScore": round(ai_score, 4),
                "aiRiskPercentage": round(ai_score * 100, 2),
                "aiAverageSegmentRisk": round(ai_average, 4),
                "aiMaximumSegmentRisk": round(ai_max, 4),
                "aiSegmentCount": int(segment_count),
                "historicalAccidentRiskScore": history_risk,
                "historicalAccidentRiskPercentage": round(history_risk * 100, 2),
                "nearbyAccidentCount": history["nearbyAccidentCount"],
                "closestAccidentDistanceKm": history["closestAccidentDistanceKm"],
                "historicalRiskLevel": history["historicalRiskLevel"],
                "liveWeatherRiskScore": round(weather_risk, 4),
                "liveWeatherRiskPercentage": round(weather_risk * 100, 2),
                "liveWeatherPointCount": int(weather_count),
                "liveTrafficRiskScore": round(traffic_risk, 4),
                "liveTrafficRiskPercentage": round(traffic_risk * 100, 2),
                "liveTrafficPointCount": int(traffic_count),
                "roadClosureCount": int(closure_count),
                "accidentPatternAI": pattern,
                "finalRiskScore": round(final_score, 4),
                "finalRiskPercentage": round(final_score * 100, 2),
                "finalRiskLevel": level,
            })

        if not results:
            return jsonify({"error": "No valid routes were provided"}), 400

        safest = min(results, key=lambda x: x["finalRiskScore"])

        return jsonify({
            "status": "success",
            "accidentHistory": {
                "points": int(len(accident_history_df)),
                "coverageNote": "Media-reported fatal crashes; absence of a nearby point does not prove a road is safe.",
                "searchRadiusKm": radius_km,
            },
            "routes": results,
            "recommendedRouteId": safest["id"],
            "recommendedRouteName": safest["name"],
            "message": "All supplied routes evaluated using trained Safe Route AI, historical accident proximity, live weather and live traffic",
        })

    except Exception as error:
        print("Integrated Safe Route AI Error:", error)
        return jsonify({"status": "error", "error": str(error)}), 500


if __name__ == "__main__":
    print("Integrated Safe Route AI API running on http://127.0.0.1:5001")
    app.run(host="127.0.0.1", port=5001, debug=True)
