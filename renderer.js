
let travelPlans = JSON.parse(
    localStorage.getItem("jomjalanPlans")
) || [];

let currentWeatherCondition = "";
let currentRecommendations = [];
let currentWeatherDestination = "";
let editingPlanId = null;

function showPage(pageName) {
    const explorePage = document.getElementById("explore");
    const plansPage = document.getElementById("plans");

    explorePage.hidden = true;
    plansPage.hidden = true;

    if (pageName === "explore") {
        explorePage.hidden = false;

    } else if (pageName === "plans") {
        plansPage.hidden = false;

        // Display saved travel plans
        displayTravelPlans();
    }
}

async function showDestination() {
    const city = document.getElementById("country").value;
    currentWeatherDestination = city;
    currentWeatherCondition = "";
    currentRecommendations = [];
    const message = document.getElementById("destinationMessage");
    const weatherResult = document.getElementById("weatherResult");

    message.textContent = "Loading weather information...";
    weatherResult.textContent = "";

    try {
        const geoURL =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(city) +
            "&count=1&language=en&format=json";

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Could not search for the destination.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Destination not found.");
        }

        const location = geoData.results[0];
        const latitude = location.latitude;
        const longitude = location.longitude;


        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + latitude +
            "&longitude=" + longitude +
            "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
            "&forecast_days=7" +
            "&timezone=auto";

        const weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Could not retrieve weather information.");
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;
        const daily = weatherData.daily;

        const code = current.weather_code;
        let condition;

        if (code === 0) {
            condition = "Clear sky";
        } else if (code <= 3) {
            condition = "Cloudy";
        } else if (code <= 48) {
            condition = "Foggy";
        } else if (code <= 67) {
            condition = "Rainy";
        } else if (code <= 77) {
            condition = "Snowy";
        } else if (code <= 82) {
            condition = "Rain showers";
        } else if (code <= 86) {
            condition = "Snow showers";
        } else if (code >= 95) {
            condition = "Thunderstorm";
        } else {
            condition = "Mixed weather conditions";
        }

        message.textContent =
            "Weather in " + location.name + ", " + location.country;

        weatherResult.innerHTML = `
            <h3>Current Weather</h3>
            <p>Condition: ${condition}</p>
            <p>Temperature: ${current.temperature_2m} °C</p>
            <p>Humidity: ${current.relative_humidity_2m}%</p>
            <p>Wind Speed: ${current.wind_speed_10m} km/h</p>
        `;
        currentWeatherCondition = condition;
        showSuggestions(city,condition);

        const forecastResult =
            document.getElementById("forecastResult");

        forecastResult.innerHTML = "<h3>7-Day Weather Forecast</h3>";

        for (let i = 0; i < daily.time.length; i++) {

            const date = daily.time[i];

            const maxTemp = daily.temperature_2m_max[i];
            const minTemp = daily.temperature_2m_min[i];

            const rainChance =
                daily.precipitation_probability_max[i];

            forecastResult.innerHTML += `
                <div class="forecastCard">
                    <h4>${date}</h4>
                    <p>Maximum: ${maxTemp} °C</p>
                    <p>Minimum: ${minTemp} °C</p>
                    <p>Rain Probability: ${rainChance}%</p>
                </div>
    `;
}

        

    } catch (error) {
        message.textContent = "Unable to load destination weather.";
        weatherResult.textContent = error.message;
    }
}

