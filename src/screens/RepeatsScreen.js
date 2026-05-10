import { Ionicons } from "@expo/vector-icons";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState, useMemo } from "react";
import { SvgXml } from "react-native-svg";
import StickerRow from "../components/StickerRow";
import { SELECCIONES } from "../data/teams";
import { obtenerBanderaSvg } from "../utils/flags";

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
export default function RepeatsScreen({ estampas, actualizarEstampa }) {
    const [grupoActivo, setGrupoActivo] = useState("GENERAL");
    const [paisActivo, setPaisActivo] = useState("TODOS");
    const [pickerAbierto, setPickerAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");

    const mapaGrupoPorSeleccion = useMemo(() => {
        const mapa = new Map();
        SELECCIONES.forEach((s) => mapa.set(s.nombre, s.grupo));
        return mapa;
    }, []);

    const repetidas = estampas.filter((estampa) => estampa.repetidas > 0);

    const seleccionesPorNombre = useMemo(() => {
        const mapa = new Map();
        SELECCIONES.forEach((s) => mapa.set(s.nombre, s));
        return mapa;
    }, []);

    const repetidasPorGrupo = useMemo(() => {
        if (grupoActivo === "GENERAL") {
            return repetidas;
        }
        return repetidas.filter((e) => {
            const grupo = mapaGrupoPorSeleccion.get(e.equipo) ?? null;
            return grupo === grupoActivo;
        });
    }, [repetidas, grupoActivo, mapaGrupoPorSeleccion]);

    const paisesDisponibles = useMemo(() => {
        const mapa = new Map();
        repetidasPorGrupo.forEach((estampa) => {
            const seleccion = seleccionesPorNombre.get(estampa.equipo);
            const clave = seleccion?.codigo ?? estampa.equipo;
            if (!mapa.has(clave)) {
                mapa.set(clave, {
                    codigo: clave,
                    nombre: estampa.equipo,
                    grupo: seleccion?.grupo ?? "GENERAL",
                    bandera: seleccion ? obtenerBanderaSvg(seleccion.codigo) : null,
                    total: 0,
                });
            }
            mapa.get(clave).total += estampa.repetidas;
        });
        return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [repetidasPorGrupo, seleccionesPorNombre]);

    const paisesFiltrados = useMemo(() => {
        if (!busqueda.trim()) return paisesDisponibles;
        const q = busqueda.trim().toLowerCase();
        return paisesDisponibles.filter((pais) => {
            return (
                pais.nombre.toLowerCase().includes(q) ||
                pais.codigo.toLowerCase().includes(q)
            );
        });
    }, [paisesDisponibles, busqueda]);

    const repetidasFiltradas = useMemo(() => {
        if (paisActivo === "TODOS") return repetidasPorGrupo;
        return repetidasPorGrupo.filter((e) => {
            const seleccion = seleccionesPorNombre.get(e.equipo);
            return seleccion?.codigo === paisActivo;
        });
    }, [repetidasPorGrupo, paisActivo, seleccionesPorNombre]);

    const paisSeleccionado = useMemo(() => {
        if (paisActivo === "TODOS") {
            return null;
        }
        return paisesDisponibles.find((pais) => pais.codigo === paisActivo) ?? null;
    }, [paisActivo, paisesDisponibles]);

    const conteoPorGrupo = useMemo(() => {
        const mapa = new Map(GRUPOS.map((g) => [g, 0]));
        repetidas.forEach((e) => {
            const grupo = mapaGrupoPorSeleccion.get(e.equipo) ?? "GENERAL";
            mapa.set(grupo, (mapa.get(grupo) || 0) + e.repetidas);
        });
        return mapa;
    }, [repetidas, mapaGrupoPorSeleccion]);

    const seleccionarGrupo = (grupo) => {
        setGrupoActivo(grupo);
        setPaisActivo("TODOS");
        setBusqueda("");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Repetidas</Text>

            <View style={styles.groupRow}>
                {GRUPOS.map((grupo) => {
                    const count = conteoPorGrupo.get(grupo) || 0;
                    return (
                        <Pressable
                            key={grupo}
                            style={[styles.groupChip, grupoActivo === grupo && styles.groupChipActive]}
                            onPress={() => seleccionarGrupo(grupo)}
                        >
                            <Text style={[styles.groupText, grupoActivo === grupo && styles.groupTextActive]}>
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
                    style={({ pressed }) => [styles.pickerTrigger, pressed && styles.pickerTriggerPressed]}
                    onPress={() => setPickerAbierto(true)}
                >
                    <View style={styles.pickerValueRow}>
                        {paisSeleccionado?.bandera ? (
                            <SvgXml
                                xml={paisSeleccionado.bandera}
                                width={24}
                                height={18}
                                style={styles.pickerFlag}
                            />
                        ) : null}
                        <Text style={styles.pickerValue} numberOfLines={1}>
                            {paisActivo === "TODOS"
                                ? "Todos los países"
                                : paisSeleccionado?.nombre ?? "Seleccionar país"}
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
                    <Pressable style={styles.pickerModalBackdrop} onPress={() => setPickerAbierto(false)}>
                        <Pressable style={styles.pickerModalCard} onPress={() => {}}>
                            <View style={styles.pickerModalHeader}>
                                <Text style={styles.pickerModalTitle}>Elige una selección</Text>
                                <Pressable style={styles.pickerModalClose} onPress={() => setPickerAbierto(false)}>
                                    <Ionicons name="close" size={18} color="#475569" />
                                </Pressable>
                            </View>
                            <TextInput
                                placeholder="Buscar país..."
                                value={busqueda}
                                onChangeText={setBusqueda}
                                style={styles.pickerSearchInput}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            <FlatList
                                data={[{ codigo: "TODOS", nombre: "Todos los países", total: repetidasPorGrupo.reduce((acc, e) => acc + e.repetidas, 0), bandera: null }, ...paisesFiltrados]}
                                keyExtractor={(item) => item.codigo}
                                style={styles.pickerOptionList}
                                renderItem={({ item }) => {
                                    const activo = item.codigo === paisActivo;
                                    return (
                                        <Pressable
                                            style={[styles.pickerOption, activo && styles.pickerOptionActive]}
                                            onPress={() => {
                                                setPaisActivo(item.codigo);
                                                setPickerAbierto(false);
                                                setBusqueda("");
                                            }}
                                        >
                                            <View style={styles.pickerOptionLeft}>
                                                {item.bandera ? (
                                                    <SvgXml xml={item.bandera} width={24} height={18} style={styles.pickerOptionFlag} />
                                                ) : null}
                                                <View>
                                                    <Text style={[styles.pickerOptionText, activo && styles.pickerOptionTextActive]}>
                                                        {item.nombre}
                                                    </Text>
                                                    <Text style={styles.pickerOptionCode}>
                                                        {item.codigo === "TODOS" ? "Todos los grupos" : `${item.total} repetidas`}
                                                    </Text>
                                                </View>
                                            </View>
                                            {activo ? <Ionicons name="checkmark" size={18} color="#1d4ed8" /> : null}
                                        </Pressable>
                                    );
                                }}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>

            {repetidasFiltradas.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>Aún no hay repetidas para este filtro</Text>
                </View>
            ) : (
                <FlatList
                    data={repetidasFiltradas}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    renderItem={({ item }) => (
                        <StickerRow
                            estampa={item}
                            alCambiarEstado={() =>
                                actualizarEstampa(item.id, (actual) => ({
                                    ...actual,
                                    estado: actual.estado === "obtenido" ? "faltante" : "obtenido",
                                }))
                            }
                            alSumarRepetida={() =>
                                actualizarEstampa(item.id, (actual) => ({
                                    ...actual,
                                    estado: actual.estado === "faltante" ? "obtenido" : actual.estado,
                                    repetidas: actual.repetidas + 1,
                                }))
                            }
                            alRestarRepetida={() =>
                                actualizarEstampa(item.id, (actual) => ({
                                    ...actual,
                                    repetidas: Math.max(0, actual.repetidas - 1),
                                }))
                            }
                        />
                    )}
                />
            )}
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
    pickerTriggerPressed: {
        backgroundColor: "#eff6ff",
        borderColor: "#cbd5e1",
    },
    pickerValue: {
        flex: 1,
        fontSize: 15,
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_500Medium",
        marginRight: 12,
    },
    pickerValueRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        minWidth: 0,
        marginRight: 12,
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
    pickerOptionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
        minWidth: 0,
    },
    pickerOptionFlag: {
        borderRadius: 3,
        overflow: "hidden",
    },
    pickerOptionText: {
        fontSize: 15,
        color: "#0f172a",
        fontFamily: "SpaceGrotesk_500Medium",
    },
    pickerOptionTextActive: {
        color: "#1d4ed8",
    },
    pickerOptionCode: {
        marginTop: 2,
        fontSize: 12,
        color: "#64748b",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    empty: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderColor: "#e2e8f0",
    },
    emptyText: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    list: {
        paddingBottom: 24,
    },
});
