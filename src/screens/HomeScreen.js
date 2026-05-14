import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIAS_SIN_SELECCION = new Set(["Intro FIFA", "Especiales"]);

const esMismoDia = (fecha, hoy) => {
    const fechaNormalizada = new Date(fecha);
    return (
        fechaNormalizada.getFullYear() === hoy.getFullYear() &&
        fechaNormalizada.getMonth() === hoy.getMonth() &&
        fechaNormalizada.getDate() === hoy.getDate()
    );
};

export default function HomeScreen({
    estampas,
    navigation,
    compartirAvanceTexto,
    copiarAvanceTexto,
    importarDesdeTexto,
    historialRespaldos,
    restaurarDesdeHistorial,
    tieneCambios,
    ultimoGuardadoEn,
    restablecerAvance,
}) {
    const insets = useSafeAreaInsets();
    const { height } = Dimensions.get("window");
    const hoy = new Date();
    const [modalTextoVisible, setModalTextoVisible] = useState(false);
    const [modalHistorialVisible, setModalHistorialVisible] = useState(false);
    const [textoImportacion, setTextoImportacion] = useState("");
    const [errorImportacion, setErrorImportacion] = useState("");
    const historial = Array.isArray(historialRespaldos) ? historialRespaldos : [];
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

    const formatearNumero = (estampa) => {
        if (estampa.numero === 0) {
            return "00";
        }
        return String(estampa.numero);
    };

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
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        >
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
                                        #{formatearNumero(estampa)} · {estampa.nombre}
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
                                        #{formatearNumero(estampa)} · {estampa.nombre}
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

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Respaldo</Text>
                <View style={styles.sectionCard}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusPill, tieneCambios ? styles.statusWarn : styles.statusOk]}>
                            <Ionicons
                                name={tieneCambios ? "alert" : "checkmark"}
                                size={12}
                                color={tieneCambios ? "#b45309" : "#166534"}
                            />
                            <Text style={[styles.statusText, tieneCambios ? styles.statusTextWarn : styles.statusTextOk]}>
                                {tieneCambios ? "Sin guardar" : "Guardado"}
                            </Text>
                        </View>
                        {ultimoGuardadoEn ? (
                            <Text style={styles.statusTime}>Ultimo: {new Date(ultimoGuardadoEn).toLocaleString()}</Text>
                        ) : null}
                    </View>
                    <Text style={styles.cardEmpty}>
                        Tu avance se guarda automaticamente. Al volver a entrar veras lo ultimo.
                    </Text>
                    <View style={styles.backupRow}>
                        <Pressable
                            style={[styles.backupButton, styles.backupSecondary]}
                            onPress={compartirAvanceTexto}
                        >
                            <Ionicons name="share" size={16} color="#1f2937" />
                            <Text style={styles.backupText}>Compartir texto</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.backupButton, styles.backupSecondary]}
                            onPress={copiarAvanceTexto}
                        >
                            <Ionicons name="copy" size={16} color="#1f2937" />
                            <Text style={styles.backupText}>Copiar texto</Text>
                        </Pressable>
                    </View>
                    <View style={styles.backupRow}>
                        <Pressable
                            style={[styles.backupButton, styles.backupSecondary]}
                            onPress={() => {
                                setErrorImportacion("");
                                setTextoImportacion("");
                                setModalTextoVisible(true);
                            }}
                        >
                            <Ionicons name="clipboard" size={16} color="#1f2937" />
                            <Text style={styles.backupText}>Importar texto</Text>
                        </Pressable>
                    </View>
                    <Pressable
                        style={[styles.backupButton, styles.backupSecondary]}
                        onPress={() => setModalHistorialVisible(true)}
                    >
                        <Ionicons name="time" size={16} color="#1f2937" />
                        <Text style={styles.backupText}>Restaurar historial</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.backupButton, styles.backupDanger]}
                        onPress={restablecerAvance}
                    >
                        <Ionicons name="trash" size={16} color="#b91c1c" />
                        <Text style={styles.backupDangerText}>Restablecer avance</Text>
                    </Pressable>
                </View>
            </View>

            <Modal
                visible={modalTextoVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalTextoVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setModalTextoVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Importar desde texto</Text>
                            <Pressable
                                style={styles.modalClose}
                                onPress={() => setModalTextoVisible(false)}
                            >
                                <Ionicons name="close" size={18} color="#475569" />
                            </Pressable>
                        </View>
                        <ScrollView
                            style={styles.modalScroll}
                            contentContainerStyle={styles.modalScrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <TextInput
                                placeholder="Pega aqui el JSON del avance..."
                                value={textoImportacion}
                                onChangeText={(value) => {
                                    setTextoImportacion(value);
                                    if (errorImportacion) {
                                        setErrorImportacion("");
                                    }
                                }}
                                style={styles.modalInput}
                                multiline
                                autoCapitalize="none"
                                autoCorrect={false}
                                scrollEnabled
                            />
                            {errorImportacion ? (
                                <Text style={styles.importError}>{errorImportacion}</Text>
                            ) : null}
                        </ScrollView>
                        <View style={styles.importActions}>
                            <Pressable
                                style={[styles.backupButton, styles.backupSecondary]}
                                onPress={() => setModalTextoVisible(false)}
                            >
                                <Text style={styles.backupText}>Cancelar</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.backupButton, styles.backupPrimary]}
                                onPress={async () => {
                                    const resultado = await importarDesdeTexto(textoImportacion);
                                    if (resultado?.ok) {
                                        setModalTextoVisible(false);
                                        setTextoImportacion("");
                                        setErrorImportacion("");
                                    } else {
                                        setErrorImportacion(resultado?.mensaje ?? "No se pudo importar.");
                                    }
                                }}
                            >
                                <Text style={[styles.backupText, styles.backupTextPrimary]}>
                                    Importar
                                </Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={modalHistorialVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalHistorialVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setModalHistorialVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Historial de respaldo</Text>
                            <Pressable
                                style={styles.modalClose}
                                onPress={() => setModalHistorialVisible(false)}
                            >
                                <Ionicons name="close" size={18} color="#475569" />
                            </Pressable>
                        </View>
                        {historial.length === 0 ? (
                            <Text style={styles.modalEmpty}>No hay respaldos disponibles.</Text>
                        ) : (
                            <View style={styles.historyList}>
                                {historial.map((item, index) => (
                                    <Pressable
                                        key={`${item.guardadoEn}-${index}`}
                                        style={styles.historyItem}
                                        onPress={() => {
                                            Alert.alert(
                                                "Restaurar respaldo",
                                                "Esto reemplazara tu avance actual. ¿Deseas continuar?",
                                                [
                                                    { text: "Cancelar", style: "cancel" },
                                                    {
                                                        text: "Restaurar",
                                                        style: "destructive",
                                                        onPress: async () => {
                                                            await restaurarDesdeHistorial(item);
                                                            setModalHistorialVisible(false);
                                                        },
                                                    },
                                                ]
                                            );
                                        }}
                                    >
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyTitle}>
                                                {new Date(item.guardadoEn).toLocaleString()}
                                            </Text>
                                            <Text style={styles.historyMeta}>
                                                {Array.isArray(item.estampas) ? item.estampas.length : 0} estampas
                                            </Text>
                                        </View>
                                        <Ionicons name="arrow-forward" size={16} color="#64748b" />
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

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
    startImportButton: {
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: "#0f172a",
    },
    startImportText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#ffffff",
        fontFamily: "SpaceGrotesk_700Bold",
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
    backupRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    backupButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    backupPrimary: {
        backgroundColor: "#0f172a",
        borderColor: "#0f172a",
    },
    backupSecondary: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
    },
    backupDanger: {
        marginTop: 10,
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
    },
    backupText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1f2937",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    backupTextPrimary: {
        color: "#ffffff",
    },
    backupDangerText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#b91c1c",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
    },
    statusOk: {
        backgroundColor: "#dcfce7",
    },
    statusWarn: {
        backgroundColor: "#fef3c7",
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    statusTextOk: {
        color: "#166534",
    },
    statusTextWarn: {
        color: "#92400e",
    },
    statusTime: {
        fontSize: 11,
        color: "#64748b",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 14,
        gap: 10,
        maxHeight: "80%",
    },
    modalScroll: {
        maxHeight: 240,
    },
    modalScrollContent: {
        gap: 8,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    modalClose: {
        padding: 4,
    },
    modalInput: {
        height: 180,
        maxHeight: 220,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 10,
        fontSize: 12,
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_400Regular",
        textAlignVertical: "top",
    },
    importActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 4,
    },
    importError: {
        fontSize: 12,
        color: "#b91c1c",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    modalEmpty: {
        fontSize: 12,
        color: "#64748b",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    historyList: {
        gap: 8,
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
    },
    historyInfo: {
        flex: 1,
        gap: 2,
    },
    historyTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    historyMeta: {
        fontSize: 11,
        color: "#64748b",
        fontFamily: "SpaceGrotesk_400Regular",
    },
});
