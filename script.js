document.addEventListener('DOMContentLoaded', () => {
    fetch('restaurants_italy.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('JSON file not accessible');
            }
            return response.json();
        })
        .then(restaurants => {
            console.log('Parsed JSON data structure:', restaurants[0]);

            // Verify property names
            const EXPECTED_PROPERTIES = ['Restaurant Name ', ' Cuisine ', ' Price ', ' Location', 'Tags Availability', 'Images'];
            const missingProperties = EXPECTED_PROPERTIES.filter(prop => !(prop in restaurants[0]));
            
            if (missingProperties.length > 0) {
                console.error('Missing properties:', missingProperties);
            } else {
                console.log('All expected properties are present');
            }

            displayRestaurants(restaurants);
            initializeFilters(restaurants);
        })
        .catch(error => console.error('Error:', error));
});

function displayRestaurants(restaurants) {
    const restaurantList = document.getElementById('restaurantList');
    restaurantList.innerHTML = '';

    restaurants.forEach((restaurant, index) => {
        const card = createRestaurantCard(restaurant, index);
        restaurantList.appendChild(card);
    });

    initializeCarousels();
}

function createRestaurantCard(restaurant, index) {
    console.log('Creating card for restaurant:', restaurant);
    const restaurantName = restaurant['Restaurant Name '].trim();
    const images = restaurant.Images || [];
    const card = document.createElement('div');
    card.className = 'col s12 m6 l4';

    // Add recommended badge if the restaurant is recommended
    const recommendedBadge = restaurant['Recommended'] === 'TRUE' ? '<div class="badge-recommended">Recommended</div>' : '';

    // Generate image elements dynamically
    let imageElements = '';
    images.forEach(imageSrc => {
        imageElements += `
            <a class="carousel-item" href="#"><img src="${imageSrc}" onerror="this.parentElement.style.display='none'"></a>
        `;
    });

    const location = restaurant[' Location'].replace(', Italy', '');
    const drivingDistance = restaurant['Driving Distance'] ? ` (${restaurant['Driving Distance']})` : '';
    const googleMapsLink = restaurant['Google Maps Link'] ? `<a href="${restaurant['Google Maps Link']}" target="_blank">Google Maps</a>` : '';
    const reservation = restaurant['Reservation'] ? `<a href="${restaurant['Reservation']}" target="_blank">📅 Reservation</a>` : '';
    const menu = restaurant['Menu'] ? `<a href="${restaurant['Menu']}" target="_blank">📜 Menu</a>` : '';
    const website = restaurant['Website'] ? `<a href="${restaurant['Website']}" target="_blank">🌐 Website</a>` : '';
    const phone = restaurant['Phone'] ? `📞 ${restaurant['Phone']}` : '';

    card.innerHTML = `
        <div class="card restaurant-card">
            ${recommendedBadge}
            <div class="carousel carousel-slider" id="carousel-${index}">
                ${imageElements}
            </div>
            <div class="carousel-controls">
                <button class="btn-floating btn-small waves-effect waves-light blue left-btn"><i class="material-icons">chevron_left</i></button>
                <button class="btn-floating btn-small waves-effect waves-light blue right-btn"><i class="material-icons">chevron_right</i></button>
            </div>
            <div class="card-content">
                <span class="card-title">${restaurant['Restaurant Name '] || 'N/A'}</span>
                <p>Cuisine: ${restaurant[' Cuisine '] || 'N/A'}</p>
                <p>Price: ${restaurant[' Price '] || 'N/A'}</p>
                <p>Location: ${location}${drivingDistance} ${googleMapsLink}</p>
                <p>${reservation} ${menu} ${website}</p>
                <p>${phone}</p>
            </div>
        </div>
    `;
    return card;
}

function initializeCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
        const items = carousel.querySelectorAll('.carousel-item');
        if (items.length > 0) {
            M.Carousel.init(carousel, {
                fullWidth: true,
                indicators: true
            });
        }
    });

    document.querySelectorAll('.left-btn').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const carousel = document.getElementById(`carousel-${index}`);
            const instance = M.Carousel.getInstance(carousel);
            instance.prev();
        });
    });

    document.querySelectorAll('.right-btn').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const carousel = document.getElementById(`carousel-${index}`);
            const instance = M.Carousel.getInstance(carousel);
            instance.next();
        });
    });
}

