import React from "react";
import { StyleSheet, View } from "react-native";

type LocationMapProps = {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  description: string;
};

const MAP_DELTA = 0.01;

export default function LocationMap({
  coordinate,
  description,
}: LocationMapProps) {
  const source = createOpenStreetMapEmbedUrl(coordinate);

  return (
    <View style={styles.container}>
      {React.createElement("iframe", {
        "aria-label": description,
        src: source,
        style: {
          border: 0,
          height: "100%",
          width: "100%",
        },
        title: "Vị trí người dùng",
      })}
    </View>
  );
}

function createOpenStreetMapEmbedUrl({
  latitude,
  longitude,
}: LocationMapProps["coordinate"]) {
  const bounds = [
    longitude - MAP_DELTA,
    latitude - MAP_DELTA,
    longitude + MAP_DELTA,
    latitude + MAP_DELTA,
  ].join(",");
  const params = new URLSearchParams({
    bbox: bounds,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
