'use client';

import { useState, useEffect } from 'react'
import { Search, Droplets, Wind, Thermometer } from 'lucide-react'
import { motion } from 'framer-motion'

const API_KEY = '9f57b3e27e4e963e038d274d3953f88a';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const GEOCODING_API_URL = 'http://api.openweathermap.org/geo/1.0/direct';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  condition: string;
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
}

export default function Home() {
  const [location, setLocation] = useState('')
  const [unit, setUnit] = useState('C')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!location) return;
    setIsLoading(true);
    try {
      const geoResponse = await fetch(`${GEOCODING_API_URL}?q=${location}&limit=1&appid=${API_KEY}`);
      const geoData = await geoResponse.json();
      if (geoData.length > 0) {
        setCoordinates({ lat: geoData[0].lat, lon: geoData[0].lon });
      } else {
        throw new Error('Nie znaleziono lokalizacji');
      }
    } catch (error) {
      console.error('Błąd wyszukiwania lokalizacji:', error);
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      if (!coordinates) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${WEATHER_API_URL}?lat=${coordinates.lat}&lon=${coordinates.lon}&units=metric&appid=${API_KEY}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setWeather({
          temperature: data.current.temp,
          humidity: data.current.humidity,
          windSpeed: data.current.wind_speed,
          pressure: data.current.pressure,
          condition: data.current.weather[0].main.toLowerCase(),
          forecast: data.daily.slice(1, 6).map((day: any) => ({
            day: new Date(day.dt * 1000).toLocaleDateString('pl-PL', { weekday: 'short' }),
            temp: day.temp.day,
            condition: day.weather[0].main.toLowerCase()
          }))
        });
      } catch (error) {
        console.error('Błąd pobierania danych pogodowych:', error);
        setWeather(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [coordinates]);

  const convertTemp = (temp: number) => {
    if (unit === 'F') {
      return Math.round((temp * 9/5) + 32)
    }
    return Number(temp.toFixed(1))
  }

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Wpisz lokalizację..."
            className="flex-grow p-2 border-b-2 border-black focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="ml-2">
            <Search />
          </button>
        </div>

        <div className="text-center mb-8">
          {isLoading ? (
            <div>Ładowanie...</div>
          ) : weather ? (
            <>
              <motion.div
                className="text-8xl font-bold mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {convertTemp(weather.temperature)}°{unit}
              </motion.div>
              <WeatherIcon condition={weather.condition} />
            </>
          ) : (
            <div>Wpisz lokalizację i kliknij lupę, aby wyszukać pogodę</div>
          )}
        </div>

        {weather && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <InfoCard icon={<Droplets />} value={`${weather.humidity}%`} label="Wilgotność" />
              <InfoCard icon={<Wind />} value={`${weather.windSpeed} m/s`} label="Wiatr" />
              <InfoCard icon={<Thermometer />} value={`${weather.pressure} hPa`} label="Ciśnienie" />
            </div>

            <div className="flex justify-between">
              {weather.forecast.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="font-bold">{day.day}</div>
                  <WeatherIcon condition={day.condition} small />
                  <div>{convertTemp(day.temp)}°</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Zmień na °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className="flex flex-col items-center p-4 border border-black rounded">
      {icon}
      <div className="font-bold mt-2">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  )
}

function WeatherIcon({ condition, small = false }: { condition: string, small?: boolean }) {
  const size = small ? 'w-8 h-8' : 'w-24 h-24'
  const smallSize = 'w-6 h-6'  // Nowy, mniejszy rozmiar dla prognozy
  
  const iconSize = small ? smallSize : size
  
  switch (condition.toLowerCase()) {
    case 'clear':
    case 'sunny':
      return (
        <motion.div className={`${iconSize} relative`}>
          <motion.div
            className={`absolute inset-0 bg-yellow-400 rounded-full`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
          {!small && (
            <motion.div
              className="absolute inset-0"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-2 bg-yellow-300"
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: '0 -8px',
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      )
    case 'rain':
    case 'rainy':
      return (
        <motion.div className={`${iconSize} relative bg-gray-300 rounded-full overflow-hidden`}>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-2 bg-blue-500 rounded"
              initial={{ y: -10, x: `${i * 30}%` }}
              animate={{ y: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 1 + i * 0.2,
                ease: "linear",
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      )
    case 'snow':
    case 'snowy':
      return (
        <motion.div className={`${iconSize} relative bg-blue-100 rounded-full overflow-hidden`}>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{ y: -10, x: `${i * 30}%` }}
              animate={{ y: '100%', rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 3 + i * 0.5,
                ease: "linear",
                delay: i * 0.3
              }}
            />
          ))}
        </motion.div>
      )
    case 'clouds':
    case 'cloudy':
      return (
        <motion.div className={`${iconSize} relative`}>
          <motion.div
            className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gray-300 rounded-full"
            animate={{ x: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/3 w-2/3 h-1/2 bg-gray-400 rounded-full"
            animate={{ x: [2, -2, 2] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          />
        </motion.div>
      )
    case 'mist':
    case 'fog':
      return (
        <motion.div className={`${iconSize} relative overflow-hidden`}>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-1 bg-gray-300"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 5 + i * 0.5,
                ease: "linear",
                delay: i * 0.5
              }}
              style={{ top: `${i * 33.33}%` }}
            />
          ))}
        </motion.div>
      )
    default:
      return (
        <div className={`${iconSize} bg-gray-300 rounded-full`} />
      )
  }
}