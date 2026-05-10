import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const CATEGORIAS_SIN_SELECCION = new Set(["Intro FIFA", "Especiales"]);

const esMismoDia = (fecha, hoy) => {
    const fechaNormalizada = new Date(fecha);
    return (
        fechaNormalizada.getFullYear() === hoy.getFullYear() &&
        fechaNormalizada.getMonth() === hoy.getMonth() &&
        fechaNormalizada.getDate() === hoy.getDate()
    );
};

export default function HomeScreen({ estampas, navigation }) {
    const { height } = Dimensions.get("window");
    const hoy = new Date();
    const recientes = estampas
        .filter((estampa) => estampa.actualizadoEn)
        .sort((a, b) => new Date(b.actualizadoEn) - new Date(a.actualizadoEn));
    const recientesHoy = recientes.filter((estampa) => esMismoDia(estampa.actualizadoEn, hoy));
    const ultimasMarcadas = recientesHoy
        .filter((estampa) => estampa.estado === "obtenido")
        .slice(0, 3);
    const ultimasRepetidas = recientesHoy
        .filter((estampa) => estampa.repetidas > 0)
        .slice(0, 3);

    const progresoPorSeleccion = estampas.reduce((acc, estampa) => {
        if (CATEGORIAS_SIN_SELECCION.has(estampa.categoria)) {
            return acc;
        }
        if (!acc[estampa.equipo]) {
            acc[estampa.equipo] = { equipo: estampa.equipo, total: 0, obtenidas: 0 };
        }
        acc[estampa.equipo].total += 1;
        if (estampa.estado === "obtenido") {
            acc[estampa.equipo].obtenidas += 1;
        }
        return acc;
    }, {});

    const selecciones = Object.values(progresoPorSeleccion).map((entrada) => ({
        ...entrada,
        porcentaje:
            entrada.total === 0 ? 0 : Math.round((entrada.obtenidas / entrada.total) * 100),
    }));

    const topSelecciones = [...selecciones]
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 5);

    const completas = selecciones.filter((entrada) => entrada.porcentaje === 100);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.heroWrap}>
                <Image
                    source={require("../../assets/mundial_2026.png")}
                    style={styles.heroImage}
                    resizeMode="contain"
                />
                <Text style={styles.title}>ARKA</Text>

                <Text style={styles.scrollHint}>Desliza para continuar</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumen de hoy</Text>
                {recientesHoy.length === 0 ? (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionEmpty}>Aún no hay cambios</Text>
                    </View>
                ) : (
                    <View style={styles.sectionGrid}>
                        <View style={styles.sectionCard}>
                            <Text style={styles.cardTitle}>Últimas marcadas</Text>
                            {ultimasMarcadas.length === 0 ? (
                                <Text style={styles.cardEmpty}>Sin nuevas obtenidas hoy</Text>
                            ) : (
                                ultimasMarcadas.map((estampa) => (
                                    <Text key={estampa.id} style={styles.cardItem}>
                                        #{estampa.numero} · {estampa.nombre}
                                    </Text>
                                ))
                            )}
                        </View>
                        <View style={styles.sectionCard}>
                            <Text style={styles.cardTitle}>Últimas repetidas</Text>
                            {ultimasRepetidas.length === 0 ? (
                                <Text style={styles.cardEmpty}>Sin repetidas nuevas hoy</Text>
                            ) : (
                                ultimasRepetidas.map((estampa) => (
                                    <Text key={estampa.id} style={styles.cardItem}>
                                        #{estampa.numero} · {estampa.nombre}
                                    </Text>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top 5 selecciones</Text>
                <View style={styles.sectionCard}>
                    {topSelecciones.map((entrada) => (
                        <View key={entrada.equipo} style={styles.rankRow}>
                            <Text style={styles.rankTeam}>{entrada.equipo}</Text>
                            <Text style={styles.rankValue}>{entrada.porcentaje}%</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Selecciones completas</Text>
                {completas.length === 0 ? (
                    <View style={styles.sectionCard}>
                        <Text style={styles.cardEmpty}>
                            Aún no hay selecciones completadas
                        </Text>
                    </View>
                ) : (
                    <View style={styles.chips}>
                        {completas.map((entrada) => (
                            <View key={entrada.equipo} style={styles.chip}>
                                <Ionicons name="checkmark" size={12} color="#166534" />
                                <Text style={styles.chipText}>{entrada.equipo}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                <Pressable
                    style={styles.actionButton}
                    onPress={() => navigation.navigate("Mi álbum")}
                >
                    <Ionicons name="arrow-forward" size={20} color="#56595e" />
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 0,
        paddingBottom: 24,
        gap: 12,
    },
    heroWrap: {
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: Dimensions.get("window").height,
        paddingTop: 16,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#0f172a",
        textAlign: "center",
        alignSelf: "center",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    subtitle: {
        marginTop: 6,
        fontSize: 14,
        color: "#475569",
        textAlign: "center",
        alignSelf: "center",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    heroImage: {
        width: "100%",
        height: 200,
    },
    actions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginTop: 4,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
    },
    scrollHint: {
        fontSize: 12,
        color: "#94a3b8",
        textAlign: "center",
        marginTop: 6,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    section: {
        gap: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    sectionGrid: {
        gap: 12,
    },
    sectionCard: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 14,
        gap: 8,
    },
    sectionEmpty: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "600",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    cardItem: {
        fontSize: 12,
        color: "#475569",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    cardEmpty: {
        fontSize: 12,
        color: "#94a3b8",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    rankRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
    },
    rankTeam: {
        fontSize: 12,
        color: "#0f172a",
        fontWeight: "600",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    rankValue: {
        fontSize: 12,
        color: "#475569",
        fontWeight: "700",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#dcfce7",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    chipText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#166534",
        fontFamily: "SpaceGrotesk_500Medium",
    },
});
