document.addEventListener('DOMContentLoaded', () => {
    const plotArea = document.getElementById('plot-area');
    const numClustersInput = document.getElementById('num-clusters');
    const initMethodSelect = document.getElementById('init-method');

    let randomDataset = generateRandomDataset();
    let clusterCentroids = [];
    let clusterAssignments = [];
    let previousClusterCentroids = [];
    let isManualInitMode = false;
    let selectedCentroidCount = 0;

    initMethodSelect.addEventListener('change', () => {
        const selectedInitMethod = initMethodSelect.value;
        if (selectedInitMethod === 'manual') {
            isManualInitMode = true;
            selectedCentroidCount = 0;
            alert('Click on the plot area to select centroids');
        } else {
            isManualInitMode = false;
        }
    });

    document.getElementById('new-dataset').addEventListener('click', () => {
        randomDataset = generateRandomDataset();
        clusterCentroids = [];
        clusterAssignments = [];
        isManualInitMode = false;
        selectedCentroidCount = 0;
        drawPlot();
    });

    document.getElementById('step').addEventListener('click', () => {
        if (clusterCentroids.length === 0) {
            initializeCentroids();
        } else {
            assignClusters();
            updateCentroids();
        }
        if (isConverged()) {
            alert('Has been converged.');
        }

        drawPlot();
    });

    document.getElementById('converge').addEventListener('click', () => {
        if (clusterCentroids.length === 0) {
            initializeCentroids();
        }
        do {
            assignClusters();
            updateCentroids();
            drawPlot();
        } while (!isConverged());

        if (isConverged()) {
            alert('Has been converged.');
        }
        drawPlot();
    });

    document.getElementById('reset').addEventListener('click', () => {
        clusterCentroids = [];
        clusterAssignments = [];
        const selectedInitMethod = initMethodSelect.value;
        isManualInitMode = (selectedInitMethod === 'manual');
        selectedCentroidCount = 0;
        drawPlot();
    });

    plotArea.addEventListener('click', (event) => {
        if (isManualInitMode) {
            const k = parseInt(numClustersInput.value);
            if (selectedCentroidCount < k) {
                const rect = plotArea.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                clusterCentroids.push({ x: x, y: y });
                selectedCentroidCount++;

                if (selectedCentroidCount === k) {
                    isManualInitMode = false; 
                    alert('All centroids selected, now proceed with clustering');
                }

                drawPlot();
            }
        }
    });

    /**
     * Initializes the cluster centroids based on the selected method.
     */
    function initializeCentroids() {
        const k = parseInt(numClustersInput.value);
        clusterCentroids = [];
        const selectedInitMethod = initMethodSelect.value;

        if (selectedInitMethod === 'manual') {
            isManualInitMode = true;
            selectedCentroidCount = 0;
            alert('Click on the plot area to select centroids');
        } else if (selectedInitMethod === 'farthest') {
            const firstCentroid = randomDataset[Math.floor(Math.random() * randomDataset.length)];
            clusterCentroids.push({ ...firstCentroid });

            while (clusterCentroids.length < k) {
                let farthestPoint = null;
                let maxDistance = -Infinity;

                randomDataset.forEach(point => {
                    const minDistanceToCentroid = clusterCentroids.reduce((minDistance, centroid) => {
                        const distance = Math.hypot(point.x - centroid.x, point.y - centroid.y);
                        return Math.min(minDistance, distance);
                    }, Infinity);

                    if (minDistanceToCentroid > maxDistance) {
                        maxDistance = minDistanceToCentroid;
                        farthestPoint = point;
                    }
                });

                clusterCentroids.push({ ...farthestPoint });
            }
        } else if (selectedInitMethod === 'random') {
            for (let i = 0; i < k; i++) {
                const randomPoint = randomDataset[Math.floor(Math.random() * randomDataset.length)];
                clusterCentroids.push({ ...randomPoint });
            }
        } else if (selectedInitMethod === 'kmeans++') {
            clusterCentroids.push(randomDataset[Math.floor(Math.random() * randomDataset.length)]);
            while (clusterCentroids.length < k) {
                const distances = randomDataset.map(point => {
                    const minDistance = clusterCentroids.reduce((minDist, centroid) => {
                        const distance = Math.hypot(point.x - centroid.x, point.y - centroid.y);
                        return Math.min(minDist, distance);
                    }, Infinity);
                    return minDistance;
                });

                const totalDistance = distances.reduce((sum, d) => sum + d, 0);
                const randomValue = Math.random() * totalDistance;
                let cumulativeDistance = 0;
                for (let i = 0; i < randomDataset.length; i++) {
                    cumulativeDistance += distances[i];
                    if (cumulativeDistance >= randomValue) {
                        clusterCentroids.push({ ...randomDataset[i] });
                        break;
                    }
                }
            }
        }
        drawPlot();    
    }

    /**
     * Generates a random dataset of points within the plot area.
     * @returns {Array} An array of points with x and y coordinates.
     */
    function generateRandomDataset() {
        const data = [];
        for (let i = 0; i < 300; i++) {
            data.push({
                x: Math.random() * (plotArea.clientWidth - 5),
                y: Math.random() * (plotArea.clientHeight - 5)
            });
        }
        return data;
    }

    /**
     * Assigns each point in the dataset to the nearest centroid.
     */
    function assignClusters() {
        clusterAssignments = randomDataset.map(point => {
            let closestIndex = 0;
            let minDistance = Infinity;
            clusterCentroids.forEach((centroid, index) => {
                const distance = Math.hypot(point.x - centroid.x, point.y - centroid.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            });
            return closestIndex;
        });
    }

    /**
     * Updates the centroids based on the current cluster assignments.
     */
    function updateCentroids() {
        previousClusterCentroids = clusterCentroids.map(centroid => ({ ...centroid }));
        const k = clusterCentroids.length;
        const sums = Array(k).fill(0).map(() => ({ x: 0, y: 0, count: 0 }));

        randomDataset.forEach((point, index) => {
            const cluster = clusterAssignments[index];
            sums[cluster].x += point.x;
            sums[cluster].y += point.y;
            sums[cluster].count += 1;
        });

        sums.forEach((sum, index) => {
            if (sum.count > 0) {
                clusterCentroids[index].x = sum.x / sum.count;
                clusterCentroids[index].y = sum.y / sum.count;
            }
        });
    }

    /**
     * Checks if the centroids have converged (i.e., not changed significantly).
     * @returns {boolean} True if converged, false otherwise.
     */
    function isConverged() {
        const epsilon = 1e-6;
        return clusterCentroids.every((centroid, index) => {
            const prev = previousClusterCentroids[index];
            return Math.abs(centroid.x - prev.x) < epsilon && Math.abs(centroid.y - prev.y) < epsilon;
        });
    }

    /**
     * Draws the current state of the dataset and the centroids in the plot area.
     */
    function drawPlot() {
        plotArea.innerHTML = '';
        const xAxis = document.createElement('div');
        const yAxis = document.createElement('div');
        
        xAxis.style.position = 'absolute';
        xAxis.style.height = '1px';
        xAxis.style.width = '100%';
        xAxis.style.backgroundColor = 'black';
        xAxis.style.top = `${plotArea.clientHeight / 2}px`;
        plotArea.appendChild(xAxis);
    
        yAxis.style.position = 'absolute';
        yAxis.style.width = '1px';
        yAxis.style.height = '100%';
        yAxis.style.backgroundColor = 'black';
        yAxis.style.left = `${plotArea.clientWidth / 2}px`;
        plotArea.appendChild(yAxis);
    
        const xLabel = document.createElement('div');
        xLabel.textContent = 'X Axis';
        xLabel.style.position = 'absolute';
        xLabel.style.left = `${plotArea.clientWidth - 50}px`;
        xLabel.style.top = `${plotArea.clientHeight / 2 + 10}px`;
        plotArea.appendChild(xLabel);
    
        const yLabel = document.createElement('div');
        yLabel.textContent = 'Y Axis';
        yLabel.style.position = 'absolute';
        yLabel.style.left = `${plotArea.clientWidth / 2 + 10}px`;
        yLabel.style.top = `${10}px`;
        plotArea.appendChild(yLabel);
    
        randomDataset.forEach((point, index) => {
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.width = '8px';
            dot.style.height = '8px';
            dot.style.backgroundColor = clusterAssignments[index] !== undefined ? `hsl(${clusterAssignments[index] * 360 / clusterCentroids.length}, 100%, 50%)` : 'black';
            dot.style.borderRadius = '50%';
            dot.style.left = `${point.x}px`;
            dot.style.top = `${point.y}px`;
            plotArea.appendChild(dot);
        });
    
        clusterCentroids.forEach(centroid => {
            const center = document.createElement('div');
            center.style.position = 'absolute';
            center.style.width = '20px';
            center.style.height = '20px';
            center.style.backgroundColor = 'red';
            center.style.borderRadius = '50%';
            center.style.left = `${centroid.x}px`;
            center.style.top = `${centroid.y}px`;
            plotArea.appendChild(center);
        });
    }
    
    drawPlot();
});
