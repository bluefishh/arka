import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { useState, useMemo } from "react";
import { obtenerBanderaSvg } from "../utils/flags";
import { SELECCIONES } from "../data/teams";

const CATEGORIAS_SIN_SELECCION = new Set(["Intro FIFA", "Especiales"]);
const GRUPOS = ["GENERAL", "FWC", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "COCACOLA"];
const GRUPOS_ORDEN = ["FWC", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "COCACOLA"];

const obtenerEtiquetaGrupo = (grupo) => {
    if (grupo === "GENERAL") return "General";
    if (grupo === "FWC") return "FWC";
    if (grupo === "COCACOLA") return "CocaCola";
    return `Grupo ${grupo}`;
};

const obtenerClaveSeleccion = (estampa) => String(estampa.codigo || "").split("-")[0];

const obtenerEtiquetaSeleccion = (seleccion) => {
    if (!seleccion) {
        return "";
    }
    return seleccion.rango
        ? `${seleccion.nombre} ${seleccion.rango} (${seleccion.codigo})`
        : `${seleccion.nombre} (${seleccion.codigo})`;
};

export default function ProgressScreen({ estampas }) {
    const [grupoActivo, setGrupoActivo] = useState("GENERAL");

    const estampasPorSeleccion = estampas.reduce((acc, estampa) => {
        if (CATEGORIAS_SIN_SELECCION.has(estampa.categoria)) {
            return acc;
        }
        const clave = obtenerClaveSeleccion(estampa);
        if (!acc[clave]) {
            acc[clave] = [];
        }
        acc[clave].push(estampa);
        return acc;
    }, {});

    const progreso = useMemo(() => {
        let items = SELECCIONES.map((seleccion) => {
            const estampasSeleccion = estampasPorSeleccion[seleccion.codigo] ?? [];
            const total = seleccion.cantidad ?? 20;
            const obtenidas = estampasSeleccion.reduce(
                (acumulado, estampa) => acumulado + (estampa.estado === "obtenido" ? 1 : 0),
                0
            );
            const repetidas = estampasSeleccion.reduce(
                (acumulado, estampa) => acumulado + (estampa.repetidas > 0 ? estampa.repetidas : 0),
                0
            );
            return {
                equipo: seleccion.nombre,
                codigo: seleccion.codigo,
                grupo: seleccion.grupo || "GENERAL",
                total,
                obtenidas,
                repetidas,
                faltantes: total - obtenidas,
                porcentaje: total === 0 ? 0 : Math.round((obtenidas / total) * 100),
            };
        }).filter((item) => !CATEGORIAS_SIN_SELECCION.has(item.grupo));
        
        if (grupoActivo !== "GENERAL") {
            items = items.filter((item) => item.grupo === grupoActivo);
        }

        return items.sort((a, b) => {
            if (b.porcentaje !== a.porcentaje) {
                return b.porcentaje - a.porcentaje;
            }
            return b.obtenidas - a.obtenidas;
        });
    }, [grupoActivo, estampasPorSeleccion]);

    const gruposObj = SELECCIONES.reduce((acc, seleccion) => {
        const grupo = seleccion.grupo || "GENERAL";
        if (grupo === "GENERAL") {
            return acc;
        }
        if (!acc[grupo]) {
            acc[grupo] = { grupo, total: 0, obtenidas: 0, repetidas: 0 };
        }
        const estampasSeleccion = estampasPorSeleccion[seleccion.codigo] ?? [];
        acc[grupo].total += seleccion.cantidad ?? 20;
        acc[grupo].obtenidas += estampasSeleccion.reduce(
            (acumulado, estampa) => acumulado + (estampa.estado === "obtenido" ? 1 : 0),
            0
        );
        acc[grupo].repetidas += estampasSeleccion.reduce(
            (acumulado, estampa) => acumulado + (estampa.repetidas > 0 ? estampa.repetidas : 0),
            0
        );
        return acc;
    }, {});

    const progresoPorGrupo = GRUPOS_ORDEN.map((grupo) => {
        const entrada = gruposObj[grupo] ?? { grupo, total: 0, obtenidas: 0, repetidas: 0 };
        return {
            ...entrada,
            grupo,
            faltantes: entrada.total - entrada.obtenidas,
            porcentaje:
                entrada.total === 0
                    ? 0
                    : Math.round((entrada.obtenidas / entrada.total) * 100),
        };
    }).sort((a, b) => {
        if (b.porcentaje !== a.porcentaje) {
            return b.porcentaje - a.porcentaje;
        }
        return b.obtenidas - a.obtenidas;
    });

    const totales = progresoPorGrupo.reduce(
        (acc, item) => {
            acc.total += item.total;
            acc.obtenidas += item.obtenidas;
            acc.repetidas += item.repetidas;
            return acc;
        },
        { total: 0, obtenidas: 0, repetidas: 0 }
    );
    const porcentajeTotal =
        totales.total === 0
            ? 0
            : Math.round((totales.obtenidas / totales.total) * 100);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Progreso</Text>
            <View style={styles.heroRow}>
                <View style={styles.heroCard}>
                    <View>
                        <Text style={styles.heroLabel}>Completado</Text>
                        <Text style={styles.heroValue}>{totales.obtenidas} de {totales.total}</Text>
                    </View>
                    <Text style={styles.heroPercent}>{porcentajeTotal}%</Text>
                </View>
            </View>
            <View style={styles.heroRow}>
                <View style={[styles.heroCard, { flex: 1 }]}>
                    <View>
                        <Text style={styles.heroLabel}>Faltantes</Text>
                        <Text style={styles.heroValue}>{totales.total - totales.obtenidas}</Text>
                    </View>
                    <Text style={styles.heroPercent}>-</Text>
                </View>
                <View style={[styles.heroCard, { flex: 1 }]}>
                    <View>
                        <Text style={styles.heroLabel}>Repetidas</Text>
                        <Text style={styles.heroValue}>{totales.repetidas}</Text>
                    </View>
                    <Text style={styles.heroPercent}>+</Text>
                </View>
            </View>
            <View style={{ height: 12 }} />
            <Text style={[styles.title, { fontSize: 16, marginBottom: 8 }]}>Por grupos</Text>
            <View style={styles.groupsWrap}>
                <FlatList
                    data={progresoPorGrupo}
                    keyExtractor={(item) => item.grupo}
                    horizontal
                    style={{ marginBottom: 12 }}
                    contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8 }}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={[styles.summaryCard, styles.summaryCardHorizontal, { minWidth: 220 }]}>
                            <View style={styles.summaryHeader}>
                                <Ionicons name="albums" size={14} color="#0f172a" />
                                <Text style={styles.summaryLabel}>{obtenerEtiquetaGrupo(item.grupo)}</Text>
                            </View>
                            <Text style={styles.summaryValue}>{item.total}</Text>
                            <Text style={styles.cardMeta}>Obtenidos {item.obtenidas} · Faltantes {item.faltantes}</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${item.porcentaje}%` }]} />
                            </View>
                            <Text style={[styles.cardPercent, { marginTop: 6 }]}>{item.porcentaje}%</Text>
                        </View>
                    )}
                />
            </View>
            <View style={{ height: 12 }} />
            <View style={styles.groupRow}>
                {GRUPOS.map((grupo) => (
                    <Pressable
                        key={grupo}
                        style={[styles.groupChip, grupoActivo === grupo && styles.groupChipActive]}
                        onPress={() => setGrupoActivo(grupo)}
                    >
                        <Text
                            style={[
                                styles.groupText,
                                grupoActivo === grupo && styles.groupTextActive,
                            ]}
                        >
                            {obtenerEtiquetaGrupo(grupo)}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <FlatList
                data={progreso}
                keyExtractor={(item) => item.codigo}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => {
                    const seleccion = SELECCIONES.find((s) => s.codigo === item.codigo) ?? null;
                    const mostrarBandera = seleccion && seleccion.grupo !== "FWC" && seleccion.grupo !== "COCACOLA";
                    const banderaXml = mostrarBandera ? obtenerBanderaSvg(seleccion.codigo) : null;
                    return (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    {banderaXml ? (
                                        <SvgXml xml={banderaXml} width={28} height={18} style={{ borderRadius: 4 }} />
                                    ) : null}
                                    <Text style={styles.cardTitle}>{obtenerEtiquetaSeleccion(seleccion)}</Text>
                                </View>
                                <Text style={styles.cardPercent}>{item.porcentaje}%</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${item.porcentaje}%` }]} />
                            </View>
                            <Text style={styles.cardMeta}>
                                Obtenidos {item.obtenidas} · Faltantes {item.faltantes} · Repetidas {item.repetidas}
                            </Text>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f8fafc",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 12,
        fontFamily: "SpaceGrotesk_700Bold",
    },
    summary: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 12,
    },
    heroRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 12,
    },
    heroCard: {
        flex: 1,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    heroCardAlt: {
        backgroundColor: "#111827",
    },
    heroLabel: {
        fontSize: 11,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    heroValue: {
        marginTop: 4,
        fontSize: 22,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    heroPercent: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    summaryCard: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    summaryLabel: {
        fontSize: 11,
        color: "#64748b",
        letterSpacing: 1,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    summaryValue: {
        marginTop: 4,
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    list: {
        paddingBottom: 24,
    },
    card: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    cardPercent: {
        fontSize: 12,
        fontWeight: "700",
        color: "#475569",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    progressBar: {
        marginTop: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: "#e5e7eb",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#475569",
    },
    cardMeta: {
        marginTop: 4,
        fontSize: 12,
        color: "#6b7280",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    summaryCardHorizontal: {
        alignSelf: "flex-start",
        marginRight: 8,
    },
    groupsWrap: {
        backgroundColor: "#f8fafc"
    },
    summaryCardHorizontal: {
        alignSelf: "flex-start",
        marginRight: 8,
        zIndex: 2,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    groupRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    groupChip: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "#e2e8f0",
    },
    groupChipActive: {
        backgroundColor: "#0f172a",
    },
    groupText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1e293b",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    groupTextActive: {
        color: "#f8fafc",
    },
});
