import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function StatCard({
    etiqueta,
    valor,
    icono,
    colorIcono = "#2563eb",
    fondoIcono = "#dbeafe",
}) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                {icono ? (
                    <View style={[styles.iconWrap, { backgroundColor: fondoIcono }]}>
                        <Ionicons name={icono} size={18} color={colorIcono} />
                    </View>
                ) : null}
                <Text style={styles.label}>{etiqueta}</Text>
            </View>
            <Text style={styles.value}>{valor}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f4f4f5",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e4e4e7",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 12,
        color: "#52525b",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    value: {
        marginTop: 6,
        fontSize: 20,
        fontWeight: "600",
        color: "#111827",
        fontFamily: "SpaceGrotesk_700Bold",
    },
});
