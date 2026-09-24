document.getElementById("riskForm").addEventListener("submit", async function (event) {

    event.preventDefault();

    const data = {
        vehicleType: document.getElementById("vehicleType").value,
        ageGroup: document.getElementById("ageGroup").value,
        experience: document.getElementById("experience").value,
        roadCondition: document.getElementById("roadCondition").value,
        traffic: document.getElementById("traffic").value,
        weather: document.getElementById("weather").value
    };

    console.log("Sending data:", data);

    try {

        const response = await fetch(
            "http://localhost:8080/api/ai/predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        console.log("Backend response:", result);

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Prediction failed"
            );
        }

        document.getElementById("resultBox")
            .classList.remove("hidden");

        document.getElementById("riskLevel")
            .textContent = result.predicted_risk || "UNKNOWN";

        const probabilities = result.probabilities || {};

        document.getElementById("highProbability")
            .textContent = (probabilities.High || 0) + "%";

        document.getElementById("mediumProbability")
            .textContent = (probabilities.Medium || 0) + "%";

        document.getElementById("lowProbability")
            .textContent = (probabilities.Low || 0) + "%";

        document.getElementById("riskMessage")
            .textContent = "AI prediction received successfully.";

    } catch (error) {

        console.error("Prediction Error:", error);

        alert("Prediction failed: " + error.message);
    }
});