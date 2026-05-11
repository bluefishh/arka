import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    TextInput,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { obtenerBanderaSvg } from "../utils/flags";
import { SELECCIONES } from "../data/teams";

const GRUPOS = [
    "GENERAL",
    "FWC",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "COCACOLA",
];


const obtenerEtiquetaGrupo = (grupo) => {
    if (grupo === "GENERAL") {
        return "General";
    }
    if (grupo === "FWC") {
        return "FWC";
    }
    if (grupo === "COCACOLA") {
        return "CocaCola";
    }
    return `Grupo ${grupo}`;
};

const obtenerEtiquetaSeleccion = (seleccion) => {
    if (!seleccion) {
        return "";
    }
    return seleccion.rango
        ? `${seleccion.nombre} ${seleccion.rango} (${seleccion.codigo})`
        : `${seleccion.nombre} (${seleccion.codigo})`;
};

const obtenerNumeroEstampa = (seleccion, puesto) => {
    return seleccion.inicio + puesto - 1;
};

const formatearNumeroEstampa = (numero) => {
    return numero === 0 ? "00" : String(numero);
};

export default function AlbumScreen({ estampas, actualizarEstampa }) {
    const [grupoActivo, setGrupoActivo] = useState("GENERAL");
    const [pickerAbierto, setPickerAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const seleccionesGrupo = useMemo(() => {
        if (grupoActivo === "GENERAL") {
            return SELECCIONES;
        }
        return SELECCIONES.filter((seleccion) => seleccion.grupo === grupoActivo);
    }, [grupoActivo]);
    const [seleccionActiva, setSeleccionActiva] = useState(
        seleccionesGrupo[0]?.codigo ?? ""
    );

    const seleccionesFiltradas = useMemo(() => {
        if (!busqueda || busqueda.trim() === "") return seleccionesGrupo;
        const q = busqueda.trim().toLowerCase();
        return seleccionesGrupo.filter((s) => {
            return (
                s.nombre.toLowerCase().includes(q) ||
                (s.codigo && s.codigo.toLowerCase().includes(q)) ||
                (s.rango && s.rango.toLowerCase().includes(q))
            );
        });
    }, [seleccionesGrupo, busqueda]);

    const mapaPorCodigo = useMemo(() => {
        const mapa = new Map();
        estampas.forEach((estampa) => {
            if (estampa.codigo) {
                mapa.set(estampa.codigo, estampa);
            }
        });
        return mapa;
    }, [estampas]);

    const conteoPorGrupo = useMemo(() => {
        const mapa = new Map(GRUPOS.map((g) => [g, 0]));
        SELECCIONES.forEach((seleccion) => {
            const grupo = seleccion.grupo || "GENERAL";
            const cantidad = seleccion.cantidad ?? 20;
            let obtenidas = 0;
            for (let puesto = 1; puesto <= cantidad; puesto++) {
                const codigo = `${seleccion.codigo}-${puesto}`;
                const estampa = mapaPorCodigo.get(codigo);
                if (estampa?.estado === "obtenido") {
                    obtenidas += 1;
                }
            }
            mapa.set(grupo, (mapa.get(grupo) || 0) + obtenidas);
        });
        return mapa;
    }, [mapaPorCodigo]);

    const seleccion =
        SELECCIONES.find((item) => item.codigo === seleccionActiva) ??
        seleccionesGrupo[0];

    const numeros = useMemo(
        () => Array.from({ length: seleccion?.cantidad ?? 20 }, (_, index) => index + 1),
        [seleccion]
    );

    const resumenSeleccion = useMemo(() => {
        if (!seleccion) {
            return { obtenidas: 0, repetidas: 0 };
        }
        let obtenidas = 0;
        let repetidas = 0;
        numeros.forEach((puesto) => {
            const codigo = `${seleccion.codigo}-${puesto}`;
            const estampa = mapaPorCodigo.get(codigo);
            if (estampa?.estado === "obtenido") {
                obtenidas += 1;
            }
            if (estampa?.repetidas) {
                repetidas += estampa.repetidas;
            }
        });
        return { obtenidas, repetidas };
    }, [seleccion, numeros, mapaPorCodigo]);

    const marcar = (puesto) => {
        if (!seleccion) {
            return;
        }
        const codigo = `${seleccion.codigo}-${puesto}`;
        const estampa = mapaPorCodigo.get(codigo);
        if (!estampa) {
            return;
        }
        if (estampa.estado === "faltante") {
            actualizarEstampa(estampa.id, (actual) => ({
                ...actual,
                estado: "obtenido",
            }));
            return;
        }
        actualizarEstampa(estampa.id, (actual) => ({
            ...actual,
            estado: "obtenido",
            repetidas: actual.repetidas + 1,
        }));
    };

    const desmarcar = (puesto) => {
        if (!seleccion) {
            return;
        }
        const codigo = `${seleccion.codigo}-${puesto}`;
        const estampa = mapaPorCodigo.get(codigo);
        if (!estampa) {
            return;
        }
        actualizarEstampa(estampa.id, (actual) => ({
            ...actual,
            estado: "faltante",
            repetidas: 0,
        }));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mi álbum</Text>
            <View style={styles.groupRow}>
                {GRUPOS.map((grupo) => {
                    const count = conteoPorGrupo.get(grupo) || 0;
                    return (
                        <Pressable
                            key={grupo}
                            style={[styles.groupChip, grupoActivo === grupo && styles.groupChipActive]}
                            onPress={() => {
                                setGrupoActivo(grupo);
                                if (grupo === "GENERAL") {
                                    const primera = SELECCIONES[0];
                                    if (primera) {
                                        setSeleccionActiva(primera.codigo);
                                    }
                                } else {
                                    const primera = SELECCIONES.find((item) => item.grupo === grupo);
                                    if (primera) {
                                        setSeleccionActiva(primera.codigo);
                                    }
                                }
                            }}
                        >
                            <Text
                                style={[
                                    styles.groupText,
                                    grupoActivo === grupo && styles.groupTextActive,
                                ]}
                            >
                                {obtenerEtiquetaGrupo(grupo)}
                            </Text>
                            {count > 0 && (
                                <View style={[styles.groupCount, grupoActivo === grupo && styles.groupCountActive]}>
                                    <Text style={[styles.groupCountText, grupoActivo === grupo && styles.groupCountTextActive]}>{count}</Text>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.pickerWrap}>
                <Text style={styles.pickerLabel}>Selección</Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.pickerTrigger,
                        pressed && styles.pickerTriggerPressed,
                    ]}
                    onPress={() => setPickerAbierto(true)}
                >
                    <View style={styles.pickerValueRow}>
                        {seleccion?.codigo && obtenerBanderaSvg(seleccion.codigo) ? (
                            <SvgXml
                                xml={obtenerBanderaSvg(seleccion.codigo)}
                                width={24}
                                height={18}
                                style={styles.pickerFlag}
                            />
                        ) : null}
                        <Text style={styles.pickerValue} numberOfLines={1}>
                            {obtenerEtiquetaSeleccion(seleccion)}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748b" />
                </Pressable>

                <Modal
                    visible={pickerAbierto}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setPickerAbierto(false)}
                >
                    <Pressable
                        style={styles.pickerModalBackdrop}
                        onPress={() => setPickerAbierto(false)}
                    >
                        <Pressable style={styles.pickerModalCard} onPress={() => {}}>
                            <View style={styles.pickerModalHeader}>
                                <Text style={styles.pickerModalTitle}>Elige una selección</Text>
                                <Pressable
                                    style={styles.pickerModalClose}
                                    onPress={() => setPickerAbierto(false)}
                                >
                                    <Ionicons name="close" size={18} color="#475569" />
                                </Pressable>
                            </View>
                            <TextInput
                                placeholder="Buscar país o código..."
                                value={busqueda}
                                onChangeText={setBusqueda}
                                style={styles.pickerSearchInput}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            <FlatList
                                data={seleccionesFiltradas}
                                keyExtractor={(item) => item.codigo}
                                style={styles.pickerOptionList}
                                renderItem={({ item }) => {
                                    const activo = item.codigo === seleccionActiva;
                                    return (
                                        <Pressable
                                            style={[
                                                styles.pickerOption,
                                                activo && styles.pickerOptionActive,
                                            ]}
                                            onPress={() => {
                                                setSeleccionActiva(item.codigo);
                                                setPickerAbierto(false);
                                                    setBusqueda("");
                                            }}
                                        >
                                            <View>
                                                {obtenerBanderaSvg(item.codigo) ? (
                                                    <SvgXml
                                                        xml={obtenerBanderaSvg(item.codigo)}
                                                        width={24}
                                                        height={18}
                                                        style={styles.pickerOptionFlag}
                                                    />
                                                ) : null}
                                                <Text
                                                    style={[
                                                        styles.pickerOptionText,
                                                        activo && styles.pickerOptionTextActive,
                                                    ]}
                                                >
                                                    {item.nombre}
                                                </Text>
                                                <Text style={styles.pickerOptionCode}>
                                                    {item.rango ? `${item.rango} · ` : ""}
                                                    {item.codigo}
                                                </Text>
                                            </View>
                                            {activo ? (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="#1d4ed8"
                                                />
                                            ) : null}
                                        </Pressable>
                                    );
                                }}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>

            <View style={styles.summary}>
                <Text style={styles.summaryText}>
                    Obtenidas {resumenSeleccion.obtenidas}/{numeros.length}
                </Text>
                <Text style={styles.summaryText}>Repetidas {resumenSeleccion.repetidas}</Text>
                <Text style={styles.summaryHint}>Pulsa para marcar · Mantén para desmarcar</Text>
            </View>

            <FlatList
                data={numeros}
                keyExtractor={(item) => `${item}`}
                numColumns={5}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.row}
                renderItem={({ item }) => {
                    if (!seleccion) {
                        return null;
                    }
                    const codigo = `${seleccion.codigo}-${item}`;
                    const estampa = mapaPorCodigo.get(codigo);
                    const estaObtenida = estampa?.estado === "obtenido";
                    const tieneRepetidas = (estampa?.repetidas ?? 0) > 0;
                    return (
                        <Pressable
                            style={[
                                styles.numeroChip,
                                estaObtenida && styles.numeroChipOk,
                                tieneRepetidas && styles.numeroChipRepetida,
                            ]}
                            onPress={() => marcar(item)}
                            onLongPress={() => desmarcar(item)}
                        >
                            <Text
                                style={[
                                    styles.numeroText,
                                    estaObtenida && styles.numeroTextOk,
                                ]}
                            >
                                    {formatearNumeroEstampa(obtenerNumeroEstampa(seleccion, item))}
                            </Text>
                            {tieneRepetidas ? (
                                <Text style={styles.repetidaBadge}>+{estampa.repetidas}</Text>
                            ) : null}
                        </Pressable>
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
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
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
    groupCount: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    groupCountActive: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    groupCountText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    groupCountTextActive: {
        color: "#f8fafc",
    },
    pickerWrap: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    pickerLabel: {
        fontSize: 11,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    pickerTrigger: {
        marginTop: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        backgroundColor: "#f8fafc",
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    pickerValueRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
        minWidth: 0,
    },
    pickerTriggerPressed: {
        backgroundColor: "#eff6ff",
        borderColor: "#cbd5e1",
    },
    pickerValue: {
        fontSize: 15,
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    pickerFlag: {
        marginRight: 8,
        width: 24,
        height: 18,
        borderRadius: 3,
    },
    pickerModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        justifyContent: "center",
        padding: 20,
    },
    pickerModalCard: {
        borderRadius: 20,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        maxHeight: "78%",
        overflow: "hidden",
    },
    pickerModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    pickerSearchInput: {
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
        color: "#0f172a",
    },
    pickerModalTitle: {
        fontSize: 16,
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    pickerModalClose: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f1f5f9",
    },
    pickerOptionList: {
        maxHeight: 420,
    },
    pickerOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    pickerOptionActive: {
        backgroundColor: "#eff6ff",
    },
    pickerOptionText: {
        fontSize: 15,
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    pickerOptionTextActive: {
        color: "#1d4ed8",
    },
    pickerOptionFlag: {
        marginBottom: 4,
        width: 24,
        height: 18,
        borderRadius: 3,
    },
    pickerOptionCode: {
        marginTop: 2,
        fontSize: 12,
        color: "#64748b",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    summary: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 12,
        color: "#475569",
        backgroundColor: "#e2e8f0",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        fontWeight: "600",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    summaryHint: {
        fontSize: 12,
        color: "#94a3b8",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    list: {
        paddingBottom: 24,
        gap: 12,
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 12,
    },
    numeroChip: {
        width: "18%",
        aspectRatio: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    numeroChipOk: {
        backgroundColor: "#dcfce7",
        borderColor: "#86efac",
    },
    numeroChipRepetida: {
        backgroundColor: "#fef9c3",
        borderColor: "#fde68a",
    },
    numeroText: {
        fontSize: 14,
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    numeroTextOk: {
        color: "#166534",
    },
    repetidaBadge: {
        position: "absolute",
        top: 6,
        right: 6,
        fontSize: 10,
        color: "#854d0e",
        fontFamily: "SpaceGrotesk_700Bold",
    },
});
