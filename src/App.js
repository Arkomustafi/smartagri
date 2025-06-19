import React, { useState, useEffect, useRef } from 'react';
import { Thermometer, Droplet, Sprout, Search, Sun, Moon, Leaf, FlaskConical, Wheat, XCircle, Play, StopCircle, Trash2, Microscope } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Custom SVG Icons for N, P, K to mimic periodic table style
const NitrogenIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="90" height="90" rx="10" fill="#2ECC71" stroke="#27AE60" strokeWidth="4"/>
        <text x="20" y="35" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white">7</text>
        <text x="50" y="70" fontFamily="Arial, sans-serif" fontSize="45" fontWeight="bold" textAnchor="middle" fill="white">N</text>
        <text x="50" y="90" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="middle" fill="white">Nitrogen</text>
    </svg>
);

const PhosphorusIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="90" height="90" rx="10" fill="#E67E22" stroke="#D35400" strokeWidth="4"/>
        <text x="20" y="35" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white">15</text>
        <text x="50" y="70" fontFamily="Arial, sans-serif" fontSize="45" fontWeight="bold" textAnchor="middle" fill="white">P</text>
        <text x="50" y="90" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="middle" fill="white">Phosphorus</text>
    </svg>
);

const PotassiumIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="90" height="90" rx="10" fill="#9B59B6" stroke="#8E44AD" strokeWidth="4"/>
        <text x="20" y="35" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white">19</text>
        <text x="50" y="70" fontFamily="Arial, sans-serif" fontSize="45" fontWeight="bold" textAnchor="middle" fill="white">K</text>
        <text x="50" y="90" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="middle" fill="white">Potassium</text>
    </svg>
);

// Helper function to get the color code based on value and favorable range
const getColorCode = (element, value, favorable) => {
    if (!favorable) return '';
    
    // Normalize favorable string by removing units and splitting into a range
    const rangeString = favorable.replace(/°C|%|mg\/kg/gi, '').trim();
    const range = rangeString.split(/~|-/).map(Number);
    
    if (range.length !== 2 || range.some(isNaN)) {
        return ''; // Invalid range format
    }
    
    const [min, max] = range;
    let comparisonValue = value;

    if (element === 'Soil Moisture') {
        comparisonValue = parseFloat((value * 0.1).toFixed(1));
    }
    
    if (comparisonValue >= min && comparisonValue <= max) return 'bg-green-500';
    return comparisonValue < min ? 'bg-red-500' : 'bg-yellow-500';
};


// Data for sensor readings and favorable ranges (initial values, will be updated by crop selection)
const initialSensorData = {
    temperature: { value: 0, unit: '°C', favorable: '21°C~37°C' },
    humidity: { value: 0, unit: '%', favorable: '60~80 %' },
    soilMoisture: { value: 0, unit: '%', favorable: '70-100' },
    nitrogen: { value: 0, unit: 'mg/kg', favorable: '10~50' },
    phosphorus: { value: 0, unit: 'mg/kg', favorable: '15~73' },
    potassium: { value: 0, unit: 'mg/kg', favorable: '101~150' },
};

// Favorable data for different crops
const cropFavorableData = {
    'Manual': {
        temperature: '21~37°C',
        humidity: '60~80%',
        soilMoisture: '70-100', // Range as numbers
        nitrogen: '10~50',
        phosphorus: '15~73',
        potassium: '101~150',
    },
    'Wheat': {
        temperature: '18~24°C',
        humidity: '50~70%',
        soilMoisture: '40-60', // Range as numbers
        nitrogen: '50~100',
        phosphorus: '20~40',
        potassium: '80~120',
    },
    'Corn': {
        temperature: '21~32°C',
        humidity: '60~85%',
        soilMoisture: '50-75', // Range as numbers
        nitrogen: '80~150',
        phosphorus: '30~60',
        potassium: '120~200',
    },
    'Rice': {
        temperature: '25~35°C',
        humidity: '70~90%',
        soilMoisture: '80-100', // Range as numbers
        nitrogen: '60~120',
        phosphorus: '25~50',
        potassium: '100~180',
    },
    'Soybean': {
        temperature: '20~30°C',
        humidity: '60~80%',
        soilMoisture: '45-65', // Range as numbers
        nitrogen: '40~80',
        phosphorus: '25~55',
        potassium: '90~160',
    },
    'Cotton': {
        temperature: '25~35°C',
        humidity: '55~75%',
        soilMoisture: '50-70', // Range as numbers
        nitrogen: '70~130',
        phosphorus: '20~45',
        potassium: '110~190',
    },
};

