const tokens = {
  WIFI_SSID: 'ssid',
  WIFI_PASSWORD: 'wifiPassword',
  MQTT_HOST: 'host',
  MQTT_PORT: 'port',
  MQTT_USERNAME: 'username',
  MQTT_PASSWORD: 'mqttPassword',
  MQTT_TOPIC: 'topic',
  MQTT_CLIENT_ID: 'clientId',
}

export function escapeArduinoString(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

export function buildStarterSketch(template, configuration) {
  return Object.entries(tokens).reduce((sketch, [token, key]) => {
    const value = key === 'port' ? String(configuration[key] ?? 1883) : escapeArduinoString(configuration[key])
    return sketch.replaceAll(`{{${token}}}`, value)
  }, template)
}

export function isStarterSketchReady(configuration) {
  return ['ssid', 'wifiPassword', 'mqttPassword', 'host', 'username', 'topic', 'clientId']
    .every(key => String(configuration[key] ?? '').trim().length > 0)
}