function showSuggestions(city, condition) {
    const suggestionArea =
        document.getElementById("activitySuggestions");

    let activities = [];

    if (condition === "Clear sky") {
        activities = [
            "Scenic Road Trips",
            "Hiking and nature walks",
            "Architecture Photography"
        ];

    } else if (condition === "Cloudy") {
        activities = [
            "City tours",
            "Shopping districts",
            "Cafe hopping"
        ];

    } else if (condition === "Rainy" ||
               condition === "Rain showers") {
        activities = [
            "Visit museums",
            "Book a spa",
            "Shopping malls"
        ];

    } else if (condition === "Snowy" ||
               condition === "Snow showers") {
        activities = [
            "skiing and snowboarding",
            "snowshoeing",
            "winter hiking"
        ];

    } else if (condition === "Thunderstorm") {
        activities = [
            "Bowling",
            "Explore restaurants",
            "Relax at your hotel"
        ];

    } else {
        activities = [
            "Visit local attractions",
            "Explore famous restaurants"
        ];
    }

    if (city === "Tokyo") {
        activities.push("Explore Japanese temples");

    } else if (city === "Kuala Lumpur") {
        activities.push("Visit the city's famous landmarks");

    } else if (city === "Seoul") {
        activities.push("Explore Korean cultural districts");

    } else if (city === "Bangkok") {
        activities.push("Visit Thai temples and markets");
    }

    currentRecommendations = activities.slice();
    suggestionArea.innerHTML = "<h3>Recommended Activities</h3>";

    activities.forEach(function(activity) {
        suggestionArea.innerHTML +=
            "<p> " + activity + "</p>";
    });
}

function calculateBudget() {

    const days = Number(document.getElementById("days").value);
    const accommodation = Number(document.getElementById("accommodation").value);
    const food = Number(document.getElementById("food").value);
    const transport = Number(document.getElementById("transport").value);

    const result = document.getElementById("budgetResult");

    if (
        document.getElementById("days").value === "" ||
        document.getElementById("accommodation").value === "" ||
        document.getElementById("food").value === "" ||
        document.getElementById("transport").value === ""
    ) {
        result.textContent = "Please fill in all fields.";
        return;
    }

    if (
        !Number.isFinite(days) ||
        !Number.isFinite(accommodation) ||
        !Number.isFinite(food) ||
        !Number.isFinite(transport) ||
        days <= 0 ||
        !Number.isInteger(days) ||
        accommodation < 0 ||
        food < 0 ||
        transport < 0
    ) {
        result.textContent = "Please enter valid positive values.";
        return;
    }

    const accommodationTotal = days * accommodation;
    const foodTotal = days * food;

    const totalBudget =
        accommodationTotal + foodTotal + transport;

    result.innerHTML = `
        <h3>Estimated Travel Budget</h3>
        <p>Accommodation: RM${accommodationTotal.toFixed(2)}</p>
        <p>Food: RM${foodTotal.toFixed(2)}</p>
        <p>Transportation: RM${transport.toFixed(2)}</p>
        <h3>Total: RM${totalBudget.toFixed(2)}</h3>
    `;
}

function saveTravelPlan() {
    
    const destination =
        document.getElementById("planDestination").value.trim();

    const days =
        Number(document.getElementById("planDays").value);

    const accommodation =
        Number(document.getElementById("planAccommodation").value);

    const food =
        Number(document.getElementById("planFood").value);

    const transport =
        Number(document.getElementById("planTransport").value);

    const message = document.getElementById("planMessage");


    if (
        destination === "" ||
        document.getElementById("planDays").value === "" ||
        document.getElementById("planAccommodation").value === "" ||
        document.getElementById("planFood").value === "" ||
        document.getElementById("planTransport").value === ""
    ) {
        message.textContent = "Please fill in all fields.";
        return;
    }

    if (
        !Number.isInteger(days) ||
        days <= 0 ||
        accommodation < 0 ||
        food < 0 ||
        transport < 0 ||
        !Number.isFinite(accommodation) ||
        !Number.isFinite(food) ||
        !Number.isFinite(transport)
    ) {
        message.textContent = "Please enter valid values.";
        return;
    }


    const totalBudget =
        (days * accommodation) +
        (days * food) +
        transport;

    const newPlan = {
        id: Date.now(),
        destination: destination,
        days: days,
        accommodation: accommodation,
        food: food,
        transport: transport,
        totalBudget: totalBudget,
        weather:
            currentWeatherDestination === destination
            ? currentWeatherCondition
            : "Not checked",

        recommendations:
            currentWeatherDestination === destination
            ? [...currentRecommendations]
            : []
    };
    if (editingPlanId !== null) {

       const index = travelPlans.findIndex(function(plan) {
          return plan.id === editingPlanId;
       });

       if (index !== -1) {
          travelPlans[index] = newPlan;
       }

       message.textContent = "Travel plan updated successfully!";
       editingPlanId = null;

    } else {
       travelPlans.push(newPlan);
       message.textContent = "Travel plan saved successfully!";
    }


    localStorage.setItem(
        "jomjalanPlans",
        JSON.stringify(travelPlans)
    );

    message.textContent = "Travel plan saved successfully!";

    document.getElementById("planDestination").value = "";
    document.getElementById("planDays").value = "";
    document.getElementById("planAccommodation").value = "";
    document.getElementById("planFood").value = "";
    document.getElementById("planTransport").value = "";

    editingPlanId = null;
    document.getElementById("CancelEditButton").hidden = true;


    displayTravelPlans();
}

