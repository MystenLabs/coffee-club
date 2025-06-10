interface SensorData {
    steamValue: number;
    photocellValue: number;
    soilHumidityValue: number;
    temperature?: number;
    humidity?: number;
    dht11_error?: boolean; // If true, indicates a DHT11 error, with no temperature/humidity data
    ultrasonicDistance?: number | string;
    ultrasonicError?: string;
    motionDetected: boolean;
  }
  
  /**
   * Parses a JSON string representing sensor data from an Arduino.
   *
   * @param jsonString The JSON string to parse.
   * @returns A SensorData object representing the parsed data, or null if parsing fails.
   */
  function parseSensorData(jsonString: string): SensorData | null {
    try {
      const data: any = JSON.parse(jsonString);
  
      // Validate basic required properties
      if (
        typeof data.steamValue !== 'number' ||
        typeof data.photocellValue !== 'number' ||
        typeof data.soilHumidityValue !== 'number' ||
        typeof data.motionDetected !== 'boolean'
      ) {
        console.error("Missing or invalid required properties in JSON:", data);
        return null;
      }
  
      // Type guard and handle ultrasonicDistance, ultrasonicError, and temperature/humidity
      let ultrasonicDistance: number | string | undefined = undefined;
      let ultrasonicError: string | undefined = undefined;
      let temperature: number | undefined = undefined;
      let humidity: number | undefined = undefined;
      let dht11_error: boolean | undefined = undefined;
  
  
      if (data.ultrasonicDistance !== undefined) {
        if (typeof data.ultrasonicDistance === 'number') {
          ultrasonicDistance = data.ultrasonicDistance;
        } else if (typeof data.ultrasonicDistance === 'string') {
          ultrasonicDistance = data.ultrasonicDistance;
        } else {
          console.warn("Invalid type for ultrasonicDistance.  Expected number or string. Got: ", typeof data.ultrasonicDistance);
          ultrasonicDistance = undefined; // Don't pass through an invalid value
        }
      }
  
      if (data.ultrasonicError !== undefined && typeof data.ultrasonicError === 'string') {
        ultrasonicError = data.ultrasonicError;
      }
  
      if (data.temperature !== undefined && typeof data.temperature === 'number' &&
          data.humidity !== undefined && typeof data.humidity === 'number') {
        temperature = data.temperature;
        humidity = data.humidity;
      }
  
      if (data.dht11_error !== undefined && typeof data.dht11_error === 'boolean') {
          dht11_error = data.dht11_error;
      }
  
      const sensorData: SensorData = {
        steamValue: data.steamValue,
        photocellValue: data.photocellValue,
        soilHumidityValue: data.soilHumidityValue,
        temperature: temperature,
        humidity: humidity,
        dht11_error: dht11_error,
        ultrasonicDistance: ultrasonicDistance,
        ultrasonicError: ultrasonicError,
        motionDetected: data.motionDetected,
      };
  
      return sensorData;
  
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  }
  
  // Example usage:
  const jsonString1 = '{"steamValue":0,"photocellValue":2142,"soilHumidityValue":0,"temperature":25,"humidity":48,"ultrasonicError":"timeout","motionDetected":false}';
  const jsonString2 = '{"steamValue":0,"photocellValue":1250,"soilHumidityValue":0,"temperature":25,"humidity":47,"ultrasonicDistance":6,"motionDetected":true}';
  const jsonString3 = '{"steamValue":0,"photocellValue":1411,"soilHumidityValue":0,"temperature":25,"humidity":48,"ultrasonicDistance":12,"motionDetected":false}';
  const jsonString4 = '{"steamValue":0,"photocellValue":2149,"soilHumidityValue":0,"temperature":25,"humidity":48,"ultrasonicError":"timeout","motionDetected":false}';
  const jsonString5 = '{"steamValue":0,"photocellValue":2195,"soilHumidityValue":0,"temperature":25,"humidity":48,"ultrasonicError":"timeout","motionDetected":false}';
  const jsonString6 = '{"steamValue":0,"photocellValue":2195,"soilHumidityValue":0,"dht11_error":true,"ultrasonicDistance":"N/A","motionDetected":false}';
  
  
  const data1 = parseSensorData(jsonString1);
  const data2 = parseSensorData(jsonString2);
  const data3 = parseSensorData(jsonString3);
  const data4 = parseSensorData(jsonString4);
  const data5 = parseSensorData(jsonString5);
  const data6 = parseSensorData(jsonString6);
  
  
  console.log("Data 1:", data1);
  console.log("Data 2:", data2);
  console.log("Data 3:", data3);
  console.log("Data 4:", data4);
  console.log("Data 5:", data5);
  console.log("Data 6:", data6);