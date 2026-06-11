import { Platform, StyleSheet } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

type LocationMapProps = {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  description: string;
};

export default function LocationMap({
  coordinate,
  description,
}: LocationMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      region={{
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      mapType={Platform.OS === "android" ? "none" : "standard"}
      showsCompass
      showsScale
    >
      <UrlTile
        maximumZ={19}
        shouldReplaceMapContent={Platform.OS === "ios"}
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        coordinate={coordinate}
        title="Người dùng"
        description={description}
      />
    </MapView>
  );
}