function displayTravelPlans() {
    const planList = document.getElementById("planList");


    planList.innerHTML = "";

    if (travelPlans.length === 0) {
        planList.textContent = "No saved travel plans yet.";
        return;
    }

    travelPlans.forEach(function(plan) {
        const card = document.createElement("div");
        card.className = "planCard";

        const title = document.createElement("h3");
        title.textContent = plan.destination;

        const details = document.createElement("p");
        details.textContent =
            "Duration: " + plan.days + " days";

        const budget = document.createElement("p");
        budget.textContent =
            "Estimated Budget: RM" +
            plan.totalBudget.toFixed(2);
        
        const weather = document.createElement("p");
        weather.textContent = "Weather: " + (plan.weather || "Not checked");

        const activities = document.createElement("p");
        activities.textContent =
          "Recommended Activities: " +
          (plan.recommendations && plan.recommendations.length > 0
            ? plan.recommendations.join(", ")
            : "No recommendations saved.");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = function() {
            editTravelPlan(plan.id);
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = function() {
            deleteTravelPlan(plan.id);
        };

        card.appendChild(title);
        card.appendChild(details);
        card.appendChild(budget);
        card.appendChild(editButton);
        card.appendChild(deleteButton);
        card.appendChild(weather);
        card.appendChild(activities);

        planList.appendChild(card);
    });
}

function editTravelPlan(id) {
    // Find the selected travel plan
    const plan = travelPlans.find(function(item) {
        return item.id === id;
    });

    if (!plan) {
        return;
    }

    // Put the saved details back into the form
    document.getElementById("planDestination").value =
        plan.destination;

    document.getElementById("planDays").value =
        plan.days;

    document.getElementById("planAccommodation").value =
        plan.accommodation;

    document.getElementById("planFood").value =
        plan.food;

    document.getElementById("planTransport").value =
        plan.transport;

    // Remember which plan is being edited
    editingPlanId = id;

    document.getElementById("planMessage").textContent =
        "Editing: " + plan.destination;

    document.getElementById("cancelEditButton").hidden = false;
}

function deleteTravelPlan(id) {
    // Ask for confirmation
    const confirmDelete = confirm(
        "Are you sure you want to delete this travel plan?"
    );

    if (!confirmDelete) {
        return;
    }

    // Remove the selected plan
    travelPlans = travelPlans.filter(function(plan) {
        return plan.id !== id;
    });

    // Update Local Storage
    localStorage.setItem(
        "jomjalanPlans",
        JSON.stringify(travelPlans)
    );

    // Refresh the display
    displayTravelPlans();

    document.getElementById("planMessage").textContent =
        "Travel plan deleted successfully!";
}

function cancelEdit() {
    editingPlanId = null;

    document.getElementById("planDestination").value = "";
    document.getElementById("planDays").value = "";
    document.getElementById("planAccommodation").value = "";
    document.getElementById("planFood").value = "";
    document.getElementById("planTransport").value = "";

    document.getElementById("cancelEditButton").hidden = true;

    document.getElementById("planMessage").textContent =
        "Editing cancelled.";
}