// Homepage Component
const HomePage = ({ onNavigate, isDarkMode, sensorData }) => {
    const cardClass = `flex flex-col items-center p-4 rounded-lg shadow-lg cursor-pointer transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'
    }`;
    const iconClass = `w-16 h-16 mb-2`;

    return (
        <div className="p-6">
            <h1 className={`text-4xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                IOT Based <br /> Smart Agriculture System
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className={cardClass} onClick={() => onNavigate('detail', 'Temperature')}>
                    <Thermometer className={`${iconClass} ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className="text-lg font-semibold">Temperature : {sensorData.temperature.value} {sensorData.temperature.unit}</p>
                </div>
                <div className={cardClass} onClick={() => onNavigate('detail', 'Humidity')}>
                    <Droplet className={`${iconClass} ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className="text-lg font-semibold">Humidity : {sensorData.humidity.value} {sensorData.humidity.unit}</p>
                </div>
                <div className={cardClass} onClick={() => onNavigate('detail', 'Soil Moisture')}>
                    <Sprout className={`${iconClass} ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className="text-lg font-semibold">Soil Moisture : {parseFloat(sensorData.soilMoisture.value * 0.1).toFixed(1)} {sensorData.soilMoisture.unit}</p>
                </div>
                <div className={cardClass} onClick={() => onNavigate('detail', 'Nitrogen')}>
                    <NitrogenIcon className={iconClass} />
                    <p className="text-lg font-semibold">Nitrogen : {sensorData.nitrogen.value} {sensorData.nitrogen.unit}</p>
                </div>
                <div className={cardClass} onClick={() => onNavigate('detail', 'Phosphorus')}>
                    <PhosphorusIcon className={iconClass} />
                    <p className="text-lg font-semibold">Phosphorus : {sensorData.phosphorus.value} {sensorData.phosphorus.unit}</p>
                </div>
                <div className={cardClass} onClick={() => onNavigate('detail', 'Potassium')}>
                    <PotassiumIcon className={iconClass} />
                    <p className="text-lg font-semibold">Potassium : {sensorData.potassium.value} {sensorData.potassium.unit}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4">
                <button
                    onClick={() => onNavigate('results')}
                    className={`flex items-center px-8 py-4 rounded-full shadow-xl text-xl font-semibold transition-all duration-300 mb-4 md:mb-0
                    ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600'}`}
                >
                    <Search className="w-6 h-6 mr-3" />
                    Result and Suggestions
                </button>
                <button
                    onClick={() => onNavigate('soilAnalysis')}
                    className={`flex items-center px-8 py-4 rounded-full shadow-xl text-xl font-semibold transition-all duration-300
                    ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                    <Microscope className="w-6 h-6 mr-3" />
                    Land Soil Analysis
                </button>
            </div>
        </div>
    );
};

// DetailPage Component
const DetailPage = ({ parameter, onNavigate, isDarkMode }) => {
    const getDetailIcon = (param, className) => {
        switch (param) {
            case 'Temperature': return <Thermometer className={`${className} text-red-500`} />;
            case 'Humidity': return <Droplet className={`${className} text-blue-500`} />;
            case 'Soil Moisture': return <Sprout className={`${className} text-green-500`} />;
            case 'Nitrogen': return <NitrogenIcon className={className} />;
            case 'Phosphorus': return <PhosphorusIcon className={className} />;
            case 'Potassium': return <PotassiumIcon className={className} />;
            default: return null;
        }
    };

    const parameterInfo = {
        Temperature: {
            description: "Temperature is a critical factor influencing plant growth, metabolic rates, and nutrient uptake. Each crop has an optimal temperature range for healthy development. Deviations can lead to stress, reduced yields, or even plant death. Monitoring and managing temperature, especially in controlled environments like greenhouses, is essential for maximizing agricultural productivity."
        },
        Humidity: {
            description: "Humidity, the amount of moisture in the air, plays a vital role in plant transpiration and overall health. High humidity can encourage fungal diseases, while low humidity can lead to excessive water loss and wilting. Maintaining appropriate humidity levels helps plants efficiently absorb water and nutrients, promoting robust growth."
        },
        'Soil Moisture': {
            description: "Soil moisture refers to the water content in the soil, crucial for nutrient transport and plant hydration. Adequate soil moisture ensures that plants can access the water they need for photosynthesis and other physiological processes. Both over-watering (leading to root rot) and under-watering (causing drought stress) can severely impact crop health and yield."
        },
        Nitrogen: {
            description: "Nitrogen acts as the building block for agricultural bounty. This essential nutrient fuels plant growth, forming the backbone of chlorophyll for photosynthesis and proteins for healthy structures. Like a baker needing flour, crops with adequate nitrogen flourish, producing strong stalks, vibrant leaves, and abundant fruits or grains. However, nitrogen mismanagement can disrupt this harmony. Excess nitrogen can pollute waterways and contribute to greenhouse gas emissions. Conversely, nitrogen deficiency hinders plant growth, resulting in stunted crops and diminished yields. Therefore, farmers strive for a balanced approach, employing efficient fertilization techniques and cover crops to ensure optimal nitrogen utilization for a thriving harvest."
        },
        Phosphorus: {
            description: "Phosphorus is vital for energy transfer within plants, playing a key role in photosynthesis, nutrient transport, and root development. It's particularly important for flowering, fruiting, and seed production. A deficiency can lead to stunted growth and poor crop quality, while proper levels ensure vigorous plant development and strong yields."
        },
        Potassium: {
            description: "Potassium is essential for overall plant vigor, disease resistance, and water regulation. It helps activate enzymes, improves nutrient uptake, and strengthens plant cell walls. Adequate potassium levels contribute to better fruit quality, increased drought tolerance, and enhanced resistance to pests and diseases, leading to healthier and more productive crops."
        },
    };

    const info = parameterInfo[parameter] || { description: "Information not available." };
    const detailIconClass = "w-24 h-24 mb-4";

    return (
        <div className="p-6">
            <button
                onClick={() => onNavigate('home')}
                className={`mb-6 px-6 py-2 rounded-full font-semibold transition-all duration-300
                ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
                &larr; Back to Home
            </button>
            <h2 className={`text-4xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {parameter}
            </h2>
            <div className={`flex flex-col items-center p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                {getDetailIcon(parameter, detailIconClass)}
                <p className="text-lg leading-relaxed text-center max-w-2xl">
                    {info.description}
                </p>
            </div>
        </div>
    );
};

// LandSoilAnalysisPage Component
const LandSoilAnalysisPage = ({ onNavigate, isDarkMode, sensorData }) => {
    const [soilAnalysisSamples, setSoilAnalysisSamples] = useState([]);
    const [isStoringData, setIsStoringData] = useState(false);
    const sampleCounterRef = useRef(0);
    const intervalRef = useRef(null);

    // Effect for continuous data storage
    useEffect(() => {
        if (isStoringData) {
            intervalRef.current = setInterval(() => {
                sampleCounterRef.current += 1;
                const newSample = {
                    sampleNumber: sampleCounterRef.current,
                    timestamp: new Date().toLocaleString(),
                    temperature: sensorData.temperature.value,
                    humidity: sensorData.humidity.value,
                    soilMoisture: parseFloat(sensorData.soilMoisture.value * 0.1).toFixed(1),
                    nitrogen: sensorData.nitrogen.value,
                    phosphorus: sensorData.phosphorus.value,
                    potassium: sensorData.potassium.value,
                    unitTemperature: sensorData.temperature.unit,
                    unitHumidity: sensorData.humidity.unit,
                    unitSoilMoisture: sensorData.soilMoisture.unit,
                    unitNitrogen: sensorData.nitrogen.unit,
                    unitPhosphorus: sensorData.phosphorus.unit,
                    unitPotassium: sensorData.potassium.unit,
                };
                setSoilAnalysisSamples(prevSamples => [...prevSamples, newSample]);
            }, 60000); // Sample every 60 seconds (1 minute)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isStoringData, sensorData]);

    const handleStartStoringData = () => {
        setIsStoringData(true);
    };

    const handleStopStoringData = () => {
        setIsStoringData(false);
    };

    const handleClearAllSamples = () => {
        setIsStoringData(false);
        setSoilAnalysisSamples([]);
        sampleCounterRef.current = 0;
    };

    const tableHeaderClass = `px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`;
    const tableCellClass = `px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`;

    return (
        <div className="p-6">
            <button
                onClick={() => onNavigate('home')}
                className={`mb-6 px-6 py-2 rounded-full font-semibold transition-all duration-300
                ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
                &larr; Back to Home
            </button>
            <h2 className={`text-4xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Land Soil Analysis
            </h2>

            <div className={`p-6 rounded-lg shadow-xl mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-2xl font-bold text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Collected Soil Samples
                </h3>
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <button
                        onClick={handleStartStoringData}
                        disabled={isStoringData}
                        className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300
                        ${isStoringData ? 'bg-gray-400 cursor-not-allowed' : (isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600')}`}
                    >
                        <Play className="w-5 h-5 mr-2" /> Start Storing Data
                    </button>
                    <button
                        onClick={handleStopStoringData}
                        disabled={!isStoringData}
                        className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300
                        ${!isStoringData ? 'bg-gray-400 cursor-not-allowed' : (isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600')}`}
                    >
                        <StopCircle className="w-5 h-5 mr-2" /> Stop Storing Data
                    </button>
                    <button
                        onClick={handleClearAllSamples}
                        className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300
                        ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        <Trash2 className="w-5 h-5 mr-2" /> Clear All Samples
                    </button>
                </div>

                {soilAnalysisSamples.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <tr>
                                    <th scope="col" className={tableHeaderClass}>Sample #</th>
                                    <th scope="col" className={tableHeaderClass}>Timestamp</th>
                                    <th scope="col" className={tableHeaderClass}>Temp ({sensorData.temperature.unit})</th>
                                    <th scope="col" className={tableHeaderClass}>Humidity ({sensorData.humidity.unit})</th>
                                    <th scope="col" className={tableHeaderClass}>Soil Moisture ({sensorData.soilMoisture.unit})</th>
                                    <th scope="col" className={tableHeaderClass}>Nitrogen ({sensorData.nitrogen.unit})</th>
                                    <th scope="col" className={tableHeaderClass}>Phosphorus ({sensorData.phosphorus.unit})</th>
                                    <th scope="col" className={tableHeaderClass}>Potassium ({sensorData.potassium.unit})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {soilAnalysisSamples.map((sample, index) => (
                                    <tr key={index} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                                        <td className={tableCellClass}>{sample.sampleNumber}</td>
                                        <td className={tableCellClass}>{sample.timestamp}</td>
                                        <td className={tableCellClass}>{sample.temperature}</td>
                                        <td className={tableCellClass}>{sample.humidity}</td>
                                        <td className={tableCellClass}>{sample.soilMoisture}</td>
                                        <td className={tableCellClass}>{sample.nitrogen}</td>
                                        <td className={tableCellClass}>{sample.phosphorus}</td>
                                        <td className={tableCellClass}>{sample.potassium}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {soilAnalysisSamples.length === 0 && !isStoringData && (
                    <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No samples collected yet.</p>
                )}
                {isStoringData && (
                    <p className={`text-center py-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Collecting samples...</p>
                )}
            </div>
        </div>
    );
};


// ResultPage Component
const ResultPage = ({ onNavigate, isDarkMode, sensorData }) => {
    const [localSensorData, setLocalSensorData] = useState(sensorData);
    const [selectedCrop, setSelectedCrop] = useState('Manual');
    const [soilHealthSuggestion, setSoilHealthSuggestion] = useState('');
    const [cropPrediction, setCropPrediction] = useState('');
    const [loadingSoilHealth, setLoadingSoilHealth] = useState(false);
    const [loadingCropPrediction, setLoadingCropPrediction] = useState(false);
    const [manualFavorableData, setManualFavorableData] = useState(cropFavorableData['Manual']);

    useEffect(() => {
        setLocalSensorData(prevLocalData => {
            const updatedData = { ...prevLocalData };
            for (const key in sensorData) {
                if (updatedData[key]) {
                    updatedData[key].value = sensorData[key].value;
                }
            }
            return updatedData;
        });
    }, [sensorData]);

    useEffect(() => {
        setLocalSensorData(prevData => {
            const newFavorableData = selectedCrop === 'Manual' ? manualFavorableData : cropFavorableData[selectedCrop];
            const updatedData = {};
            for (const key in prevData) {
                updatedData[key] = {
                    ...prevData[key],
                    favorable: newFavorableData[key] || ''
                };
            }
            return updatedData;
        });
        setSoilHealthSuggestion('');
        setCropPrediction('');
    }, [selectedCrop, manualFavorableData]);

    const handleFavorableInputChange = (key, value) => {
        setManualFavorableData(prevData => ({
            ...prevData,
            [key]: value
        }));
    };

    const handleCropChange = (event) => {
        setSelectedCrop(event.target.value);
    };

    const getGeminiResponse = async (prompt, type) => {
        if (type === 'soilHealth') setLoadingSoilHealth(true);
        if (type === 'cropPrediction') setLoadingCropPrediction(true);

        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Gemini API key is missing. Please set REACT_APP_GEMINI_API_KEY in your .env file.");
            const errorMessage = "API key is missing. Please configure it to use this feature.";
            if (type === 'soilHealth') setSoilHealthSuggestion(errorMessage);
            if (type === 'cropPrediction') setCropPrediction(errorMessage);
            setLoadingSoilHealth(false);
            setLoadingCropPrediction(false);
            return;
        }

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }

            const result = await response.json();
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

            if (type === 'soilHealth') setSoilHealthSuggestion(text);
            if (type === 'cropPrediction') setCropPrediction(text);
        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage = `Failed to fetch response from Gemini. Error: ${error.message}. Please check your API key and network.`;
            if (type === 'soilHealth') setSoilHealthSuggestion(errorMessage);
            if (type === 'cropPrediction') setCropPrediction(errorMessage);
        } finally {
            if (type === 'soilHealth') setLoadingSoilHealth(false);
            if (type === 'cropPrediction') setLoadingCropPrediction(false);
        }
    };

    const handleGetSoilHealthSuggestions = () => {
        setSoilHealthSuggestion('');
        const prompt = `Given the current soil moisture and nutrient (Nitrogen, Phosphorus, Potassium) readings:
        Soil Moisture: ${parseFloat(localSensorData.soilMoisture.value * 0.1).toFixed(1)}${localSensorData.soilMoisture.unit} (Favorable raw range: ${localSensorData.soilMoisture.favorable})
        Nitrogen: ${localSensorData.nitrogen.value}${localSensorData.nitrogen.unit} (Favorable: ${localSensorData.nitrogen.favorable})
        Phosphorus: ${localSensorData.phosphorus.value}${localSensorData.phosphorus.unit} (Favorable: ${localSensorData.phosphorus.favorable})
        Potassium: ${localSensorData.potassium.value}${localSensorData.potassium.unit} (Favorable: ${localSensorData.potassium.favorable})

        Provide precise and actionable suggestions ONLY on soil moisture and nutrient management for growing ${selectedCrop === 'Manual' ? 'your selected crop' : selectedCrop}. List specific steps to improve or maintain optimal levels.`;
        getGeminiResponse(prompt, 'soilHealth');
    };

    const handleGetCropPredictions = () => {
        setCropPrediction('');
        const prompt = `Based on the following current soil and environmental parameters:
        Temperature: ${localSensorData.temperature.value}${localSensorData.temperature.unit}
        Humidity: ${localSensorData.humidity.value}${localSensorData.humidity.unit}
        Soil Moisture: ${parseFloat(localSensorData.soilMoisture.value * 0.1).toFixed(1)}${localSensorData.soilMoisture.unit}
        Nitrogen: ${localSensorData.nitrogen.value}${localSensorData.nitrogen.unit}
        Phosphorus: ${localSensorData.phosphorus.value}${localSensorData.phosphorus.unit}
        Potassium: ${localSensorData.potassium.value}${localSensorData.potassium.unit}

        List only the crops that can grow well in these exact conditions. Do not include explanations or suggestions for adjusting conditions. Just a comma-separated list of suitable crop names.`;
        getGeminiResponse(prompt, 'cropPrediction');
    };

    const handleClearAllSuggestions = () => {
        setSoilHealthSuggestion('');
        setCropPrediction('');
    };

    const tableHeaderClass = `px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`;
    const tableCellClass = `px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`;
    const favorableInputClass = `w-full p-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`;
    const selectClass = `block w-full md:w-1/2 lg:w-1/3 px-4 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
    }`;

    return (
        <div className="p-6">
            <button
                onClick={() => onNavigate('home')}
                className={`mb-6 px-6 py-2 rounded-full font-semibold transition-all duration-300
                ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
                &larr; Back to Home
            </button>
            <h2 className={`text-4xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Result & Suggestions
            </h2>

            <div className={`p-6 rounded-lg shadow-xl mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Select Your Crop or Manual Input:
                </h3>
                <div className="mb-6 flex justify-center">
                    <select
                        value={selectedCrop}
                        onChange={handleCropChange}
                        className={selectClass}
                    >
                        {Object.keys(cropFavorableData).map(crop => (
                            <option key={crop} value={crop}>
                                {crop}
                            </option>
                        ))}
                    </select>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                            <th scope="col" className={tableHeaderClass}>Element</th>
                            <th scope="col" className={tableHeaderClass}>Present Data</th>
                            <th scope="col" className={tableHeaderClass}>Favorable for {selectedCrop}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Object.entries(localSensorData).map(([key, data]) => (
                            <tr key={key}>
                                <td className={`${tableCellClass} font-medium capitalize`}>{key.replace(/([A-Z])/g, ' $1')}</td>
                                <td className={`${tableCellClass} text-center`}>
                                    <span className={`px-2 py-1 rounded ${getColorCode(key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), data.value, data.favorable)}`}>
                                        {key === 'soilMoisture' ? parseFloat(data.value * 0.1).toFixed(1) : data.value} {data.unit}
                                    </span>
                                </td>
                                <td className={tableCellClass}>
                                    {selectedCrop === 'Manual' ? (
                                        <input
                                            type="text"
                                            value={manualFavorableData[key]}
                                            onChange={(e) => handleFavorableInputChange(key, e.target.value)}
                                            className={favorableInputClass}
                                            placeholder="e.g., 20~30°C or 70-100%"
                                        />
                                    ) : (
                                        data.favorable
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-8">
                    <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Color Code Meaning:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                            <span className="w-8 h-8 bg-red-500 rounded-md mr-3"></span>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Less than required</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-8 h-8 bg-green-500 rounded-md mr-3"></span>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Perfect amount</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-8 h-8 bg-yellow-500 rounded-md mr-3"></span>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Higher than required</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                <button
                    onClick={handleGetSoilHealthSuggestions}
                    disabled={loadingSoilHealth}
                    className={`flex items-center px-8 py-4 rounded-full shadow-xl text-xl font-semibold transition-all duration-300
                    ${loadingSoilHealth ? 'bg-gray-400 cursor-not-allowed' : (isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}`}
                >
                    <FlaskConical className="w-6 h-6 mr-3" />
                    {loadingSoilHealth ? 'Generating...' : 'Get Soil Health Suggestions'}
                </button>
                <button
                    onClick={handleGetCropPredictions}
                    disabled={loadingCropPrediction}
                    className={`flex items-center px-8 py-4 rounded-full shadow-xl text-xl font-semibold transition-all duration-300
                    ${loadingCropPrediction ? 'bg-gray-400 cursor-not-allowed' : (isDarkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600')}`}
                >
                    <Wheat className="w-6 h-6 mr-3" />
                    {loadingCropPrediction ? 'Generating...' : 'Get Crop Predictions'}
                </button>
            </div>

            {(soilHealthSuggestion || cropPrediction) && (
                <div className="flex justify-center mb-4">
                    <button
                        onClick={handleClearAllSuggestions}
                        className={`flex items-center px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300
                        ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        <XCircle className="w-5 h-5 mr-2" />
                        Clear All Suggestions
                    </button>
                </div>
            )}


            {(soilHealthSuggestion || cropPrediction) && (
                <div className={`p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {soilHealthSuggestion && (
                        <>
                            <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Soil Health Suggestions:</h3>
                            <div className={`mt-4 p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} whitespace-pre-wrap mb-6`}>
                                {soilHealthSuggestion}
                            </div>
                        </>
                    )}
                    {cropPrediction && (
                        <>
                            <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Crop Predictions:</h3>
                            <div className={`mt-4 p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} whitespace-pre-wrap`}>
                                {cropPrediction}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// Main App Component
function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedParameter, setSelectedParameter] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [appSensorData, setAppSensorData] = useState(initialSensorData);

    // Initialize Firebase and authenticate
    useEffect(() => {
        const firebaseConfig = {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID,
        };
        
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.error("Firebase configuration is missing. Please set the REACT_APP_FIREBASE_* variables in your .env file.");
            return;
        }

        const app = initializeApp(firebaseConfig);
        const realtimeDb = getDatabase(app);
        const firebaseAuth = getAuth(app);

        setDb(realtimeDb);
        setAuth(firebaseAuth);

        const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    await signInAnonymously(firebaseAuth);
                } catch (error) {
                    console.error("Firebase authentication failed:", error);
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribeAuth();
    }, []);

    // Effect to listen for real-time sensor data from Realtime Database
    useEffect(() => {
        if (!db || !isAuthReady) return;

        const sensorDataRef = ref(db, 'SmartAgri');

        const unsubscribeDb = onValue(sensorDataRef, (snapshot) => {
            const fetchedData = snapshot.val();
            if (fetchedData) {
                setAppSensorData(prevData => ({
                    temperature: { ...prevData.temperature, value: parseFloat(fetchedData.temperature) || 0 },
                    humidity: { ...prevData.humidity, value: parseFloat(fetchedData.humidity) || 0 },
                    soilMoisture: { ...prevData.soilMoisture, value: parseFloat(fetchedData.sms) || 0 },
                    nitrogen: { ...prevData.nitrogen, value: parseFloat(fetchedData.nitro) || 0 },
                    phosphorus: { ...prevData.phosphorus, value: parseFloat(fetchedData.phospho) || 0 },
                    potassium: { ...prevData.potassium, value: parseFloat(fetchedData.potas) || 0 },
                }));
            } else {
                console.log("No sensor data found at 'SmartAgri' in Realtime Database.");
            }
        }, (error) => {
            console.error("Error fetching real-time sensor data from Realtime Database:", error);
        });

        return () => unsubscribeDb();
    }, [db, isAuthReady]);


    const handleNavigate = (page, parameter = null) => {
        setCurrentPage(page);
        setSelectedParameter(parameter);
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const appContainerClass = `min-h-screen font-inter transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`;

    if (!isAuthReady) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${appContainerClass}`}>
                <div className="text-center">
                    <p className="text-2xl font-semibold mb-2">Authenticating & Loading Data...</p>
                    <p className="text-lg">Please wait a moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={appContainerClass}>
            <div className="container mx-auto p-4">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={toggleDarkMode}
                        className={`p-3 rounded-full shadow-md transition-colors duration-300
                        ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-yellow-400 text-gray-800 hover:bg-yellow-300'}`}
                    >
                        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                </div>

                {currentPage === 'home' && (
                    <HomePage onNavigate={handleNavigate} isDarkMode={isDarkMode} sensorData={appSensorData} />
                )}
                {currentPage === 'detail' && selectedParameter && (
                    <DetailPage parameter={selectedParameter} onNavigate={handleNavigate} isDarkMode={isDarkMode} />
                )}
                {currentPage === 'results' && (
                    <ResultPage onNavigate={handleNavigate} isDarkMode={isDarkMode} sensorData={appSensorData} />
                )}
                {currentPage === 'soilAnalysis' && (
                    <LandSoilAnalysisPage onNavigate={handleNavigate} isDarkMode={isDarkMode} sensorData={appSensorData} />
                )}
            </div>
        </div>
    );
}

export default App;
