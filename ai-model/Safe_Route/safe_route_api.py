from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "safe_route_model.joblib"
)


# ============================================================
# LOAD TRAINED SAFE ROUTE MODEL
# ============================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        "safe_route_model.joblib not found."
    )


package = joblib.load(MODEL_PATH)

# Trained pipeline
model = package["pipeline"]

# Exact feature order used during training
features = package["features"]


print("Safe Route AI Model Loaded")
print("Features:", features)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Safe Route AI API is running",
        "status": "success"
    })


# ============================================================
# SAFE ROUTE PREDICTION
# ============================================================

@app.route(
    "/predict-safe-route",
    methods=["POST"]
)
def predict_safe_route():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "error": "JSON input is required"
            }), 400


        routes = data.get("routes")


        if not isinstance(routes, list):
            return jsonify({
                "error": "routes must be an array"
            }), 400


        if len(routes) == 0:
            return jsonify({
                "error": "No routes provided"
            }), 400


        predictions = []


        # ====================================================
        # PROCESS EVERY ROUTE
        # ====================================================

        for index, route in enumerate(routes):

            if not isinstance(route, dict):
                continue


            route_id = route.get(
                "id",
                f"route-{index + 1}"
            )

            route_name = route.get(
                "name",
                f"Route {chr(65 + index)}"
            )


            route_features = route.get(
                "features",
                {}
            )


            if not isinstance(route_features, dict):
                route_features = {}


            # ------------------------------------------------
            # REQUIRED MODEL FEATURES
            # ------------------------------------------------

            input_data = {

                "city":
                    route_features.get(
                        "city",
                        "Unknown"
                    ),

                "state":
                    route_features.get(
                        "state",
                        "Unknown"
                    ),

                "latitude":
                    float(
                        route_features.get(
                            "latitude",
                            0
                        )
                    ),

                "longitude":
                    float(
                        route_features.get(
                            "longitude",
                            0
                        )
                    ),

                "hour":
                    int(
                        route_features.get(
                            "hour",
                            12
                        )
                    ),

                "day_of_week":
                    route_features.get(
                        "day_of_week",
                        "Unknown"
                    ),

                "is_weekend":
                    int(
                        route_features.get(
                            "is_weekend",
                            0
                        )
                    ),

                "road_type":
                    route_features.get(
                        "road_type",
                        "Unknown"
                    ),

                "lanes":
                    int(
                        route_features.get(
                            "lanes",
                            2
                        )
                    ),

                "traffic_signal":
                    route_features.get(
                        "traffic_signal",
                        "Unknown"
                    ),

                "weather":
                    route_features.get(
                        "weather",
                        "Clear"
                    ),

                "visibility":
                    route_features.get(
                        "visibility",
                        "Good"
                    ),

                "temperature":
                    float(
                        route_features.get(
                            "temperature",
                            25
                        )
                    ),

                "traffic_density":
                    route_features.get(
                        "traffic_density",
                        "Low"
                    ),

                "is_peak_hour":
                    int(
                        route_features.get(
                            "is_peak_hour",
                            0
                        )
                    ),

                "festival":
                    route_features.get(
                        "festival",
                        "No"
                    )
            }


            # ------------------------------------------------
            # KEEP EXACT MODEL FEATURE ORDER
            # ------------------------------------------------

            input_df = pd.DataFrame(
                [input_data],
                columns=features
            )


            # ------------------------------------------------
            # AI PREDICTION
            # ------------------------------------------------

            prediction = float(
                model.predict(input_df)[0]
            )


            # Keep prediction between 0 and 1
            prediction = float(
                np.clip(
                    prediction,
                    0,
                    1
                )
            )


            # Convert to percentage
            risk_percentage = prediction * 100


            # ------------------------------------------------
            # RISK LEVEL
            # ------------------------------------------------

            if prediction < 0.33:

                risk_level = "LOW"

            elif prediction < 0.66:

                risk_level = "MEDIUM"

            else:

                risk_level = "HIGH"


            # ------------------------------------------------
            # STORE RESULT
            # ------------------------------------------------

            predictions.append({

                "id":
                    route_id,

                "name":
                    route_name,

                "distanceKm":
                    route.get(
                        "distanceKm",
                        0
                    ),

                "durationMin":
                    route.get(
                        "durationMin",
                        0
                    ),

                "riskScore":
                    round(
                        prediction,
                        4
                    ),

                "riskPercentage":
                    round(
                        risk_percentage,
                        2
                    ),

                "riskLevel":
                    risk_level
            })


        # ====================================================
        # CHECK PREDICTIONS
        # ====================================================

        if len(predictions) == 0:

            return jsonify({
                "error": "No valid routes were provided"
            }), 400


        # ====================================================
        # FIND LOWEST AI RISK
        # ====================================================

        safest_route = min(
            predictions,
            key=lambda x: x["riskScore"]
        )


        # ====================================================
        # FINAL RESPONSE
        # ====================================================

        return jsonify({

            "status":
                "success",

            "routes":
                predictions,

            "recommendedRouteId":
                safest_route["id"],

            "recommendedRouteName":
                safest_route["name"],

            "message":
                "AI route risk prediction completed"

        })


    except Exception as error:

        print(
            "Safe Route AI Error:",
            error
        )

        return jsonify({

            "status":
                "error",

            "error":
                str(error)

        }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print(
        "Safe Route AI API running on:"
    )

    print(
        "http://127.0.0.1:5001"
    )

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )