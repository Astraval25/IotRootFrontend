#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "{{WIFI_SSID}}";
const char* password = "{{WIFI_PASSWORD}}";
const char* mqtt_server = "{{MQTT_HOST}}";
const int mqtt_port = {{MQTT_PORT}};
const char* mqtt_user = "{{MQTT_USERNAME}}";
const char* mqtt_password = "{{MQTT_PASSWORD}}"; // Same as your account password for the starter device
const char* mqtt_topic = "{{MQTT_TOPIC}}";
const char* mqtt_client_id = "{{MQTT_CLIENT_ID}}";

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");

    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println("; retrying in 2 seconds");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  randomSeed(millis());
  delay(2000);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  float temperature = random(200, 350) / 10.0; // 20.0 C - 35.0 C
  String payload = String("{\"temperature\":") + temperature + "}";

  Serial.print("Publishing: ");
  Serial.println(payload);
  client.publish(mqtt_topic, payload.c_str());

  delay(3000); // Send a temperature reading every 3 seconds
}
