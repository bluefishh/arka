import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { obtenerBanderaSvg } from "../utils/flags";

const formatearNumeroEstampa = (numero) => {
    return numero === 0 ? "00" : String(numero);
};

export default function StickerRow({
    estampa,
    alCambiarEstado,
    alSumarRepetida,
    alRestarRepetida,
}) {
    const estaObtenida = estampa.estado === "obtenido";
    const estiloTipo = estampa.tipo === "Normal" ? styles.badgeMuted : styles.badgeAccent;

    return (
        <View style={styles.row}>
            <View style={styles.infoRow}>
                {(() => {
                    const countryCode = String(estampa.codigo || "").split("-")[0];
                    const xml = obtenerBanderaSvg(countryCode);
                    if (xml) {
                        return (
                            <SvgXml
                                xml={xml}
                                width={36}
                                height={26}
                                style={styles.rowFlag}
                            />
                        );
                    }
                    return null;
                })()}
                <View style={styles.info}>
                <Text style={styles.title}>
                    #{formatearNumeroEstampa(estampa.numero)} {estampa.codigo}
                </Text>
                <Text style={styles.name}>{estampa.nombre}</Text>
                <Text style={styles.meta}>{estampa.equipo}</Text>
                <View style={styles.badges}>
                    <Text style={[styles.badge, styles.badgeNeutral]}>{estampa.categoria}</Text>
                    <Text style={[styles.badge, estiloTipo]}>{estampa.tipo}</Text>
                </View>
                </View>
            </View>

            <View style={styles.actions}>
                <View style={styles.repeatControls}>
                    <Pressable style={[styles.repeatBtn, styles.repeatBtnGhost]} onPress={alRestarRepetida}>
                        <Ionicons name="remove" size={16} color="#0f172a" />
                    </Pressable>
                    <View style={styles.repeatCount}>
                        <Text style={styles.repeatCountText}>{estampa.repetidas}</Text>
                    </View>
                    <Pressable style={[styles.repeatBtn, styles.repeatBtnPrimary]} onPress={alSumarRepetida}>
                        <Ionicons name="add" size={16} color="#ffffff" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        gap: 12,
        padding: 12,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    info: {
        flex: 1,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    rowFlag: {
        borderRadius: 6,
        overflow: "hidden",
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    name: {
        marginTop: 4,
        fontSize: 13,
        color: "#1f2937",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    meta: {
        marginTop: 4,
        fontSize: 12,
        color: "#6b7280",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    badges: {
        marginTop: 8,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: "600",
        color: "#0f172a",
        backgroundColor: "#e2e8f0",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    badgeSuccess: {
        backgroundColor: "#dcfce7",
        color: "#166534",
    },
    badgeWarning: {
        backgroundColor: "#fef9c3",
        color: "#854d0e",
    },
    badgeAccent: {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
    },
    badgeNeutral: {
        backgroundColor: "#f1f5f9",
        color: "#0f172a",
    },
    badgeMuted: {
        backgroundColor: "#f3f4f6",
        color: "#475569",
    },
    actions: {
        justifyContent: "center",
        gap: 6,
        alignItems: "flex-end",
    },
    repeatControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        justifyContent: "center",
    },
    repeatBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    repeatBtnGhost: {
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
    },
    repeatBtnPrimary: {
        backgroundColor: "#0f172a",
        borderColor: "#0f172a",
    },
    repeatCount: {
        minWidth: 44,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    repeatCountText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: "#0f172a",
        borderRadius: 8,
        alignItems: "center",
        minWidth: 44,
    },
    primaryButton: {
        backgroundColor: "#2563eb",
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    buttonText: {
        fontSize: 11,
        color: "#f8fafc",
        fontWeight: "600",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    repeatRow: {
        flexDirection: "row",
        gap: 6,
    },
    iconButton: {
        backgroundColor: "#0f172a",
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    iconText: {
        fontSize: 11,
        color: "#f8fafc",
        fontWeight: "700",
    },
});