function initializeFilters(restaurants) {
    const nameFilter = document.getElementById('nameFilter');
    const priceFilter = document.getElementById('priceFilter');
    const cuisineFilter = document.getElementById('cuisineFilter');
    const recommendedFilter = document.getElementById('recommendedFilter');
    const sortFilter = document.getElementById('sortFilter');
    const dayCheckboxes = document.querySelectorAll('input[type="checkbox"]');

    // Initialize Materialize select
    M.FormSelect.init(priceFilter);
    M.FormSelect.init(sortFilter);

    // Populate cuisine filter
    const cuisines = [...new Set(restaurants.map(r => r[' Cuisine '].trim()).filter(Boolean))];
    for (const cuisine of cuisines) {
        const option = document.createElement('option');
        option.value = cuisine;
        option.textContent = cuisine;
        cuisineFilter.appendChild(option);
    }

    // Initialize Materialize select for cuisine
    M.FormSelect.init(cuisineFilter);

    // Add event listeners
    nameFilter.addEventListener('input', debounce(applyFilters, 300));
    priceFilter.addEventListener('change', applyFilters);
    cuisineFilter.addEventListener('change', applyFilters);
    recommendedFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);
    for (const checkbox of dayCheckboxes) {
        checkbox.addEventListener('change', applyFilters);
    }

    function applyFilters() {
        const nameValue = nameFilter.value.toLowerCase();
        const priceValue = priceFilter.value;
        const selectedCuisines = Array.from(cuisineFilter.querySelectorAll('option:checked')).map(option => option.value);
        const selectedDays = Array.from(dayCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const recommendedOnly = recommendedFilter.checked;
        const sortValue = sortFilter.value;

        let filteredRestaurants = filterModule.filterRestaurants(restaurants, {
            nameValue,
            priceValue,
            selectedCuisines,
            selectedDays,
            recommendedOnly
        });

        filteredRestaurants = sortModule.sortRestaurants(filteredRestaurants, sortValue);

        displayRestaurants(filteredRestaurants);
    }
}

// Debounce function
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Filter module
const filterModule = (() => {
    const RESTAURANT_NAME = 'Restaurant Name ';
    const TAGS_AVAILABILITY = 'Tags Availability';

    const filterRestaurants = (restaurants, filters) => {
        return restaurants.filter(restaurant => {
            const nameMatch = restaurant[RESTAURANT_NAME].toLowerCase().includes(filters.nameValue);
            const priceMatch = filters.priceValue === '' || restaurant[' Price '].trim() === filters.priceValue;
            const cuisineMatch = filters.selectedCuisines.length === 0 || filters.selectedCuisines.includes(restaurant[' Cuisine '].trim());
            const daysMatch = filters.selectedDays.length === 0 || filters.selectedDays.some(day => restaurant[TAGS_AVAILABILITY].includes(day));
            const recommendedMatch = !filters.recommendedOnly || restaurant['Recommended'] === 'TRUE';

            return nameMatch && priceMatch && cuisineMatch && daysMatch && recommendedMatch;
        });
    }

    return {
        filterRestaurants
    };
})();

// Sort module
const sortModule = (() => {
    const sortRestaurants = (restaurants, sortValue) => {
        switch (sortValue) {
            case 'price':
                return restaurants.sort((a, b) => {
                    const priceA = a[' Price '].length;
                    const priceB = b[' Price '].length;
                    return priceA - priceB;
                });
            case 'distance':
                return restaurants.sort((a, b) => {
                    const distanceA = parseInt(a['Driving Distance']) || 0;
                    const distanceB = parseInt(b['Driving Distance']) || 0;
                    return distanceA - distanceB;
                });
            case 'recommended':
                return restaurants.sort((a, b) => {
                    return (b['Recommended'] === 'TRUE' ? 1 : 0) - (a['Recommended'] === 'TRUE' ? 1 : 0);
                });
            default:
                return restaurants;
        }
    }

    return {
        sortRestaurants
    };
})();
