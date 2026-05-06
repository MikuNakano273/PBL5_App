import Card from "@/components/Card";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const blindProfile = {
  fullName: "Nguyễn Minh An",
  age: "28 tuổi",
  gender: "Nam",
  visionStatus: "Khiếm thị hoàn toàn",
  supportNeed: "Cần hỗ trợ định vị và cảnh báo vật cản",
  homeArea: "Hải Châu, Đà Nẵng",
  safeZone: "Bán kính 200m quanh nhà",
  linkedDevice: "NC-01 Smart Cane",
  deviceStatus: "Đang kết nối ổn định",
  lastActivity: "Cập nhật 1 phút trước",
  healthNotes: [
    "Ưu tiên cảnh báo bằng âm thanh và rung",
    "Tự di chuyển quen thuộc trong khu vực an toàn",
    "Cần thông báo ngay khi rời vùng an toàn",
  ],
  contacts: [
    { label: "Liên hệ khẩn", value: "Chị Lan • 0918 456 789" },
    { label: "Bác sĩ hỗ trợ", value: "BS. Trần Quốc Huy • 0902 888 115" },
  ],
};

export default function AccountScreen() {
  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Card style={styles.heroCard}>
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="account-heart-outline"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={styles.badgeText}>Hồ sơ người khiếm thị</Text>
          </View>

          <Text style={styles.name}>{blindProfile.fullName}</Text>
          <Text style={styles.role}>{blindProfile.supportNeed}</Text>

          <View style={styles.metricRow}>
            <MetricBlock
              icon="eye-off-outline"
              label="Tình trạng thị lực"
              value={blindProfile.visionStatus}
            />
            <MetricBlock
              icon="access-point"
              label="Kết nối"
              value="Ổn định"
              highlight="success"
            />
          </View>

          <View style={styles.notice}>
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              size={18}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>{blindProfile.lastActivity}</Text>
              <Text style={styles.noticeText}>
                Hệ thống theo dõi vị trí, vùng an toàn và cảnh báo vật cản từ
                gậy thông minh của người khiếm thị.
              </Text>
            </View>
          </View>
        </Card>

        <SectionTitle title="Thông tin cá nhân" />
        <Card style={styles.sectionCard}>
          <InfoRow icon="calendar-account-outline" label="Tuổi" value={blindProfile.age} />
          <Divider />
          <InfoRow icon="gender-male-female" label="Giới tính" value={blindProfile.gender} />
          <Divider />
          <InfoRow
            icon="map-marker-outline"
            label="Khu vực sinh hoạt"
            value={blindProfile.homeArea}
          />
          <Divider />
          <InfoRow icon="shield-home-outline" label="Vùng an toàn" value={blindProfile.safeZone} />
        </Card>

        <SectionTitle title="Ghi chú hỗ trợ" />
        <Card style={styles.sectionCard}>
          {blindProfile.healthNotes.map((item) => (
            <View key={item} style={styles.permissionRow}>
              <View style={styles.permissionDot}>
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.permissionText}>{item}</Text>
            </View>
          ))}
        </Card>

        <SectionTitle title="Hỗ trợ liên quan" />
        <Card style={styles.sectionCard}>
          <InfoRow
            icon="walk"
            label="Thiết bị gậy"
            value={blindProfile.linkedDevice}
          />
          <Divider />
          <InfoRow
            icon="access-point-network"
            label="Trạng thái thiết bị"
            value={blindProfile.deviceStatus}
            valueColor={theme.colors.success}
          />
          {blindProfile.contacts.map((contact) => (
            <React.Fragment key={contact.label}>
              <Divider />
              <InfoRow
                icon="card-account-phone-outline"
                label={contact.label}
                value={contact.value}
              />
            </React.Fragment>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function MetricBlock({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  highlight?: "success";
}) {
  const accent =
    highlight === "success" ? theme.colors.success : theme.colors.primary;

  return (
    <View style={styles.metricBlock}>
      <View style={[styles.metricIcon, { backgroundColor: `${accent}16` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={theme.colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing(3),
  },
  heroCard: {
    gap: theme.spacing(2),
    backgroundColor: "#F4F8FF",
    borderColor: "#CFE0FF",
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: `${theme.colors.primary}14`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}28`,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  name: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  role: {
    color: theme.colors.subText,
    fontSize: 13,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: "#D8E5FF",
    borderRadius: theme.radius.lg,
    padding: theme.spacing(1.5),
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricLabel: {
    color: theme.colors.subText,
    fontSize: 11,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  notice: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: theme.spacing(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: "#D8E5FF",
  },
  noticeTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  noticeText: {
    color: theme.colors.subText,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  sectionCard: {
    gap: theme.spacing(1),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: `${theme.colors.primary}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: theme.colors.subText,
    fontSize: 12,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 52,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  permissionDot: {
    width: 28,
    height: 28,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.primary}16`,
  },
  permissionText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
